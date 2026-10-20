"use client";

// The one interactive part of "Picture yourself here": the drag-to-compare
// range that reveals the AI-generated illustration over the original photo.
// The heading, intro and styles list around it stay server-rendered
// (project-page JS budget, lighthouserc.cjs), same split as
// states/evidence-chip.tsx and sections/records/record-row.tsx.
import { useId, useState } from "react";

const COPY = {
  compareLabel: "Or drag to compare the original photo and the AI-generated illustration",
  original: "Original photo",
  aiLabel: "AI-generated illustration",
  illustrative: "Illustrative image",
};

export function CompareSlider() {
  const id = useId();
  const [reveal, setReveal] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={`${id}-range`} className="text-body">
        {COPY.compareLabel}
      </label>
      <div className="relative aspect-[4/3] w-full max-w-[32rem] overflow-hidden rounded-panel bg-track">
        <div className="absolute inset-0 flex items-end p-3">
          <span className="rounded-pill bg-inverse px-3 py-1 text-caption font-semibold text-on-inverse">
            {COPY.original} · {COPY.illustrative}
          </span>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-end bg-claim-bg p-3"
          style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }}
        >
          <span className="rounded-pill bg-ai-label-bg px-3 py-1 text-caption font-semibold text-ai-label-fg">
            {COPY.aiLabel}
          </span>
        </div>
      </div>
      <input
        id={`${id}-range`}
        type="range"
        min={0}
        max={100}
        value={reveal}
        onChange={(e) => setReveal(Number(e.currentTarget.value))}
        className="h-7 w-full max-w-[32rem] cursor-pointer accent-accent"
      />
    </div>
  );
}
