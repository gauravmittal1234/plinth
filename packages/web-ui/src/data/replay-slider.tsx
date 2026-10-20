"use client";

// The replay slider (DESIGN §4b): a native range over the QPR quarters, so it
// works with arrows, Home/End and touch, and reads out the quarter's name
// (aria-valuetext). Two arrow buttons step one report at a time; at either end
// they stay focusable and say so with aria-disabled, so keyboard focus never
// drops to the page. Controlled: the page owns the index and moves the tower,
// tiles and "band then" chip with it.
import type { QuarterProgress } from "@plinth/contracts";
import { useId, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { ChevronLeftIcon, ChevronRightIcon } from "../lib/icons";

export type ReplayStop = Pick<QuarterProgress, "label">;

export type ReplaySliderProps = {
  /** The stops in time order: ProjectProgress.quarters, plus any "today" stop the page adds. */
  stops: readonly ReplayStop[];
  /** The current stop's index. */
  value: number;
  onChange: (index: number) => void;
  /** The range's visible label ("Quarter on record: <strong>Apr–Jun 2026</strong>"). */
  label: ReactNode;
  /** The arrow buttons' names ("Earlier report", "Later report"), from the artboard. */
  previousLabel: string;
  nextLabel: string;
  /** Show the first and last stop names under the track (default true). */
  showEnds?: boolean;
  /** The ground the slider sits on, so the arrow buttons stay one tone step above it. */
  surface?: "bg" | "track";
  className?: string;
};

const STEP_BUTTON =
  "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-pill border-0 text-ink transition-transform duration-(--pl-motion-duration-press) ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-disabled:cursor-not-allowed aria-disabled:text-disabled-fg aria-disabled:active:scale-100";

export function ReplaySlider({
  stops,
  value,
  onChange,
  label,
  previousLabel,
  nextLabel,
  showEnds = true,
  surface = "bg",
  className,
}: ReplaySliderProps) {
  const id = useId();
  if (!stops.length) return null;
  const last = stops.length - 1;
  const index = Math.max(0, Math.min(last, Math.round(value)));
  const current = stops[index]!;
  const atStart = index <= 0;
  const atEnd = index >= last;
  const tone = surface === "track" ? "bg-chip-fill-on-track" : "bg-track";
  const go = (to: number) => {
    const next = Math.max(0, Math.min(last, to));
    if (next !== index) onChange(next);
  };
  return (
    <div data-replay="" data-index={index} className={cx("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${id}-range`} className="min-w-0 text-body">
          {label}
        </label>
        <span className="inline-flex gap-1.5">
          <button
            type="button"
            aria-label={previousLabel}
            aria-disabled={atStart}
            aria-controls={`${id}-range`}
            className={cx(STEP_BUTTON, tone)}
            onClick={() => go(index - 1)}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            aria-label={nextLabel}
            aria-disabled={atEnd}
            aria-controls={`${id}-range`}
            className={cx(STEP_BUTTON, tone)}
            onClick={() => go(index + 1)}
          >
            <ChevronRightIcon />
          </button>
        </span>
      </div>
      <input
        id={`${id}-range`}
        type="range"
        min={0}
        max={last}
        step={1}
        value={index}
        aria-valuetext={current.label}
        disabled={last === 0}
        onChange={(e) => go(Number(e.currentTarget.value))}
        className="m-0 h-7 w-full cursor-pointer accent-accent disabled:cursor-default"
      />
      {showEnds && last > 0 ? (
        <div aria-hidden="true" className="flex justify-between gap-4 text-caption text-ink2">
          <span>{stops[0]!.label}</span>
          <span>{stops[last]!.label}</span>
        </div>
      ) : null}
    </div>
  );
}
