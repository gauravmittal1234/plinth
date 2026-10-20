// Property tests (AGENTS.md calc brief): plain loops over seeded inputs, no new dependency.
// 1. A higher rate never lowers the EMI, for a fixed loan and tenure.
// 2. A longer delay never lowers the delay cost, for a fixed plan and inputs.
import { describe, expect, it } from "vitest";
import { affordTheWait, type AffordTheWaitInputs, type AffordTheWaitPlan } from "./afford-the-wait";
import { emi } from "./emi";

/** A tiny deterministic PRNG (LCG) so the seeded cases are reproducible across runs. */
function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 48271) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

describe("emi: a higher rate never lowers the EMI", () => {
  const next = seededRandom(64);

  for (let caseIndex = 0; caseIndex < 30; caseIndex++) {
    const loanInr = Math.round(5_00_000 + next() * 4_95_00_000); // ₹5 L .. ₹5 Cr
    const tenureYears = 5 + Math.floor(next() * 26); // 5 .. 30 years
    const rates = [0, 0.5, 2, 4.5, 6, 7.25, 8.5, 9, 10.5, 12, 15, 18]
      .map((base) => base + next() * 0.4) // jitter so no two seeded cases repeat exactly
      .sort((a, b) => a - b);

    it(`loan ₹${loanInr}, ${tenureYears}y: EMI(r) is non-decreasing in r`, () => {
      let previousEmi = -Infinity;
      for (const ratePct of rates) {
        const value = emi(loanInr, ratePct, tenureYears);
        expect(value).toBeGreaterThanOrEqual(previousEmi);
        previousEmi = value;
      }
    });
  }
});

describe("affordTheWait: a longer delay never lowers the delay cost", () => {
  const next = seededRandom(2048);
  const delayOptionsMonths = [0, 1, 2, 3, 6, 9, 12, 18, 24, 36, 48];

  for (let caseIndex = 0; caseIndex < 20; caseIndex++) {
    const inputs: AffordTheWaitInputs = {
      all_in_inr: Math.round(50_00_000 + next() * 4_50_00_00_00), // ₹50 L .. ~₹4.5 Cr+50L
      take_home_inr: Math.round(1_00_000 + next() * 9_00_000),
      rent_inr: Math.round(10_000 + next() * 90_000),
      down_pct: 10 + Math.round(next() * 30),
      rate_pct: 7 + next() * 6,
      tenure_years: 10 + Math.floor(next() * 21),
      delay_months: 0,
    };
    const plan: AffordTheWaitPlan = {
      first_month: "2026-11",
      completion: "2028-06",
      now_pct: 15 + next() * 40,
      end_pct: 80 + next() * 15,
    };

    it(`inputs seed ${caseIndex}: delay cost(months) is non-decreasing`, () => {
      let previousCost = -Infinity;
      for (const delayMonths of delayOptionsMonths) {
        const result = affordTheWait({ ...inputs, delay_months: delayMonths }, plan);
        expect(result.delay.months).toBe(delayMonths);
        expect(result.delay.cost_inr).toBeGreaterThanOrEqual(previousCost);
        previousCost = result.delay.cost_inr;
      }
    });
  }
});
