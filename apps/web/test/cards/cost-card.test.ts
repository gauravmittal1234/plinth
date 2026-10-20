// @vitest-environment node
// T27 accept: "PNG dimensions are exact; snapshot hashes match within
// tolerance."
import type { CostBreakdown, ProjectPage } from "@plinth/contracts";
import { loadExpected } from "@plinth/fixtures/node";
import { describe, expect, it } from "vitest";
import { COST_CARD_SIZE, renderCostCard } from "@/src/features/cards/cost-card";
import "./node-test-env";
import { hammingDistance, perceptualHash, pngDimensions } from "./png-inspect";

const HASH_TOLERANCE = 4;

describe("renderCostCard", () => {
  it("renders Aurelia Heights, Phase 2's cost sheet at the exact 1080×1350 size", async () => {
    const page = loadExpected<ProjectPage>("project_page", "aurelia-heights-phase-2");
    const cost = page.cost as CostBreakdown;
    const response = await renderCostCard(page.risk.phase, cost, page.meta);
    const png = Buffer.from(await response.arrayBuffer());

    expect(response.headers.get("content-type")).toBe("image/png");
    expect(pngDimensions(png)).toEqual(COST_CARD_SIZE);

    const hash = perceptualHash(png);
    expect(hammingDistance(hash, "1fff3f6060ffff1e")).toBeLessThanOrEqual(HASH_TOLERANCE);
  });
});
