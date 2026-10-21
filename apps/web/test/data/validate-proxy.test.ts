// Contract checks run in dev and test only; the session-refresh helper for the
// auth tasks' proxy.ts.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDataError } from "@/src/data";
import { checkRequest, checkResponse } from "@/src/data/validate";
import { refreshSession } from "@/src/lib/supabase/proxy";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("contract checks (validate.ts)", () => {
  it("rejects arguments and payloads that break the contract in tests", async () => {
    const badArgs = await checkRequest("search_projects", { p_limit: 500 }).catch(
      (e: unknown) => e,
    );
    expect(isDataError(badArgs, "invalid_input")).toBe(true);
    const badPayload = await checkResponse("flags", { schema: "plinth.flags/1" }).catch(
      (e: unknown) => e,
    );
    expect(isDataError(badPayload, "bad_response")).toBe(true);
    await expect(checkResponse("me", "anything")).resolves.toBeUndefined();
  });

  it("is off in production, where the API's own contract tests stand behind the payloads", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(checkRequest("search_projects", { p_limit: 500 })).resolves.toBeUndefined();
    await expect(checkResponse("flags", {})).resolves.toBeUndefined();
  });
});

describe("refreshSession (src/lib/supabase/proxy.ts)", () => {
  it("passes the request through in fixture mode, account routes included", async () => {
    const res = await refreshSession(new NextRequest("http://localhost/following"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  describe("supabase mode", () => {
    beforeEach(() => {
      vi.stubEnv("PLINTH_DATA", "supabase");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://supabase.test");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "pk-test");
    });

    // M2 gate gap B: a signed-out reader on an account route no longer
    // reaches the page (which would otherwise throw the buyer read's own
    // auth_required into Next's generic error render) — the guard sends
    // them to sign-in first, with no network call (getClaims() needs none
    // when there is no session cookie, same as before this gap closed).
    it("sends a signed-out reader on /following to sign-in, with no network call", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const res = await refreshSession(new NextRequest("http://localhost/following?x=1"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost/sign-in?next=%2Ffollowing%3Fx%3D1");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("sends a signed-out reader on /privacy to sign-in too", async () => {
      vi.stubGlobal("fetch", vi.fn());
      const res = await refreshSession(new NextRequest("http://localhost/privacy"));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost/sign-in?next=%2Fprivacy");
    });

    it("never redirects /sign-in itself (no loop) or an /api route (its own 401, not HTML)", async () => {
      vi.stubGlobal("fetch", vi.fn());
      for (const path of ["/sign-in", "/api/revalidate"]) {
        const res = await refreshSession(new NextRequest(`http://localhost${path}`));
        expect(res.headers.get("x-middleware-next")).toBe("1");
      }
    });

    // A signed-in reader passing the guard needs a real session cookie
    // @supabase/ssr itself wrote (chunked, project-ref-keyed): ci-gate-m2's
    // @live test proves that path end to end (sign in on a project page,
    // land on /following past this exact guard). Unit level, the two cases
    // this guard itself decides between are above: no session → redirect,
    // and a path it was never meant to touch → untouched.
  });
});
