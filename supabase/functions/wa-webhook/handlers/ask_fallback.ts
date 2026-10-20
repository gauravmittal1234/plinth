// wa-webhook handler stub: ask_fallback (T44 stub; T46a fills it, with tests).
//
// To build: anything else: the templated answer or refusal (English, M2), and "not yet" for route.args.deferred (doc_check, transcribe, flows); Ask Plinth AI in M5.
// Contract: router.ts (HandlerInput, HandlerTools, HandlerResult). Until T46a lands, the stub
// sends nothing: no reply may confirm what no RPC recorded (AGENTS.md rule 9).

import type { WaHandler } from "../router.ts";

export const askFallback: WaHandler = (input, tools) => {
  tools.log.info("wa handler not built yet", {
    handler: "ask_fallback",
    rule: input.route.rule,
    action: input.route.action,
  });
  return Promise.resolve({ outcome: "not_built" });
};
