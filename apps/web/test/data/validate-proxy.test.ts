// Contract checks run in dev and test only; the session-refresh helper for the
// auth tasks' proxy.ts.
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  it("passes the request through in fixture mode", async () => {
    const res = await refreshSession(new NextRequest("http://localhost/following"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("reads the session cookies in supabase mode, with no network call when there is no session", async () => {
    vi.stubEnv("PLINTH_DATA", "supabase");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://supabase.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "pk-test");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await refreshSession(new NextRequest("http://localhost/following"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
