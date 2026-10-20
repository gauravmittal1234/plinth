// WebHome (T21; WORK_BREAKDOWN §2.1, OWNERSHIP.md). The guided story in
// product/design/artboards/WebHome.dc.html, built from `@/src/data` reads
// only (INTEGRATION_NOTES): the hero's assembling risk card, "which projects
// are on track", "how does Plinth know", coverage and the money ledger. The
// site shell (header, footer, Night toggle) is the public route group's
// layout (src/shell, T05).
import { CoverageSection } from "@/src/features/home/coverage-section";
import "@/src/features/home/home.css";
import { ExploreSection } from "@/src/features/home/explore-section";
import { HeroSection } from "@/src/features/home/hero-section";
import { HowSection } from "@/src/features/home/how-section";
import { loadHomeData } from "@/src/features/home/data";
import { MoneySection } from "@/src/features/home/money-section";

export default async function Page() {
  const { defaultSummary, corridors, sortLine, about, bands } = await loadHomeData();

  return (
    <>
      <HeroSection defaultSummary={defaultSummary} />
      <ExploreSection corridors={corridors} sortLine={sortLine} coverageNext={about.coverage.next} />
      <HowSection summary={defaultSummary} bands={bands} />
      <CoverageSection coverage={about.coverage} />
      <MoneySection money={about.money} />
    </>
  );
}
