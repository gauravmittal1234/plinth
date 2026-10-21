// The service side of an erasure (delete-account and retention-sweep): SQL through the secret
// key, the Storage API, and GoTrue's admin API. Kept out of index.ts so retention-sweep can import
// it without starting a server. Wiring only: logic.ts holds the decisions and their tests.

import type { Logger } from "../_shared/core/log.ts";
import type { ApiClient } from "../_shared/core/supabase.ts";
import { callRpc } from "../_shared/core/supabase.ts";
import { supabaseStorage } from "../export-data/storage.ts";
import type { EraseDeps } from "./logic.ts";

export function serviceEraseDeps(service: ApiClient, log: Logger): EraseDeps {
  return {
    log,
    storage: supabaseStorage(service),
    run: (id, channel) =>
      callRpc(service, "dpdp_erasure_run", { p_request_id: id, p_channel: channel }),
    complete: (id, storageRemoved, identityErased) =>
      callRpc(service, "dpdp_erasure_complete", {
        p_request_id: id,
        p_storage_removed: storageRemoved,
        p_identity_erased: identityErased,
      }),
    async deleteIdentity(userId) {
      // Soft delete: the auth.users row stays (the kept consent rows reference it) with the
      // phone and email obfuscated, the metadata cleared and every session ended. A user that
      // is already gone (404) counts as done, so a retry completes.
      const { error } = await service.auth.admin.deleteUser(userId, true);
      const status = (error as { status?: number } | null)?.status;
      if (error && status !== 404) throw new Error(`auth soft delete failed (${status ?? "?"})`);
    },
  };
}
