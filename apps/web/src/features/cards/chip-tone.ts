// Maps a Chip (common.schema.json) to a card ink colour, the same logic as
// @plinth/web-ui's chipTone()/bandOfStep(), but returning this file's own
// token hex values instead of a riskVar() CSS variable (colors.ts doc).
import type { BandCode, Chip } from "@plinth/contracts";
import { bandColor } from "./colors";

const BAND_CODES: readonly BandCode[] = ["low", "moderate", "elevated", "high", "severe"];

function bandOfStep(step: number | null | undefined): BandCode | null {
  if (step == null || !Number.isInteger(step)) return null;
  return BAND_CODES[step - 1] ?? null;
}

/** The ink colour a chip draws in: its band's ink for kind "band", else a neutral. */
export function chipFloorTone(chip: Chip): string {
  if (chip.kind !== "band") return bandColor.limited.ink;
  const band = bandOfStep(chip.step);
  return band ? bandColor[band].ink : bandColor.notScored.ink;
}
