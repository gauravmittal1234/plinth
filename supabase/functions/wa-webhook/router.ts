// wa-webhook intent router (T44; API_CONTRACTS §5.1 "Intent router", first match wins).
//
//   rule          inbound                                              handler        M
//   join          "JOIN <code>"                                        family_join    M2
//   stop          "STOP", "Stop alerts|weekly|daily" (text or button)  prefs          M2
//   digest        "See changes" (button or text)                       digest         M2
//   card_button   why_this_band · follow_project · ask · yes_alert_me
//                 · not_now · open_full_card (reply ids)               risk_card      M2
//   ask_session   typed text while the session is ask_open             ask_fallback   M2
//   rera          a RERA number (GGM/673/405/2022/117)                 risk_card      M2
//   link          a plinth.in project, card or short link              risk_card      M2
//   project_name  text that api.suggest matches to a phase             risk_card      M2
//   image         any image (pHash match to a share card in the handler) card_changed M2
//   fallback      anything else                                        ask_fallback   M2
// Documents (claims, cost, before_pay, pay_as_built: M3), audio (transcribe: M5), Flow replies
// (nfm_reply: M5) and developer senders (M4) fall back to ask_fallback with `deferred` naming the
// later route, so the M2 handler can answer "not yet" without guessing. The card_changed handler
// (T46a) answers images that match no share card the same way until claims lands in M3.
//
// Handlers live in handlers/*.ts (T44 stubs; T46a fills risk_card, card_changed, ask_fallback;
// T46b fills prefs, digest, family_join). They get the route, the message, the contact and the
// session, plus tools (logic.ts): reply (session messages, limits enforced), actAsUser (a ≤ 60 s
// user JWT for a verified tap; consent RPCs need it), the service client and flags. A handler
// returns an outcome and, optionally, a session event (session.ts).

import type { Clock } from "../_shared/core/clock.ts";
import type { FlagsReader } from "../_shared/core/flags.ts";
import type { Logger } from "../_shared/core/log.ts";
import type { RpcClient } from "../_shared/core/supabase.ts";
import { callRpc } from "../_shared/core/supabase.ts";
import type { OutboundMessage, SendResult } from "../_shared/wa/graph.ts";
import type { SessionEvent, WaContact, WaSession } from "../_shared/wa/session.ts";
import type { InboundMessage } from "../_shared/wa/verify.ts";
import { askFallback } from "./handlers/ask_fallback.ts";
import { cardChanged } from "./handlers/card_changed.ts";
import { digest } from "./handlers/digest.ts";
import { familyJoin } from "./handlers/family_join.ts";
import { prefs } from "./handlers/prefs.ts";
import { riskCard } from "./handlers/risk_card.ts";

export const HANDLER_NAMES = [
  "family_join",
  "prefs",
  "digest",
  "risk_card",
  "card_changed",
  "ask_fallback",
] as const;
export type HandlerName = typeof HANDLER_NAMES[number];

export interface Route {
  handler: HandlerName;
  /** The rule that matched (table above). */
  rule: string;
  /** What the handler should do, e.g. stop_weekly, why_this_band. */
  action: string | null;
  args: Readonly<Record<string, unknown>>;
}

export interface ProjectMatch {
  slug: string;
  label: string;
  matchedOn: string | null;
}

/** Text → the phase it names, or null. */
export type ProjectFinder = (text: string) => Promise<ProjectMatch | null>;

export interface RouterContext {
  session: WaSession;
  findProject: ProjectFinder;
}

// ---------------------------------------------------------------------------------------------
// Handler contract
// ---------------------------------------------------------------------------------------------

export interface HandlerInput {
  route: Route;
  message: InboundMessage;
  contact: WaContact;
  session: WaSession;
}

export interface HandlerTools {
  /** A session message to the sender. Null when wa_outbound is off (nothing was sent). */
  reply(message: OutboundMessage): Promise<SendResult | null>;
  /** A client acting as the sender's account for this tap (consents, follows). */
  actAsUser(): Promise<RpcClient>;
  /** The secret-key client (service-only RPCs). */
  service: RpcClient;
  flags: FlagsReader;
  log: Logger;
  /** Wall clock. Business dates come from the RPCs (ops.now()). */
  clock: Clock;
}

export interface HandlerResult {
  /** A short code for the log, e.g. "card_sent", "stopped", "not_built". */
  outcome: string;
  session?: SessionEvent;
}

export type WaHandler = (input: HandlerInput, tools: HandlerTools) => Promise<HandlerResult>;

export const HANDLERS: Readonly<Record<HandlerName, WaHandler>> = {
  family_join: familyJoin,
  prefs,
  digest,
  risk_card: riskCard,
  card_changed: cardChanged,
  ask_fallback: askFallback,
};

// ---------------------------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------------------------

const JOIN_RE = /^join\s+([a-z0-9]{2,6}(?:-[a-z0-9]{2,6}){0,2})$/i;
const RERA_RE = /\b(?:RC\/REP\/HARERA\/)?([A-Z]{2,4}\/\d{1,4}\/\d{1,4}\/\d{4}\/\d{1,4})\b/i;
const PROJECT_LINK_RE = /\bplinth\.in\/(?:[a-z-]+\/projects|cards\/risk)\/([a-z0-9-]+)/i;
const SHORT_LINK_RE = /\bplinth\.in\/r\/([A-Za-z0-9]{2,12})\b/;

