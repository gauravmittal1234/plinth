// T16 acceptance (supabase adapter, mocked fetch, no network and no project):
// api.* calls go to POST /rest/v1/rpc/<fn> with `Content-Profile: api` and the
// `p_` args as the body; PostgREST errors map to DataError codes.
import { loadExpected } from "@plinth/fixtures/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as data from "@/src/data";
import { DataError, isDataError } from "@/src/data";

vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
const cookieStore = vi.hoisted(() => ({ getAll: vi.fn(() => []), set: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));

const URL_BASE = "http://supabase.test";
const KEY = "pk-test";

type Sent = { url: string; method: string; headers: Headers; body: unknown };

let fetchMock: ReturnType<typeof vi.fn>;
let sent: Sent[];

function answer(status: number, body: unknown) {
  fetchMock.mockImplementationOnce(async (input: RequestInfo | URL, init?: RequestInit) => {
    record(input, init);
    return new Response(body === undefined ? "" : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
}

function record(input: RequestInfo | URL, init?: RequestInit) {
  sent.push({
    url: String(input),
    method: init?.method ?? "GET",
    headers: new Headers(init?.headers),
    body: typeof init?.body === "string" ? JSON.parse(init.body) : init?.body,
  });
}

beforeEach(() => {
  sent = [];
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("PLINTH_DATA", "supabase");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_BASE);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", KEY);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("supabase adapter: the request", () => {
  it("POSTs api.risk_summary with Content-Profile: api and the p_ args", async () => {
    const aurelia = loadExpected("risk_summary", "aurelia-heights-phase-2");
    answer(200, aurelia);
    await expect(data.riskSummary("aurelia-heights-phase-2")).resolves.toEqual(aurelia);

    expect(sent).toHaveLength(1);
    const [req] = sent as [Sent];
    expect(req.url).toBe(`${URL_BASE}/rest/v1/rpc/risk_summary`);
    expect(req.method).toBe("POST");
    expect(req.headers.get("content-profile")).toBe("api");
    expect(req.headers.get("apikey")).toBe(KEY);
    expect(req.headers.get("authorization")).toBe(`Bearer ${KEY}`);
    expect(req.body).toEqual({ p_slug: "aurelia-heights-phase-2" });
  });

  it("sends arrays and objects as JSON, and leaves out what the caller left out", async () => {
    answer(
      200,
      loadExpected("compare", "aurelia-heights-phase-2_kestrel-park_sapphire-grove-phase-1"),
    );
    await data.compare(["aurelia-heights-phase-2", "kestrel-park", "sapphire-grove-phase-1"]);
    expect(sent[0]!.url).toBe(`${URL_BASE}/rest/v1/rpc/compare`);
    expect(sent[0]!.body).toEqual({
      p_slugs: ["aurelia-heights-phase-2", "kestrel-park", "sapphire-grove-phase-1"],
    });

    answer(200, loadExpected("search_projects", "canonical"));
    await data.searchProjects({
      q: "3 bhk dwarka expresway under 2.5 cr low risk",
      filters: { bhk: [3] },
    });
    expect(sent[1]!.body).toEqual({
      p_q: "3 bhk dwarka expresway under 2.5 cr low risk",
      p_filters: { bhk: [3] },
    });
    expect(sent[1]!.headers.get("content-profile")).toBe("api");
  });

  it("never sends a fixture design state", async () => {
    answer(200, loadExpected("risk_summary", "kestrel-park"));
    await data.riskSummary("kestrel-park", { fixtureState: "facts_only" });
    expect(sent[0]!.body).toEqual({ p_slug: "kestrel-park" });
  });

  it("calls the buyer API with this request's cookie session", async () => {
    answer(200, { ok: true });
    await expect(data.unfollow("kestrel-park", "c-1")).resolves.toEqual({ ok: true });
    expect(cookieStore.getAll).toHaveBeenCalled();
    expect(sent[0]!.url).toBe(`${URL_BASE}/rest/v1/rpc/unfollow`);
    expect(sent[0]!.headers.get("content-profile")).toBe("api");
    expect(sent[0]!.body).toEqual({ p_slug: "kestrel-park", p_client_id: "c-1" });
  });

  it("explains a missing project URL or key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const err = await data.unfollow("kestrel-park", "c-1").catch((e: unknown) => e);
    expect(String(err)).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("supabase adapter: error mapping (API_CONTRACTS §1)", () => {
  it("maps PT404 not_found, keeping the server's sentence", async () => {
    answer(404, {
      code: "PT404",
      message: "not_found",
      details: "We have no project at this address.",
      hint: null,
    });
    const err = await data.riskSummary("no-such-phase").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DataError);
    expect(err).toMatchObject({
      code: "not_found",
      rpc: "risk_summary",
      status: 404,
      message: "We have no project at this address.",
    });
  });

  it("maps PT422 invalid_input", async () => {
    answer(422, {
      code: "PT422",
      message: "invalid_input",
      details: "Give the id of the fact to show.",
      hint: null,
    });
    const err = await data.evidence(" ").catch((e: unknown) => e);
    expect(isDataError(err, "invalid_input")).toBe(true);
    expect((err as DataError).status).toBe(422);
  });

  it("maps a function that is not deployed yet to not_implemented", async () => {
    answer(404, {
      code: "PGRST202",
      message: "Could not find the function api.suggest(p_q) in the schema cache",
      details: null,
      hint: null,
    });
    const err = await data.suggest("aure").catch((e: unknown) => e);
    expect(isDataError(err, "not_implemented")).toBe(true);
  });

  it("maps a network failure to unavailable", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    const err = await data.methodology().catch((e: unknown) => e);
    expect(isDataError(err, "unavailable")).toBe(true);
  });

  it("maps any other PostgREST error to internal with its status", async () => {
    answer(500, { code: "XX000", message: "boom", details: null, hint: null });
    const err = await data.about().catch((e: unknown) => e);
    expect(err).toMatchObject({ code: "internal", status: 500 });
  });

  it("rejects a payload that breaks its contract (dev and test)", async () => {
    answer(200, { schema: "plinth.risk_summary/1", phase: null });
    const err = await data.riskSummary("kestrel-park").catch((e: unknown) => e);
    expect(isDataError(err, "bad_response")).toBe(true);
    expect((err as DataError).message).toContain("RiskSummary");
  });
});
