// export-data: POST /functions/v1/export-data (API_CONTRACTS §3.5) · auth: the buyer's JWT plus a
// sign-in code from the last 10 minutes · body { "request_id": "<uuid>" } (from
// api.data_export_request) → 200 { request_id, status: "ready", url, url_expires_at,
// link_expires_at, line }; the url is a signed Storage URL that lives at most 5 minutes.
//   401 auth_required   no bearer token, or no fresh sign-in code (WWW-Authenticate:
//                       insufficient_user_authentication; ask for a code, then retry)
//   404 not_found        not the caller's request, or the 7-day link has expired (the line says so)
//   409 conflict         still being prepared ("Ready by 19 Oct 2026, 12:00 pm.")
//   422 invalid_input    the body is not { request_id }
//
// POST /functions/v1/export-data/build · auth: x-plinth-dispatch-secret (pg_cron every 15 minutes,
// ops.dpdp_kick) → 200 { pending, built, discarded, failed }. Builds the open requests' ZIPs
// into the private `exports` bucket.
//
// Deploy without gateway JWT verification (config.toml [functions.export-data] verify_jwt =
// false, PR Handoff): pg_net calls /build with the dispatch secret and no JWT. The function
// checks its own credentials: the dispatch secret for the builder; for the buyer, a bearer token
// that PostgREST verifies when api.dpdp_export_link runs, before anything is signed.
//
// Env: the CoreEnv set (SUPABASE_URL, the publishable and secret keys, PLINTH_DISPATCH_SECRET,
// PLINTH_HASH_SALT) and NEXT_PUBLIC_SITE_URL for CORS. Logic: logic.ts, render.ts, pdf.ts,
// zip.ts, storage.ts.

import { businessClock } from "../_shared/core/clock.ts";
import { processEnv, readVar } from "../_shared/core/env.ts";
import { callRpc, secretClient, userClient } from "../_shared/core/supabase.ts";
import { jwtRejected, makeExportData, parsePending } from "./logic.ts";
import { supabaseStorage } from "./storage.ts";

const site = readVar(processEnv, "NEXT_PUBLIC_SITE_URL")?.replace(/\/+$/, "");

const handler = makeExportData({
  cors: site ? { origins: [site], methods: ["POST", "OPTIONS"] } : undefined,
  buildDeps: (ctx) => {
    const service = secretClient(ctx.env.supabase, { requestId: ctx.requestId, fn: ctx.fn });
    return {
      log: ctx.log,
      storage: supabaseStorage(service),
      pending: async (limit) =>
        parsePending(await callRpc(service, "dpdp_export_pending", { p_limit: limit })),
      payload: (id) => callRpc(service, "dpdp_export_payload", { p_request_id: id }),
      complete: (id, key, bytes, sha256) =>
        callRpc(service, "dpdp_export_complete", {
          p_request_id: id,
          p_export_key: key,
          p_bytes: bytes,
          p_sha256: sha256,
        }),
    };
  },
  linkDeps: (ctx, token) => {
    const buyer = userClient(ctx.env.supabase, token, { requestId: ctx.requestId, fn: ctx.fn });
    const service = secretClient(ctx.env.supabase, { requestId: ctx.requestId, fn: ctx.fn });
    return {
      // Wall time for the sign-in code's age; business time for the 7-day link (logic.ts).
      now: () => ctx.clock.now(),
      businessNow: () => businessClock(ctx.env.plinthEnv).now(),
      storage: supabaseStorage(service),
      link: async (id) => {
        try {
          return await callRpc(buyer, "dpdp_export_link", { p_request_id: id });
        } catch (err) {
          throw jwtRejected(err);
        }
      },
    };
  },
});

Deno.serve(handler);
