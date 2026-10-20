// @vitest-environment node
// T27 accept: "PNG dimensions are exact; snapshot hashes match within
// tolerance."
import type { RiskSummary, ShareCard } from "@plinth/contracts";
import { loadExpected } from "@plinth/fixtures/node";
import { describe, expect, it } from "vitest";
import { CHANGED_CARD_SIZE, renderChangedCard } from "@/src/features/cards/changed-card";
import "./node-test-env";
import { hammingDistance, perceptualHash, pngDimensions } from "./png-inspect";

const HASH_TOLERANCE = 4;

describe("renderChangedCard", () => {
  it("renders the reopened Aurelia Heights card ('ce57248d') at the exact 1080×1350 size", async () => {
    const card = loadExpected<ShareCard>("share_card", "aurelia-old-card");
    const risk = loadExpected<RiskSummary>("risk_summary", "aurelia-heights-phase-2");
    const response = await renderChangedCard(card, risk, "ce57248d");
    const png = Buffer.from(await response.arrayBuffer());

    expect(response.headers.get("content-type")).toBe("image/png");
    expect(pngDimensions(png)).toEqual(CHANGED_CARD_SIZE);

    const hash = perceptualHash(png);
    expect(hammingDistance(hash, "0f071f3fffffff3f")).toBeLessThanOrEqual(HASH_TOLERANCE);
  });
});
