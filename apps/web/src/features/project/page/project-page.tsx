// The guided story (DESIGN §4a): Hero → Will it be delivered on time? → So
// what do we do now? → What else before booking? → How much is built? → What
// are the homes like? → What will I really pay? → Can we afford the wait? →
// Picture yourself here → What do the records show? → Ask anything. T20a
// builds Hero, Risk, Next, Built and Records; T20b fills the rest
// (OWNERSHIP.md: "T20a stubs, T20b fills"), which is also why this file
// passes each of those six sections the slice of ProjectPage it needs — the
// stubs took no props. One <h1> lives in HeroSection; every other heading is
// an <h2>, so the page keeps exactly one top-level heading (e2e/smoke.spec.ts).
// `ProjectStatesSection` (T20c, WebProjectStates) sits right after the risk
// answer: it renders nothing for a plain scored project, and the hard-state
// instrument plus "If you've already booked here" for the 6 phases and the
// facts-only fixture that carry one (project-states-section.tsx).
import type { Evidence } from "@plinth/contracts";
import { ProjectStatesSection } from "../states";
import { AskSection } from "../sections/ask/ask-section";
import { BookingSection } from "../sections/booking/booking-section";
import { BuiltSection } from "../sections/built/built-section";
import { CostSection } from "../sections/cost/cost-section";
import { HeroSection } from "../sections/hero/hero-section";
import { HomesSection } from "../sections/homes/homes-section";
import { NextSection } from "../sections/next/next-section";
import { PictureSection } from "../sections/picture/picture-section";
import { RecordsSection } from "../sections/records/records-section";
import { RiskSection } from "../sections/risk/risk-section";
import { WaitSection } from "../sections/wait/wait-section";
import { EvidenceProvider } from "./evidence-context";
import type { ProjectData } from "./load-project";
import { OnThisPageRail } from "./on-this-page-rail";

export function ProjectPageView({
  data,
  evidence,
}: {
  data: ProjectData;
  evidence: Readonly<Record<string, Evidence>>;
}) {
  const { page, bands } = data;
  return (
    <EvidenceProvider evidence={evidence}>
      <HeroSection page={page} />
      <OnThisPageRail slug={page.risk.phase.slug} />
      <RiskSection risk={page.risk} bands={bands} />
      <ProjectStatesSection risk={page.risk} records={page.records} nextSteps={page.next_steps} />
      <NextSection nextSteps={page.next_steps} />
      <BookingSection beforeBooking={page.before_booking} />
      <BuiltSection page={page} bands={bands} />
      <HomesSection homes={page.homes} />
      <CostSection
        cost={page.cost}
        fromDeveloper={page.from_developer}
        waitDefaults={page.wait_defaults}
        affordDefault={page.afford_default}
      />
      <WaitSection waitDefaults={page.wait_defaults} affordDefault={page.afford_default} />
      <PictureSection />
      <RecordsSection
        truthPanel={page.truth_panel}
        records={page.records}
        preRera={page.pre_rera}
      />
      <AskSection />
    </EvidenceProvider>
  );
}