/** STOP words and quick-reply ids → the prefs action (API_CONTRACTS §5.1, §5.2 template buttons). */
const STOP_ACTIONS: Readonly<Record<string, string>> = {
  "stop": "stop_all",
  "stop alerts": "stop_alerts",
  "stop weekly": "stop_weekly",
  "stop daily": "stop_daily",
  "stop_all": "stop_all",
  "stop_alerts": "stop_alerts",
  "stop_weekly": "stop_weekly",
  "stop_daily": "stop_daily",
};

const DIGEST_ACTIONS: Readonly<Record<string, string>> = {
  "see changes": "see_changes",
  "see_changes": "see_changes",
};

/** Reply ids of the WaRisk card and the band-change alert (WaRisk, WaAlerts artboards). */
export const CARD_BUTTONS = [
  "why_this_band",
  "follow_project",
  "ask",
  "yes_alert_me",
  "not_now",
  "open_full_card",
] as const;

/** Lower case, inner spaces collapsed, trailing punctuation dropped. */
export function normalizeText(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim().replace(/[.!]+$/, "");
}

const route = (
  handler: HandlerName,
  rule: string,
  action: string | null,
  args: Record<string, unknown> = {},
): Route => ({ handler, rule, action, args });

/** Later routes the M2 fallback names, so it can say "not yet" (see the header). */
function deferredFor(msg: InboundMessage): string | null {
  if (msg.type === "document") return "doc_check";
  if (msg.type === "audio") return "transcribe";
  if (msg.type === "interactive" && msg.interactiveType === "nfm_reply") return "flows";
  if (msg.type === "video" || msg.type === "sticker") return "unsupported_media";
  return null;
}

/** The first matching rule's route. */
export async function routeInbound(msg: InboundMessage, ctx: RouterContext): Promise<Route> {
  const text = msg.text ?? "";
  const typed = msg.type === "text" ? text.trim() : "";
  const norm = normalizeText(text);
  const reply = msg.replyId ? normalizeText(msg.replyId) : null;
  const slug = typeof ctx.session.context.slug === "string" ? ctx.session.context.slug : null;

  // join: the relative's own opt-in (JOIN AH2-7KQ).
  const join = JOIN_RE.exec(typed);
  if (join) return route("family_join", "join", "join", { code: join[1]!.toUpperCase() });

  // stop: typed or tapped.
  const stop = (reply && STOP_ACTIONS[reply]) ?? (msg.type !== "text" ? null : STOP_ACTIONS[norm]);
  if (stop) return route("prefs", "stop", stop);

  // digest: "See changes".
  const see = (reply && DIGEST_ACTIONS[reply]) ?? (msg.type !== "text" ? null : DIGEST_ACTIONS[norm]);
  if (see) return route("digest", "digest", see);

  // card_button: buttons under a risk card or a band-change alert.
  if (reply && (CARD_BUTTONS as readonly string[]).includes(reply)) {
    return route("risk_card", "card_button", reply, { slug, context_id: msg.contextId });
  }

  // ask_session: "Ask" was tapped; this text is the question.
  if (ctx.session.state === "ask_open" && typed !== "") {
    return route("ask_fallback", "ask_session", "question", { slug, question: typed });
  }

  if (typed !== "") {
    const rera = RERA_RE.exec(typed);
    if (rera) return route("risk_card", "rera", "card", { rera: rera[1]!.toUpperCase() });

    const link = PROJECT_LINK_RE.exec(typed);
    if (link) return route("risk_card", "link", "card", { slug: link[1]!.toLowerCase() });
    const short = SHORT_LINK_RE.exec(typed);
    if (short) return route("risk_card", "link", "card", { short_code: short[1] });

    if (typed.length >= 3 && typed.length <= 80) {
      const match = await ctx.findProject(typed);
      if (match) {
        return route("risk_card", "project_name", "card", {
          slug: match.slug,
          query: typed,
          matched_on: match.matchedOn,
        });
      }
    }
  }

  if (msg.type === "image") {
    return route("card_changed", "image", "match_card", { media_id: msg.mediaId });
  }

  return route("ask_fallback", "fallback", typed ? "question" : "unsupported", {
    slug,
    question: typed || null,
    deferred: deferredFor(msg),
  });
}

/** The production finder: api.suggest (plinth.suggest/1) as anon; the first phase wins. */
export function suggestProjectFinder(client: RpcClient): ProjectFinder {
  return async (text) => {
    const out = await callRpc<{ items?: unknown }>(client, "suggest", { p_q: text }, { get: true });
    const items = Array.isArray(out?.items) ? out.items : [];
    for (const it of items) {
      const o = it as Record<string, unknown>;
      if (o.kind === "phase" && typeof o.slug === "string") {
        return {
          slug: o.slug,
          label: typeof o.label === "string" ? o.label : o.slug,
          matchedOn: typeof o.matched_on === "string" ? o.matched_on : null,
        };
      }
    }
    return null;
  };
}
