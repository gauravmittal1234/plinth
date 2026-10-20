// Oracle: packages/fixtures/vectors/formatting.json (every `inr` case, exact and short).
import { describe, expect, it } from "vitest";
import { loadVector } from "@plinth/fixtures/node";
import { fmtInrExact, fmtInrShort } from "./money";

interface FormattingVector {
  inr: { inr: number; short: string; exact: string }[];
}

describe("fmtInrExact / fmtInrShort", () => {
  const vector = loadVector<FormattingVector>("formatting");

  it.each(vector.inr)("₹$inr -> $exact / $short", ({ inr, exact, short }) => {
    expect(fmtInrExact(inr)).toBe(exact);
    expect(fmtInrShort(inr)).toBe(short);
  });

  it("the 99.95 L / ₹1.00 Cr boundary rounds half up into Cr", () => {
    // 1 rupee short of exactly 99.95 lakh still rounds down to L; 99.95 L itself tips to Cr.
    expect(fmtInrShort(9_995_000)).toBe("₹1.00 Cr");
    expect(fmtInrShort(9_994_900)).toBe("₹99.9 L");
  });

  it("keeps a trailing .0 in the L form (no stripping)", () => {
    expect(fmtInrShort(300_000)).toBe("₹3.0 L");
    expect(fmtInrShort(100_000)).toBe("₹1.0 L");
  });

  it("formats zero and small amounts exactly, with no Cr/L", () => {
    expect(fmtInrShort(0)).toBe("₹0");
    expect(fmtInrExact(0)).toBe("₹0");
    expect(fmtInrShort(99_999)).toBe("₹99,999");
  });
});
