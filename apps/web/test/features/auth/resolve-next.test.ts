// `next` is a redirect target a reader can put anything into (open-redirect
// guard), and the one place that reads a project slug out of it for the
// value card.
import { describe, expect, it } from "vitest";
import { projectSlugFromNext, safeNextPath } from "@/src/features/auth/resolve-next";

describe("safeNextPath", () => {
  it("passes through an ordinary same-origin path", () => {
    expect(safeNextPath("/gurugram/projects/sapphire-grove-phase-1")).toBe(
      "/gurugram/projects/sapphire-grove-phase-1",
    );
    expect(safeNextPath("/following")).toBe("/following");
  });

  it("falls back to / when next is missing or empty", () => {
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });

  it("takes the first value of a repeated query param", () => {
    expect(safeNextPath(["/privacy", "/following"])).toBe("/privacy");
  });

  it("refuses an off-site target (open-redirect guard)", () => {
    expect(safeNextPath("//evil.example.com/phish")).toBe("/");
    expect(safeNextPath("https://evil.example.com")).toBe("/");
    expect(safeNextPath("http://evil.example.com/following")).toBe("/");
    expect(safeNextPath("evil.example.com")).toBe("/");
  });

  it("refuses a backslash host trick", () => {
    expect(safeNextPath("/\\evil.example.com")).toBe("/");
  });

  it("keeps the query and hash of a same-origin path", () => {
    expect(safeNextPath("/search?q=aurelia#results")).toBe("/search?q=aurelia#results");
  });
});

describe("projectSlugFromNext", () => {
  it("reads the slug out of a project page path", () => {
    expect(projectSlugFromNext("/gurugram/projects/sapphire-grove-phase-1")).toBe(
      "sapphire-grove-phase-1",
    );
    expect(projectSlugFromNext("/gurugram/projects/kestrel-park?state=severe")).toBe(
      "kestrel-park",
    );
  });

  it("is null for a path that doesn't name a project", () => {
    expect(projectSlugFromNext("/following")).toBeNull();
    expect(projectSlugFromNext("/")).toBeNull();
    expect(projectSlugFromNext("/gurugram/developers/meridian-habitat")).toBeNull();
  });
});
