// followProject (src/features/auth/follow.ts; M2 gate gap A): api.follow on
// the signed-in session, against a mocked fetch, same pattern as
// session.test.ts and test/data/supabase.test.ts. The live round trip
// against a real backend runs in ci-gate-m2 (e2e/gates/m2.spec.ts @live):
// sign in from a project page's "Verify and follow", land back on it
// showing "Following".
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { followProject } from "@/src/features/auth/follow";

const cookieStore = vi.hoisted(() => ({ getAll: vi.fn(() => []), set: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));

const URL_BASE = "http://supabase.test";
const KEY = "pk-test";

type Sent = { url: string; method: string; headers: Headers; body: Record<string, unknown> };
let sent: Sent[];
let fetchMock: ReturnType<typeof vi.fn>;

function answer(status: number, body: unknown) {
  fetchMock.mockImplementationOnce(async (input: RequestInfo | URL, init?: RequestInit) => {
    sent.push({
      url: String(input),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body:
        typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : {},
    });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
}

const FOLLOW_RECORD = {
  schema: "plinth.follow/1",
  slug: "kestrel-park",
  follow_type: "watching",
  followed_at: "2026-10-18T12:00:00+05:30",
  alerts_line: "Band changes, filings, orders and extensions. Utility alerts only.",
  private_line: "Your family circle doesn’t see your follow type.",
};

beforeEach(() => {
  sent = [];
  fetchMock = vi.fn(async () => {
    throw new Error("unexpected fetch");
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("PLINTH_DATA", "supabase");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_BASE);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", KEY);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  cookieStore.set.mockClear();
});

// A well-formed p_client_id (the contract's FollowRequest requires a UUID;
// checkRequest, dev and test only, would otherwise reject it as invalid_input
// before any fetch).
const CLIENT_ID = "11111111-1111-1111-1111-111111111111";

describe("followProject", () => {
  it("follows on the signed-in session: api.follow, watching, source web", async () => {
    answer(200, FOLLOW_RECORD);
    await expect(followProject("kestrel-park", CLIENT_ID)).resolves.toEqual({
      outcome: "followed",
      follow: FOLLOW_RECORD,
    });
    const [req] = sent as [Sent];
    expect(req.url).toBe(`${URL_BASE}/rest/v1/rpc/follow`);
    expect(req.headers.get("content-profile")).toBe("api");
    expect(req.body).toEqual({
      p_slug: "kestrel-park",
      p_follow_type: "watching",
      p_source: "web",
      p_client_id: CLIENT_ID,
    });
  });

  it("a signed-out caller gets auth_required, never a fake follow", async () => {
    answer(401, {
      code: "PT401",
      message: "auth_required",
      details: "Sign in to do this.",
      hint: null,
    });
    await expect(followProject("kestrel-park", CLIENT_ID)).resolves.toEqual({
      outcome: "auth_required",
    });
  });

  it("any other failure is a plain error (the caller shows its own existing copy)", async () => {
    answer(404, {
      code: "PT404",
      message: "not_found",
      details: "We have no project at this address.",
      hint: null,
    });
    await expect(followProject("no-such-phase", CLIENT_ID)).resolves.toEqual({
      outcome: "error",
    });
  });

  it("maps a network failure to the same plain error, never a fake follow", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(followProject("kestrel-park", CLIENT_ID)).resolves.toEqual({ outcome: "error" });
  });

  it("never calls Supabase in fixture mode", async () => {
    vi.stubEnv("PLINTH_DATA", "fixtures");
    await expect(followProject("kestrel-park", CLIENT_ID)).resolves.toEqual({ outcome: "error" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
