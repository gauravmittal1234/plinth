// T28 acceptance, plus the M1-polish production gate: outside Vercel's
// production build (or an explicit PLINTH_INDEXABLE=1 override), /robots.txt
// disallows everything, so a preview or local build of the placeholder
// domain (DECISIONS E-10) is never indexed by mistake. On the production
// site it disallows only /following, /privacy, /workspace and /capture.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";

function rulesOf(result: ReturnType<typeof robots>) {
  return Array.isArray(result.rules) ? result.rules : [result.rules];
}

describe("robots", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("not the production site (no NEXT_PUBLIC_SITE_URL/VERCEL_ENV, no override)", () => {
    it("disallows everything and carries no sitemap", () => {
      const result = robots();
      expect(rulesOf(result)).toEqual([{ userAgent: "*", disallow: "/" }]);
      expect(result.sitemap).toBeUndefined();
    });
  });

  describe("the production site (NEXT_PUBLIC_SITE_URL set, VERCEL_ENV=production)", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://plinth.in");
      vi.stubEnv("VERCEL_ENV", "production");
    });

    it("disallows the account, privacy, workspace and capture surfaces", () => {
      const disallowed = rulesOf(robots()).flatMap((r) =>
        Array.isArray(r.disallow) ? r.disallow : r.disallow ? [r.disallow] : [],
      );
      for (const path of ["/following", "/privacy", "/workspace", "/capture"]) {
        expect(disallowed).toContain(path);
      }
    });

    it("allows the public site", () => {
      const rules = rulesOf(robots());
      expect(rules.some((r) => r.allow === "/" || (Array.isArray(r.allow) && r.allow.includes("/")))).toBe(
        true,
      );
    });

    it("points at the sitemap", () => {
      expect(robots().sitemap).toBe("https://plinth.in/sitemap.xml");
    });
  });

  describe("VERCEL_ENV=production without NEXT_PUBLIC_SITE_URL (a preview deploy)", () => {
    it("still disallows everything: the domain isn't confirmed yet (DECISIONS E-10)", () => {
      vi.stubEnv("VERCEL_ENV", "production");
      expect(rulesOf(robots())).toEqual([{ userAgent: "*", disallow: "/" }]);
    });
  });

  describe("PLINTH_INDEXABLE=1 (the explicit override)", () => {
    it("is indexable even without VERCEL_ENV", () => {
      vi.stubEnv("PLINTH_INDEXABLE", "1");
      const rules = rulesOf(robots());
      expect(rules.some((r) => r.allow === "/" || (Array.isArray(r.allow) && r.allow.includes("/")))).toBe(
        true,
      );
    });
  });
});
