// The one place WebProject reads data (INTEGRATION_NOTES: "import data only
// from @/src/data"). Called from the route's `generateMetadata` and Page
// function, before any Suspense boundary, so `notFound()` can interrupt the
// response rather than surface inside a streamed fallback. The `~preview`
// routes (preview.ts) call it the same way, with a `state`.
import "server-only";
import { notFound } from "next/navigation";
import { isDataError, methodology, projectPage, type Methodology, type ProjectPage } from "@/src/data";

export type ProjectData = {
  page: ProjectPage;
  bands: Methodology["bands"];
};

/**
 * The fixture states that remap to a *different* payload for the same slug
 * (T16's fixtureState option; packages/fixtures's `_requests.json` per
 * folder lists which states exist). Only `facts_only` does today, for
 * Aurelia's `aurelia-heights-phase-2--facts-only` fixture. The six other
 * WebProjectStates names (severe, stalled, limited_history, not_scored,
 * stale, rescoring; src/shell/screens.ts's WebProjectStates variant) are
 * each already the *default* fixture of their own phase slug (Laurel,
 * Juniper, Heron Point, Coral Towers, Sapphire Grove), so `?state=` there
 * previews nothing new — it is a no-op, not an unmatched fixture key that
 * `fixtureCall` would otherwise throw on (the `not_found`/`fixture_missing`
 * guard below only knows what to do with the slug it already has).
 */
const FIXTURE_STATE_REMAPS = new Set(["facts_only"]);

/**
 * `project_page(slug)` plus `Methodology.bands` (band names the kit's
 * BandScale/Riskometer need; T14/T15 handoff). `state` previews a design
 * state the fixture world carries alongside the default payload, the same
 * way WebDeveloper's `loadDeveloper` does
 * (src/features/developer/page/load-developer.ts). A `not_found` DataError
 * (an unknown or unpublished slug) becomes Next's 404 page; anything else
 * propagates to the nearest error boundary.
 */
export async function loadProject(slug: string, state: string | null = null): Promise<ProjectData> {
  const fixtureState = state && FIXTURE_STATE_REMAPS.has(state) ? state : null;
  try {
    const [page, meth] = await Promise.all([
      projectPage(slug, { fixtureState }),
      methodology(),
    ]);
    return { page, bands: meth.bands };
  } catch (e) {
    if (isDataError(e, "not_found")) notFound();
    throw e;
  }
}
