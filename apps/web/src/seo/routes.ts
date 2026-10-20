// Public route enumeration for sitemap.ts: every slug comes from the data
// layer (@/src/data), never a hand-kept list (AGENTS.md "Facts" rule; T28
// brief "don't hard-code lists the data already has") and never a direct
// @plinth/fixtures import (src/data/index.ts's own header: "Pages import
// only from here; nothing else talks to Supabase or reads fixture files" --
// a sitemap crawls the live site, so it reads the same door every page does).
//
// - Phase and developer slugs are the data layer's own public lists: the
//   8 phases and 6 developer groups that have a public page (DESIGN §5b).
// - Compare pairs are derived from each phase's `corridor` (the same field
//   that separates a phase with its own page from a completed one without),
//   paired within a corridor: real alternatives a buyer would actually
//   compare, not every combination.
import "server-only";
import {
  publicDeveloperSlugs as dataPublicDeveloperSlugs,
  publicProjectCorridors,
  publicProjectSlugs as dataPublicProjectSlugs,
  type PhaseSlug,
} from "@/src/data";

export type ComparePair = readonly [PhaseSlug, PhaseSlug];

/** The phases with their own `/gurugram/projects/[slug]` page. */
export function publicProjectSlugs(): readonly PhaseSlug[] {
  return dataPublicProjectSlugs();
}

/** The developer groups with their own `/gurugram/developers/[slug]` page. */
export function publicDeveloperSlugs(): readonly string[] {
  return dataPublicDeveloperSlugs();
}

/**
 * `[a, b]` pairs (a < b) of public phases that share a corridor: the
 * `/compare/[a]-vs-[b]` SEO route (WORK_BREAKDOWN §2.1 WebCompare).
 */
export function comparePairs(): readonly ComparePair[] {
  const corridorOf = publicProjectCorridors();
  const byCorridor = new Map<string, PhaseSlug[]>();
  for (const slug of dataPublicProjectSlugs()) {
    const corridor = corridorOf.get(slug);
    if (!corridor) continue;
    const group = byCorridor.get(corridor) ?? [];
    group.push(slug);
    byCorridor.set(corridor, group);
  }
  const pairs: ComparePair[] = [];
  for (const group of byCorridor.values()) {
    const sorted = [...group].sort();
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        pairs.push([sorted[i]!, sorted[j]!]);
      }
    }
  }
  return pairs;
}

/** The `[a]-vs-[b]` path segment of a compare pair. */
export function comparePairSlug([a, b]: ComparePair): string {
  return `${a}-vs-${b}`;
}
