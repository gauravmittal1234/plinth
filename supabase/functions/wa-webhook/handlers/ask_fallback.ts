// wa-webhook handler: ask_fallback (T46a; WORK_BREAKDOWN T46a; DESIGN §5b "Ask Plinth edge
// answers"; API_CONTRACTS §5.1 "Anything else → ask … templated refusal (M2) / AI (M5)").
//
// Two shapes of input land here (router.ts): a later-milestone capability the router already named
// (route.args.deferred: doc_check, transcribe, flows, unsupported_media) gets an honest "not yet";
// anything else is a question (typed after "Ask" was tapped, or any unrouted text) and gets one of
// the M2 templated answers — full Ask Plinth AI is M5 (AGENTS.md §7 "AI reads; rules decide" doesn't
// apply yet because there is no reading step in M2).
//
// "Outside coverage" and "unknown project" are not composed here: api.search_projects(p_q) already
// classifies a place or project name it can't match (core.search_parse) and returns the exact line,
// action and detail_line DESIGN §5b and WebSearch's zero-results panel also show — this handler only
// relays that payload's `zero_results.line`, so the Noida answer (and any other place or project) is
// never a WhatsApp-only guess.
//
// Contract: router.ts (HandlerInput, HandlerTools, HandlerResult).

import { callRpc, HttpError } from "../../_shared/core/mod.ts";
import { textMessage } from "../../_shared/wa/graph.ts";
import type { HandlerResult, Route, WaHandler } from "../router.ts";

/** route.args.deferred → an honest line naming what can't be done on WhatsApp yet (router.ts
 * deferredFor: the later route a later milestone will fill). */
const DEFERRED_LINES: Readonly<Record<string, string>> = {
  doc_check:
    "We can't read documents on WhatsApp yet. Send the project name or its RERA number and we'll show the current band.",
  transcribe:
    "We can't listen to voice notes on WhatsApp yet. Send the project name or its RERA number and we'll show the current band.",
  flows:
    "That reply needs a feature we haven't switched on here yet. Send the project name or its RERA number and we'll show the current band.",
  unsupported_media:
    "We can't read that kind of file on WhatsApp yet. Send the project name or its RERA number and we'll show the current band.",
};

const DEFAULT_DEFERRED_LINE =
  "We can't do that on WhatsApp yet. Send the project name or its RERA number and we'll show the current band.";

const NO_QUESTION_LINE = "Send a project name, a Gurugram RERA number, or type your question.";

/** DESIGN §5b "Ask Plinth edge answers": "Should I buy?" never gets yes or no. */
const SHOULD_I_BUY_RE = /\bshould i buy\b|\bis it (?:a )?good (?:investment|buy)\b|\bworth buying\b/;
const SHOULD_I_BUY_LINES = [
  "We can't tell you whether to buy. That's your call, and no developer pays us to steer it. Here's how to decide:",
  "Can you carry a 12 to 24 month delay? (Afford the wait)",
  "Read the reasons behind the band and what would change it.",
  "Look at the lower-band projects nearby.",
  "Before paying anything, check the payee against the RERA collection account. (Before you pay)",
].join("\n");

/** M2's templated refusal, once a question is neither "Should I buy?" nor a recognised zero-result
 * (DESIGN §5b: real Ask Plinth answers with sources arrive in M5). */
const GENERIC_REFUSAL =
  "Ask Plinth's full answers are arriving on WhatsApp soon. Send a project name or its RERA number and we'll show the current band, or visit plinth.in to ask in full.";

interface ZeroResults {
  kind?: unknown;
  line?: unknown;
}
interface SearchResults {
  zero_results?: ZeroResults | null;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** A question answered while "Ask" was open returns the session to the card (session.ts: ask_open
 * + done → card_shown); an unrouted question outside any session leaves it as it was. */
function answered(route: Route): HandlerResult {
  if (route.rule === "ask_session") return { outcome: "answered", session: { type: "done" } };
  return { outcome: "answered" };
}

export const askFallback: WaHandler = async (input, tools) => {
  const { route } = input;
  const deferred = typeof route.args.deferred === "string" ? route.args.deferred : null;
  if (deferred) {
    await tools.reply(textMessage(DEFERRED_LINES[deferred] ?? DEFAULT_DEFERRED_LINE));
    return { outcome: "deferred" };
  }

  const question = typeof route.args.question === "string" ? route.args.question : null;
  if (!question) {
    await tools.reply(textMessage(NO_QUESTION_LINE));
    return { outcome: "no_question" };
  }

  if (SHOULD_I_BUY_RE.test(question.toLowerCase())) {
    await tools.reply(textMessage(SHOULD_I_BUY_LINES));
    return answered(route);
  }

  let zero: ZeroResults | null = null;
  try {
    const result = await callRpc<SearchResults>(tools.service, "search_projects", { p_q: question });
    zero = isObj(result.zero_results) ? result.zero_results : null;
  } catch (err) {
    tools.log.warn("wa ask_fallback: search_projects failed", {
      code: err instanceof HttpError ? err.code : "internal",
    });
  }

  if (
    (zero?.kind === "outside_coverage" || zero?.kind === "unknown_project") &&
    typeof zero.line === "string"
  ) {
    await tools.reply(textMessage(zero.line));
    return answered(route);
  }

  await tools.reply(textMessage(GENERIC_REFUSAL));
  return answered(route);
};
