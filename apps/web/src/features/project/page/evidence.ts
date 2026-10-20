// Prefetches `api.evidence` for every fact id the page's reasons and records
// cite, server-side, so the one evidence drawer (evidence-context.tsx) never
// needs a client-side data call. `api.evidence` is itself a cached read
// (src/data/registry.ts), so this adds no extra network cost beyond the first
// render of each fact. Fixture mode only has evidence for a handful of facts
// today (packages/fixtures/expected/evidence); a fact without one is simply
// left out of the map, and its chip falls back to a plain link.
import "server-only";
import type { Evidence, ProjectPage } from "@plinth/contracts";
import { evidence, isDataError } from "@/src/data";

/** The fact ids behind a project's reasons and its records list, deduplicated. */
export function factIdsOf(page: ProjectPage): string[] {
  const ids = new Set<string>();
  for (const reason of page.risk.reasons) {
    for (const source of reason.sources) for (const id of source.fact_ids) ids.add(id);
  }
  for (const row of page.records) ids.add(row.fact_id);
  return [...ids];
}

export async function loadEvidenceMap(
  page: ProjectPage,
): Promise<Readonly<Record<string, Evidence>>> {
  const ids = factIdsOf(page);
  const slug = page.risk.phase.slug;
  const settled = await Promise.all(
    ids.map(async (id) => {
      try {
        return [id, await evidence(id, slug)] as const;
      } catch (e) {
        if (isDataError(e, "not_found") || isDataError(e, "fixture_missing")) return null;
        throw e;
      }
    }),
  );
  return Object.fromEntries(settled.filter((x) => x !== null));
}
