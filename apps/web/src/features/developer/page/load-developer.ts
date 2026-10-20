// The one place WebDeveloper reads data (follows WebProject's
// load-project.ts: "import data only from @/src/data"). A `not_found`
// DataError (an unknown or unpublished slug) becomes Next's 404 page;
// anything else propagates to the nearest error boundary.
import "server-only";
import { notFound } from "next/navigation";
import { developerPage, isDataError, type DeveloperPage } from "@/src/data";

export type DeveloperData = { page: DeveloperPage };

/**
 * `developer_page(slug)`. `state` previews a design state the fixture world
 * carries alongside the default payload (e.g. `"facts_only"` for Northfield's
 * `northfield-estates--facts-only` fixture; T16's fixture adapter already
 * understands a `fixtureState` option, INTEGRATION_NOTES), the same way
 * WebProjectStates is planned to read `?state=` (src/features/project/states).
 */
export async function loadDeveloper(slug: string, state: string | null): Promise<DeveloperData> {
  try {
    const page = await developerPage(slug, { fixtureState: state });
    return { page };
  } catch (e) {
    if (isDataError(e, "not_found")) notFound();
    throw e;
  }
}
