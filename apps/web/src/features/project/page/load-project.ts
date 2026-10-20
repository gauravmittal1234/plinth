// The one place WebProject reads data (INTEGRATION_NOTES: "import data only
// from @/src/data"). Called directly from the route's Page function, before
// any Suspense boundary, so `notFound()` can interrupt the response rather
// than surface inside a streamed fallback.
import "server-only";
import { notFound } from "next/navigation";
import { isDataError, methodology, projectPage, type Methodology, type ProjectPage } from "@/src/data";

export type ProjectData = {
  page: ProjectPage;
  bands: Methodology["bands"];
};

/**
 * `project_page(slug)` plus `Methodology.bands` (band names the kit's
 * BandScale/Riskometer need; T14/T15 handoff). A `not_found` DataError (an
 * unknown or unpublished slug) becomes Next's 404 page; anything else
 * propagates to the nearest error boundary.
 */
export async function loadProject(slug: string): Promise<ProjectData> {
  try {
    const [page, meth] = await Promise.all([projectPage(slug), methodology()]);
    return { page, bands: meth.bands };
  } catch (e) {
    if (isDataError(e, "not_found")) notFound();
    throw e;
  }
}
