// WebProjectStates preview (T20c): `/gurugram/projects/<slug>?state=<state>`
// is rewritten here by next.config.ts, so the canonical page beside `~preview`
// never reads `searchParams` and stays static. Internal: noindex, never
// linked, not in the sitemap. `state` is one of PROJECT_PREVIEW_STATES
// (src/features/project/page/preview.ts); `loadProject` maps it to the
// design-state fixture, or to the slug's own payload when it has none.
// An unknown slug 404s through `loadProject`'s `notFound()`, as on the
// canonical page.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadEvidenceMap } from "@/src/features/project/page/evidence";
import { loadProject } from "@/src/features/project/page/load-project";
import {
  isProjectPreviewState,
  projectMetadata,
  statePreviewParams,
} from "@/src/features/project/page/preview";
import { ProjectPageView } from "@/src/features/project/page/project-page";

export function generateStaticParams() {
  return statePreviewParams();
}

async function load(params: Promise<{ slug: string; state: string }>) {
  const { slug, state } = await params;
  if (!isProjectPreviewState(state)) notFound();
  return loadProject(slug, state);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; state: string }>;
}): Promise<Metadata> {
  return projectMetadata(await load(params), { preview: true });
}

export default async function Page(
  props: PageProps<"/gurugram/projects/[slug]/~preview/state/[state]">,
) {
  const data = await load(props.params);
  const evidence = await loadEvidenceMap(data.page);
  return <ProjectPageView data={data} evidence={evidence} />;
}
