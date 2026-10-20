// wa-webhook handler: card_changed (T46a; WORK_BREAKDOWN T46a; WaDigest "returned card",
// fix-since-family.md §1; API_CONTRACTS §3.1 api.share_card).
//
// A forwarded image with no readable code (router.ts "image" rule): match it to the share card
// Plinth sent, by the image's content hash, and reply with api.share_card(p_code)'s own "Changed
// since this card was sent" diff — every word (band names, the date, the frequency) is that payload's
// field, never composed here. A card_changed reply never claims a change it cannot show, so a miss
// gets the same honest "can't tell which card" line as an unrecognised image with no deferred route
// (router.ts: "no match the same way until claims lands in M3").
//
// Handoff (PR description): the match step calls api.wa_match_share_card(p_image_sha256), which
// does not exist yet — no task owns a migration that exposes core.find_share_cards_by_phash (or an
// exact-hash equivalent recorded when a card is sent) through the api schema PostgREST serves
// (supabase/config.toml `schemas = ["api"]`), and T46a owns no migration prefix (OWNERSHIP.md). This
// handler is written against that RPC's intended contract (mirroring T44's wa_* service-RPC
// naming) so it starts working the moment a later task adds it; until then it answers honestly
// instead of guessing. api.share_card(p_code) itself is also not yet implemented (T27 built its web
// page and fixtures against the same contracted name; API_CONTRACTS §3.1 already lists it).
//
// Contract: router.ts (HandlerInput, HandlerTools, HandlerResult).

import { callRpc, HttpError } from "../../_shared/core/mod.ts";
import type { RpcClient } from "../../_shared/core/mod.ts";
import type { ShareCard } from "../../_shared/core/contracts.ts";
import { imageMessage, replyButtons, textMessage } from "../../_shared/wa/graph.ts";
import type { WaHandler } from "../router.ts";

const NO_MATCH_LINE =
  "We can't tell which card this is from the photo alone. Send the project name or its RERA number and we'll show the current band.";

const UNCHANGED_LINE = "Nothing has changed since this card was sent.";

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Meta already hands us the forwarded image's content hash in the inbound payload — no media
 * download needed to ask whether we recognise this exact file. */
function imageSha256(raw: Record<string, unknown>): string | null {
  const image = raw.image;
  return isObj(image) && typeof image.sha256 === "string" ? image.sha256 : null;
}

async function matchShortCode(service: RpcClient, sha256: string): Promise<string | null> {
  const out = await callRpc<Record<string, unknown> | null>(service, "wa_match_share_card", {
    p_image_sha256: sha256,
  });
  return isObj(out) && typeof out.short_code === "string" ? out.short_code : null;
}

/** headline_line when changed (already "Changed since this card was sent: …"), else the static
 * unchanged line — never invented per-project copy — then the card's own live link (Build: "Cards
 * link to the live page"). */
function changedCaption(card: ShareCard): string {
  const headline = card.changed && card.headline_line ? card.headline_line : UNCHANGED_LINE;
  return `${headline}\n${card.live_url}`;
}

export const cardChanged: WaHandler = async (input, tools) => {
  const sha256 = imageSha256(input.message.raw);
  if (!sha256) {
    await tools.reply(textMessage(NO_MATCH_LINE));
    return { outcome: "no_match" };
  }

  let shortCode: string | null = null;
  try {
    shortCode = await matchShortCode(tools.service, sha256);
  } catch (err) {
    tools.log.warn("wa card_changed: match lookup failed", {
      code: err instanceof HttpError ? err.code : "internal",
    });
  }
  if (!shortCode) {
    await tools.reply(textMessage(NO_MATCH_LINE));
    return { outcome: "no_match" };
  }

  let card: ShareCard;
  try {
    card = await callRpc<ShareCard>(tools.service, "share_card", { p_code: shortCode }, {
      get: true,
    });
  } catch (err) {
    tools.log.warn("wa card_changed: share_card lookup failed", {
      code: err instanceof HttpError ? err.code : "internal",
    });
    await tools.reply(textMessage(NO_MATCH_LINE));
    return { outcome: "no_match" };
  }

  const imageUrl = card.now.card_url ?? card.sent.card_url;
  if (imageUrl) {
    await tools.reply(imageMessage(imageUrl, changedCaption(card)));
  } else {
    await tools.reply(textMessage(changedCaption(card)));
  }
  await tools.reply(
    replyButtons({
      body: card.phase.name,
      buttons: [{ id: "open_full_card", title: "Open full card" }],
    }),
  );
  return {
    outcome: card.changed ? "changed" : "unchanged",
    session: { type: "card_sent", slug: card.phase.slug },
  };
};
