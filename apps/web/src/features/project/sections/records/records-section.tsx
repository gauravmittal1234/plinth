// "What do the records show?" (DESIGN §4 item 8, WebProject.dc.html Records):
// a compact at-a-glance row (TruthPanelRow), then every sourced record, each a
// source chip into the one evidence drawer (page/evidence-context.tsx). A
// native <details> holds the pre-RERA history (fix-project2.md §1 G-16): real
// disclosure semantics, no extra script.
//
// Only the chip's click handler needs the client (useEvidence), so it is the
// one piece that ships JS: `RecordRow` lives in its own "use client" module
// (record-row.tsx) and this section stays server-rendered (project-page JS
// budget, lighthouserc.cjs), same split as states/evidence-chip.tsx.
import type { EvidenceSummary, PreRera, TruthPanelRow } from "@plinth/contracts";
import { FactTile, FactTiles, SectionBand } from "@plinth/web-ui";
import { RECORDS_COPY } from "../../page/copy";
import { RecordRow } from "./record-row";

/** A finished line the fixture adds beside PreRera's typed fields (the contract leaves the object open). */
function textField(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function PreReraSection({ preRera }: { preRera: PreRera }) {
  const intro = textField(preRera.intro_line);
  const coverage = textField(preRera.coverage_line);
  return (
    <details className="group rounded-panel bg-bg-solid p-5 sm:p-7">
      <summary className="cursor-pointer font-semibold text-ink">
        {RECORDS_COPY.preReraToggle}
      </summary>
      <div className="mt-4 flex flex-col gap-4">
        {intro ? <p className="m-0 text-ink2">{intro}</p> : null}
        <ul role="list" className="m-0 flex flex-col gap-3 p-0">
          {preRera.items.map((item) => (
            <li key={item.name}>
              <p className="m-0">
                <strong className="font-semibold">{item.name}:</strong> {item.line}
              </p>
            </li>
          ))}
        </ul>
        <p className="m-0 text-small text-ink2">
          {coverage}
          {coverage && preRera.line ? " " : null}
          {preRera.line}
        </p>
      </div>
    </details>
  );
}

export function RecordsSection({
  truthPanel,
  records,
  preRera,
}: {
  truthPanel: readonly TruthPanelRow[];
  records: readonly EvidenceSummary[];
  preRera: PreRera | null;
}) {
  return (
    <SectionBand id="records" tone="track">
      <div className="flex flex-col gap-8">
        <h2 className="m-0 max-w-[18ch] text-balance font-display text-section font-bold">
          {RECORDS_COPY.heading}
        </h2>

        {truthPanel.length > 0 ? (
          <div className="flex flex-col gap-4">
            <h3 className="m-0 text-small font-semibold text-ink2 uppercase">
              {RECORDS_COPY.atAGlance}
            </h3>
            <FactTiles columns="auto">
              {truthPanel.map((row) => (
                <FactTile key={row.key} label={row.label} value={row.value_line} />
              ))}
            </FactTiles>
          </div>
        ) : null}

        {records.length > 0 ? (
          <div className="flex flex-col gap-4">
            <h3 className="m-0 font-display text-section font-bold">
              {RECORDS_COPY.listHeading}
            </h3>
            <ul role="list" className="m-0 flex flex-col gap-4 p-0">
              {records.map((row, i) => (
                <RecordRow key={`${row.fact_id}-${i}`} row={row} />
              ))}
            </ul>
          </div>
        ) : null}

        {preRera ? <PreReraSection preRera={preRera} /> : null}
      </div>
    </SectionBand>
  );
}
