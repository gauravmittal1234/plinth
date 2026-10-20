// src/data has one typed function per M1–M2 api.* function the web calls
// (API_CONTRACTS §3.1–§3.2; the signatures T05 declared), each sending the
// function's `p_` args.
import { afterEach, describe, expect, it, vi } from "vitest";
import * as data from "@/src/data";
import { API_FUNCTIONS } from "@/src/data";
import * as invokeModule from "@/src/data/invoke";

vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));

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

/** The args each function sends for a sample call (API_CONTRACTS §3–§4). */
const SAMPLES: Record<string, [unknown[], Record<string, unknown>]> = {
  risk_summary: [["kestrel-park"], { p_slug: "kestrel-park" }],
  project_page: [["kestrel-park"], { p_slug: "kestrel-park" }],
  search_projects: [[{ q: "kestrel", limit: 5 }], { p_q: "kestrel", p_limit: 5 }],
  suggest: [["aure"], { p_q: "aure" }],
  developer_page: [["orbis-land"], { p_slug: "orbis-land" }],
  compare: [[["kestrel-park", "coral-towers"]], { p_slugs: ["kestrel-park", "coral-towers"] }],
  evidence: [["f-1"], { p_fact_id: "f-1" }],
  methodology: [[], {}],
  about: [[], {}],
  flags: [[], {}],
  share_card: [["AH2"], { p_code: "AH2" }],
  family_invite_preview: [["AH2-7KQ"], { p_code: "AH2-7KQ" }],
  me: [[], {}],
  device_register: [
    ["tok", "android", "1.0.0"],
    { p_token: "tok", p_platform: "android", p_app_version: "1.0.0" },
  ],
  follow: [
    ["kestrel-park", "watching", "web", "c-1"],
    { p_slug: "kestrel-park", p_follow_type: "watching", p_source: "web", p_client_id: "c-1" },
  ],
  unfollow: [["kestrel-park", "c-1"], { p_slug: "kestrel-park", p_client_id: "c-1" }],
  set_follow_type: [
    ["kestrel-park", "booked", "c-1"],
    { p_slug: "kestrel-park", p_follow_type: "booked", p_client_id: "c-1" },
  ],
  following_feed: [[], { p_since: null }],
  mark_following_seen: [[], {}],
  link_whatsapp_follows: [[true], { p_accept: true }],
  alert_prefs_get: [[], {}],
  alert_prefs_set: [
    [{ push: { band_change: "instant" } }, "c-1"],
    { p_prefs: { push: { band_change: "instant" } }, p_client_id: "c-1" },
  ],
  saved_search_save: [
    ["Mine", { q: "kestrel" }, "c-1"],
    { p_name: "Mine", p_query: { q: "kestrel" }, p_client_id: "c-1" },
  ],
  saved_search_delete: [["s-1"], { p_id: "s-1" }],
  family_circle: [[], {}],
  family_invite_create: [
    [{ slugs: ["aurelia-heights-phase-2"] }],
    { p_scope: { slugs: ["aurelia-heights-phase-2"] } },
  ],
  family_invite_cancel: [["AH2-7KQ"], { p_code: "AH2-7KQ" }],
  family_member_remove: [["m-1"], { p_member_id: "m-1" }],
  family_member_undo: [["m-1"], { p_member_id: "m-1" }],
  family_join: [["AH2-7KQ"], { p_code: "AH2-7KQ" }],
  shortlist_note_add: [
    ["kestrel-park", "Ask about parking", "c-1"],
    { p_slug: "kestrel-park", p_text: "Ask about parking", p_client_id: "c-1" },
  ],
  who_has_my_number: [[], {}],
  consent_history: [[], {}],
  consent_withdraw: [["C-1012-04"], { p_ref: "C-1012-04" }],
  relay_renew: [["r-1"], { p_relay_id: "r-1" }],
  data_export_request: [[], {}],
  account_delete_request: [[], {}],
  request_project: [["Indigo Terraces"], { p_name: "Indigo Terraces", p_rera: null }],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("data layer signatures (T05 → T16)", () => {
  it("covers exactly the M1–M2 functions of API_CONTRACTS §3.1–§3.2", () => {
    expect(Object.keys(API_FUNCTIONS).sort()).toEqual([...CONTRACT_M1_M2].sort());
    expect(Object.keys(SAMPLES).sort()).toEqual([...CONTRACT_M1_M2].sort());
  });

  it.each(CONTRACT_M1_M2)("exports %s as a function", (rpc) => {
    expect(typeof fns[camel(rpc)]).toBe("function");
  });

  it.each(CONTRACT_M1_M2)("%s sends its p_ args to api.%s", async (rpc) => {
    const spy = vi.spyOn(invokeModule, "invoke").mockResolvedValue({ ok: true });
    const [callArgs, wire] = SAMPLES[rpc]!;
    await fns[camel(rpc)]!(...callArgs).catch(() => null);
    expect(spy).toHaveBeenCalledTimes(1);
    const [mode, name, args] = spy.mock.calls[0]!;
    expect(mode).toBe("fixtures");
    expect(name).toBe(rpc);
    expect(args).toEqual(wire);
  });
});
