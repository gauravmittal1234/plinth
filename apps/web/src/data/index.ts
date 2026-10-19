// The web's data layer: one typed function per api.* function the web calls in
// M1–M2 (API_CONTRACTS §3.1 public reads, §3.2 buyer API). Pages import only
// from here; nothing else talks to Supabase or reads fixture files.
//
// SIGNATURES ONLY (T05). Every function maps its arguments to the RPC's `p_`
// args and hands them to `call`, which rejects with DataError("not_implemented")
// until T16 implements the two adapters behind it:
//   fixtures  → packages/fixtures/expected/<rpc>/<key>.json (writes held in memory)
//   supabase  → supabase.schema("api").rpc(<rpc>, args), cookie sessions via @supabase/ssr
// T16 owns src/data/** from here on (OWNERSHIP.md).
import "server-only";
import { DataError } from "./errors";
import { dataMode } from "./mode";
import type {
  About,
  AlertPrefs,
  AlertPrefsInput,
  ClientId,
  Compare,
  DeveloperPage,
  DevicePlatform,
  Evidence,
  FamilyInvite,
  FamilyInvitePreview,
  FamilyScope,
  Flags,
  Follow,
  FollowType,
  FollowingFeed,
  Methodology,
  Ok,
  ProjectPage,
  RiskSummary,
  SearchQuery,
  SearchResults,
  ShareCard,
  Slug,
  Source,
  SuggestResults,
  Untyped,
  WhoHasMyNumber,
} from "./types";

export type * from "./types";
export { DataError, isDataError, type ErrorCode } from "./errors";
export { dataMode, type DataMode } from "./mode";

type Audience = "anon" | "buyer";

/** Every api.* function behind this module, with who may call it and when it lands. */
export const API_FUNCTIONS = {
  // §3.1 public reads (anon, cacheable)
  risk_summary: { audience: "anon", milestone: "M1" },
  project_page: { audience: "anon", milestone: "M1" },
  search_projects: { audience: "anon", milestone: "M1" },
  suggest: { audience: "anon", milestone: "M1" },
  developer_page: { audience: "anon", milestone: "M1" },
  compare: { audience: "anon", milestone: "M1" },
  evidence: { audience: "anon", milestone: "M1" },
  methodology: { audience: "anon", milestone: "M1" },
  about: { audience: "anon", milestone: "M1" },
  flags: { audience: "anon", milestone: "M0" },
  share_card: { audience: "anon", milestone: "M2" },
  family_invite_preview: { audience: "anon", milestone: "M2" },
  // §3.2 buyer API (user JWT)
  me: { audience: "buyer", milestone: "M2" },
  device_register: { audience: "buyer", milestone: "M2" },
  follow: { audience: "buyer", milestone: "M2" },
  unfollow: { audience: "buyer", milestone: "M2" },
  set_follow_type: { audience: "buyer", milestone: "M2" },
  following_feed: { audience: "buyer", milestone: "M2" },
  mark_following_seen: { audience: "buyer", milestone: "M2" },
  link_whatsapp_follows: { audience: "buyer", milestone: "M2" },
  alert_prefs_get: { audience: "buyer", milestone: "M2" },
  alert_prefs_set: { audience: "buyer", milestone: "M2" },
  saved_search_save: { audience: "buyer", milestone: "M2" },
  saved_search_delete: { audience: "buyer", milestone: "M2" },
  family_circle: { audience: "buyer", milestone: "M2" },
  family_invite_create: { audience: "buyer", milestone: "M2" },
  family_invite_cancel: { audience: "buyer", milestone: "M2" },
  family_member_remove: { audience: "buyer", milestone: "M2" },
  family_member_undo: { audience: "buyer", milestone: "M2" },
  family_join: { audience: "buyer", milestone: "M2" },
  shortlist_note_add: { audience: "buyer", milestone: "M2" },
  who_has_my_number: { audience: "buyer", milestone: "M2" },
  consent_history: { audience: "buyer", milestone: "M2" },
  consent_withdraw: { audience: "buyer", milestone: "M2" },
  relay_renew: { audience: "buyer", milestone: "M2" },
  data_export_request: { audience: "buyer", milestone: "M2" },
  account_delete_request: { audience: "buyer", milestone: "M2" },
  request_project: { audience: "buyer", milestone: "M2" },
} as const satisfies Record<string, { audience: Audience; milestone: "M0" | "M1" | "M2" }>;

export type RpcName = keyof typeof API_FUNCTIONS;

/** RPC arguments: snake case with a `p_` prefix (API_CONTRACTS §1 "Args"). */
export type RpcArgs = Readonly<Record<`p_${string}`, unknown>>;

/** The one seam T16 fills: dispatch `api.<rpc>(args)` to the active adapter. */
async function call<T>(rpc: RpcName, args: RpcArgs = {}): Promise<T> {
  void args;
  throw new DataError(
    "not_implemented",
    rpc,
    `api.${rpc} has a signature but no ${dataMode()} adapter yet: T16 (web data layer) implements it.`,
  );
}

// ---------------------------------------------------------------------------
// §3.1 Public read API (anon)

export function riskSummary(slug: Slug): Promise<RiskSummary> {
  return call("risk_summary", { p_slug: slug });
}

export function projectPage(slug: Slug): Promise<ProjectPage> {
  return call("project_page", { p_slug: slug });
}

export function searchProjects(query: SearchQuery = {}): Promise<SearchResults> {
  return call("search_projects", {
    p_q: query.q ?? null,
    p_filters: query.filters ?? null,
    p_sort: query.sort ?? null,
    p_bbox: query.bbox ?? null,
    p_cursor: query.cursor ?? null,
    p_limit: query.limit ?? null,
  });
}

