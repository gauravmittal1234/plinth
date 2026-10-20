// wa-webhook handler: risk_card (T46a; WORK_BREAKDOWN T46a; WaRisk artboard; API_CONTRACTS §2, §5.1).
//
// Sends the WaRisk card: resolve the slug (route.args: slug | rera | short_code | the session's own
// slug for a card button), read api.risk_summary(p_slug) — the same RiskSummary web and app render —
// and reply with its share.card_url image, a caption that ends with the share-card line (DESIGN §5b),
// and the three session buttons "Why this band" · "Follow project" · "Ask". The risk copy (band,
// frequency, reasons, sources) is never composed here: every word is a RiskSummary field (AGENTS.md
// §7, rule 10). Card buttons under a live card, and under a card_changed or band-change-alert reply
// ("open_full_card"), all land on this handler (router.ts "card_button").
//
// "Yes, alert me" calls api.follow under the tapper's own ≤ 60 s tap JWT (tools.actAsUser(), T44
// verify.ts), so the confirmation only ever follows a record the RPC returned (AGENTS.md rule 9).
// api.follow is T45a's build (not a T46a dependency); until it ships this replies honestly instead
// of claiming a follow that was never written — see the PR's Handoff note.
//
// Contract: router.ts (HandlerInput, HandlerTools, HandlerResult).

import { callRpc, HttpError } from "../../_shared/core/mod.ts";
import type { RiskSummary, Suggestion, SuggestResults } from "../../_shared/core/contracts.ts";
import { imageMessage, replyButtons, textMessage } from "../../_shared/wa/graph.ts";
import type { HandlerResult, HandlerTools, Route, WaHandler } from "../router.ts";

const NOT_FOUND_LINE =
  "We don't have a project at that address. Send its name or RERA number and we'll show the current band.";

const FOLLOW_PROMPT =
  "Get alerts here when this project's band changes, its date is extended, or it files or misses a QPR? At most 1 message a day. Reply STOP anytime.";

const FOLLOW_DECLINED = "No problem. Type follow anytime to turn alerts on.";

const FOLLOW_FAILED =
  "We couldn't turn on alerts just now. Try again in a minute, or follow from the app.";

const CARD_REPLY_BUTTONS = [
  { id: "why_this_band", title: "Why this band" },
  { id: "follow_project", title: "Follow project" },
  { id: "ask", title: "Ask" },
] as const;

const FOLLOW_REPLY_BUTTONS = [
  { id: "yes_alert_me", title: "Yes, alert me" },
  { id: "not_now", title: "Not now" },
] as const;

/** api.suggest's phase matches whose matched_on is the RERA number (router.ts suggestProjectFinder). */
function reraMatch(items: readonly Suggestion[]): string | null {
  for (const it of items) {
    if (it.kind === "phase" && it.matched_on === "rera_number" && it.slug) return it.slug;
  }
  return null;
}

/** The slug for an initial card send: args.slug (link/project_name) or args.rera, resolved. */
async function resolveSlugForCard(route: Route, tools: HandlerTools): Promise<string | null> {
  if (typeof route.args.slug === "string" && route.args.slug !== "") return route.args.slug;
  const rera = typeof route.args.rera === "string" ? route.args.rera : null;
  if (rera) {
    const out = await callRpc<SuggestResults>(tools.service, "suggest", { p_q: rera });
    return reraMatch(out.items);
  }
  // route.args.short_code (a plinth.in/r/<code> link): no resolver RPC exists yet (PR Handoff).
  return null;
}

async function fetchRisk(tools: HandlerTools, slug: string): Promise<RiskSummary | null> {
  try {
    return await callRpc<RiskSummary>(tools.service, "risk_summary", { p_slug: slug }, {
      get: true,
    });
  } catch (err) {
    if (err instanceof HttpError && err.code === "not_found") return null;
    throw err;
  }
}

/** share.lines + share.source_line + share.caption, unchanged: the copy ends with the share-card
 * line (DESIGN §5b), and a band is always given with its natural frequency, because share.lines
 * already carries both — this never composes a sentence of its own. */
function cardCaption(risk: RiskSummary): string {
  return [...risk.share.lines, risk.share.source_line, risk.share.caption].join("\n");
}

