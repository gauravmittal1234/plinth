// T28 acceptance: the sitemap carries exactly the data-layer routes.
import { GROUP_SLUGS, PHASE_SLUGS } from "@plinth/fixtures";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { comparePairs, comparePairSlug } from "@/src/seo/routes";

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("lists the homepage once", () => {
    expect(urls.filter((u) => u === "https://plinth.in/")).toHaveLength(1);
  });

  it("lists every public phase's project page", () => {
    for (const slug of PHASE_SLUGS) {
      expect(urls).toContain(`https://plinth.in/gurugram/projects/${slug}`);
    }
  });

  it("lists every developer group's page", () => {
    for (const slug of GROUP_SLUGS) {
      expect(urls).toContain(`https://plinth.in/gurugram/developers/${slug}`);
    }
  });

  it("lists every compare pair's SEO route", () => {
    for (const pair of comparePairs()) {
      expect(urls).toContain(`https://plinth.in/compare/${comparePairSlug(pair)}`);
    }
  });

  it("has no duplicate URL and no account or workspace route", () => {
    expect(new Set(urls).size).toBe(urls.length);
    for (const u of urls) {
      expect(u).not.toMatch(/\/(following|privacy|workspace|capture)(\/|$)/);
    }
  });
});
