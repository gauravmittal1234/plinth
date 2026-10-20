// The Stalled instrument (WORK_BREAKDOWN §4 T20c; fixpass-buyer.md §4,
// WebProjectStates.dc.html "Built, by quarterly report"): four equal slabs,
// one per QPR with no progress, plus a promised-time bar running past 100%
// to today. The slabs are read off the "site" reason's own sources (Laurel's
// rank-3 reason, "No QPR progress for 4 quarters…"), so every quarter label,
// filed date and evidence link is the same data risk-section.tsx already
// cites — nothing here is invented. Server-rendered; only each slab's
// source chip is client code (evidence-chip.tsx).
import type { Reason, RiskMeta, Progress } from "@plinth/contracts";
import type { CSSProperties } from "react";
import { formatDate } from "../page/format";
import { STALL_COPY } from "./client-copy";
import { EvidenceChip } from "./evidence-chip";

function Slab({ source, pct }: { source: Reason["sources"][number]; pct: number }) {
  const quarter = source.label.replace(/^HARERA QPR\s*·\s*/, "");
  return (
    <div className="flex flex-col gap-2">
      <div
        role="img"
        aria-label={`${quarter}: ${pct}% built`}
        className="h-24 w-full overflow-hidden rounded-panel bg-track"
      >
        <div
          className="h-full bg-accent"
          style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
        />
      </div>
      <p className="m-0 text-small font-semibold text-ink">
        {pct}% <span className="font-normal text-ink2">{quarter}</span>
      </p>
      <EvidenceChip
        factId={source.fact_ids[0]}
        source={{ label: `filed ${formatDate(source.as_of)}`, evidence_url: source.evidence_url }}
        ariaLabel={`Source: ${source.label}, filed ${formatDate(source.as_of)}. Open evidence.`}
        fallback="link"
      />
    </div>
  );
}

export function StallInstrument({
  reasons,
  progress,
  meta,
}: {
  reasons: readonly Reason[];
  progress: Progress;
  meta: Pick<RiskMeta, "generated_at">;
}) {
  const siteReason = reasons.find((r) => r.factor === "site" && r.sources.length > 1);
  if (!siteReason || progress.built_pct == null) return null;

  const today = meta.generated_at.slice(0, 10);
  const overdue = progress.time_used_pct > 100;
  /** The bar's scale: 0 to 150% of the promised time, so the 100% line sits inside it. */
  const BAR_MAX = 150;
  const filledPct = (Math.min(100, progress.time_used_pct) / BAR_MAX) * 100;
  const markerPct = (100 / BAR_MAX) * 100;
  const overflowPct = overdue
    ? ((Math.min(BAR_MAX, progress.time_used_pct) - 100) / BAR_MAX) * 100
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="m-0 font-display text-h2 font-extrabold">{STALL_COPY.heading}</h2>
        <span className="rounded-pill bg-claim-bg px-3 py-1 text-caption font-semibold text-ink">
          {STALL_COPY.pill}
        </span>
      </div>
      <p className="m-0 max-w-measure text-body text-ink2">{siteReason.text}</p>

      <div className="flex flex-col gap-4">
        <h4 className="m-0 text-small font-semibold text-ink2 uppercase">
          {STALL_COPY.barHeading}
        </h4>
        <div className="grid gap-4 sm:grid-cols-4">
          {siteReason.sources.map((source) => (
            <Slab key={source.label} source={source} pct={progress.built_pct ?? 0} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div
          role="img"
          aria-label={`Today, ${formatDate(today)}: ${progress.time_used_pct}% ${STALL_COPY.overdueLabel}`}
          className="relative h-5 w-full max-w-[37.5rem] overflow-hidden rounded-pill bg-track"
        >
          <div className="h-full bg-accent" style={{ width: `${filledPct}%` }} />
          {overdue ? (
            <div
              aria-hidden="true"
              className="ui-hatch absolute inset-y-0"
              style={
                {
                  "--ui-band-ink": "var(--pl-risk-severe-ink)",
                  "--ui-band-fill": "var(--pl-risk-severe-fill)",
                  left: `${markerPct}%`,
                  width: `${overflowPct}%`,
                } as CSSProperties
              }
            />
          ) : null}
          <div
            className="absolute inset-y-0 w-px bg-ink2"
            style={{ left: `${markerPct}%` }}
            aria-hidden="true"
          />
        </div>
        <p className="m-0 text-small text-ink2">
          Today, {formatDate(today)} · {progress.time_used_pct}% {STALL_COPY.overdueLabel}
        </p>
      </div>

      <div className="rounded-panel bg-accent-soft px-5 py-4 text-on-accent-soft">
        <p className="m-0 font-semibold">{STALL_COPY.changeHeading}</p>
        <p className="m-0 mt-1">{STALL_COPY.changeLine}</p>
      </div>
    </div>
  );
}
