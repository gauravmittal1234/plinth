// Stub from T05 (web skeleton). T20a replaces it with the real page (WORK_BREAKDOWN §2.1, OWNERSHIP.md).
// M0 gate (T07): the stub also shows the phase's borderless risk chip from the
// fixture RiskSummary (Aurelia: Elevated; Kestrel: Low). T20a replaces both.
import { Suspense } from "react";
import { FIXTURE_RISK_SLUGS, fixtureRiskSummary } from "@/src/m0/fixture-risk";
import { RiskChip } from "@/src/m0/risk-chip";
import { Placeholder, placeholderMetadata } from "@/src/shell/placeholder";

export const metadata = placeholderMetadata("WebProject");

/** The 8 seeded phases are prerendered; any other slug renders on request. */
export function generateStaticParams() {
  return FIXTURE_RISK_SLUGS.map((slug) => ({ slug }));
}

async function PhaseRiskChip({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const summary = fixtureRiskSummary(slug);
  if (!summary) return null;
  return (
    <p className="mt-5 mb-0">
      <RiskChip chip={summary.chip} band={summary.band?.code ?? null} />
    </p>
  );
}

export default function Page({ params }: PageProps<"/gurugram/projects/[slug]">) {
  return (
    <Placeholder artboard="WebProject">
      <Suspense fallback={null}>
        <PhaseRiskChip params={params} />
      </Suspense>
    </Placeholder>
  );
}
