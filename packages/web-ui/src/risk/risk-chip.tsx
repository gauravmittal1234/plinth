// The risk chip (DESIGN §0, §4 item 4): borderless everywhere. A band sits on
// its band fill with a mini meter and the name; Limited history, Not scored and
// a withheld band sit on the neutral track with no colour. The same chip on
// cards, map pins, compare, chat and the page header. Every word is the
// contract's `chip.label`.
import type { Chip } from "@plinth/contracts";
import { bandStyle, chipTone, isBandTone } from "../lib/band";
import { cx } from "../lib/cx";
import { Meter } from "./meter";

export type RiskChipProps = {
  chip: Chip;
  /**
   * Visually hidden text read before the label, from the artboard
   * ("Delivery risk: "), so a chip on its own still says what it rates.
   */
  srPrefix?: string;
  /** The ground the chip sits on. On `track`, unscored chips take a deeper tone so they stay visible. */
  surface?: "bg" | "track";
  className?: string;
};

export function RiskChip({ chip, srPrefix, surface = "bg", className }: RiskChipProps) {
  const tone = chipTone(chip);
  const banded = isBandTone(tone);
  return (
    <span
      data-chip-kind={chip.kind}
      data-tone={tone}
      className={cx(
        "inline-flex h-7 shrink-0 items-center gap-2 rounded-pill pr-3 pl-2.5 align-middle font-sans text-caption leading-none font-semibold whitespace-nowrap",
        banded && "bg-(--ui-band-fill) text-ink",
        !banded && (surface === "track" ? "bg-chip-fill-on-track" : "bg-track"),
        !banded && (tone === "withheld" ? "text-ink" : "text-ink2"),
        className,
      )}
      style={banded ? bandStyle(tone) : undefined}
    >
      {srPrefix ? <span className="sr-only">{srPrefix}</span> : null}
      <Meter chip={chip} size="s" />
      {chip.label}
    </span>
  );
}