/** The buttons message body: the project name, then its live page (Build: "Cards link to the live
 * page"). WhatsApp auto-links a bare https URL in body text. */
function cardButtonsBody(risk: RiskSummary): string {
  return `${risk.phase.name}\n${risk.meta.live_url}`;
}

async function sendCard(risk: RiskSummary, tools: HandlerTools): Promise<void> {
  await tools.reply(imageMessage(risk.share.card_url, cardCaption(risk)));
  await tools.reply(
    replyButtons({ body: cardButtonsBody(risk), buttons: [...CARD_REPLY_BUTTONS] }),
  );
}

/** "Why this band": the reasons text with sources, plus what would change it and where the
 * developer's reply lives, all straight from RiskSummary fields. Empty reasons (not scored, or
 * bands withheld) get an honest line using the chip instead of a band word. */
function whyThisBandText(risk: RiskSummary): string {
  if (risk.reasons.length === 0) {
    return `There's no "why" to show yet for ${risk.phase.name}. ${risk.chip.label}.`;
  }
  const bandWord = risk.band?.label ?? risk.chip.label;
  const lines = risk.reasons.map((r) => {
    const sources = r.sources.map((s) => s.label).join("; ");
    return `${r.rank}. ${r.text} ${sources}`.trim();
  });
  const parts = [`Why ${bandWord}? The ${risk.reasons.length} reasons:`, ...lines];
  if (risk.what_would_change) parts.push(`What would change this: ${risk.what_would_change}`);
  if (risk.developer_response) {
    parts.push(`The developer's reply is on the full card: ${risk.meta.live_url}`);
  }
  return parts.join("\n");
}

async function confirmFollow(risk: RiskSummary, tools: HandlerTools): Promise<HandlerResult> {
  try {
    const user = await tools.actAsUser();
    await callRpc(user, "follow", {
      p_slug: risk.phase.slug,
      p_follow_type: "watching",
      p_source: "whatsapp",
      p_client_id: crypto.randomUUID(),
    });
    await tools.reply(
      textMessage(`Done. You will get alerts for ${risk.phase.name}. Manage them at plinth.in/you.`),
    );
    return { outcome: "followed", session: { type: "done" } };
  } catch (err) {
    tools.log.warn("wa risk_card: follow failed", {
      code: err instanceof HttpError ? err.code : "internal",
    });
    await tools.reply(textMessage(FOLLOW_FAILED));
    return { outcome: "follow_failed", session: { type: "done" } };
  }
}

export const riskCard: WaHandler = async (input, tools) => {
  const { route } = input;
  const action = route.action;

  let slug: string | null;
  if (action === "card") {
    slug = await resolveSlugForCard(route, tools);
  } else {
    slug = typeof route.args.slug === "string" && route.args.slug !== "" ? route.args.slug : null;
  }
  if (slug === null) {
    await tools.reply(textMessage(NOT_FOUND_LINE));
    return { outcome: "not_found" };
  }

  const risk = await fetchRisk(tools, slug);
  if (risk === null) {
    await tools.reply(textMessage(NOT_FOUND_LINE));
    return { outcome: "not_found" };
  }

  switch (action) {
    case "card":
    case "open_full_card":
      await sendCard(risk, tools);
      return { outcome: "card_sent", session: { type: "card_sent", slug: risk.phase.slug } };

    case "why_this_band":
      await tools.reply(textMessage(whyThisBandText(risk)));
      return { outcome: "why_this_band" };

    case "follow_project":
      await tools.reply(
        replyButtons({ body: FOLLOW_PROMPT, buttons: [...FOLLOW_REPLY_BUTTONS] }),
      );
      return {
        outcome: "follow_offered",
        session: { type: "follow_offered", slug: risk.phase.slug },
      };

    case "ask":
      await tools.reply(textMessage(`Type your question about ${risk.phase.name}.`));
      return { outcome: "ask_opened", session: { type: "ask_opened", slug: risk.phase.slug } };

    case "yes_alert_me":
      return await confirmFollow(risk, tools);

    case "not_now":
      await tools.reply(textMessage(FOLLOW_DECLINED));
      return { outcome: "follow_declined", session: { type: "done" } };

    default:
      tools.log.warn("wa risk_card: unhandled action", { action });
      return { outcome: "unhandled" };
  }
};
