// T16 acceptance: POST /api/revalidate rejects a wrong secret, and expires the
// tags it is sent when the secret matches.
import { revalidateTag } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/revalidate/route";
import { MAX_TAGS, REVALIDATE_SECRET_HEADER, sameSecret } from "@/src/data/revalidate";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const SHARED = "rv-test";

function post(body: unknown, secret: string | null = SHARED) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (secret !== null) headers.set(REVALIDATE_SECRET_HEADER, secret);
  return POST(
    new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.stubEnv("REVALIDATE_SECRET", SHARED);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/revalidate", () => {
  it("rejects a wrong secret with 401 and expires nothing", async () => {
    const res = await post({ tags: ["phase:kestrel-park"] }, "rv-nope");
    expect(res.status).toBe(401);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({
      error: { code: "auth_required", message: "Wrong or missing secret." },
    });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a missing secret header the same way", async () => {
    const res = await post({ tags: ["search"] }, null);
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("accepts nothing while REVALIDATE_SECRET is unset on the server", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    const res = await post({ tags: ["search"] }, "");
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("flag_off");
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("expires each tag at once, normalised and without repeats", async () => {
    const res = await post({
      tags: ["phase:aurelia-heights-phase-2", "search", "card:AH2", "search"],
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      revalidated: ["phase:aurelia-heights-phase-2", "search", "card:ah2"],
    });
    expect(vi.mocked(revalidateTag).mock.calls).toEqual([
      ["phase:aurelia-heights-phase-2", { expire: 0 }],
      ["search", { expire: 0 }],
      ["card:ah2", { expire: 0 }],
    ]);
  });

  it.each([
    ["not JSON", "{"],
    ["no tags", {}],
    ["an empty list", { tags: [] }],
    ["an unknown tag", { tags: ["project:aurelia"] }],
    ["a non-string tag", { tags: [42] }],
    ["too many tags", { tags: Array.from({ length: MAX_TAGS + 1 }, (_, i) => `phase:p-${i}`) }],
  ])("rejects %s with 422", async (_why, body) => {
    const res = await post(body);
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("invalid_input");
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("sameSecret", () => {
  it("compares values of any length", () => {
    expect(sameSecret("abc", "abc")).toBe(true);
    expect(sameSecret("abc", "abcd")).toBe(false);
    expect(sameSecret("", "abc")).toBe(false);
  });
});
