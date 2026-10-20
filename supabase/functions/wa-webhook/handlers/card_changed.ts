// wa-webhook handler stub: card_changed (T44 stub; T46a fills it, with tests).
//
// To build: a forwarded card image: pHash-match route.args.media_id to core.share_cards and send "Changed since this card was sent"; no match → the M2 "not yet" answer (claims lands in M3).
// Contract: router.ts (HandlerInput, HandlerTools, HandlerResult). Until T46a lands, the stub
// sends nothing: no reply may confirm what no RPC recorded (AGENTS.md rule 9).

import type { WaHandler } from "../router.ts";

export const cardChanged: WaHandler = (input, tools) => {
  tools.log.info("wa handler not built yet", {
    handler: "card_changed",
    rule: input.route.rule,
    action: input.route.action,
  });
  return Promise.resolve({ outcome: "not_built" });
};
