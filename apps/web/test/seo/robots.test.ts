// T28 acceptance: /robots.txt disallows /following, /privacy, /workspace and
// /capture.
import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

describe("robots", () => {
  const result = robots();
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

  it("disallows the account, privacy, workspace and capture surfaces", () => {
    const disallowed = rules.flatMap((r) =>
      Array.isArray(r.disallow) ? r.disallow : r.disallow ? [r.disallow] : [],
    );
    for (const path of ["/following", "/privacy", "/workspace", "/capture"]) {
      expect(disallowed).toContain(path);
    }
  });

  it("allows the public site by default", () => {
    expect(rules.some((r) => r.allow === "/" || (Array.isArray(r.allow) && r.allow.includes("/")))).toBe(
      true,
    );
  });

  it("points at the sitemap", () => {
    expect(result.sitemap).toBe("https://plinth.in/sitemap.xml");
  });
});
