// Colour source for the OG cards (INTEGRATION_NOTES: "T27's OG images use
// riskVar or the tokens, not Tailwind"). Satori renders each card in
// isolation: it never sees globals.css's `:root` custom properties, so
// `riskVar()`'s `var(--pl-risk-…)` strings would resolve to nothing. These
// cards read @plinth/tokens' literal hex values instead, always the "day"
// theme (a forwarded card has no reader theme to follow).
import { color, risk, type RiskKey } from "@plinth/tokens";
import type { BandCode } from "@plinth/contracts";

export const ink = color.day;
export const bandColor: Record<RiskKey, (typeof risk.day)[RiskKey]> = risk.day;

/** The ink/fill/text triple for a public band (risk.day[code]). */
export function bandTone(code: BandCode) {
  return bandColor[code];
}
