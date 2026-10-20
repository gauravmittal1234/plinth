// The hero's assembled risk card (WORK_BREAKDOWN T21 signature): everything
// here is `RiskSummary` fields rendered through the shared kit (@plinth/web-ui,
// T14), never composed copy (AGENTS.md §5, DESIGN §0 "risk chip borderless").
import type { RiskSummary } from "@/src/data";
import {
  Button,
  FactTile,
  FactTiles,
  PendingFact,
  RiskHeader,
  slabsFromPct,
  SourceChip,
  TowerStack,
} from "@plinth/web-ui";
import Link from "next/link";

/** The server's `late12.line` always leads with "Original completion <month>." */
function originalCompletionLine(line: string): string {
  const [first] = line.split(". ");
  return first ? `${first.replace(/\.$/, "")}.` : line;
}

export function RiskMiniCard({ summary }: { summary: RiskSummary }) {
  const { phase, progress, price, late12, reasons, pending } = summary;
  const sources = reasons
    .slice(0, 2)
    .map((r) => r.sources[0])
    .filter((s, i, arr) => arr.findIndex((o) => o.label === s.label) === i);

  return (
    <div data-hero-card={phase.slug} className="flex flex-col gap-4.5">
      <div className="flex flex-col gap-0.5">
        <strong className="font-display text-h3 leading-[1.08] font-extrabold tracking-[-0.025em]">
          {phase.name}
        </strong>
        <span className="text-small text-ink2">
          {phase.developer.name} · {phase.locality_line}
        </span>
      </div>

      <RiskHeader risk={summary} srPrefix="Delivery risk: " caption={summary.frequency?.sentence} />

      <div className="flex items-end gap-4.5">
        <TowerStack
          floors={10}
          built={slabsFromPct(progress.built_pct, 10)}
          sold={progress.sold_pct == null ? null : slabsFromPct(progress.sold_pct, 10)}
          band={summary.band?.code}
          size={96}
          className="shrink-0"
        />
        <FactTiles columns={2} className="flex-1">
          <FactTile label="Built" value={`${progress.built_pct ?? "—"}%`} emphasis="accent" />
          <FactTile label="Time used" value={`${progress.time_used_pct}%`} />
        </FactTiles>
      </div>
      <p className="m-0 text-small text-ink2">{originalCompletionLine(late12.line)}</p>

      {price ? (
        <div className="flex flex-wrap items-baseline gap-2.5">
          <strong className="font-display text-number font-extrabold tracking-[-0.02em]">
            {price.display_line}
          </strong>
        </div>
      ) : null}

      <PendingFact fact={pending[0]} />

      {sources.length ? (
        <div className="flex flex-wrap gap-2">
          {sources.map((s) => (
            <SourceChip key={s.label} source={s} />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4.5">
        <Button asChild variant="tertiary">
          <Link href={`/gurugram/projects/${phase.slug}`}>Open the project</Link>
        </Button>
      </div>
    </div>
  );
}
