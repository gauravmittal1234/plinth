// @vitest-environment node
// T27 accept: "PNG dimensions are exact; snapshot hashes match within
// tolerance; the card alt text equals RiskSummary.share.card_alt."
import { loadExpected } from "@plinth/fixtures/node";
import type { RiskSummary } from "@plinth/contracts";
import { describe, expect, it, vi } from "vitest";
import { RISK_CARD_SIZE, renderRiskCard, riskCardAlt } from "@/src/features/cards/risk-card";
import "./node-test-env";
import { hammingDistance, perceptualHash, pngDimensions } from "./png-inspect";

vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));

// A render that drifts a little (font hinting, resvg version) should still
// pass; a materially different card should not. 4 of 64 bits is ~6%.
const HASH_TOLERANCE = 4;

describe("renderRiskCard", () => {
  it("renders the Aurelia Heights, Phase 2 card at the exact 1080×1350 size", async () => {
    const risk = loadExpected<RiskSummary>("risk_summary", "aurelia-heights-phase-2");
    const response = await renderRiskCard(risk, "/media/heroAurelia.jpg", "Images are illustrative");
    const png = Buffer.from(await response.arrayBuffer());

    expect(response.headers.get("content-type")).toBe("image/png");
    expect(pngDimensions(png)).toEqual(RISK_CARD_SIZE);

    const hash = perceptualHash(png);
    expect(hammingDistance(hash, "00000000ffffffff")).toBeLessThanOrEqual(HASH_TOLERANCE);
  });

  it("renders without a photo when the project page has none", async () => {
    const risk = loadExpected<RiskSummary>("risk_summary", "aurelia-heights-phase-2");
    const response = await renderRiskCard(risk, null, null);
    expect(pngDimensions(Buffer.from(await response.arrayBuffer()))).toEqual(RISK_CARD_SIZE);
  });
});

describe("riskCardAlt", () => {
  it("equals RiskSummary.share.card_alt, unchanged", () => {
    const risk = loadExpected<RiskSummary>("risk_summary", "aurelia-heights-phase-2");
    expect(riskCardAlt(risk)).toBe(risk.share.card_alt);
    expect(riskCardAlt(risk)).toBe(
      "Aurelia Heights, Phase 2: Delivery risk Elevated. Between 30 and 45 of 100 similar projects were more than 12 months late.",
    );
  });
});
