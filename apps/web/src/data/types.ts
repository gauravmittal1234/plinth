// Response and argument types for src/data: the generated contract types
// (`@plinth/contracts`, T02; API_CONTRACTS §2–§4). Type-only imports, so the
// ajv validators in the same package never reach a bundle from here.
import type {
  AlertPrefsMap,
  Bbox,
  Chip as ContractChip,
  FamilyInviteScope,
  FollowSource,
  SearchFilters as ContractSearchFilters,
} from "@plinth/contracts";

export type {
  About,
  AlertPrefs,
  BandCode,
  Chip,
  Compare,
  ConsentWithdrawal,
  DeveloperPage,
  Evidence,
  FamilyInvite,
  FamilyInvitePreview,
  Flags,
  Follow,
  FollowingFeed,
  FollowType,
  Methodology,
  Ok,
  ProjectPage,
  RiskSummary,
  SearchResults,
  ShareCard,
  Slug,
  SuggestResults,
  WhoHasMyNumber,
} from "@plinth/contracts";

/** A response with no contract schema yet (API_CONTRACTS §3.2 rows without a §4 shape). */
export type Untyped = { readonly [field: string]: unknown };

/**
 * plinth.digest_card/1 (api.digest_card; the lead's M2 gate gap 5). Its contract schema is
 * pending (openapi x-plinth-shape: pending): this is the shape the SQL returns, local until
 * @plinth/contracts exports a DigestCard.
 */
export type DigestCard = {
  readonly schema: "plinth.digest_card/1";
  /** Server copy: "This week in your projects · <week> · <n> changes on record". */
  readonly heading_line: string;
  readonly projects: readonly { slug: string; name: string; chip: ContractChip }[];
};

// Arguments

/** Where a follow came from (`p_source`). */
export type Source = FollowSource;
/** Idempotency key for mutations (API_CONTRACTS §1): replays return the first result. */
export type ClientId = string;

/** `p_filters` of api.search_projects (API_CONTRACTS §4.3). */
export type SearchFilters = ContractSearchFilters;

/** `p_sort`: lowest_risk is the server default; T13 publishes the others. */
export type SearchSort = "lowest_risk" | (string & {});

/** [west, south, east, north] in degrees. */
export type BBox = Bbox;

export type SearchQuery = {
  q?: string | null;
  filters?: SearchFilters | null;
  sort?: SearchSort | null;
  bbox?: BBox | null;
  cursor?: string | null;
  /** ≤ 50 (API_CONTRACTS §1 "Pagination"). Omitted: the server's page size. */
  limit?: number;
};

/** `p_prefs` of api.alert_prefs_set (API_CONTRACTS §4.9). */
export type AlertPrefsInput = AlertPrefsMap;

/** `p_scope` of api.family_invite_create (API_CONTRACTS §4.11). */
export type FamilyScope = FamilyInviteScope;

export type DevicePlatform = "android" | "ios" | "web";

/**
 * A design-state variant of a fixture key (`_requests.json` "state", e.g.
 * `aurelia-heights-phase-2--facts-only`). Fixture mode only: it powers the
 * `?state=` previews (WORK_BREAKDOWN §2). The supabase adapter ignores it,
 * because production state always comes from `RiskSummary.display`.
 */
export type FixtureState = "facts_only" | (string & {});

/** Options of the reads that have design-state fixtures. */
export type ReadOptions = { fixtureState?: FixtureState | null };
