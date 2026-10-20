// Formats a raw rupee integer the fixture gives us (AffordLoan, AfterKeys —
// contracts that carry `_inr` numbers with no pre-formatted label) the house
// way (AGENTS.md §5): ₹2.74 Cr / ₹24.1 L / ₹1,18,077. Never used on amounts
// that already arrive as a finished `*_label` string (CostBreakdown,
// AffordTheWait.answer_line) — those are the server's words, not ours.
export function formatInr(amountInr: number): string {
  const abs = Math.abs(amountInr);
  if (abs >= 1_00_00_000) {
    return `₹${(amountInr / 1_00_00_000).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  }
  if (abs >= 1_00_000) {
    return `₹${(amountInr / 1_00_000).toFixed(1).replace(/\.0$/, "")} L`;
  }
  return `₹${new Intl.NumberFormat("en-IN").format(amountInr)}`;
}

/** "8.50" from 8.5, always two decimal places (the house's rate style). */
export function formatRatePct(ratePct: number): string {
  return ratePct.toFixed(2);
}

/** Digit-grouped rupees with no Cr/L abbreviation ("₹1,18,077"): a monthly figure or an input value, not a big lump sum. */
export function formatInrPlain(amountInr: number): string {
  return `₹${new Intl.NumberFormat("en-IN").format(Math.round(amountInr))}`;
}
