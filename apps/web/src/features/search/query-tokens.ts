// "AI read your search as" tiles (WebSearch.dc.html): the parsed query shown
// as a sentence of removable words. Every word comes from `parsed`
// (SearchResults, the server's own reading of the query), never invented
// here; this file only lays the words out as tiles and, when a reader drops
// one, rebuilds a plain-English query for the next search.
//
// Fixture mode only answers 5 exact queries (packages/fixtures/expected/
// search_projects/_requests.json), so a rebuilt query almost always lands
// outside the preview (SearchExperience then shows the example searches) —
// except dropping every tile, which rebuilds to "" and matches the
// `all-gurugram` fixture. That one live transition is this feature's real,
// working "never a silent widening": a tile always says plainly whether
// removing it changed anything.
import type { BandCode } from "@plinth/contracts";
import { BAND_LABEL } from "./copy";
import { formatCroreLabel } from "./money";
import type { SearchFilters } from "./types";

export type FilterTile = {
  /** Stable key for the tile (also its removal key). */
  key: string;
  label: string;
};

export type QueryTokens = {
  bhk: readonly number[] | null;
  corridors: readonly string[] | null;
  allInMaxInr: number | null;
  bands: readonly BandCode[] | null;
};

export function tokensFromFilters(parsed: SearchFilters): QueryTokens {
  return {
    bhk: parsed.bhk ?? null,
    corridors: parsed.corridors ?? null,
    allInMaxInr: parsed.all_in_max_inr ?? null,
    bands: (parsed.bands as readonly BandCode[] | null | undefined) ?? null,
  };
}

/** A sector slug ("dwarka-expressway") as a corridor name ("Dwarka Expressway"). */
export function corridorName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** The tiles for the sentence row, in reading order. Low and Moderate are always separate (G-36). */
export function tilesFromTokens(tokens: QueryTokens): FilterTile[] {
  const tiles: FilterTile[] = [];
  if (tokens.bhk?.length) tiles.push({ key: "bhk", label: `${tokens.bhk.join("/")} BHK` });
  for (const slug of tokens.corridors ?? []) {
    tiles.push({ key: `corridor:${slug}`, label: corridorName(slug) });
  }
  if (tokens.allInMaxInr != null) {
    tiles.push({ key: "budget", label: `Under ${formatCroreLabel(tokens.allInMaxInr)} all-in` });
  }
  for (const band of tokens.bands ?? []) {
    tiles.push({ key: `band:${band}`, label: BAND_LABEL[band] });
  }
  return tiles;
}

/** `tokens` with one tile's facet removed. */
export function withoutTile(tokens: QueryTokens, key: string): QueryTokens {
  if (key === "bhk") return { ...tokens, bhk: null };
  if (key === "budget") return { ...tokens, allInMaxInr: null };
  if (key.startsWith("corridor:")) {
    const slug = key.slice("corridor:".length);
    const next = (tokens.corridors ?? []).filter((c) => c !== slug);
    return { ...tokens, corridors: next.length ? next : null };
  }
  if (key.startsWith("band:")) {
    const band = key.slice("band:".length) as BandCode;
    const next = (tokens.bands ?? []).filter((b) => b !== band);
    return { ...tokens, bands: next.length ? next : null };
  }
  return tokens;
}

/** A plain-English query a reader could have typed, rebuilt from the active tokens. */
export function queryFromTokens(tokens: QueryTokens): string {
  const parts: string[] = [];
  if (tokens.bhk?.length) parts.push(`${tokens.bhk.join("/")} bhk`);
  for (const slug of tokens.corridors ?? []) parts.push(corridorName(slug).toLowerCase());
  if (tokens.allInMaxInr != null) {
    parts.push(`under ${(tokens.allInMaxInr / 1e7).toString()} cr`);
  }
  const bands = tokens.bands ?? [];
  if (bands.includes("low")) parts.push("low risk");
  else if (bands.length) parts.push(`${bands[0]} risk`);
  return parts.join(" ").trim();
}
