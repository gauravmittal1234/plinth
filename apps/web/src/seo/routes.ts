// Public route enumeration for sitemap.ts: every slug comes from the data
// layer (@plinth/fixtures), never a hand-kept list (AGENTS.md "Facts" rule;
// T28 brief "don't hard-code lists the data already has").
//
// - Phase and developer slugs are @plinth/fixtures' own canonical lists: the
//   8 phases and 6 developer groups that have a public page (DESIGN §5b).
// - Compare pairs are derived from the catalogue's `corridor` field (the same
//   field that separates a phase with its own page from a completed one
//   without), paired within a corridor: real alternatives a buyer would
//   actually compare, not every combination.
import "server-only";
// A static import, not @plinth/fixtures/node's loadCanonical(): that loader
// reads the file at a dynamic path (readFileSync(join(FIXTURES_DIR, rel))),
// which makes Turbopack trace (and ship) the whole monorepo for this route
// (confirmed by `next build`'s own warning on this exact import).
import catalogueJson from "@plinth/fixtures/canonical/catalogue.json";
import { GROUP_SLUGS, PHASE_SLUGS, type PhaseSlug } from "@plinth/fixtures";

export type ComparePair = readonly [PhaseSlug, PhaseSlug];

/** One row of packages/fixtures/canonical/catalogue.json `phases` (fields this module reads only). */
type CataloguePhase = { slug: string; corridor: string | null };
type Catalogue = { phases: CataloguePhase[] };

const catalogue = catalogueJson as unknown as Catalogue;

/** The phases with their own `/gurugram/projects/[slug]` page. */
export function publicProjectSlugs(): readonly PhaseSlug[] {
  return PHASE_SLUGS;
}

/** The developer groups with their own `/gurugram/developers/[slug]` page. */
export function publicDeveloperSlugs(): readonly string[] {
  return GROUP_SLUGS;
}

/**
 * `[a, b]` pairs (a < b) of public phases that share a corridor: the
 * `/compare/[a]-vs-[b]` SEO route (WORK_BREAKDOWN §2.1 WebCompare).
 */
export function comparePairs(): readonly ComparePair[] {
  const corridorOf = new Map(catalogue.phases.map((p) => [p.slug, p.corridor]));
  const byCorridor = new Map<string, PhaseSlug[]>();
  for (const slug of PHASE_SLUGS) {
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
