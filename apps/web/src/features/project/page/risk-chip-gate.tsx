// The hero's small risk chip ("Delivery risk: {{bandName}}", WebProject.dc.html
// top bar). It is @plinth/web-ui's RiskChip in substance — the same Meter and
// the same `bandStyle`/`chipTone` tokens, so it is pixel-for-pixel the same
// chip as everywhere else on the product — with two extra DOM hooks
// (`data-testid`, `data-band`) the T07 M0 gate (e2e/gates/m0.spec.ts) checks
// for and that RiskChip's own props don't expose. `RiskChip` takes no rest
// props to forward them through, so this is the smallest way to keep that
// gate green without touching a path T07 owns. The gate also asserts this
// element's own text is exactly the chip's label, so the "Delivery risk: "
// context for screen readers lives in a sibling `sr-only` span the caller
// renders beside it (hero-section.tsx), never inside this element.
import type { Chip } from "@plinth/contracts";
import { Meter, bandStyle, chipTone, isBandTone } from "@plinth/web-ui";
import { cx } from "./cx";

export function RiskChipGate({ chip }: { chip: Chip }) {
  const tone = chipTone(chip);
  const banded = isBandTone(tone);
  return (
    <span
      data-testid="risk-chip"
      data-band={tone}
      data-chip-kind={chip.kind}
      className={cx(
        "inline-flex h-7 shrink-0 items-center gap-2 rounded-pill pr-3 pl-2.5 align-middle font-sans text-caption leading-none font-semibold whitespace-nowrap",
        banded && "bg-(--ui-band-fill) text-ink",
        !banded && "bg-track text-ink2",
      )}
      style={banded ? bandStyle(tone) : undefined}
    >
      <Meter chip={chip} size="s" />
      {chip.label}
    </span>
  );
}
