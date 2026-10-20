// RERA s.13: before a registered agreement for sale, at most 10% of the price (base +
// charges) may be taken. Golden vector: packages/fixtures/vectors/cap.json
// (₹2,44,20,000 base + charges -> a ₹24,42,000 limit).

/**
 * The 10% cap on `basePlusChargesInr` (base + charges, before GST and stamp duty), rounded
 * half up to the rupee.
 */
export function capLimit(basePlusChargesInr: number): number {
  return Math.round(basePlusChargesInr / 10);
}

/**
 * Whether `amountInr` (plus anything already paid) stays within the 10% cap on
 * `basePlusChargesInr`. The final verdict is always the server's (BUILD_PLAN §1 rule 3);
 * this is the slider/EOI-entry preview only.
 */
export function withinCap(
  amountInr: number,
  paidSoFarInr: number,
  basePlusChargesInr: number,
): boolean {
  return amountInr + paidSoFarInr <= capLimit(basePlusChargesInr);
}
