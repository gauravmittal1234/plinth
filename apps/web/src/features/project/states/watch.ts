// "What to watch" bullets for the booked-buyer panel (WORK_BREAKDOWN §4
// T20c; fixpass-buyer.md §4, WebProjectStates.dc.html "{{wi}}"). Every bullet
// is built from `RiskSummary`/`ProjectPage` fields already on the page —
// `risk.pending`, `risk.reasons`, `risk.phase.developer.name`,
// `risk.progress.built_pct`, `records` and `nextSteps.steps` — never a
// per-slug fact string (AGENTS.md §1 "Never invent a fact in code"; AGENTS.md
// §5: risk copy "comes from the server ... never composed in a client").
// Where the artboard named a fact this payload doesn't carry on its own
// (Coral's "Extension 2 (to Aug 2029)", Aurelia's demand-letter slab numbers)
// the bullet either reuses the server's own sentence verbatim or is dropped
// — see the PR's Handoffs note.
import type { EvidenceSummary, NextSteps, RiskSummary } from "@plinth/contracts";

/** Fact-free: points at Pay-as-built for any demand letter. Shared by every
 * hard state that has stages on record to check a demand against. */
const DEMAND_LETTERS_LINE = "Demand letters against stages on record, with Pay-as-built.";

function latestExtensionLine(records: readonly EvidenceSummary[]): string | null {
  const extensions = records.filter((r) => /\bextension\b/i.test(r.chip));
  const last = extensions.at(-1);
  return last ? last.line : null;
}

export function watchLines({
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
}: {
  risk: RiskSummary;
  records: readonly EvidenceSummary[];
  nextSteps: NextSteps;
  isStalled: boolean;
  isLimitedHistory: boolean;
  isNotScored: boolean;
  isStale: boolean;
  isRescoring: boolean;
  isFactsOnly: boolean;
  insolvency: boolean;
}): string[] {
  const developerName = risk.phase.developer.name;
  const lines: string[] = [];

  if (isStalled) {
    if (risk.progress.built_pct != null) {
      lines.push(`Each QPR: does the built share move from ${risk.progress.built_pct}%?`);
    }
    lines.push(DEMAND_LETTERS_LINE);
    if (insolvency) lines.push(`NCLT and IBBI lists for ${developerName} and its group.`);
    lines.push("New HARERA orders on this project.");
  }

  if (isLimitedHistory) {
    lines.push("The CA certificate on escrow withdrawals with each QPR.");
    lines.push(DEMAND_LETTERS_LINE);
    lines.push(`${developerName}'s first finished project, when it comes.`);
  }

  if (isNotScored) {
    lines.push("Its first QPR, once filed.");
    lines.push(`New HARERA orders on this project or ${developerName}.`);
  }

  if (isStale) {
    for (const pending of risk.pending) lines.push(pending.line);
    const extensionLine = latestExtensionLine(records);
    if (extensionLine) lines.push(`Whether a third extension follows: ${extensionLine}`);
    lines.push(DEMAND_LETTERS_LINE);
  }

  if (isRescoring) {
    const pending = risk.pending[0];
    if (pending) {
      lines.push(pending.line);
      if (pending.marker_line) lines.push(pending.marker_line);
    }
    lines.push(DEMAND_LETTERS_LINE);
  }

  if (isFactsOnly) {
    for (const step of nextSteps.steps) lines.push(`${step.heading}: ${step.body}`);
    lines.push(DEMAND_LETTERS_LINE);
  }

  return lines;
}
