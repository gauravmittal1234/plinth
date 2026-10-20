"use server";

// Server Actions for the interactive board (OWNERSHIP.md keeps this inside
// src/features/compare; src/data is server-only and apps/web/app/api/** isn't
// ours). Add and remove both end up here: the board never calls src/data
// itself, so every read goes through `loadCompare`'s fixture_missing handling.
import { suggest, type Slug } from "@/src/data";
import { loadCompare, type CompareLoad } from "../page/load-compare";

export async function refreshCompare(slugs: readonly Slug[]): Promise<CompareLoad> {
  return loadCompare(slugs);
}

export type AddCandidate = {
  slug: Slug;
  label: string;
  detailLine: string | null;
};

/** Phase matches only (a developer or locality has no single compare column); already-added slugs are dropped. */
export async function searchCandidates(
  query: string,
  excludeSlugs: readonly Slug[],
): Promise<readonly AddCandidate[]> {
  const q = query.trim();
  if (!q) return [];
  const results = await suggest(q);
  const exclude = new Set(excludeSlugs);
  return results.items
    .filter((item) => item.kind === "phase" && !exclude.has(item.slug))
    .map((item) => ({ slug: item.slug, label: item.label, detailLine: item.detail_line }));
}
