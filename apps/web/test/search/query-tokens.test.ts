// Tiles derived from the server's own `parsed` filters (no invented facts):
// packages/fixtures/expected/search_projects/canonical.json is the ground
// truth for "3 BHK · Dwarka Expressway · Under ₹2.5 Cr all-in · Low · Moderate".
import { loadExpected } from "@plinth/fixtures/node";
import { describe, expect, it } from "vitest";
import {
  corridorName,
  queryFromTokens,
  tilesFromTokens,
  tokensFromFilters,
  withoutTile,
} from "@/src/features/search/query-tokens";
import { formatCroreLabel } from "@/src/features/search/money";
import type { SearchResults } from "@/src/data";

const canonical = loadExpected<SearchResults>("search_projects", "canonical");

describe("tokensFromFilters / tilesFromTokens", () => {
  it("reads the canonical fixture's own parsed filters into one tile per word", () => {
    const tokens = tokensFromFilters(canonical.parsed);
    const tiles = tilesFromTokens(tokens);
    expect(tiles.map((t) => t.label)).toEqual([
      "3 BHK",
      "Dwarka Expressway",
      "Under ₹2.5 Cr all-in",
      "Low",
      "Moderate",
    ]);
  });

  it("Low and Moderate are always two separate tiles (G-36), never one merged chip", () => {
    const tokens = tokensFromFilters(canonical.parsed);
    const tiles = tilesFromTokens(tokens);
    const bandTiles = tiles.filter((t) => t.key.startsWith("band:"));
    expect(bandTiles).toHaveLength(2);
    expect(bandTiles.map((t) => t.key)).toEqual(["band:low", "band:moderate"]);
  });

  it("dropping one band tile leaves the other band and every other word untouched", () => {
    const tokens = tokensFromFilters(canonical.parsed);
    const next = withoutTile(tokens, "band:low");
    expect(next.bands).toEqual(["moderate"]);
    expect(next.bhk).toEqual(tokens.bhk);
    expect(next.corridors).toEqual(tokens.corridors);
  });

  it("dropping every tile rebuilds to an empty query (the all-gurugram fixture's own p_q)", () => {
    let tokens = tokensFromFilters(canonical.parsed);
    for (const tile of tilesFromTokens(tokens)) tokens = withoutTile(tokens, tile.key);
    expect(queryFromTokens(tokens)).toBe("");
  });
});

describe("corridorName", () => {
  it("un-slugifies a corridor the server already parsed", () => {
    expect(corridorName("dwarka-expressway")).toBe("Dwarka Expressway");
  });
});

describe("formatCroreLabel", () => {
  it("matches the §5b budget convention (₹2.5 Cr), for the tile label only", () => {
    expect(formatCroreLabel(25_000_000)).toBe("₹2.5 Cr");
  });
});