/** ≤ 8 typo- and Hinglish-tolerant name, RERA and sector matches. */
export function suggest(q: string): Promise<SuggestResults> {
  return call("suggest", { p_q: q });
}

export function developerPage(slug: Slug): Promise<DeveloperPage> {
  return call("developer_page", { p_slug: slug });
}

/** 2–4 phases. */
export function compare(slugs: Slug[]): Promise<Compare> {
  return call("compare", { p_slugs: slugs });
}

/** The evidence drawer (F-06). */
export function evidence(factId: string): Promise<Evidence> {
  return call("evidence", { p_fact_id: factId });
}

export function methodology(): Promise<Methodology> {
  return call("methodology");
}

export function about(): Promise<About> {
  return call("about");
}

export function flags(): Promise<Flags> {
  return call("flags");
}

/** The original card plus "Changed since this card was sent". */
export function shareCard(code: string): Promise<ShareCard> {
  return call("share_card", { p_code: code });
}

/** Powers /j/[code]. Carries no phone number. */
export function familyInvitePreview(code: string): Promise<FamilyInvitePreview> {
  return call("family_invite_preview", { p_code: code });
}

// ---------------------------------------------------------------------------
// §3.2 Buyer API (user session). Mutations carry a client id where the
// contract makes them replayable (follows, alert prefs, notes, saved searches).

export function me(): Promise<Untyped> {
  return call("me");
}

export function deviceRegister(
  token: string,
  platform: DevicePlatform,
  appVersion: string,
): Promise<Untyped> {
  return call("device_register", {
    p_token: token,
    p_platform: platform,
    p_app_version: appVersion,
  });
}

export function follow(
  slug: Slug,
  followType: FollowType,
  source: Source,
  clientId: ClientId,
): Promise<Follow> {
  return call("follow", {
    p_slug: slug,
    p_follow_type: followType,
    p_source: source,
    p_client_id: clientId,
  });
}

export function unfollow(slug: Slug, clientId: ClientId): Promise<Ok> {
  return call("unfollow", { p_slug: slug, p_client_id: clientId });
}

export function setFollowType(
  slug: Slug,
  followType: FollowType,
  clientId: ClientId,
): Promise<Follow> {
  return call("set_follow_type", {
    p_slug: slug,
    p_follow_type: followType,
    p_client_id: clientId,
  });
}

/** Since you last looked (F-93). `since` defaults to the buyer's last look. */
export function followingFeed(since: string | null = null): Promise<FollowingFeed> {
  return call("following_feed", { p_since: since });
}

export function markFollowingSeen(): Promise<Ok> {
  return call("mark_following_seen");
}

/** "Bring them here": merge WhatsApp follows only after the buyer accepts. */
export function linkWhatsappFollows(accept: boolean): Promise<Untyped> {
  return call("link_whatsapp_follows", { p_accept: accept });
}

export function alertPrefsGet(): Promise<AlertPrefs> {
  return call("alert_prefs_get");
}

export function alertPrefsSet(prefs: AlertPrefsInput, clientId: ClientId): Promise<AlertPrefs> {
  return call("alert_prefs_set", { p_prefs: prefs, p_client_id: clientId });
}

export function savedSearchSave(
  name: string,
  query: SearchQuery,
  clientId: ClientId,
): Promise<Untyped> {
  return call("saved_search_save", { p_name: name, p_query: query, p_client_id: clientId });
}

export function savedSearchDelete(id: string): Promise<Ok> {
  return call("saved_search_delete", { p_id: id });
}

export function familyCircle(): Promise<Untyped> {
  return call("family_circle");
}

export function familyInviteCreate(scope: FamilyScope): Promise<FamilyInvite> {
  return call("family_invite_create", { p_scope: scope });
}

export function familyInviteCancel(code: string): Promise<Ok> {
  return call("family_invite_cancel", { p_code: code });
}

export function familyMemberRemove(memberId: string): Promise<Untyped> {
  return call("family_member_remove", { p_member_id: memberId });
}

export function familyMemberUndo(memberId: string): Promise<Untyped> {
  return call("family_member_undo", { p_member_id: memberId });
}

/** The app/web path for a JOIN code (WhatsApp uses "JOIN <code>"). */
export function familyJoin(code: string): Promise<Untyped> {
  return call("family_join", { p_code: code });
}

export function shortlistNoteAdd(slug: Slug, text: string, clientId: ClientId): Promise<Untyped> {
  return call("shortlist_note_add", { p_slug: slug, p_text: text, p_client_id: clientId });
}

export function whoHasMyNumber(): Promise<WhoHasMyNumber> {
  return call("who_has_my_number");
}

export function consentHistory(): Promise<Untyped> {
  return call("consent_history");
}

/** Withdraw a consent by its C- ref; returns the effects lines. */
export function consentWithdraw(ref: string): Promise<Untyped> {
  return call("consent_withdraw", { p_ref: ref });
}

export function relayRenew(relayId: string): Promise<Untyped> {
  return call("relay_renew", { p_relay_id: relayId });
}

export function dataExportRequest(): Promise<Untyped> {
  return call("data_export_request");
}

export function accountDeleteRequest(): Promise<Untyped> {
  return call("account_delete_request");
}

/** Ask for a project to be added; returns an R-MMDD-NN ref. */
export function requestProject(name: string, rera: string | null = null): Promise<Untyped> {
  return call("request_project", { p_name: name, p_rera: rera });
}
