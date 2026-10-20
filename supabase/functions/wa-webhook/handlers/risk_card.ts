// wa-webhook handler stub: risk_card (T44 stub; T46a fills it, with tests).
//
// To build: the WaRisk card: resolve the slug (route.args: slug | rera | short_code | query), send the 1080×1350 card image + caption + reply buttons "Why this band" · "Follow project" · "Ask" (session event card_sent); answer the card buttons (route.action), and for "Yes, alert me" write the follow and its consent through tools.actAsUser().
// Contract: router.ts (HandlerInput, HandlerTools, HandlerResult). Until T46a lands, the stub
// sends nothing: no reply may confirm what no RPC recorded (AGENTS.md rule 9).

import type { WaHandler } from "../router.ts";

export const riskCard: WaHandler = (input, tools) => {
  tools.log.info("wa handler not built yet", {
    handler: "risk_card",
    rule: input.route.rule,
    action: input.route.action,
  });
  return Promise.resolve({ outcome: "not_built" });
};
