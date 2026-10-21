// Live sign-in's server actions (src/features/auth/session.ts; M2 gate gap 2),
// against a mocked fetch: no network and no project. Supabase Auth's phone OTP
// goes to /auth/v1/otp and /auth/v1/verify with the publishable key only; a
// session is "signed in" only when Auth returned one, and only then are its
// cookies set. Fixture mode never calls Auth. The live round trip against a
// real Auth runs in ci-gate-m2 (e2e/gates/m2.spec.ts @live).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendSignInCode, verifySignInCode } from "@/src/features/auth/session";

const cookieStore = vi.hoisted(() => ({ getAll: vi.fn(() => []), set: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));

const URL_BASE = "http://supabase.test";
const KEY = "pk-test";

/** Rohan's test number (packages/fixtures/canonical/people.json), never a real one. */
const PHONE = (
  JSON.parse(
    readFileSync(join(__dirname, "../../../../../packages/fixtures/canonical/people.json"), "utf8"),
  ) as { people: { key: string; test_phone_e164: string | null }[] }
).people.find((p) => p.key === "rohan")!.test_phone_e164!;

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

const SESSION = {
  access_token: "access-token-for-this-test",
  token_type: "bearer",
  expires_in: 3600,
  refresh_token: "refresh-token-for-this-test",
  user: {
    id: "bff1ee72-9910-5980-a875-96a9a00b24cf",
    aud: "authenticated",
    role: "authenticated",
    phone: PHONE.replace(/^\+/, ""),
    app_metadata: { provider: "phone" },
    user_metadata: {},
    created_at: "2026-07-01T00:00:00+05:30",
  },
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

describe("sendSignInCode", () => {
  it("asks Supabase Auth for a phone code, with the publishable key only", async () => {
    answer(200, {});
    await expect(sendSignInCode(PHONE)).resolves.toEqual({ sent: true });
    expect(sent).toHaveLength(1);
    const [req] = sent as [Sent];
    expect(req.url).toBe(`${URL_BASE}/auth/v1/otp`);
    expect(req.method).toBe("POST");
    expect(req.headers.get("apikey")).toBe(KEY);
    expect(req.body.phone).toBe(PHONE);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("says not sent when Auth refuses (a rate limit, the hook's refusal)", async () => {
    answer(429, { code: "over_sms_send_rate_limit", msg: "For security purposes, wait." });
    await expect(sendSignInCode(PHONE)).resolves.toEqual({ sent: false });
  });

  it("never calls Auth for a malformed number, or in fixture mode", async () => {
    await expect(sendSignInCode("9900000318")).resolves.toEqual({ sent: false });
    await expect(sendSignInCode("+91 99000 00318")).resolves.toEqual({ sent: false });
    vi.stubEnv("PLINTH_DATA", "fixtures");
    await expect(sendSignInCode(PHONE)).resolves.toEqual({ sent: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("verifySignInCode", () => {
  it("checks the code with Auth; its session lands in this browser's cookies", async () => {
    answer(200, SESSION);
    await expect(verifySignInCode(PHONE, "123456")).resolves.toEqual({ signedIn: true });
    const [req] = sent as [Sent];
    expect(req.url).toBe(`${URL_BASE}/auth/v1/verify`);
    expect(req.body).toMatchObject({ phone: PHONE, token: "123456", type: "sms" });
    // @supabase/ssr writes the session as sb-<project>-auth-token cookies.
    const names = cookieStore.set.mock.calls.map(([name]) => name as string);
    expect(names.some((n) => /^sb-.+-auth-token(\.\d+)?$/.test(n))).toBe(true);
  });

  it("a wrong or expired code is not a sign-in, and sets no cookie", async () => {
    answer(403, { code: "otp_expired", msg: "Token has expired or is invalid" });
    await expect(verifySignInCode(PHONE, "000000")).resolves.toEqual({ signedIn: false });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("an answer without a session is not a sign-in (AGENTS.md rule 9)", async () => {
    answer(200, { user: SESSION.user });
    await expect(verifySignInCode(PHONE, "123456")).resolves.toEqual({ signedIn: false });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("never calls Auth for a malformed code or number, or in fixture mode", async () => {
    await expect(verifySignInCode(PHONE, "12345")).resolves.toEqual({ signedIn: false });
    await expect(verifySignInCode(PHONE, "12345a")).resolves.toEqual({ signedIn: false });
    await expect(verifySignInCode("919900000318", "123456")).resolves.toEqual({ signedIn: false });
    vi.stubEnv("PLINTH_DATA", "fixtures");
    await expect(verifySignInCode(PHONE, "123456")).resolves.toEqual({ signedIn: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
