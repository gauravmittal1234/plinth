// T16 acceptance (fixture mode): every read returns schema-valid data for every
// expected key, deep-equal to packages/fixtures/expected. Plus how the fixture
// adapter finds keys, design states, misses, suggest and the write session.
import { VALIDATORS } from "@plinth/contracts/validators";
import { PHASE_SLUGS } from "@plinth/fixtures";
import { expectedKeys, loadExpected, loadRequests } from "@plinth/fixtures/node";
import { connection } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as data from "@/src/data";
import { API_FUNCTIONS, DataError, isDataError, type RpcName } from "@/src/data";
import { fixtureIndex } from "@/src/data/adapters/fixtures";
import { fixtureSession, resetFixtureSession } from "@/src/data/adapters/fixture-session";
import { fixtureDir } from "@/src/data/registry";

vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));

type Req = Record<string, unknown>;
const s = (v: unknown) => v as string;
const state = (req: Req) => ({ fixtureState: typeof req.state === "string" ? req.state : null });

/** Every read the web makes, called through its public function with a fixture request's args. */
const READS: Record<string, (req: Req) => Promise<unknown>> = {
  risk_summary: (r) => data.riskSummary(s(r.p_slug), state(r)),
  project_page: (r) => data.projectPage(s(r.p_slug), state(r)),
  search_projects: (r) =>
    data.searchProjects({
      q: r.p_q as string | null,
      filters: r.p_filters as data.SearchFilters | null,
      sort: r.p_sort as string | null,
      bbox: r.p_bbox as data.BBox | null,
      cursor: r.p_cursor as string | null,
      limit: r.p_limit as number | undefined,
    }),
  suggest: (r) => data.suggest(s(r.p_q)),
  developer_page: (r) => data.developerPage(s(r.p_slug), state(r)),
  compare: (r) => data.compare(r.p_slugs as string[]),
  evidence: (r) => data.evidence(s(r.p_fact_id)),
  methodology: () => data.methodology(),
  about: () => data.about(),
  flags: () => data.flags(),
  share_card: (r) => data.shareCard(s(r.p_code)),
  family_invite_preview: (r) => data.familyInvitePreview(s(r.p_code)),
  me: () => data.me(),
  following_feed: (r) => data.followingFeed((r.p_since as string | null) ?? null),
  alert_prefs_get: () => data.alertPrefsGet(),
  family_circle: () => data.familyCircle(),
  who_has_my_number: () => data.whoHasMyNumber(),
  consent_history: () => data.consentHistory(),
};

const READ_RPCS = (Object.keys(API_FUNCTIONS) as RpcName[]).filter(
  (rpc) => API_FUNCTIONS[rpc].kind === "read",
);

/** [rpc, key] for every expected payload of a function the web reads (T03 today; T03b adds more). */
const CASES = READ_RPCS.flatMap((rpc) =>
  expectedKeys(fixtureDir(rpc)).map((key) => [rpc, key] as const),
);

