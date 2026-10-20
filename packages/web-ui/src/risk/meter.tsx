// The 5-segment meter (DESIGN §3.2 non-colour cue, §4 items 4–5). Filled
// cumulatively left to right in the band ink; the rest are empty segments with
// a 1 px border. Limited history draws dashed segments, Not scored outlined
// ones, and a withheld band has no colour and no fill (API_CONTRACTS §2.2).
// Always aria-hidden: the band name next to it is the accessible text.
import type { BandCode } from "@plinth/contracts";
import { bandStyle, chipTone, clampSegments, stepOfBand, type ChipLike } from "../lib/band";
import { cx } from "../lib/cx";

export type MeterSize = "s" | "m" | "l";

/** How the segments are drawn: a band fills them; the three states never do. */
export type MeterMode = "band" | "limited" | "not_scored" | "withheld";

export type MeterProps = {
  /** s: the chip (6×10), m: the risk header (16×12), l: the project page (20×15). */
  size?: MeterSize;
  className?: string;
} & (
  | {
      /** A RiskSummary or card chip: fills `meter_filled`. */ chip: ChipLike;
      band?: never;
      filled?: never;
    }
  | {
      chip?: never;
      /** A band on its own: fills its step, unless `filled` says otherwise. */ band: BandCode;
      filled?: number;
    }
);

const SEGMENTS = [1, 2, 3, 4, 5] as const;

const SIZE: Readonly<Record<MeterSize, string>> = {
  s: "h-2.5 w-1.5 rounded-segment",
  m: "h-3 w-4 rounded-segment-lg",
  l: "h-[15px] w-5 rounded-segment-lg",
};

const GAP: Readonly<Record<MeterSize, string>> = { s: "gap-0.5", m: "gap-1", l: "gap-1" };

function segmentClass(mode: MeterMode, on: boolean): string {
  switch (mode) {
    case "band":
      return on ? "bg-(--ui-band-ink)" : "border border-empty-border bg-meter-off";
    case "limited":
      return "border-[1.5px] border-dashed border-risk-limited-ink";
    case "not_scored":
      return "border-[1.5px] border-risk-not-scored-ink";
    default:
      return "border border-empty-border";
  }
}

/** Mode, fill and band of a meter, from a chip or a band. Exported for tests and other surfaces. */
export function meterState(props: { chip?: ChipLike; band?: BandCode; filled?: number }): {
  mode: MeterMode;
  filled: number;
  band: BandCode | null;
} {
  if (props.chip) {
    const tone = chipTone(props.chip);
    if (tone === "limited") return { mode: "limited", filled: 0, band: null };
    if (tone === "notScored") return { mode: "not_scored", filled: 0, band: null };
    if (tone === "withheld") return { mode: "withheld", filled: 0, band: null };
    return { mode: "band", filled: clampSegments(props.chip.meter_filled), band: tone };
  }
  const band = props.band ?? "low";
  return { mode: "band", filled: clampSegments(props.filled ?? stepOfBand(band)), band };
}

export function Meter(props: MeterProps) {
  const { size = "s", className } = props;
  const { mode, filled, band } = meterState(props);
  return (
    <span
      aria-hidden="true"
      data-meter={mode}
      data-filled={filled}
      className={cx("inline-flex shrink-0 items-center", GAP[size], className)}
      style={band ? bandStyle(band) : undefined}
    >
      {SEGMENTS.map((n) => {
        const on = mode === "band" && n <= filled;
        return (
          <span
            key={n}
            data-segment={n}
            data-on={on ? "true" : undefined}
            className={cx("box-border block", SIZE[size], segmentClass(mode, on))}
          />
        );
      })}
    </span>
  );
}
