import { describe, expect, it } from "vitest";
import { FIXTURE_ADMIN_SESSION } from "@/src/auth/fixture";
import { checkAdminAccess } from "@/src/auth/require-admin";
import { getAdminSession } from "@/src/auth/session";
import { isAdmin } from "@/src/auth/types";

// PLINTH_DATA=fixtures (vitest.config.mts): no Supabase involved at all (AGENTS.md
// "Fixture mode must work without Supabase") — getAdminSession never calls cookies().
describe("getAdminSession (fixture mode)", () => {
  it("is already the admin at aal2, with no accounts or network", async () => {
    await expect(getAdminSession()).resolves.toEqual(FIXTURE_ADMIN_SESSION);
  });
});

describe("isAdmin", () => {
  it("needs both the admin role and aal2", () => {
    expect(isAdmin({ email: "a@b.test", roles: ["admin"], aal: "aal2" })).toBe(true);
    expect(isAdmin({ email: "a@b.test", roles: ["admin"], aal: "aal1" })).toBe(false);
    expect(isAdmin({ email: "a@b.test", roles: ["buyer"], aal: "aal2" })).toBe(false);
    expect(isAdmin({ email: null, roles: [], aal: null })).toBe(false);
  });
});

describe("checkAdminAccess (fixture mode)", () => {
  it("lets the fixture admin through", async () => {
    await expect(checkAdminAccess()).resolves.toEqual({ ok: true, session: FIXTURE_ADMIN_SESSION });
  });
});