beforeEach(() => {
  resetFixtureSession();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("fixture reads: every expected key (T16 acceptance)", () => {
  it("has a caller for every read in the registry", () => {
    expect(Object.keys(READS).sort()).toEqual([...READ_RPCS].sort());
  });

  it("serves every function of packages/fixtures/expected that T03 published", () => {
    const served = new Set(CASES.map(([rpc]) => rpc));
    for (const rpc of [
      "risk_summary",
      "project_page",
      "developer_page",
      "search_projects",
      "compare",
      "evidence",
      "methodology",
      "about",
      "flags",
    ] as const) {
      expect(served, rpc).toContain(rpc);
    }
    expect(CASES.length).toBeGreaterThanOrEqual(39);
  });

  it("bundles the same files Node sees on disk", () => {
    for (const [dir, keys] of fixtureIndex()) expect(keys, dir).toEqual(expectedKeys(dir));
  });

  it.each(CASES)("%s / %s deep-equals the expected file and validates", async (rpc, key) => {
    const dir = fixtureDir(rpc);
    const req = (loadRequests(dir)[key] ?? {}) as Req;
    const payload = await READS[rpc]!(req);
    expect(payload).toEqual(loadExpected(dir, key));

    const returns = API_FUNCTIONS[rpc].returns;
    if (returns) {
      const validate = VALIDATORS[returns];
      expect(validate(payload), JSON.stringify(validate.errors)).toBe(true);
    }
  });
});

describe("finding a fixture key", () => {
  it("ignores case and spacing in the search box, and applies the default sort and page size", async () => {
    const canonical = loadExpected("search_projects", "canonical");
    await expect(
      data.searchProjects({ q: "  3 BHK  dwarka expresway under 2.5 cr LOW risk " }),
    ).resolves.toEqual(canonical);
    await expect(data.searchProjects()).resolves.toEqual(
      loadExpected("search_projects", "all-gurugram"),
    );
  });

  it("serves a design state only when asked, and never by default", async () => {
    const plain = await data.riskSummary("aurelia-heights-phase-2");
    expect(plain.chip.label).toBe("Elevated");
    const factsOnly = await data.riskSummary("aurelia-heights-phase-2", {
      fixtureState: "facts_only",
    });
    expect(factsOnly.chip).toMatchObject({ kind: "withheld", label: "Band withheld · facts only" });
    const group = await data.developerPage("northfield-estates", { fixtureState: "facts_only" });
    expect(group.ongoing.every((p) => p.chip.kind === "withheld")).toBe(true);
    await expect(
      data.riskSummary("kestrel-park", { fixtureState: "facts_only" }),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("hands out copies: editing one payload never changes the next read", async () => {
    const first = await data.riskSummary("kestrel-park");
    (first as { chip: { label: string } }).chip.label = "edited";
    expect((await data.riskSummary("kestrel-park")).chip.label).toBe("Low");
  });

  it("covers the 8 seeded phases", async () => {
    for (const slug of PHASE_SLUGS) {
      expect((await data.riskSummary(slug)).phase.slug).toBe(slug);
      expect((await data.projectPage(slug)).risk.phase.slug).toBe(slug);
    }
  });
});

describe("fixture misses", () => {
  it("answers an unknown slug or fact id with not_found, as the server does", async () => {
    for (const read of [
      () => data.riskSummary("no-such-phase"),
      () => data.projectPage("no-such-phase"),
      () => data.developerPage("no-such-group"),
      () => data.evidence("00000000-0000-4000-8000-000000000000"),
    ]) {
      const err = await read().catch((e: unknown) => e);
      expect(isDataError(err, "not_found")).toBe(true);
      expect((err as DataError).status).toBe(404);
    }
  });

  it("answers arguments with no fixture with fixture_missing, naming the file to add", async () => {
    const err = await data.searchProjects({ q: "5 bhk sohna road" }).catch((e: unknown) => e);
    expect(isDataError(err, "fixture_missing")).toBe(true);
    expect((err as DataError).rpc).toBe("search_projects");
    expect((err as DataError).message).toContain("packages/fixtures/expected/search_projects");

    const swapped = await data
      .compare(["kestrel-park", "aurelia-heights-phase-2"])
      .catch((e: unknown) => e);
    expect(isDataError(swapped, "fixture_missing")).toBe(true);
  });

  it("checks arguments against the contract first (invalid_input, like PT422)", async () => {
    const err = await data.compare(["kestrel-park"]).catch((e: unknown) => e);
    expect(isDataError(err, "invalid_input")).toBe(true);
    expect((err as DataError).message).toContain("CompareRequest");
  });
});

describe("api.suggest in fixture mode", () => {
  it("finds Aurelia from the first letters of its name, with its locality and RERA number", async () => {
    const res = await data.suggest("aure");
    expect(res.schema).toBe("plinth.suggest/1");
    expect(res.items[0]).toEqual({
      kind: "phase",
      slug: "aurelia-heights-phase-2",
      label: "Aurelia Heights, Phase 2",
      detail_line: "Sector 37D, Dwarka Expressway · GGM/673/405/2022/117",
      matched_on: "name",
    });
    expect(VALIDATORS.SuggestResults(res)).toBe(true);
  });

  it("matches RERA numbers, sectors and developer groups, at most 8 items", async () => {
    expect((await data.suggest("GGM/673/405")).items[0]).toMatchObject({
      slug: "aurelia-heights-phase-2",
      matched_on: "rera_number",
    });
    const north = await data.suggest("northfield");
    expect(north.items.map((i) => i.kind)).toContain("developer");
    expect((await data.suggest("dwarka")).items.every((i) => i.matched_on === "sector")).toBe(true);
    expect((await data.suggest("a")).items.length).toBeLessThanOrEqual(8);
    expect((await data.suggest("   ")).items).toEqual([]);
  });
});

describe("fixture writes: the in-memory session", () => {
  it("answers an Ok write, records it and replays the first result for its client id", async () => {
    await data.follow("kestrel-park", "watching", "web", "c-1").catch(() => null);
    await expect(data.unfollow("kestrel-park", "c-2")).resolves.toEqual({ ok: true });
    await expect(data.unfollow("kestrel-park", "c-2")).resolves.toEqual({ ok: true });
    await expect(data.markFollowingSeen()).resolves.toEqual({ ok: true });
    const session = fixtureSession();
    expect(session.writes.map((w) => w.rpc)).toEqual(["unfollow", "mark_following_seen"]);
    expect(session.writes[0]!.at).toBe("2026-10-18T12:00:00+05:30");
  });

  it("rejects a write whose answer carries server copy until a fixture exists", async () => {
    const err = await data
      .follow("kestrel-park", "watching", "web", "6f0e2c1a-0000-4000-8000-000000000001")
      .catch((e: unknown) => e);
    expect(isDataError(err, "fixture_missing")).toBe(true);
    expect(fixtureSession().writes).toHaveLength(0);
  });

  it("starts empty after a reset", async () => {
    await data.unfollow("kestrel-park", "c-3");
    resetFixtureSession();
    expect(fixtureSession().writes).toEqual([]);
  });
});

describe("uncached reads render at request time in both modes", () => {
  it("calls connection() before a buyer read, never before a cached public read", async () => {
    await data.riskSummary("kestrel-park");
    expect(connection).not.toHaveBeenCalled();
    await data.me().catch(() => null);
    expect(connection).toHaveBeenCalledTimes(1);
  });
});
