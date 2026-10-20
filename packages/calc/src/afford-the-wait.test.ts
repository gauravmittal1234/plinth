// Oracle: packages/fixtures/vectors/afford_the_wait.json (Aurelia Heights Phase 2, Tower A).
// The vector's `inputs` mix the slider's own inputs with the tower's plan percentages and
// dates; this test splits them into this package's `inputs`/`plan` the way a page would
// (plan read once from the server's first answer, inputs from the sliders).
import { describe, expect, it } from "vitest";
import { loadVector } from "@plinth/fixtures/node";
import { affordTheWait, type AffordTheWaitInputs, type AffordTheWaitPlan } from "./afford-the-wait";
import { fmtInrExact, fmtInrShort } from "./money";

interface AffordVector {
  inputs: {
    all_in_inr: number;
    take_home_inr: number;
    rent_inr: number;
    down_pct: number;
    rate_pct: number;
    tenure_years: number;
    paid_out_today_pct: number;
    paid_out_by_completion_pct: number;
    completion: string;
    first_month: string;
  };
  derived: {
    all_in_rounded_inr: number;
    down_payment_inr: number;
    loan_inr: number;
  };
  expected: {
    now_pre_emi_inr: number;
    now_monthly_inr: number;
    now_monthly_label: string;
    now_share_pct: number;
    by_completion_pre_emi_inr: number;
    by_completion_monthly_inr: number;
    by_completion_monthly_label: string;
    by_completion_share_pct: number;
    emi_after_keys_inr: number;
    emi_after_keys_label: string;
  };
  cases: { delay_months: number; cost_inr: number; cost_label: string }[];
  series: {
    month: string;
    paid_out_pct: number;
    pre_emi_inr: number;
    rent_inr: number;
    delay: boolean;
  }[];
}

const vector = loadVector<AffordVector>("afford_the_wait");

const inputs: AffordTheWaitInputs = {
  all_in_inr: vector.inputs.all_in_inr,
  take_home_inr: vector.inputs.take_home_inr,
  rent_inr: vector.inputs.rent_inr,
  down_pct: vector.inputs.down_pct,
  rate_pct: vector.inputs.rate_pct,
  tenure_years: vector.inputs.tenure_years,
  delay_months: 12, // The vector's own series runs 12 months late (its last 12 `delay: true` points).
};
const plan: AffordTheWaitPlan = {
  first_month: vector.inputs.first_month,
  completion: vector.inputs.completion,
  now_pct: vector.inputs.paid_out_today_pct,
  end_pct: vector.inputs.paid_out_by_completion_pct,
};

describe("affordTheWait", () => {
  const result = affordTheWait(inputs, plan);

  it("rounds the all-in to the lakh before any loan arithmetic (BUILD_PLAN D-6)", () => {
    expect(result.loan.all_in_rounded_inr).toBe(vector.derived.all_in_rounded_inr);
    expect(result.loan.down_payment_inr).toBe(vector.derived.down_payment_inr);
    expect(result.loan.loan_inr).toBe(vector.derived.loan_inr);
  });

  it("reproduces now and by-completion, rent + pre-EMI", () => {
    expect(result.now.monthly_inr).toBe(vector.expected.now_monthly_inr);
    expect(result.now.monthly_inr - inputs.rent_inr).toBe(vector.expected.now_pre_emi_inr);
    expect(result.now.share_pct).toBe(vector.expected.now_share_pct);
    expect(fmtInrExact(result.now.monthly_inr)).toBe(vector.expected.now_monthly_label);

    expect(result.by_completion.monthly_inr).toBe(vector.expected.by_completion_monthly_inr);
    expect(result.by_completion.monthly_inr - inputs.rent_inr).toBe(
      vector.expected.by_completion_pre_emi_inr,
    );
    expect(result.by_completion.share_pct).toBe(vector.expected.by_completion_share_pct);
    expect(fmtInrExact(result.by_completion.monthly_inr)).toBe(
      vector.expected.by_completion_monthly_label,
    );
  });

  it("reproduces the EMI after keys", () => {
    expect(result.after_keys.emi_inr).toBe(vector.expected.emi_after_keys_inr);
    expect(fmtInrExact(result.after_keys.emi_inr)).toBe(vector.expected.emi_after_keys_label);
  });

  it("reproduces the 12- and 24-month delay options", () => {
    for (const c of vector.cases) {
      const option = result.delay_options.find((o) => o.months === c.delay_months);
      expect(option?.cost_inr).toBe(c.cost_inr);
      expect(fmtInrShort(option!.cost_inr)).toBe(c.cost_label);
    }
  });

  it("the 12-month delay input matches the vector's own delay cost", () => {
    const twelveMonth = vector.cases.find((c) => c.delay_months === 12)!;
    expect(result.delay.months).toBe(12);
    expect(result.delay.cost_inr).toBe(twelveMonth.cost_inr);
  });

  it("reproduces the full month-by-month series", () => {
    expect(result.series).toHaveLength(vector.series.length);
    for (let i = 0; i < vector.series.length; i++) {
      const got = result.series[i]!;
      const want = vector.series[i]!;
      expect(got, `series[${i}] (${want.month})`).toEqual(want);
    }
  });
});
