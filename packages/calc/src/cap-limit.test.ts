// Oracle: packages/fixtures/vectors/cap.json (RERA s.13, 10% of base + charges).
import { describe, expect, it } from "vitest";
import { loadVector } from "@plinth/fixtures/node";
import { capLimit, withinCap } from "./cap-limit";
import { fmtInrExact, fmtInrShort } from "./money";

interface CapVector {
  inputs: { base_plus_charges_inr: number };
  expected: { limit_inr: number; limit_label: string; price_label: string };
  cases: {
    name: string;
    amount_inr: number;
    paid_so_far_inr: number;
    expected: { within: boolean; amount_label?: string; line?: string };
  }[];
}

const vector = loadVector<CapVector>("cap");

describe("capLimit", () => {
  it("is 10% of base + charges, rounded half up", () => {
    const limit = capLimit(vector.inputs.base_plus_charges_inr);
    expect(limit).toBe(vector.expected.limit_inr);
    expect(fmtInrShort(limit)).toBe(vector.expected.limit_label);
    expect(fmtInrShort(vector.inputs.base_plus_charges_inr)).toBe(vector.expected.price_label);
  });

  it.each(vector.cases)("$name: within = $expected.within", (c) => {
    expect(withinCap(c.amount_inr, c.paid_so_far_inr, vector.inputs.base_plus_charges_inr)).toBe(
      c.expected.within,
    );
    if (c.expected.amount_label) expect(fmtInrExact(c.amount_inr)).toBe(c.expected.amount_label);
  });

  it("an amount exactly at the limit is within it; one rupee over is not", () => {
    const limit = capLimit(vector.inputs.base_plus_charges_inr);
    expect(withinCap(limit, 0, vector.inputs.base_plus_charges_inr)).toBe(true);
    expect(withinCap(limit + 1, 0, vector.inputs.base_plus_charges_inr)).toBe(false);
  });
});
