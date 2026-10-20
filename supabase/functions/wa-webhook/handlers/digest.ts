// wa-webhook handler stub: digest (T44 stub; T46b fills it, with tests).
//
// To build: "See changes": list the changes since the last digest (route.action see_changes).
// Contract: router.ts (HandlerInput, HandlerTools, HandlerResult). Until T46b lands, the stub
// sends nothing: no reply may confirm what no RPC recorded (AGENTS.md rule 9).

import type { WaHandler } from "../router.ts";

export const digest: WaHandler = (input, tools) => {
  tools.log.info("wa handler not built yet", {
    handler: "digest",
    rule: input.route.rule,
    action: input.route.action,
  });
  return Promise.resolve({ outcome: "not_built" });
};
