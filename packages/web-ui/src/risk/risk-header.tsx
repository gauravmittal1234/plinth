// The risk header (DESIGN §4 item 5): the meter, then the band name large in
// Bricolage, in the band's text colour. Confidence is a separate line under it,
// never attached to the name. A band set by a red-flag rule shows the rule's
// line (API_CONTRACTS §2.2, Laurel). Unscored states show the chip's label in
// a quieter size, with no colour.
import type { RiskSummary } from "@plinth/contracts";
import type { ReactNode } from "react";
import { bandStyle, chipTone, isBandTone } from "../lib/band";
import { cx } from "../lib/cx";
import { ConfidenceDots } from "./confidence-dots";
import { Meter } from "./meter";

export type RiskHeaderProps = {
  risk: Pick<RiskSummary, "band" | "chip" | "confidence">;
  /** m: cards, compare and sheets (30 px name). l: the project page's risk answer. */
  size?: "m" | "l";
  /** Visually hidden text before the name, from the artboard ("Delivery risk: "). */
  srPrefix?: string;
  /** A quiet line under the name ("Delivery risk · data as of 14 Oct 2026 · v1.2"). */
  caption?: ReactNode;
  /** Show the confidence line when there is one (default true). */
  showConfidence?: boolean;
  /** Show the red-flag rule's line when a rule set the band (default true). */
  showRule?: boolean;
  className?: string;
};

export function RiskHeader({
  risk,
  size = "m",
  srPrefix,
  caption,
  showConfidence = true,
  showRule = true,
  className,
}: RiskHeaderProps) {
  const { band, chip, confidence } = risk;
  const tone = band ? band.code : chipTone(chip);
  const banded = isBandTone(tone);
  const rule = band?.set_by === "red_flag_rule" ? band.rule : null;
  return (
    <div
      data-risk-header={banded ? tone : chip.kind}
      className={cx("flex flex-col gap-4", className)}
      style={banded ? bandStyle(tone) : undefined}
    >
      <div className="flex items-center gap-4">
        <Meter chip={chip} size={size === "l" ? "l" : "m"} />
        <span
          className={cx(
            "min-w-0 font-display font-extrabold text-balance",
            banded && "text-(--ui-band-text)",
            banded && (size === "l" ? "text-question" : "text-number"),
            !banded && "text-ink2",
            !banded && (size === "l" ? "text-h3" : "text-lead"),
          )}
        >
          {srPrefix ? <span className="sr-only">{srPrefix}</span> : null}
          {band ? band.label : chip.label}
        </span>
      </div>
      {caption ? <p className="m-0 text-small text-ink2">{caption}</p> : null}
      {showRule && rule ? (
        <p
          data-rule={rule.code}
          className="m-0 rounded-panel bg-(--ui-band-fill) px-4 py-3 text-ink"
        >
          {rule.line}
        </p>
      ) : null}
      {showConfidence ? <ConfidenceDots confidence={confidence} /> : null}
    </div>
  );
}
