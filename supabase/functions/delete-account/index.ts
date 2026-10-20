// delete-account: POST /functions/v1/delete-account (API_CONTRACTS §3.5) · auth: the buyer's JWT ·
// body (optional) { "channel": "web" | "app" } (default app; it is the channel the consent
// withdrawals record).
//   200 { request: plinth.account_delete_request/1, erasure: plinth.account_erasure/1 (erased) }
//   202 { request, erasure: { status: "erasing", … } | null }   on record, not finished yet: the
//       daily retention-sweep finishes it (erasure within 30 days, BUILD_PLAN §13)
//   401 auth_required   no bearer token, or PostgREST refused it
//   403 forbidden        a token that is not a signed-in buyer's (e.g. the service role's)
//   422 invalid_input    a body other than { channel }
// Show the buyer only what these records say (AGENTS.md rule 9).
//
// Deploy with JWT verification on (the default). Env: the CoreEnv set (SUPABASE_URL, the
// publishable and secret keys, PLINTH_HASH_SALT) and NEXT_PUBLIC_SITE_URL for CORS.
// Logic: logic.ts (finishErasure is shared with retention-sweep); wiring: service.ts; Storage:
// ../export-data/storage.ts.

import { processEnv, readVar } from "../_shared/core/env.ts";
import { callRpc, secretClient, userClient } from "../_shared/core/supabase.ts";
import { jwtRejected } from "../export-data/logic.ts";
import { makeDeleteAccount } from "./logic.ts";
import { serviceEraseDeps } from "./service.ts";

const site = readVar(processEnv, "NEXT_PUBLIC_SITE_URL")?.replace(/\/+$/, "");

Deno.serve(makeDeleteAccount({
  cors: site ? { origins: [site], methods: ["POST", "OPTIONS"] } : undefined,
  deps: (ctx, token) => {
    const buyer = userClient(ctx.env.supabase, token, { requestId: ctx.requestId, fn: ctx.fn });
    const service = secretClient(ctx.env.supabase, { requestId: ctx.requestId, fn: ctx.fn });
    return {
      request: async () => {
        try {
          return await callRpc(buyer, "account_delete_request");
        } catch (err) {
          throw jwtRejected(err);
        }
      },
      erase: serviceEraseDeps(service, ctx.log),
    };
  },
}));
