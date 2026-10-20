// T27: /cards/<kind>/<file>.png — the next/og share cards (WORK_BREAKDOWN
// §2.1 "Share cards", OWNERSHIP.md apps/web/app/{cards,c}/**). A plain Route
// Handler, not a page.tsx: ImageResponse returns real PNG bytes, which a
// page component can't (replaces the T05 stub that lived at this path).
//
// `card_url` everywhere in the contracts is "/cards/<kind>/<slug>.png"
// (packages/contracts/examples/share_card): kind risk or cost takes a phase
// slug, kind changed takes a ShareCard code.
import { isDataError, projectPage, riskSummary, shareCard } from "@/src/data";
import { renderChangedCard } from "@/src/features/cards/changed-card";
import { renderCostCard } from "@/src/features/cards/cost-card";
import { renderRiskCard } from "@/src/features/cards/risk-card";

const NOT_FOUND = new Response("Not found", { status: 404 });

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
      default:
        return NOT_FOUND;
    }
  } catch (e) {
    if (isDataError(e, "not_found") || isDataError(e, "fixture_missing")) return NOT_FOUND;
    throw e;
  }
}
