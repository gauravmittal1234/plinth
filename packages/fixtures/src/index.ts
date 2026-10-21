// @plinth/fixtures: DESIGN.md §5b as data (owner: T03, then T03b).
// Environment-agnostic constants and keys. Node-only file loaders live in "@plinth/fixtures/node".

/** The frozen fixture clock: 18 Oct 2026, 12:00 IST. */
export const FIXED_NOW = "2026-10-18T12:00:00+05:30";
/** Data cutoff of every fixture score and record. */
export const DATA_AS_OF = "2026-10-14";
/** Scoring model of the fixture world. */
export const MODEL_VERSION = "v1.2";

/** The 8 seeded phases (page, score and follow keys). */
export const PHASE_SLUGS = [
  "aurelia-heights-phase-2",
  "kestrel-park",
  "sapphire-grove-phase-1",
  "coral-towers",
  "laurel-residency",
  "juniper-enclave",
  "heron-point-phase-2",
  "cedar-walk-phase-2",
] as const;
export type PhaseSlug = (typeof PHASE_SLUGS)[number];

/** The 6 developer groups with a page. */
export const GROUP_SLUGS = [
  "northfield-estates",
  "orbis-land",
  "meridian-habitat",
  "vantage-buildcon",
  "elmstone-developers",
  "halcyon-homes",
] as const;

/** Suffix of the design-state variants (e.g. `aurelia-heights-phase-2--facts-only`). */
export const FACTS_ONLY_SUFFIX = "--facts-only";

/** Read functions with T03 expected outputs: `expected/<fn>/<key>.json` (+ `_requests.json`). */
export const EXPECTED_FUNCTIONS = [
  "risk_summary",
  "project_page",
  "developer_page",
  "search_projects",
  "compare",
  "evidence",
  "methodology",
  "about",
  "flags",
  // T03b: M2–M3 reads. `alert_prefs` answers api.alert_prefs_get and `payee_check` answers
  // api.before_you_pay_check (each key's `rpc` in _requests.json).
  "following_feed",
  "who_has_my_number",
  "family_invite_preview",
  "alert_prefs",
  "share_card",
  "doc_check",
  "cost_breakdown",
  "afford_the_wait",
  "payee_check",
  // T45a: buyer reads.
  "family_circle",
  "saved_searches",
] as const;
export type ExpectedFunction = (typeof EXPECTED_FUNCTIONS)[number];

/** M2 buyer writes with fixture answers (T03b): what each RPC returns in the fixture world. */
export const WRITE_FUNCTIONS = [
  "follow",
  "unfollow",
  "mark_following_seen",
  "alert_prefs_set",
  "family_invite_create",
  "family_invite_cancel",
  "family_member_remove",
  "family_member_undo",
  "shortlist_note_add",
  "consent_withdraw",
  // T45a
  "set_follow_type",
  "request_project",
] as const;
export type WriteFunction = (typeof WRITE_FUNCTIONS)[number];

/** The fixture buyer: Rohan (DESIGN §5b). His user id is canonical/people.json `people[key=rohan].id`. */
export const FIXTURE_BUYER = "rohan";

/** Recorded WhatsApp webhook bodies: `recorded/wa/<name>.json`, described in `recorded/wa/_index.json`. */
export const RECORDED_WA = [
  "text-aurelia",
  "text-rera-number",
  "text-join-ah2-7kq",
  "text-stop",
  "button-stop-weekly",
  "button-see-changes",
  "interactive-why-this-band",
  "interactive-follow-project",
  "image-old-card",
  "image-flyer",
  "audio-voice-note",
  "document-demand-letter",
  "status-delivered",
] as const;
export type RecordedWa = (typeof RECORDED_WA)[number];

/** Golden vector files: `vectors/<name>.json`. */
export const VECTOR_NAMES = [
  "afford_the_wait",
  "cap",
  "cost",
  "formatting",
  "late12",
  "time_used",
] as const;

/** Package-relative path of an expected payload. */
export function expectedPath(fn: string, key: string): string {
  return `expected/${fn}/${key}.json`;
}

/** Fixture key for `api.compare(p_slugs)`: the slugs in request order, joined by "_". */
export function compareKey(slugs: readonly string[]): string {
  return slugs.join("_");
}
