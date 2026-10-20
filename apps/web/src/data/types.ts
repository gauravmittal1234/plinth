// Response and argument types for src/data (API_CONTRACTS §2–§4).
//
// Placeholders from T05: the generated contract types (T02, `@plinth/contracts`)
// are not merged yet. Each response is typed as its envelope (`schema`
// discriminator) plus unknown fields. T16 swaps every alias below for the
// generated type of the same name; the function signatures in index.ts stay.

/** A response envelope: `"schema": "plinth.<type>/<major>"` plus fields (API_CONTRACTS §1). */
export type Envelope<S extends string> = { readonly schema: S } & {
  readonly [field: string]: unknown;
};

/** A response with no schema in API_CONTRACTS yet. T02/T16 give it one. */
export type Untyped = { readonly [field: string]: unknown };

// §3.1 public reads (M0–M2)
export type RiskSummary = Envelope<"plinth.risk_summary/1">;
export type ProjectPage = Envelope<"plinth.project_page/1">;
export type SearchResults = Envelope<"plinth.search_results/1">;
export type SuggestResults = Envelope<"plinth.suggest/1">;
export type DeveloperPage = Envelope<"plinth.developer_page/1">;
export type Compare = Envelope<"plinth.compare/1">;
export type Evidence = Envelope<"plinth.evidence/1">;
export type Methodology = Envelope<"plinth.methodology/1">;
export type About = Envelope<"plinth.about/1">;
/** `{ key: boolean }` for the caller's audience. */
export type Flags = Readonly<Record<string, boolean>>;
export type ShareCard = Envelope<"plinth.share_card/1">;
export type FamilyInvitePreview = Envelope<"plinth.family_invite_preview/1">;

// §3.2 buyer API (M2)
export type Follow = Envelope<"plinth.follow/1">;
export type FollowingFeed = Envelope<"plinth.following_feed/1">;
export type AlertPrefs = Envelope<"plinth.alert_prefs/1">;
export type WhoHasMyNumber = Envelope<"plinth.who_has_my_number/1">;
export type FamilyInvite = Envelope<"plinth.family_invite/1">;
export type Ok = { readonly ok: true };

// Arguments
export type Slug = string;
export type BandCode = "low" | "moderate" | "elevated" | "high" | "severe";
export type FollowType = "watching" | "booked";
export type Source = "web" | "app" | "whatsapp";
/** Idempotency key for mutations (API_CONTRACTS §1): replays return the first result. */
export type ClientId = string;

/** `p_filters` of api.search_projects (§4.3). */
export type SearchFilters = {
  bhk?: number[];
  all_in_max_inr?: number;
  corridors?: string[];
  bands?: BandCode[];
  possession_by?: string | null;
};

export type SearchSort = "lowest_risk" | (string & {});

/** [west, south, east, north] in degrees. */
export type BBox = [number, number, number, number];

export type SearchQuery = {
  q?: string;
  filters?: SearchFilters;
  sort?: SearchSort;
  bbox?: BBox | null;
  cursor?: string | null;
  /** ≤ 50 (API_CONTRACTS §1 "Pagination"). */
  limit?: number;
};

/** `p_prefs` of api.alert_prefs_set (§4.9). */
export type AlertPrefsInput = {
  push?: Readonly<Record<string, string>>;
  whatsapp?: Readonly<Record<string, string>>;
  quiet_hours?: { from: string; to: string };
};

/** `p_scope` of api.family_invite_create (§4.11). */
export type FamilyScope = { slugs: Slug[] };

export type DevicePlatform = "android" | "ios" | "web";
