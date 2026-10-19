// Band and state colours, by reference only. Components never hold a colour:
// they set three local custom properties to @plinth/tokens variables
// (var(--pl-risk-<key>-…)), and the classes read those (bg-(--ui-band-fill)).
// Day and Night follow data-theme on any ancestor, with no re-render.
import type { BandCode, Chip } from "@plinth/contracts";
import type { CSSProperties } from "react";

/** The five bands in ramp order (step 1 to 5), as in @plinth/tokens `riskBands`. */
export const BAND_CODES: readonly BandCode[] = ["low", "moderate", "elevated", "high", "severe"];

/** A token key of the risk ramp: the five bands plus the two unscored states. */
export type RiskTone = BandCode | "limited" | "notScored";

/** CSS custom-property names of each tone in dist/tokens.css (`notScored` is kebab-cased). */
const TOKEN_SLUG: Readonly<Record<RiskTone, string>> = {
  low: "low",
  moderate: "moderate",
  elevated: "elevated",
  high: "high",
  severe: "severe",
  limited: "limited",
  notScored: "not-scored",
};

/** `var(--pl-risk-<tone>-<part>)`, the same string as `cssVar.risk[tone][part]` in @plinth/tokens. */
export function riskVar(tone: RiskTone, part: "ink" | "fill" | "text"): string {
  return `var(--pl-risk-${TOKEN_SLUG[tone]}-${part})`;
}

/** Inline style that points the kit's `--ui-band-*` properties at one tone's tokens. */
export type BandStyle = CSSProperties & {
  "--ui-band-ink": string;
  "--ui-band-fill": string;
  "--ui-band-text": string;
};

export function bandStyle(tone: RiskTone): BandStyle {
  return {
    "--ui-band-ink": riskVar(tone, "ink"),
    "--ui-band-fill": riskVar(tone, "fill"),
    "--ui-band-text": riskVar(tone, "text"),
  };
}

/** The band of a step (1 = low … 5 = severe); null outside 1–5. */
export function bandOfStep(step: number | null | undefined): BandCode | null {
  if (step == null || !Number.isInteger(step)) return null;
  return BAND_CODES[step - 1] ?? null;
}

/** The step of a band (low = 1 … severe = 5). */
export function stepOfBand(band: BandCode): number {
  return BAND_CODES.indexOf(band) + 1;
}

/** True for the five band tones (not Limited history, Not scored or withheld). */
export function isBandTone(tone: RiskTone | "withheld"): tone is BandCode {
  return (BAND_CODES as readonly string[]).includes(tone);
}

/** The chip fields every surface needs (RiskSummary.chip, ProjectCard.chip, NearbyProject.chip). */
export type ChipLike = Pick<Chip, "kind" | "step" | "meter_filled">;

/** The tone a chip is drawn in: its band for kind "band", else the state's tone. */
export function chipTone(chip: ChipLike): RiskTone | "withheld" {
  switch (chip.kind) {
    case "band":
      return bandOfStep(chip.step) ?? "notScored";
    case "limited_history":
      return "limited";
    case "not_scored":
      return "notScored";
    default:
      return "withheld";
  }
}

/** Clamps a meter fill to 0–5 whole segments. */
export function clampSegments(n: number | null | undefined): number {
  if (n == null || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(5, Math.round(n)));
}
