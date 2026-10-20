// "How old is each record?" (WORK_BREAKDOWN §4 T20c; fix-project2.md §2(c),
// WebProjectStates.dc.html): age bars against the 120-day stale line, built
// from the same data the Stale pill and the records row already cite —
// `progress.latest_qpr` for the ageing QPR, and the most recent dated source
// among the reasons for a "fresh" record (an order, an extension, a search).
// Nothing here is a new fact; it is the existing ones, re-read as an age.
import type { Reason, Progress } from "@plinth/contracts";
import type { CSSProperties } from "react";
import { AGE_BARS_COPY } from "./copy";
import { formatDate } from "../page/format";

type AgeRow = { label: string; when: string; days: number };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00+05:30`).getTime();
  const to = new Date(`${toIso}T00:00:00+05:30`).getTime();
  return Math.max(0, Math.round((to - from) / MS_PER_DAY));
}

/** The latest-filed QPR, plus the most recently dated other source (an order, extension or search). */
export function ageRows(
  progress: Progress,
  reasons: readonly Reason[],
  todayIso: string,
): AgeRow[] {
  const rows: AgeRow[] = [];
  const qpr = progress.latest_qpr;
  if (qpr?.filed_on) {
    rows.push({
      label: `${qpr.label} QPR`,
      when: `filed ${formatDate(qpr.filed_on)}`,
      days: qpr.age_days ?? daysBetween(qpr.filed_on, todayIso),
    });
  }
  const others = reasons
    .flatMap((r) => r.sources)
    .filter((s) => s.as_of && s.label !== qpr?.label)
    .sort((a, b) => (b.as_of ?? "").localeCompare(a.as_of ?? ""));
  const latestOther = others[0];
  if (latestOther?.as_of) {
    rows.push({
      label: latestOther.label,
      when: `checked ${formatDate(latestOther.as_of)}`,
      days: daysBetween(latestOther.as_of, todayIso),
    });
  }
  return rows;
}

function AgeBar({ row }: { row: AgeRow }) {
  const stale = row.days > AGE_BARS_COPY.staleLineDays;
  const widthPct = Math.max(1.5, Math.min(100, (row.days / AGE_BARS_COPY.scaleMaxDays) * 100));
  const markerPct = (AGE_BARS_COPY.staleLineDays / AGE_BARS_COPY.scaleMaxDays) * 100;
  const status = stale ? AGE_BARS_COPY.staleLabel : AGE_BARS_COPY.freshLabel;
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold text-ink">
          {row.label} <span className="font-normal text-ink2">{row.when}</span>
        </span>
        <span className="font-semibold text-ink">
          {status} · {row.days} {row.days === 1 ? "day" : "days"} old
        </span>
      </p>
      <div
        role="img"
        aria-label={`${row.label}, ${row.when}: ${row.days} days old, ${status.toLowerCase()}`}
        className="relative h-3 w-full max-w-[37.5rem] overflow-hidden rounded-pill bg-track"
      >
        <div
          className={stale ? "ui-hatch h-full" : "h-full bg-accent"}
          style={
            stale
              ? ({
                  "--ui-band-ink": "var(--pl-risk-high-ink)",
                  "--ui-band-fill": "var(--pl-risk-high-fill)",
                  width: `${widthPct}%`,
                } as CSSProperties)
              : { width: `${widthPct}%` }
          }
        />
        <div
          className="absolute inset-y-0 w-px bg-ink2"
          style={{ left: `${markerPct}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function AgeBars({ rows }: { rows: readonly AgeRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-col gap-6">
      <h2 className="m-0 font-display text-h2 font-extrabold">{AGE_BARS_COPY.heading}</h2>
      <div className="flex flex-col gap-5">
        {rows.map((row) => (
          <AgeBar key={row.label} row={row} />
        ))}
      </div>
      <p className="m-0 text-small text-ink2">{AGE_BARS_COPY.note}</p>
      <div className="rounded-panel bg-accent-soft px-5 py-4 text-on-accent-soft">
        <p className="m-0 font-semibold">{AGE_BARS_COPY.clearLabel}</p>
        <p className="m-0 mt-1">{AGE_BARS_COPY.clearLine}</p>
      </div>
    </div>
  );
}
