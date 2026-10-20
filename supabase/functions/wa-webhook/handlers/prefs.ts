// wa-webhook handler stub: prefs (T44 stub; T46b fills it, with tests).
//
// To build: STOP and the template quick replies: route.action is stop_all | stop_alerts | stop_weekly | stop_daily. Confirm only what the RPC changed, and say what still comes ("Band changes still come"). Withdrawals need no user JWT (T40).
// Contract: router.ts (HandlerInput, HandlerTools, HandlerResult). Until T46b lands, the stub
// sends nothing: no reply may confirm what no RPC recorded (AGENTS.md rule 9).

import type { WaHandler } from "../router.ts";

export const prefs: WaHandler = (input, tools) => {
  tools.log.info("wa handler not built yet", {
    handler: "prefs",
    rule: input.route.rule,
    action: input.route.action,
  });
  return Promise.resolve({ outcome: "not_built" });
};
