// Every api.* function behind src/data (API_CONTRACTS §3.1 public reads, §3.2
// buyer API; the M0–M2 rows), with what the data layer needs to call, cache,
// validate and fake it. Adding a function: a row here plus its typed wrapper
// in index.ts.
import type { ExportedTypeName } from "@plinth/contracts";

export type Audience = "anon" | "buyer";
export type Milestone = "M0" | "M1" | "M2";

export type ApiFunction = {
  /** anon: publishable key, cacheable. buyer: the user's session (cookies), never cached. */
  readonly audience: Audience;
  readonly milestone: Milestone;
  /** write: a mutation. Never cached; the fixture session records it. */
  readonly kind: "read" | "write";
  /** Contract type of the response; null while API_CONTRACTS has no schema for it. */
  readonly returns: ExportedTypeName | null;
  /** Contract type of the arguments, where one exists. Checked in dev and test. */
  readonly request?: ExportedTypeName;
  /** `cacheLife` profile of a cached public read (cache.ts). Absent: never cached. */
  readonly cache?: "hours" | "minutes";
  /** Folder under packages/fixtures/expected when it differs from the function name. */
  readonly fixtureDir?: string;
  /**
   * Fixture mode with no key for the arguments: `not_found` where the server
   * would say so (an unknown slug, fact id or code), else `fixture_missing`.
   */
  readonly fixtureMiss: "not_found" | "fixture_missing";
};

const publicRead = (
  returns: ExportedTypeName,
  milestone: Milestone,
  fixtureMiss: ApiFunction["fixtureMiss"],
  extra: Partial<ApiFunction> = {},
): ApiFunction => ({
  audience: "anon",
  milestone,
  kind: "read",
  returns,
  cache: "hours",
  fixtureMiss,
  ...extra,
});

const buyer = (
  kind: ApiFunction["kind"],
  returns: ExportedTypeName | null,
  extra: Partial<ApiFunction> = {},
): ApiFunction => ({
  audience: "buyer",
  milestone: "M2",
  kind,
  returns,
  fixtureMiss: "fixture_missing",
  ...extra,
});

export const API_FUNCTIONS = {
  // §3.1 public reads (anon, cacheable)
  risk_summary: publicRead("RiskSummary", "M1", "not_found"),
  project_page: publicRead("ProjectPage", "M1", "not_found"),
  search_projects: publicRead("SearchResults", "M1", "fixture_missing", {
    request: "SearchRequest",
  }),
  suggest: publicRead("SuggestResults", "M1", "fixture_missing"),
  developer_page: publicRead("DeveloperPage", "M1", "not_found"),
  compare: publicRead("Compare", "M1", "fixture_missing", { request: "CompareRequest" }),
  evidence: publicRead("Evidence", "M1", "not_found"),
  methodology: publicRead("Methodology", "M1", "fixture_missing"),
  about: publicRead("About", "M1", "fixture_missing"),
  // BUILD_PLAN §10: flags are cached for about a minute.
  flags: publicRead("Flags", "M0", "fixture_missing", { cache: "minutes" }),
  share_card: publicRead("ShareCard", "M2", "not_found"),
  // An invite changes when it is used, cancelled or expires: read it fresh.
  family_invite_preview: publicRead("FamilyInvitePreview", "M2", "not_found", {
    cache: undefined,
  }),
  // §3.2 buyer API (user JWT)
  me: buyer("read", null),
  device_register: buyer("write", null),
  follow: buyer("write", "Follow", { request: "FollowRequest" }),
  unfollow: buyer("write", "Ok"),
  set_follow_type: buyer("write", "Follow"),
  following_feed: buyer("read", "FollowingFeed"),
  mark_following_seen: buyer("write", "Ok"),
  link_whatsapp_follows: buyer("write", null),
  alert_prefs_get: buyer("read", "AlertPrefs", { fixtureDir: "alert_prefs" }),
  alert_prefs_set: buyer("write", "AlertPrefs", { request: "AlertPrefsSetRequest" }),
  saved_search_save: buyer("write", null),
  saved_search_delete: buyer("write", "Ok"),
  family_circle: buyer("read", null),
  family_invite_create: buyer("write", "FamilyInvite", { request: "FamilyInviteCreateRequest" }),
  family_invite_cancel: buyer("write", "Ok"),
  family_member_remove: buyer("write", null),
  family_member_undo: buyer("write", null),
  family_join: buyer("write", null),
  shortlist_note_add: buyer("write", null),
  who_has_my_number: buyer("read", "WhoHasMyNumber"),
  consent_history: buyer("read", null),
  consent_withdraw: buyer("write", "ConsentWithdrawal"),
  relay_renew: buyer("write", null),
  data_export_request: buyer("write", null),
  account_delete_request: buyer("write", null),
  request_project: buyer("write", null),
} as const satisfies Record<string, ApiFunction>;

export type RpcName = keyof typeof API_FUNCTIONS;

/** RPC arguments: snake case with a `p_` prefix (API_CONTRACTS §1 "Args"). */
export type RpcArgs = Readonly<Record<`p_${string}`, unknown>>;

export function isRpcName(name: string): name is RpcName {
  return Object.hasOwn(API_FUNCTIONS, name);
}

export function apiFunction(rpc: RpcName): ApiFunction {
  return API_FUNCTIONS[rpc];
}

/** The packages/fixtures/expected folder that serves `rpc` in fixture mode. */
export function fixtureDir(rpc: RpcName): string {
  return apiFunction(rpc).fixtureDir ?? rpc;
}
