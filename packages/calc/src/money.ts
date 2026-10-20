// ₹ preview formatter: the only user-facing lines this package produces (AGENTS.md's calc
// brief: "previews only, no risk copy, no lines beyond the ₹ formatter"). Ports
// ops.fmt_inr_exact and ops.fmt_inr_short (supabase/migrations/20261020000200_t04_domains_ops_helpers.sql)
// rupee-for-rupee: half up throughout, Indian digit grouping, and the lakh/crore thresholds
// decided by their own rounding step (so 99.95 L still rounds to ₹1.00 Cr, not ₹100.0 L).
// Golden vectors: packages/fixtures/vectors/formatting.json (and the labels inside cap.json,
// cost.json, afford_the_wait.json, which reuse the same numbers).

/** Indian digit grouping of a non-negative integer's digit string: last 3, then pairs. */
function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  let head = digits.slice(0, -3);
  const tail = digits.slice(-3);
  const groups: string[] = [];
  while (head.length > 2) {
    groups.unshift(head.slice(-2));
    head = head.slice(0, -2);
  }
  if (head.length > 0) groups.unshift(head);
  return `${groups.join(",")},${tail}`;
}

/**
 * Whole rupees with Indian grouping (ops.fmt_inr_exact): 16720000 -> "₹1,67,20,000";
 * 118077 -> "₹1,18,077". `amountInr` is rounded to the nearest rupee first.
 */
export function fmtInrExact(amountInr: number): string {
  const sign = amountInr < 0 ? "-" : "";
  const digits = Math.round(Math.abs(amountInr)).toString();
  return `${sign}₹${groupIndian(digits)}`;
}

/**
 * Short rupees (ops.fmt_inr_short): >= ₹1 Cr -> "₹2.74 Cr" (2dp); >= ₹1 L -> "₹24.4 L" (1dp);
 * below -> fmtInrExact. Each threshold's own half-up rounding decides the branch, so a value
 * that rounds up to 100.0 L at 1dp is shown as a Cr figure instead (99.95 L -> "₹1.00 Cr").
 */
export function fmtInrShort(amountInr: number): string {
  const sign = amountInr < 0 ? "-" : "";
  const abs = Math.abs(amountInr);
  if (abs < 100_000) return `${sign}${fmtInrExact(abs)}`;

  // Value in tenths of a lakh (nearest ₹10,000), half up: decides the L/Cr threshold.
  const tenthsOfLakh = Math.round(abs / 10_000);
  if (tenthsOfLakh < 1000) {
    const whole = Math.trunc(tenthsOfLakh / 10);
    const tenth = tenthsOfLakh % 10;
    return `${sign}₹${whole}.${tenth} L`;
  }

  // Value in hundredths of a crore (nearest ₹1,00,000), half up.
  const hundredthsOfCr = Math.round(abs / 100_000);
  const whole = Math.trunc(hundredthsOfCr / 100);
  const hundredth = (hundredthsOfCr % 100).toString().padStart(2, "0");
  return `${sign}₹${groupIndian(whole.toString())}.${hundredth} Cr`;
}
