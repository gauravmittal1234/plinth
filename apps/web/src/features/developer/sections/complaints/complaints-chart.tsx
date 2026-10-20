"use client";

// The complaints chart (Build: "the complaints chart with Count / Per 100
// units modes"): one bar per half-year on file, toggled between the raw
// count and the per-100-units rate (`GroupComplaints.half_years`, each
// already carrying both numbers — HalfYearComplaints.count/per_100_units —
// so the toggle only changes which one draws the bar, never what counts as
// "against the group").
import type { HalfYearComplaints } from "@plinth/contracts";
import { Pill } from "@plinth/web-ui";
import { useState } from "react";
import { COMPLAINTS_COPY } from "../../page/copy";

type Mode = "count" | "per100";

export function ComplaintsChart({ halfYears }: { halfYears: readonly HalfYearComplaints[] }) {
  const [mode, setMode] = useState<Mode>("count");
  if (halfYears.length === 0) return null;

  const values = halfYears.map((h) => (mode === "count" ? h.count : h.per_100_units));
  const max = Math.max(...values, 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Pill as="button" pressed={mode === "count"} onClick={() => setMode("count")}>
          {COMPLAINTS_COPY.modeCount}
        </Pill>
        <Pill as="button" pressed={mode === "per100"} onClick={() => setMode("per100")}>
          {COMPLAINTS_COPY.modePer100}
        </Pill>
      </div>

      <ol
        role="list"
        aria-label={COMPLAINTS_COPY.chartCaption}
        className="m-0 flex items-stretch gap-3 p-0"
      >
        {halfYears.map((h, i) => {
          const value = mode === "count" ? h.count : h.per_100_units;
          const heightPct = Math.max((value / max) * 100, 4);
          return (
            <li key={i} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-small font-semibold text-ink">
                {mode === "count" ? value : value.toFixed(1)}
              </span>
              <span
                aria-hidden="true"
                className="flex h-24 w-full items-end rounded-panel bg-track"
              >
                <span
                  className="block w-full rounded-panel bg-accent"
                  style={{ height: `${heightPct}%` }}
                />
              </span>
              <span className="text-center text-caption text-ink2">{h.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
