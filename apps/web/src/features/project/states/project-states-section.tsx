// WebProjectStates (T20c; WORK_BREAKDOWN §4 T20c; WebProjectStates.dc.html,
// fixpass-buyer.md §4, fix-project2.md §2(b)(c)): the hard-state instruments
// (Severe's rule field is already risk-section.tsx's own `RiskHeader`, so
// nothing is duplicated here) plus the "If you've already booked here"
// panel. This only ever adds to the guided story — a plain scored project
// with no overlay and a model-set band renders nothing, so T20a/T20b's
// existing project pages (Aurelia's default fixture, Kestrel Park, Cedar
// Walk) are unchanged.
import type { EvidenceSummary, RiskSummary } from "@plinth/contracts";
import { SectionBand } from "@plinth/web-ui";
import { AgeBars, ageRows } from "./age-bars";
import { BookedPanel } from "./booked-panel";
import { Checklist } from "./checklist";
import { LIMITED_HISTORY_CHECKLIST, NOT_SCORED_CHECKLIST } from "./copy";
import { RescoringSteps } from "./rescoring-steps";
import { StallInstrument } from "./stall-instrument";
import { WithheldNotice } from "./withheld-notice";

export function ProjectStatesSection({
  risk,
  records,
}: {
  risk: RiskSummary;
  records: readonly EvidenceSummary[];
}) {
  const { display, band, phase } = risk;
  const today = risk.meta.generated_at.slice(0, 10);

  const isSevereRule = band?.set_by === "red_flag_rule";
  const isStalled = display.overlays.includes("stalled");
  const isStale = display.overlays.includes("stale");
  const isRescoring = display.overlays.includes("rescoring");
  const isLimitedHistory = display.state === "limited_history";
  const isNotScored = display.state === "not_scored";
  const isFactsOnly = display.state === "facts_only";

  const hardState =
    isSevereRule || isStalled || isStale || isRescoring || isLimitedHistory || isNotScored || isFactsOnly;
  if (!hardState) return null;

  const checklistItems = isLimitedHistory
    ? LIMITED_HISTORY_CHECKLIST.map((item) =>
        item.heading === "Progress against time" ? { ...item, body: risk.progress.line } : item,
      )
    : isNotScored
      ? NOT_SCORED_CHECKLIST
      : null;

  return (
    <SectionBand id="booked-buyer" tone="bg">
      <div className="flex flex-col gap-16">
        {isStalled ? (
          <StallInstrument reasons={risk.reasons} progress={risk.progress} meta={risk.meta} />
        ) : null}

        {isStale ? <AgeBars rows={ageRows(risk.progress, risk.reasons, today)} /> : null}

        {isRescoring ? <RescoringSteps fact={risk.pending[0]} /> : null}

        {checklistItems ? <Checklist items={checklistItems} /> : null}

        {isFactsOnly && risk.withheld ? (
          <WithheldNotice withheld={risk.withheld} records={records} developerName={phase.developer.name} />
        ) : null}

        <BookedPanel
          slug={phase.slug}
          notScored={isNotScored}
          // The financial-creditor addendum is specific to the insolvency
          // rule (RF1_GROUP_CIRP, Laurel); it is one of four published
          // red-flag rules (DESIGN.md §5b), so a different rule should not
          // get this text.
          insolvency={band?.rule?.code === "RF1_GROUP_CIRP"}
        />
      </div>
    </SectionBand>
  );
}
