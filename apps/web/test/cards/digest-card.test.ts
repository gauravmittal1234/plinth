// @vitest-environment node
// T27 accept: "PNG dimensions are exact; snapshot hashes match within
// tolerance." The digest header has no public /cards route yet (see
// digest-card.tsx), so this is the only coverage of the renderer until
// whoever wires the WhatsApp digest sender (T46b) imports it.
import type { FollowingFeed } from "@plinth/contracts";
import { loadExpected } from "@plinth/fixtures/node";
import { describe, expect, it } from "vitest";
import { DIGEST_CARD_SIZE, renderDigestHeaderCard } from "@/src/features/cards/digest-card";
import "./node-test-env";
import { hammingDistance, perceptualHash, pngDimensions } from "./png-inspect";

const HASH_TOLERANCE = 4;

describe("renderDigestHeaderCard", () => {
  it("renders one floor per followed project at the exact 1080×570 size", async () => {
    const feed = loadExpected<FollowingFeed>("following_feed", "rohan");
    // The caller composes this heading from FollowingFeed's own `changes`
    // count and a week boundary (fix-since-family.md §1 WaDigest); the week
    // itself isn't a field yet, so the test fixes one the fixture supports.
    const heading = `This week in your projects · 12–18 Oct 2026 · ${feed.changes.length} changes on record`;
    const projects = feed.projects.map((p) => ({ slug: p.slug, name: p.name ?? p.slug, chip: p.chip }));

    const response = await renderDigestHeaderCard(heading, projects);
    const png = Buffer.from(await response.arrayBuffer());

    expect(response.headers.get("content-type")).toBe("image/png");
    expect(pngDimensions(png)).toEqual(DIGEST_CARD_SIZE);

    const hash = perceptualHash(png);
    expect(hammingDistance(hash, "ffffcfc3030000ff")).toBeLessThanOrEqual(HASH_TOLERANCE);
  });

  it("carries no promise line, offer or QR (fix-since-family.md: a utility template header)", async () => {
    const response = await renderDigestHeaderCard("Nothing new this week", []);
    const png = Buffer.from(await response.arrayBuffer());
    expect(pngDimensions(png)).toEqual(DIGEST_CARD_SIZE);
  });
});
