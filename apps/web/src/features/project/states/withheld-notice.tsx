"use client";

// Facts-only (WORK_BREAKDOWN §4 T20c; fix-project2.md §2(b), DESIGN.md §5b
// "Facts-only example"): the withheld box plus "The records, as they stand".
// `risk.withheld` carries the since/line/explainer straight from the server
// (API_CONTRACTS §2); the three structural lines below follow WebDeveloper's
// own facts-only copy (facts-only-section.tsx), adapted from a group to one
// project. The records list is `page.records` unchanged — the same sourced
// facts records-section.tsx shows, just regrouped under this heading.
import type { EvidenceSummary, Withheld } from "@plinth/contracts";
import { SourceChip } from "@plinth/web-ui";
import { WITHHELD_COPY } from "./copy";
import { formatDate } from "../page/format";
import { useEvidence } from "../page/evidence-context";

function RecordRow({ row }: { row: EvidenceSummary }) {
  const { has, open } = useEvidence();
  const available = has(row.fact_id);
  return (
    <li className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <SourceChip
        source={{ label: row.chip, evidence_url: available ? row.evidence_url : null }}
        onOpen={available ? () => open(row.fact_id) : undefined}
        ariaLabel={available ? `Source: ${row.chip}. Open evidence.` : undefined}
        surface="track"
      />
      <p className="m-0 min-w-0 flex-1 text-ink2">{row.line}</p>
    </li>
  );
}

export function WithheldNotice({
  withheld,
  records,
  developerName,
}: {
  withheld: Withheld;
  records: readonly EvidenceSummary[];
  developerName: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 rounded-panel bg-claim-bg p-5 sm:p-7">
        <p className="m-0 font-display text-h4 font-extrabold">{withheld.line}</p>
        <p className="m-0 text-small text-ink2">Since {formatDate(withheld.since)}.</p>
        <p className="m-0 max-w-measure text-body">{withheld.explainer_line}</p>
        <p className="m-0 max-w-measure text-body">{WITHHELD_COPY.stillHereLine}</p>
        <p className="m-0 max-w-measure text-body">{WITHHELD_COPY.withheldLine}</p>
        <p className="m-0 max-w-measure text-body">{WITHHELD_COPY.notAFindingLine(developerName)}</p>
        <a href={withheld.explainer_url} className="text-ink underline underline-offset-[0.2em]">
          {WITHHELD_COPY.explainerLinkLabel}
        </a>
      </div>

      {records.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h2 className="m-0 font-display text-h2 font-extrabold">{WITHHELD_COPY.recordsHeading}</h2>
          <ul role="list" className="m-0 flex flex-col gap-4 p-0">
            {records.map((row, i) => (
              <RecordRow key={`${row.fact_id}-${i}`} row={row} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
