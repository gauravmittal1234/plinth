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
] as const;
export type ExpectedFunction = (typeof EXPECTED_FUNCTIONS)[number];

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
