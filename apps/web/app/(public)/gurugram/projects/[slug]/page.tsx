// WebProject (T20a; WORK_BREAKDOWN §4 T20a, OWNERSHIP.md). The 8 seeded
// phases are prerendered; any other slug renders on request and 404s through
// `loadProject`'s `notFound()` when the fixtures (or, in time, the backend)
// have no such phase.
//
// This page never reads `searchParams`, so it stays fully static. The fixture
// previews keep their public URLs through next.config.ts rewrites to the
// internal routes beside this file (src/features/project/page/preview.ts):
// `?state=<state>` (WebProjectStates, T20c) → `~preview/state/[state]`, and
// `?view=simple` (T20b's SimpleView; the header toggle is `OnThisPageRail`'s
// "Simple view" link) → `~preview/simple`. Both are noindex.
import { PHASE_SLUGS } from "@plinth/fixtures";
import type { Metadata } from "next";
import { loadEvidenceMap } from "@/src/features/project/page/evidence";
import { loadProject } from "@/src/features/project/page/load-project";
import { projectMetadata } from "@/src/features/project/page/preview";
import { ProjectPageView } from "@/src/features/project/page/project-page";
import { breadcrumbListJsonLd, residenceJsonLd } from "@/src/seo/json-ld";

export function generateStaticParams() {
  return PHASE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return projectMetadata(await loadProject(slug));
}

export default async function Page(props: PageProps<"/gurugram/projects/[slug]">) {
  const { slug } = await props.params;
  const data = await loadProject(slug);
  const evidence = await loadEvidenceMap(data.page);
  const { phase } = data.page.risk;
  const path = `/gurugram/projects/${phase.slug}`;
  const residence = residenceJsonLd(phase, path);
  const breadcrumb = breadcrumbListJsonLd([
    { name: "Home", path: "/" },
    { name: phase.name, path },
  ]);
  return (
    <>
      {/* Server-rendered only: no client JS (T28 brief, M1 polish). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(residence) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <ProjectPageView data={data} evidence={evidence} />
    </>
  );
}
