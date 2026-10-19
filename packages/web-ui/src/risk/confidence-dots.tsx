// Confidence (DESIGN §3.2, §4 item 5): two CSS circles, ●● high and ●○ low,
// never Unicode glyphs, and never part of the band name. The sentence is the
// contract's `confidence.line`.
import type { Confidence } from "@plinth/contracts";
import { cx } from "../lib/cx";

export type ConfidenceDotsProps = {
  confidence: Confidence | null;
  /** Show `confidence.line` beside the dots (default). Without it the dots carry the line as their name. */
  withLine?: boolean;
  className?: string;
};

function Dots({ dots }: { dots: number }) {
  return (
    <>
      {[1, 2].map((n) => (
        <span
          key={n}
          data-dot={n <= dots ? "filled" : "hollow"}
          className={cx(
            "box-border block size-[7px] rounded-circle",
            n <= dots ? "bg-ink2" : "border-[1.5px] border-ink2",
          )}
        />
      ))}
    </>
  );
}

export function ConfidenceDots({ confidence, withLine = true, className }: ConfidenceDotsProps) {
  if (!confidence) return null;
  if (!withLine) {
    return (
      <span
        role="img"
        aria-label={confidence.line}
        data-confidence={confidence.level}
        className={cx("inline-flex items-center gap-[3px]", className)}
      >
        <Dots dots={confidence.dots} />
      </span>
    );
  }
  return (
    <p data-confidence={confidence.level} className={cx("m-0 flex items-start gap-3", className)}>
      <span aria-hidden="true" className="mt-[0.6em] inline-flex shrink-0 gap-[3px]">
        <Dots dots={confidence.dots} />
      </span>
      <span>{confidence.line}</span>
    </p>
  );
}
