// Standard amortisation EMI, ported from the inline formula in core.afford_the_wait
// (supabase/migrations/20261102000400_t13_core_calculators.sql): r = rate ÷ 100 ÷ 12 per
// month, n = tenure in months, EMI = loan · r · (1+r)^n / ((1+r)^n − 1), rounded half up to
// the rupee. Golden vector: packages/fixtures/vectors/afford_the_wait.json
// (loan ₹2,19,20,000 at 8.5% over 240 months -> ₹1,90,227).

/**
 * Monthly EMI for `loanInr` at a flat yearly `ratePct`, repaid over `tenureYears`.
 * A zero rate falls back to equal principal instalments (loan ÷ months) to avoid
 * dividing by zero; the SQL this ports never calls it with rate 0.
 */
export function emi(loanInr: number, ratePct: number, tenureYears: number): number {
  const n = tenureYears * 12;
  const r = ratePct / 100 / 12;
  if (r === 0) return Math.round(loanInr / n);
  const g = (1 + r) ** n;
  return Math.round((loanInr * r * g) / (g - 1));
}
