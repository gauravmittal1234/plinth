// Shared types for the search feature (T22). Everything a page reads comes
// from `@/src/data` (api.search_projects); this file only adds the narrow
// typing `@plinth/contracts` doesn't carry yet.
//
// The `ZeroResults` schema (packages/contracts/schemas/search_results.schema.json)
// is `additionalProperties: true` on purpose, so fixture payloads can carry a
// `kind`, `action` and `detail_line` the generated TS type doesn't declare yet
// (INTEGRATION_NOTES: schemas are widened to describe what the fixtures
// already contain). `ZeroResultsPayload` reads those fields without touching
// the generated contract (owned by T02).
import type { HiddenProject, ProjectCard, SearchFilters, ZeroResults } from "@plinth/contracts";

export type { HiddenProject, ProjectCard, SearchFilters };

/** The one-tap fix on a `no_match` zero-results state (WebSearch.dc.html, G-39). */
export type ZeroResultsDropAction = {
  kind: "drop_filter";
  label: string;
  /** The `parsed` key the action removes ("bands", "bhk", …). */
  drop: string;
  /** Slugs the action brings back into view. */
  brings_back?: readonly string[];
};

export type ZeroResultsSimpleAction = {
  kind: "request_project" | "waitlist";
  label: string;
};

export type ZeroResultsAction = ZeroResultsDropAction | ZeroResultsSimpleAction;

export type ZeroResultsPayload = ZeroResults & {
  /** "no_match" (G-39) · "unknown_project" (G-30) · "outside_coverage" (G-30). */
  kind?: "no_match" | "unknown_project" | "outside_coverage" | (string & {});
  action?: ZeroResultsAction;
  detail_line?: string;
};

export function zeroResultsPayload(zr: ZeroResults | null | undefined): ZeroResultsPayload | null {
  return zr ?? null;
}

/** A card keeps its own position so the list and the map stay in step. */
export type SearchCard = ProjectCard;
