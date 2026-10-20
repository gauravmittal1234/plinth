// Ports core.pre_emi (supabase/migrations/20261102000400_t13_core_calculators.sql).
// Golden vector: packages/fixtures/vectors/afford_the_wait.json (₹2,74,00,000 all-in at
// 52.5% due, ₹54,80,000 down, 8.5% -> ₹63,077).

/**
 * Pre-EMI for a month: interest only on what the bank has paid out so far (the share of
 * `priceInr` due minus the down payment), at `ratePct` ÷ 12, rounded half up to the rupee,
 * floored at ₹0 (core.pre_emi: `greatest(round((price * paid_pct / 100 - down) * rate / 1200), 0)`).
 */
export function preEmi(priceInr: number, paidPct: number, downInr: number, ratePct: number): number {
  const paidOutInr = (priceInr * paidPct) / 100 - downInr;
  const rounded = Math.round((paidOutInr * ratePct) / 1200);
  return Math.max(rounded, 0);
}
