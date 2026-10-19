// src/data declares a signature for every M1–M2 api.* function the web calls
// (API_CONTRACTS §3.1–§3.2). T16 implements them; until then each rejects with
// DataError("not_implemented").
import { describe, expect, it } from "vitest";
import * as data from "@/src/data";
import { API_FUNCTIONS, DataError, dataMode, isDataError } from "@/src/data";

/** API_CONTRACTS §3.1 rows for M0–M2 and every §3.2 function marked M2 (plus "Other" M2). */
const CONTRACT_M1_M2 = [
  "risk_summary",
  "project_page",
  "search_projects",
  "suggest",
  "developer_page",
  "compare",
  "evidence",
  "methodology",
  "about",
  "flags",
  "share_card",
  "family_invite_preview",
  "me",
  "device_register",
  "follow",
  "unfollow",
  "set_follow_type",
  "following_feed",
  "mark_following_seen",
  "link_whatsapp_follows",
  "alert_prefs_get",
  "alert_prefs_set",
  "saved_search_save",
  "saved_search_delete",
  "family_circle",
  "family_invite_create",
  "family_invite_cancel",
  "family_member_remove",
  "family_member_undo",
  "family_join",
  "shortlist_note_add",
  "who_has_my_number",
  "consent_history",
  "consent_withdraw",
  "relay_renew",
  "data_export_request",
  "account_delete_request",
  "request_project",
];

const camel = (rpc: string) => rpc.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const fns = data as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;

describe("data layer signatures (T05 → T16)", () => {
  it("covers exactly the M1–M2 functions of API_CONTRACTS §3.1–§3.2", () => {
    expect(Object.keys(API_FUNCTIONS).sort()).toEqual([...CONTRACT_M1_M2].sort());
  });

  it.each(CONTRACT_M1_M2)("exports %s as a function", (rpc) => {
    expect(typeof fns[camel(rpc)]).toBe("function");
  });

  it.each(CONTRACT_M1_M2)("%s rejects with not_implemented until T16", async (rpc) => {
    const err = await fns[camel(rpc)]!("x", "x", "x", "x").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DataError);
    expect(isDataError(err, "not_implemented")).toBe(true);
    expect((err as DataError).rpc).toBe(rpc);
    expect((err as DataError).message).toContain("T16");
  });
});

describe("dataMode (PLINTH_DATA)", () => {
  it("defaults to fixtures and accepts the two modes", () => {
    expect(dataMode(undefined)).toBe("fixtures");
    expect(dataMode("")).toBe("fixtures");
    expect(dataMode("fixtures")).toBe("fixtures");
    expect(dataMode("supabase")).toBe("supabase");
    expect(dataMode()).toBe("fixtures");
  });

  it("refuses anything else", () => {
    expect(() => dataMode("prod")).toThrow(/PLINTH_DATA/);
  });
});
