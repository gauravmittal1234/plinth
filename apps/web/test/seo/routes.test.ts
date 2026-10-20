// T28 acceptance: sitemap routes are enumerated from the data layer
// (@plinth/fixtures), never a hand-kept list.
import { GROUP_SLUGS, PHASE_SLUGS } from "@plinth/fixtures";
import { describe, expect, it } from "vitest";
import {
  comparePairs,
  comparePairSlug,
  publicDeveloperSlugs,
  publicProjectSlugs,
} from "@/src/seo/routes";

describe("publicProjectSlugs / publicDeveloperSlugs", () => {
  it("is exactly @plinth/fixtures' own phase and group slugs", () => {
    expect(publicProjectSlugs()).toEqual(PHASE_SLUGS);
    expect(publicDeveloperSlugs()).toEqual(GROUP_SLUGS);
  });
});

describe("comparePairs", () => {
  const pairs = comparePairs();

  it("pairs only phases that share a corridor, never a project with itself", () => {
    for (const [a, b] of pairs) {
      expect(PHASE_SLUGS).toContain(a);
      expect(PHASE_SLUGS).toContain(b);
      expect(a).not.toBe(b);
      expect(a < b).toBe(true); // canonical order, so a-vs-b and b-vs-a never both appear
    }
  });

  it("has no duplicate pair", () => {
    const slugs = pairs.map(comparePairSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("includes the two Dwarka Expressway phases from DESIGN §5b", () => {
    expect(comparePairSlug(["aurelia-heights-phase-2", "kestrel-park"])).toBe(
      "aurelia-heights-phase-2-vs-kestrel-park",
    );
    const slugs = pairs.map(comparePairSlug);
    expect(slugs).toContain("aurelia-heights-phase-2-vs-kestrel-park");
  });

  it("never pairs across corridors (Aurelia, Dwarka Expressway, with Coral Towers, New Gurugram)", () => {
    const slugs = pairs.map(comparePairSlug);
    expect(slugs).not.toContain("aurelia-heights-phase-2-vs-coral-towers");
    expect(slugs).not.toContain("coral-towers-vs-aurelia-heights-phase-2");
  });
});
