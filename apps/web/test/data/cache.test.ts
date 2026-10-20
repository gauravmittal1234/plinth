// ISR: cached public reads carry the tags of src/data/tags.ts and a cacheLife;
// failures of the moment are never cached.
import { cacheLife, cacheTag } from "next/cache";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as data from "@/src/data";
import { isCacheTag, tagsForCall, tagsForPayload } from "@/src/data";
import { normalizeTag } from "@/src/data/tags";

vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));

const tagged = () => vi.mocked(cacheTag).mock.calls.flat();
const lives = () => vi.mocked(cacheLife).mock.calls.map(([profile]) => profile);

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("cache tags on reads", () => {
  it("tags a risk summary with its phase and its developer", async () => {
    await data.riskSummary("aurelia-heights-phase-2");
    expect(tagged()).toEqual([
      "all",
      "phase:aurelia-heights-phase-2",
      "developer:northfield-estates",
    ]);
    expect(lives()).toEqual(["hours"]);
  });

  it("tags a project page with its phase and its developer", async () => {
    await data.projectPage("kestrel-park");
    expect(tagged()).toEqual(["all", "phase:kestrel-park", "developer:orbis-land"]);
  });

  it("tags a developer page with every phase it shows", async () => {
    await data.developerPage("northfield-estates");
    expect(tagged()).toEqual([
      "all",
      "developer:northfield-estates",
      "phase:aurelia-heights-phase-2",
      "phase:heron-point-phase-2",
      "phase:cedar-walk-phase-2",
    ]);
  });

  it("tags search with every listed and hidden phase, so one publish refreshes it", async () => {
    await data.searchProjects({ q: "3 bhk dwarka expresway under 2.5 cr low risk" });
    const tags = tagged();
    expect(tags.slice(0, 2)).toEqual(["all", "search"]);
    expect(tags).toContain("phase:kestrel-park");
    expect(tags).toContain("phase:aurelia-heights-phase-2"); // hidden by the filter
  });

  it("tags compare with its columns", async () => {
    await data.compare(["aurelia-heights-phase-2", "kestrel-park", "sapphire-grove-phase-1"]);
    expect(tagged()).toEqual([
      "all",
      "compare",
      "phase:aurelia-heights-phase-2",
      "phase:kestrel-park",
      "phase:sapphire-grove-phase-1",
    ]);
  });

  it("refreshes flags every minute and the rest hourly, between publishes", async () => {
    await data.flags();
    await data.methodology();
    expect(lives()).toEqual(["minutes", "hours"]);
    expect(tagged()).toEqual(["all", "flags", "all", "methodology"]);
  });

  it("caches an unknown slug like data, under the slug's tag", async () => {
    await expect(data.riskSummary("no-such-phase")).rejects.toMatchObject({ code: "not_found" });
    expect(tagged()).toEqual(["all", "phase:no-such-phase"]);
    expect(lives()).toEqual(["hours"]);
  });

  it("never caches a failure of the moment", async () => {
    vi.stubEnv("PLINTH_DATA", "supabase");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://supabase.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "pk-test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(data.about()).rejects.toMatchObject({ code: "unavailable" });
    expect(lives()).toEqual([{ stale: 0, revalidate: 0, expire: 0 }]);
  });

  it("never caches buyer calls", async () => {
    await data.unfollow("kestrel-park", "c-9");
    await data.me().catch(() => null);
    expect(cacheTag).not.toHaveBeenCalled();
    expect(cacheLife).not.toHaveBeenCalled();
  });
});

describe("the tag vocabulary", () => {
  it("accepts the documented tags only", () => {
    for (const tag of [
      "all",
      "search",
      "compare",
      "methodology",
      "about",
      "flags",
      "phase:aurelia-heights-phase-2",
      "developer:northfield-estates",
      "evidence:196cb4f5-27eb-57a5-99f8-e5ab1b599c93",
      "card:AH2",
    ]) {
      expect(isCacheTag(tag), tag).toBe(true);
    }
    for (const tag of ["", "phase:", "phase", "project:x", "phase:a b", "x".repeat(300), 7, null]) {
      expect(isCacheTag(tag), String(tag)).toBe(false);
    }
  });

  it("lower-cases keyed values, as the reads write them", () => {
    expect(normalizeTag("card:AH2")).toBe("card:ah2");
    expect(normalizeTag("search")).toBe("search");
    expect(tagsForCall("share_card", { p_code: "AH2" })).toEqual(["all", "card:ah2"]);
    expect(tagsForCall("risk_summary", { p_slug: "  Kestrel-Park " })).toEqual([
      "all",
      "phase:kestrel-park",
    ]);
  });

  it("finds nothing in a payload of the wrong shape", () => {
    expect(tagsForPayload("developer_page", null)).toEqual([]);
    expect(tagsForPayload("search_projects", { items: "x" })).toEqual([]);
    expect(tagsForPayload("share_card", { phase: { slug: "kestrel-park" } })).toEqual([
      "phase:kestrel-park",
    ]);
  });
});
