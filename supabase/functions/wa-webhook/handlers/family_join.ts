// wa-webhook handler stub: family_join (T44 stub; T46b fills it, with tests).
//
// To build: "JOIN <code>" (route.args.code, e.g. AH2-7KQ): the relative's own opt-in. Join through the family RPC and send the session text "You'll get the same alerts…".
// Contract: router.ts (HandlerInput, HandlerTools, HandlerResult). Until T46b lands, the stub
// sends nothing: no reply may confirm what no RPC recorded (AGENTS.md rule 9).

import type { WaHandler } from "../router.ts";

export const familyJoin: WaHandler = (input, tools) => {
  tools.log.info("wa handler not built yet", {
    handler: "family_join",
    rule: input.route.rule,
    action: input.route.action,
  });
  return Promise.resolve({ outcome: "not_built" });
};
