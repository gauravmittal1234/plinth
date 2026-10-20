// The web's data layer: one typed function per api.* function the web calls in
// M1–M2 (API_CONTRACTS §3.1 public reads, §3.2 buyer API). Pages import only
// from here; nothing else talks to Supabase or reads fixture files.
//
// Every function maps its arguments to the RPC's `p_` args and hands them to
// `call`, which picks the adapter for PLINTH_DATA (mode.ts):
//   fixtures  → packages/fixtures/expected/<fn>/<key>.json, writes held in memory
//   supabase  → supabase.schema("api").rpc(<fn>, args), cookie sessions via @supabase/ssr
//
// - Public reads are cached with ISR tags (cache.ts, tags.ts) and revalidated
//   by POST /api/revalidate. Buyer calls are never cached and always render at
//   request time, in both modes, so a page that builds in fixture mode also
//   builds against Supabase.
// - Failures reject with a DataError whose `code` is the contract code
//   (`isDataError(e, "not_found")` → notFound()).
// - In development and tests, arguments and payloads are checked against the
//   contract schemas (validate.ts).
// Owner: T16 (OWNERSHIP.md).
import "server-only";
import { connection } from "next/server";
// A static import, not @plinth/fixtures/node's loadCanonical(): that loader
// reads the file at a dynamic path, which makes Turbopack trace (and ship)
// the whole monorepo for every route that imports this file (src/seo/routes.ts's
// own comment on the same import, before it moved here).
import catalogueJson from "@plinth/fixtures/canonical/catalogue.json";
import { DATA_AS_OF, GROUP_SLUGS, PHASE_SLUGS, type PhaseSlug } from "@plinth/fixtures";
import { cachedRead } from "./cache";
import { DataError } from "./errors";
import { invoke } from "./invoke";
import { dataMode } from "./mode";
import { API_FUNCTIONS, type RpcArgs, type RpcName } from "./registry";
import type {
  About,
  AlertPrefs,
  AlertPrefsInput,
  ClientId,
  Compare,
  ConsentWithdrawal,
  DeveloperPage,
  DevicePlatform,
  Evidence,
  FamilyInvite,
  FamilyInvitePreview,
  FamilyScope,
  Flags,
  Follow,
  FollowingFeed,
  FollowType,
  Methodology,
  Ok,
  ProjectPage,
  ReadOptions,
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
/** Re-exported so src/seo/** never imports @plinth/fixtures directly (this file's one door). */
export type { PhaseSlug } from "@plinth/fixtures";
export { DataError, ERROR_CODES, isDataError, type ApiErrorCode, type ErrorCode } from "./errors";
export { dataMode, type DataMode } from "./mode";
export { API_FUNCTIONS, type RpcArgs, type RpcName } from "./registry";
export {
  developerTag,
  isCacheTag,
  phaseTag,
  tagsForCall,
  tagsForPayload,
  type CacheTag,
} from "./tags";

/** One row of packages/fixtures/canonical/catalogue.json `phases` (fields this module reads only). */
type CataloguePhase = { slug: string; corridor: string | null };
type Catalogue = { phases: CataloguePhase[] };
const catalogue = catalogueJson as unknown as Catalogue;

/** Drops undefined args, so a function's SQL default applies (JSON has no undefined). */
function compact(args: RpcArgs): RpcArgs {
  return Object.fromEntries(Object.entries(args).filter(([, v]) => v !== undefined)) as RpcArgs;
}

/** The one seam: dispatch `api.<rpc>(args)` to the active adapter. */
async function call<T>(rpc: RpcName, args: RpcArgs = {}, options: ReadOptions = {}): Promise<T> {
  const mode = dataMode();
  const clean = compact(args);
  const fixtureState = mode === "fixtures" ? (options.fixtureState ?? null) : null;
  const fn = API_FUNCTIONS[rpc];

  if (fn.cache) {
    const settled = await cachedRead(mode, rpc, clean, fixtureState);
    if (settled.ok) return settled.value as T;
    throw DataError.fromShape(settled.error);
  }
  // Uncached reads depend on the request (the buyer's session, a live invite):
  // never part of a prerendered shell.
  if (fn.kind === "read") await connection();
  return (await invoke(mode, rpc, clean, { fixtureState })) as T;
}

// ---------------------------------------------------------------------------
// §3.1 Public read API (anon)

/** The one risk object (API_CONTRACTS §2). `fixtureState` picks a design state in fixture mode. */
export function riskSummary(slug: Slug, options?: ReadOptions): Promise<RiskSummary> {
  return call("risk_summary", { p_slug: slug }, options);
}

export function projectPage(slug: Slug, options?: ReadOptions): Promise<ProjectPage> {
  return call("project_page", { p_slug: slug }, options);
}

/**
 * Fields left out are not sent, so the server's defaults apply (sort
 * lowest_risk, its page size): every SearchRequest field is optional.
 */
export function searchProjects(query: SearchQuery = {}): Promise<SearchResults> {
  return call("search_projects", {
    p_q: query.q,
    p_filters: query.filters,
    p_sort: query.sort,
    p_bbox: query.bbox,
    p_cursor: query.cursor,
    p_limit: query.limit,
  });
}

/** ≤ 8 typo- and Hinglish-tolerant name, RERA and sector matches. */
export function suggest(q: string): Promise<SuggestResults> {
  return call("suggest", { p_q: q });
}

export function developerPage(slug: Slug, options?: ReadOptions): Promise<DeveloperPage> {
  return call("developer_page", { p_slug: slug }, options);
}

/** 2–4 phases, in column order. */
export function compare(slugs: Slug[]): Promise<Compare> {
  return call("compare", { p_slugs: slugs });
}

/**
 * The evidence drawer (F-06). `slug`, the page it was opened from (the
 * `api.evidence(p_fact_id, p_slug)` overload, T13): `used_in` then names
 * that page's own reasons, not whichever page the fact was first authored
 * for.
 */
export function evidence(factId: string, slug?: Slug): Promise<Evidence> {
  return call("evidence", { p_fact_id: factId, p_slug: slug });
}

export function methodology(): Promise<Methodology> {
  return call("methodology");
}

export function about(): Promise<About> {
  return call("about");
}

/** `{ schema, flags: { key: boolean } }` for anonymous visitors; an absent key reads as false. */
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
// Site enumeration (T28 SEO: sitemap.ts, src/seo/routes.ts). Every URL a
// crawler can reach comes from here, never a list `src/seo/**` keeps itself
// (this file's own header: "Pages import only from here; nothing else talks
// to Supabase or reads fixture files"). No api.* RPC lists every public
// phase/developer today, so fixture mode's full catalogue is also today's
// live list; a later task gives this its own api.* call once one exists.

/** Every phase with its own `/gurugram/projects/[slug]` page (DESIGN §5b). */
export function publicProjectSlugs(): readonly PhaseSlug[] {
  return PHASE_SLUGS;
}

/** Every developer group with its own `/gurugram/developers/[slug]` page. */
export function publicDeveloperSlugs(): readonly string[] {
  return GROUP_SLUGS;
}

/** Each public phase's corridor (null when it has none), for pairing nearby projects. */
export function publicProjectCorridors(): ReadonlyMap<PhaseSlug, string | null> {
  return new Map(
    PHASE_SLUGS.map((slug) => [slug, catalogue.phases.find((p) => p.slug === slug)?.corridor ?? null]),
  );
}

/** The sitemap's `lastModified`: the published data's own cutoff. */
export function siteDataAsOf(): string {
  return DATA_AS_OF;
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
export function consentWithdraw(ref: string): Promise<ConsentWithdrawal> {
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
