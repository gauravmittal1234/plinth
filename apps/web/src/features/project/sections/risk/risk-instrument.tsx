"use client";

// The Dial / 100 projects toggle (DESIGN §4b): the riskometer's needle sweep
// is the page's one signature move in this section; the icon array is the
// literal "X of 100" reading the same frequency gives. A segmented Pill
// toggle swaps one instrument for the other; neither competes with the other
// for motion (DESIGN §0 "other instruments stay but sit quietly").
import type { Band, BandRange, Frequency } from "@plinth/contracts";
import { IconArray, Pill, Riskometer } from "@plinth/web-ui";
import { useId, useState } from "react";

const LEGEND = { late: "More than 12 months late", within: "Within 12 months" };

export function RiskInstrument({
  band,
  frequency,
  bands,
  shareLabel,
}: {
  band: Band | null;
  frequency: Frequency | null;
  bands: readonly Pick<BandRange, "code" | "label">[];
  shareLabel: string;
}) {
  const [view, setView] = useState<"dial" | "table">("dial");
  const id = useId();
  if (!band || !frequency) return null;

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        role="group"
        aria-label="Show the dial, or 100 projects"
        className="inline-flex gap-1.5 rounded-pill bg-track p-1"
      >
        <Pill
          as="button"
          id={`${id}-dial`}
          pressed={view === "dial"}
          onClick={() => setView("dial")}
        >
          Dial
        </Pill>
        <Pill
          as="button"
          id={`${id}-table`}
          pressed={view === "table"}
          onClick={() => setView("table")}
        >
          100 projects
        </Pill>
      </div>
      {view === "dial" ? (
        <Riskometer band={band} label={shareLabel} bands={bands} />
      ) : (
        <IconArray frequency={frequency} band={band.code} legend={LEGEND} />
      )}
    </div>
  );
}
