// T27: /cards/<kind>/<file>.png — the next/og share cards (WORK_BREAKDOWN
// §2.1 "Share cards", OWNERSHIP.md apps/web/app/{cards,c}/**). A plain Route
// Handler, not a page.tsx: ImageResponse returns real PNG bytes, which a
// page component can't (replaces the T05 stub that lived at this path).
//
// `card_url` everywhere in the contracts is "/cards/<kind>/<slug>.png"
// (packages/contracts/examples/share_card): kind risk or cost takes a phase
// slug, kind changed takes a ShareCard code, kind digest takes the weekly
// digest's card token (the lead's M2 gate gap 5).
//
// A digest is personal (which projects someone follows), so its card is
// never addressed by a person: ops.enqueue_digests mints a random 32-hex
// token per digest row and puts /cards/digest/<token>.png in it; this route
// reads it back with api.digest_card(p_code), the way the changed card
// reads api.share_card(p_code). Anything that is not a token is a 404
// before any lookup, and the image is never stored by a shared cache.
import { digestCard, isDataError, projectPage, riskSummary, shareCard } from "@/src/data";
import { renderChangedCard } from "@/src/features/cards/changed-card";
import { renderCostCard } from "@/src/features/cards/cost-card";
import { renderDigestHeaderCard } from "@/src/features/cards/digest-card";
import { renderRiskCard } from "@/src/features/cards/risk-card";

const NOT_FOUND = new Response("Not found", { status: 404 });
const DIGEST_TOKEN = /^[0-9a-f]{32}$/;

function fileKey(segment: string): string {
  return segment.endsWith(".png") ? segment.slice(0, -4) : segment;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ card: string[] }> },
): Promise<Response> {
  const { card } = await params;
  const [kind, file] = card;
  if (!kind || !file) return NOT_FOUND;
  const key = fileKey(file);

  try {
    switch (kind) {
      case "risk": {
        const page = await projectPage(key);
        return await renderRiskCard(page.risk, page.hero.image_url, page.hero.image_caption);
      }
      case "cost": {
        const page = await projectPage(key);
        if (!page.cost) return NOT_FOUND; // "Null without a cost sheet" (CostBreakdown schema)
        return await renderCostCard(page.risk.phase, page.cost, page.meta);
      }
      case "changed": {
        const shared = await shareCard(key);
        // Re-read the phase's RiskSummary for its share.source_line/caption
        // footer text (ShareCard itself carries no promise or disclaimer line).
        const risk = await riskSummary(shared.phase.slug);
        return await renderChangedCard(shared, risk, key);
      }
      case "digest": {
        if (!DIGEST_TOKEN.test(key)) return NOT_FOUND;
        const card = await digestCard(key);
        const image = await renderDigestHeaderCard(card.heading_line, card.projects);
        const headers = new Headers(image.headers);
        headers.set("cache-control", "private, no-store");
        return new Response(image.body, { status: image.status, headers });
      }
      default:
        return NOT_FOUND;
    }
  } catch (e) {
    if (isDataError(e, "not_found") || isDataError(e, "fixture_missing")) return NOT_FOUND;
    throw e;
  }
}
