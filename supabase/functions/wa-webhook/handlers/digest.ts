// wa-webhook handler: digest (T46b; API_CONTRACTS §5.1 "See changes" (weekly_digest's or
// daily_digest's quick reply, or typed) → digest.see_changes).
//
// The change lines are the server's own (api.whatsapp_digest_changes, migration 20261123000100):
// one sentence per core.events row on the buyer's followed phases, in the window the RPC itself
// chooses. This handler only lists what the RPC returned — it never names a project, a count or a
// date on its own (AGENTS.md rule 10).

import { callRpc } from "../../_shared/core/supabase.ts";
import { textMessage } from "../../_shared/wa/graph.ts";
import type { WaHandler } from "../router.ts";

/** plinth.wa_digest_changes/1 (api.whatsapp_digest_changes, 20261123000100). */
interface DigestChangesResult {
  change_count: number;
  lines: string[];
  since: string | null;
}

export const digest: WaHandler = async (input, tools) => {
  const result = await callRpc<DigestChangesResult>(tools.service, "whatsapp_digest_changes", {
    p_contact_id: input.contact.id,
  });

  const body = result.change_count === 0
    ? "Nothing new on your followed projects since your last digest."
    : [
      `${result.change_count} change${result.change_count === 1 ? "" : "s"} on record:`,
      ...result.lines.map((line) => `• ${line}`),
    ].join("\n");

  await tools.reply(textMessage(body));
  return { outcome: result.change_count === 0 ? "no_changes" : "changes_listed" };
};
