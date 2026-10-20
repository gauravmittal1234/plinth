// retention-sweep: POST /functions/v1/retention-sweep (API_CONTRACTS §3.5, §5.5) · auth: the
// dispatch secret, never a JWT (header x-plinth-dispatch-secret). Caller: pg_cron daily at
// 02:30 IST through ops.dpdp_kick (migration 20261125000400), with the secret from Vault.
//   200 { due, uploads_deleted, voice_notes_deleted, exports_deleted, files_failed,
//         messages_anonymised, erasures_completed, erasures_open, erasures_failed }
//       always 200 once the secret checks out; what failed stays due for tomorrow.
//   401 auth_required   the header is missing
//   403 forbidden        the header doesn't match
//   500 internal         PLINTH_DISPATCH_SECRET (or another required variable) is not set
// Deploy without JWT verification (config.toml [functions.retention-sweep] verify_jwt = false,
// PR Handoff).
//
// Env: the CoreEnv set (SUPABASE_URL, the secret key, PLINTH_DISPATCH_SECRET).
// Logic and tests: logic.ts, logic.test.ts. Erasures: ../delete-account/{logic,service}.ts.

import { callRpc, secretClient } from "../_shared/core/supabase.ts";
import { serviceEraseDeps } from "../delete-account/service.ts";
import { supabaseStorage } from "../export-data/storage.ts";
import { makeRetentionSweep, parseDue } from "./logic.ts";

Deno.serve(makeRetentionSweep({
  deps: (ctx) => {
    const service = secretClient(ctx.env.supabase, { requestId: ctx.requestId, fn: ctx.fn });
    return {
      log: ctx.log,
      storage: supabaseStorage(service),
      erase: serviceEraseDeps(service, ctx.log),
      due: async (limit) => parseDue(await callRpc(service, "retention_due", { p_limit: limit })),
      markDeleted: (items) =>
        callRpc<Record<string, number>>(service, "retention_mark_deleted", {
          p_items: items.map(({ kind, id, key }) => ({ kind, id, key })),
        }),
      anonymiseMessages: (limit) =>
        callRpc<Record<string, number>>(service, "retention_anonymise_messages", {
          p_limit: limit,
        }),
      erasurePending: async (limit) => {
        const rows = await callRpc<unknown>(service, "dpdp_erasure_pending", { p_limit: limit });
        return Array.isArray(rows)
          ? rows.map((r) => (r as { request_id?: unknown })?.request_id).filter((
            id,
          ): id is string => typeof id === "string")
          : [];
      },
    };
  },
}));
