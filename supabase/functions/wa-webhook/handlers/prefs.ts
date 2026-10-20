// wa-webhook handler: prefs (T46b; API_CONTRACTS §5.1 "STOP", "Stop alerts", "Stop weekly",
// "Stop daily" → prefs.stop).
//
// None of the four actions needs the sender's own tap JWT: withdrawing consent is never gated
// behind re-proving it (AGENTS.md §7 "Consent is a database constraint"), and a bare "STOP" is
// plain typed text anyway, not a tap (packages/fixtures/recorded/wa/text-stop.json) — verify.ts's
// mintTapToken would refuse it (isTap). tools.service (the secret-key client) calls
// api.whatsapp_prefs_stop(contact_id, action) directly; the confirmation below repeats only what
// that RPC's own answer says changed or still comes (AGENTS.md rule 9).
//
// stop_weekly and stop_daily are a toggle: the confirmation's own quick-reply button reuses the
// same stop_weekly/stop_daily id router.ts already routes, labelled "Turn weekly|daily on" when
// the digest is now off — tapping it again turns the same cadence back on.

import { callRpc } from "../../_shared/core/supabase.ts";
import { replyButtons, textMessage } from "../../_shared/wa/graph.ts";
import type { WaHandler } from "../router.ts";

const STOP_ACTIONS = ["stop_all", "stop_alerts", "stop_weekly", "stop_daily"] as const;
type StopAction = typeof STOP_ACTIONS[number];

function isStopAction(v: unknown): v is StopAction {
  return typeof v === "string" && (STOP_ACTIONS as readonly string[]).includes(v);
}

/** api.whatsapp_prefs_stop's own answer (plinth.wa_prefs_stop/1; 20261123000100). */
interface PrefsStopResult {
  action: StopAction;
  linked: boolean;
  stopped: boolean;
  band_change_on: boolean;
  digest_on: boolean;
  digest_cadence: string | null;
}

const BAND_STILL_COMES =
  "Band changes for your projects still reach you. Reply STOP to end those too.";

function bodyFor(result: PrefsStopResult): string {
  switch (result.action) {
    case "stop_all":
      return "Done. No more WhatsApp alerts from Plinth. Follow a project again anytime to start them back up.";
    case "stop_alerts":
      return result.linked
        ? `Done. No more band-change or filing alerts on WhatsApp.${
          result.digest_on ? " Your digest still comes." : ""
        }`
        : "You don't have project alerts on WhatsApp yet.";
    case "stop_weekly":
    case "stop_daily": {
      const word = result.action === "stop_weekly" ? "weekly" : "daily";
      if (!result.linked) return `You don't have a ${word} digest on WhatsApp yet.`;
      if (result.digest_on) return `Your ${word} updates are back on.`;
      return `Done. No more ${word} updates.${result.band_change_on ? ` ${BAND_STILL_COMES}` : ""}`;
    }
  }
}

export const prefs: WaHandler = async (input, tools) => {
  const { action } = input.route;
  if (!isStopAction(action)) {
    tools.log.warn("prefs: not a WhatsApp preference action", { action });
    return { outcome: "unknown_action" };
  }

  const result = await callRpc<PrefsStopResult>(tools.service, "whatsapp_prefs_stop", {
    p_contact_id: input.contact.id,
    p_action: action,
  });

  const body = bodyFor(result);
  if ((action === "stop_weekly" || action === "stop_daily") && result.linked) {
    const word = action === "stop_weekly" ? "weekly" : "daily";
    const title = result.digest_on ? `Stop ${word}` : `Turn ${word} on`;
    await tools.reply(replyButtons({ body, buttons: [{ id: action, title }] }));
  } else {
    await tools.reply(textMessage(body));
  }

  return { outcome: result.action };
};
