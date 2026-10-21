// wa-webhook handler: family_join (T46b; API_CONTRACTS §4.11, §5.1 "JOIN <code>" → family.join).
//
// The relative's own "JOIN <code>" message is their own opt-in (DESIGN §5b "Following, digest and
// family"): this inbound message is the evidence api.whatsapp_family_join checks (it must be the
// sender's own inbound message, received in the last 24 hours), so no tap JWT is needed either —
// the join RPC is service-only (T45a, migration 20261120000300). Its answer (plinth.family_join/1)
// is the "You'll get the same alerts" session reply: joined_line is sent verbatim (AGENTS.md rule
// 9, no reply may confirm what no RPC recorded), never recomposed from the route's own args.
//
// A code that is unknown, used, cancelled, expired, or the sender's own circle answers one neutral
// sentence (app.neutral_code_error / app.circle_owner, T45a); that sentence is the server's own
// words too, and is sent as the reply rather than left for the sweeper to retry.

import { callRpc } from "../../_shared/core/supabase.ts";
import { HttpError } from "../../_shared/core/errors.ts";
import { textMessage } from "../../_shared/wa/graph.ts";
import type { WaHandler } from "../router.ts";

/** plinth.family_join/1 (API_CONTRACTS §4.11). */
interface FamilyJoinResult {
  member_id: string;
  inviter_first_name: string;
  scope_line: string;
  joined_line: string;
  number_line: string;
}

const REFUSAL_CODES = new Set(["not_found", "invalid_input", "forbidden"]);

export const familyJoin: WaHandler = async (input, tools) => {
  const code = input.route.args.code;
  if (typeof code !== "string" || code === "") {
    tools.log.warn("family_join: no code on the route");
    return { outcome: "no_code" };
  }

  try {
    const result = await callRpc<FamilyJoinResult>(tools.service, "whatsapp_family_join", {
      p_contact_id: input.contact.id,
      p_code: code,
      p_wa_message_id: input.message.waMessageId,
    });
    await tools.reply(textMessage(`${result.joined_line} ${result.number_line}`));
    return { outcome: "joined" };
  } catch (err) {
    if (err instanceof HttpError && REFUSAL_CODES.has(err.code)) {
      await tools.reply(textMessage(err.message));
      return { outcome: `join_refused_${err.code}` };
    }
    throw err;
  }
};
