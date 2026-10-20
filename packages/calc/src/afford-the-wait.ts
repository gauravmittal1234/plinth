// Ports core.afford_the_wait (supabase/migrations/20261102000400_t13_core_calculators.sql),
// minus the SQL's own lookups (phase, cost sheet, payment plan, tower slab) and its copy
// (answer_line, assumptions, frequency_line, framing_line — BUILD_PLAN §1 rule 3: those come
// from the server; this is the slider-preview port, EMI and Afford the wait only). The server's
// first answer already carries `loan`, `now`, `by_completion` and `series`; a page extracts
// this function's `plan` from that answer once (first_month/completion = the first and last
// non-delay `series[].month`; now_pct/end_pct = the first and last non-delay
// `series[].paid_out_pct`) and re-runs this on every slider move. The server's answer replaces
// the preview again when the slider is released.
//
// Golden vector: packages/fixtures/vectors/afford_the_wait.json.
import { emi } from "./emi";
import { monthIndexOf, yearMonthOf } from "./month";
import { preEmi } from "./pre-emi";

/** Nearest ₹1 lakh the all-in is rounded to before any loan arithmetic (BUILD_PLAN D-6, DECISIONS E-5). */
const LAKH_INR = 100_000;

/** The delay options the project page always offers, independent of the slider's own delay (vectors/afford_the_wait.json `cases`). */
const STANDARD_DELAY_MONTHS = [12, 24] as const;

/** A calendar month as the server sends it: `"2027-12"`. */
export type YearMonth = string;

/** The server's plan shape for a tower, read once from its first `AffordTheWait` answer. */
export interface AffordTheWaitPlan {
  /** The month after today (the series' first month; `series[0].month`). */
  first_month: YearMonth;
  /** The tower's original completion month (the last non-delay `series[].month`). */
  completion: YearMonth;
  /** Share of the price due today, by the registered agreement (the first non-delay `series[].paid_out_pct`). */
  now_pct: number;
  /** Share of the price due by completion, before possession (the last non-delay `series[].paid_out_pct`). */
  end_pct: number;
}

/** The slider's own inputs (AffordInputs, plus the all-in the cost sheet already gave the page). */
export interface AffordTheWaitInputs {
  /** The unit's all-in price (core.all_in / CostBreakdown.all_in_inr), before rounding to the lakh. */
  all_in_inr: number;
  take_home_inr: number;
  rent_inr: number;
  down_pct: number;
  rate_pct: number;
  tenure_years: number;
  delay_months: number;
}

export interface AffordTheWaitSeriesPoint {
  month: YearMonth;
  paid_out_pct: number;
  pre_emi_inr: number;
  rent_inr: number;
  delay: boolean;
}

/** AffordLoan. */
export interface AffordTheWaitLoan {
  all_in_rounded_inr: number;
  down_payment_inr: number;
  loan_inr: number;
}

/** MonthlyShare / CompletionShare, minus the server's `label` copy. */
export interface AffordTheWaitLevel {
  monthly_inr: number;
  share_pct: number;
}

/** DelayCost, minus the server's `cost_label` copy (compose it with `fmtInrShort`). */
export interface AffordTheWaitDelay {
  months: number;
  cost_inr: number;
}

export interface AffordTheWaitResult {
  loan: AffordTheWaitLoan;
  now: AffordTheWaitLevel;
  by_completion: AffordTheWaitLevel;
  delay: AffordTheWaitDelay;
  /** The delay cost at the standard 12- and 24-month options (vectors/afford_the_wait.json `cases`). */
  delay_options: AffordTheWaitDelay[];
  after_keys: { emi_inr: number };
  series: AffordTheWaitSeriesPoint[];
}

/**
 * The slider preview of `core.afford_the_wait`: rent + pre-EMI now and by completion, the
 * cost of a delay and the EMI after keys, from the plan's payout shares. Arithmetic, not
 * advice (BUILD_PLAN §1 rule 3) — no band, line or verdict; a page composes those from the
 * server's own answer, never from this preview.
 */
export function affordTheWait(
  inputs: AffordTheWaitInputs,
  plan: AffordTheWaitPlan,
): AffordTheWaitResult {
  const allInRoundedInr = Math.round(inputs.all_in_inr / LAKH_INR) * LAKH_INR;
  const downPaymentInr = Math.round((allInRoundedInr * inputs.down_pct) / 100);
  const loanInr = allInRoundedInr - downPaymentInr;

  const nowMonthlyInr =
    preEmi(allInRoundedInr, plan.now_pct, downPaymentInr, inputs.rate_pct) + inputs.rent_inr;
  const endMonthlyInr =
    preEmi(allInRoundedInr, plan.end_pct, downPaymentInr, inputs.rate_pct) + inputs.rent_inr;
  const nowSharePct = Math.round((100 * nowMonthlyInr) / inputs.take_home_inr);
  const endSharePct = Math.round((100 * endMonthlyInr) / inputs.take_home_inr);

  const firstMonthIdx = monthIndexOf(plan.first_month);
  const completionIdx = monthIndexOf(plan.completion);
  const steps = Math.max(completionIdx - firstMonthIdx, 0);

  const series: AffordTheWaitSeriesPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const pct =
      steps === 0 ? plan.end_pct : plan.now_pct + ((plan.end_pct - plan.now_pct) * i) / steps;
    series.push({
      month: yearMonthOf(firstMonthIdx + i),
      paid_out_pct: Math.round(pct * 10) / 10,
      pre_emi_inr: preEmi(allInRoundedInr, pct, downPaymentInr, inputs.rate_pct),
      rent_inr: inputs.rent_inr,
      delay: false,
    });
  }
  const delayMonths = Math.max(inputs.delay_months, 0);
  for (let i = 1; i <= delayMonths; i++) {
    series.push({
      month: yearMonthOf(completionIdx + i),
      paid_out_pct: Math.round(plan.end_pct * 10) / 10,
      pre_emi_inr: preEmi(allInRoundedInr, plan.end_pct, downPaymentInr, inputs.rate_pct),
      rent_inr: inputs.rent_inr,
      delay: true,
    });
  }

  return {
    loan: { all_in_rounded_inr: allInRoundedInr, down_payment_inr: downPaymentInr, loan_inr: loanInr },
    now: { monthly_inr: nowMonthlyInr, share_pct: nowSharePct },
    by_completion: { monthly_inr: endMonthlyInr, share_pct: endSharePct },
    delay: { months: delayMonths, cost_inr: delayMonths * endMonthlyInr },
    delay_options: STANDARD_DELAY_MONTHS.map((months) => ({
      months,
      cost_inr: months * endMonthlyInr,
    })),
    after_keys: { emi_inr: emi(loanInr, inputs.rate_pct, inputs.tenure_years) },
    series,
  };
}
