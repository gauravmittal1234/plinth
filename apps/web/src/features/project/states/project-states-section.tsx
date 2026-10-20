// WebProjectStates (T20c; WORK_BREAKDOWN §4 T20c; WebProjectStates.dc.html,
// fixpass-buyer.md §4, fix-project2.md §2(b)(c)): the hard-state instruments
// (Severe's rule field is already risk-section.tsx's own `RiskHeader`, so
// nothing is duplicated here) plus the "If you've already booked here"
// panel. This only ever adds to the guided story — a plain scored project
// with no overlay and a model-set band renders nothing, so T20a/T20b's
// existing project pages (Aurelia's default fixture, Kestrel Park, Cedar
// Walk) are unchanged.
//
// Every fact a checklist line or "what to watch" bullet needs — the
// developer's name, the group's own record, a QPR's quarter, an extension's
// date, the re-score deadline — is read off `risk`/`records`/`nextSteps`
// here, never hard-coded by project slug (AGENTS.md §1 "Never invent a fact
// in code"; §5 "risk copy ... comes from the server ... never composed in a
// client"). The checklist for Limited history / Not scored is literally
// `nextSteps.steps` (the same records-to-read list "So what do we do now?"
// shows), just with a source chip per line.
import type { EvidenceSummary, NextSteps, RiskSummary } from "@plinth/contracts";
import { SectionBand } from "@plinth/web-ui";
import { AgeBars, ageRows } from "./age-bars";
import { BookedPanel } from "./booked-panel";
import { Checklist } from "./checklist";
import { formatDate } from "../page/format";
import { RescoringSteps } from "./rescoring-steps";
import { StallInstrument } from "./stall-instrument";
import { watchLines } from "./watch";
import { WithheldNotice } from "./withheld-notice";

export function ProjectStatesSection({
  risk,
  records,
  nextSteps,
}: {
  risk: RiskSummary;
  records: readonly EvidenceSummary[];
  nextSteps: NextSteps;
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
    isSevereRule ||
    isStalled ||
    isStale ||
    isRescoring ||
    isLimitedHistory ||
    isNotScored ||
    isFactsOnly;
  if (!hardState) return null;

  // The financial-creditor addendum is specific to the insolvency rule
  // (RF1_GROUP_CIRP); it is one of four published red-flag rules (DESIGN.md
  // §5b), so a different rule should not get this text. Its date is the
  // NCLT order's own source date, read off the matching "legal" reason —
  // never a fixed date, so this still reads correctly if another project
  // trips the same rule.
  const insolvency = band?.rule?.code === "RF1_GROUP_CIRP";
  const insolvencyDate = insolvency
    ? risk.reasons.find((r) => r.factor === "legal")?.sources[0].as_of
    : undefined;

  const checklistItems =
    isLimitedHistory || isNotScored
      ? nextSteps.steps.map((step) => ({
          heading: step.heading,
          body: step.body,
          chip: step.source_label ?? null,
        }))
      : null;

  const watch = watchLines({
    risk,
    records,
    nextSteps,
    isStalled,
    isLimitedHistory,
    isNotScored,
    isStale,
    isRescoring,
    isFactsOnly,
    insolvency,
  });

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
          <WithheldNotice
            withheld={risk.withheld}
            records={records}
            developerName={phase.developer.name}
          />
        ) : null}

        <BookedPanel
          slug={phase.slug}
          notScored={isNotScored}
          insolvency={insolvency}
          insolvencyDate={insolvencyDate ? formatDate(insolvencyDate) : undefined}
          watch={watch}
        />
      </div>
    </SectionBand>
  );
}
