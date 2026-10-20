"use client";

// The riskometer (DESIGN §4b, copied from LiveDay.dc.html): a semicircle of
// five arcs in the band inks. The current arc is 30 wide at full strength, the
// others 20 at 42%. The needle sweeps from −90° to the band (−72, −36, 0, 36,
// 72°) over 1.4 s, once, on first paint.
//
// The final angle is always in the markup (server render, no JavaScript, print
// and reduced motion all show the answer). The sweep is a CSS animation from
// −90° (styles.css `ui-needle-sweep`) whose duration is a token that
// prefers-reduced-motion sets to 0; with reduced motion the class is dropped too.
import type { Band, BandRange } from "@plinth/contracts";
import { BAND_CODES, riskVar } from "../lib/band";
import { cx } from "../lib/cx";
import { useReducedMotion } from "../lib/motion";

export type RiskometerProps = {
  /** The public band; null (not scored, limited history, withheld) draws nothing. */
  band: Band | null;
  /** The dial's accessible sentence, from the page ("Riskometer pointing to Elevated, step 3 of 5 …"). */
  label: string;
  /** Band names for a row under the dial (Methodology.bands). Omit for no row. */
  bands?: ReadonlyArray<Pick<BandRange, "code" | "label">>;
  className?: string;
};

const CX = 150;
const CY = 150;
const R = 112;

function point(deg: number, r: number): string {
  const a = (deg * Math.PI) / 180;
  return `${(CX + r * Math.cos(a)).toFixed(1)} ${(CY - r * Math.sin(a)).toFixed(1)}`;
}

/** The needle's resting angle for a step: −72, −36, 0, 36 or 72 degrees. */
export function needleAngle(step: number): number {
  return -90 + (Math.max(1, Math.min(5, step)) - 0.5) * 36;
}

export function Riskometer({ band, label, bands, className }: RiskometerProps) {
  const reduced = useReducedMotion();
  if (!band) return null;
  const angle = needleAngle(band.step);
  return (
    <div
      data-riskometer={band.code}
      className={cx("flex w-full max-w-[500px] flex-col items-center gap-1", className)}
    >
      <svg viewBox="0 0 300 172" className="block h-auto w-full" role="img" aria-label={label}>
        {BAND_CODES.map((code, i) => {
          const on = code === band.code;
          const a0 = 180 - i * 36 - 1.6;
          const a1 = 180 - (i + 1) * 36 + 1.6;
          return (
            <path
              key={code}
              data-arc={code}
              data-current={on ? "true" : undefined}
              d={`M ${point(a0, R)} A ${R} ${R} 0 0 1 ${point(a1, R)}`}
              fill="none"
              stroke={riskVar(code, "ink")}
              strokeWidth={on ? 30 : 20}
              opacity={on ? 1 : 0.42}
            />
          );
        })}
        <g
          data-needle=""
          data-angle={angle}
          data-motion={reduced ? "reduce" : "sweep"}
          className={reduced ? undefined : "ui-needle-sweep"}
          style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${CX}px ${CY}px` }}
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={44}
            stroke="var(--pl-color-ink)"
            strokeWidth={4}
            strokeLinecap="round"
          />
        </g>
        <circle cx={CX} cy={CY} r={11} fill="var(--pl-color-ink)" />
        <circle cx={CX} cy={CY} r={4} fill="var(--pl-color-bg)" />
      </svg>
      {bands?.length ? (
        <div
          aria-hidden="true"
          className="grid w-full grid-cols-5 text-center text-caption-min text-muted"
        >
          {bands.map((b) => (
            <span key={b.code} className={b.code === band.code ? "font-bold text-ink" : undefined}>
              {b.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
