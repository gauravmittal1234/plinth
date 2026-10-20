"use client";

// The one interactive part of a records row: the source chip into the
// page's evidence drawer (page/evidence-context.tsx). The row's own layout
// and copy stay with the server-rendered `RecordsSection` (project-page JS
// budget, lighthouserc.cjs), same split as states/evidence-chip.tsx and
// states/booked-toggle.tsx.
import type { EvidenceSummary } from "@plinth/contracts";
import { SourceChip } from "@plinth/web-ui";
import { useEvidence } from "../../page/evidence-context";

export function RecordRow({ row }: { row: EvidenceSummary }) {
  const { has, open } = useEvidence();
  const available = has(row.fact_id);
  return (
    <li className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <SourceChip
        source={{ label: row.chip, evidence_url: available ? row.evidence_url : null }}
        onOpen={available ? () => open(row.fact_id) : undefined}
        ariaLabel={available ? `Source: ${row.chip}. Open evidence.` : undefined}
      />
      <p className="m-0 min-w-0 flex-1 text-ink2">{row.line}</p>
    </li>
  );
}
