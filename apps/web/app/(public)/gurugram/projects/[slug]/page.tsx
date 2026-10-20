// WebProject (T20a; WORK_BREAKDOWN §4 T20a, OWNERSHIP.md). The 8 seeded
// phases are prerendered; any other slug renders on request and 404s through
// `loadProject`'s `notFound()` when the fixtures (or, in time, the backend)
// have no such phase.
//
// `?state=` previews a design state in fixture mode (e.g. `facts_only`, the
// WebProjectStates fixture), the same mechanism WebDeveloper uses
// (features/developer, T23). `?view=simple` renders T20b's SimpleView
// instead of the full guided story (fix-project2.md §1 G-27; the header
// toggle is `OnThisPageRail`'s "Simple view" link). Reading `searchParams`
// is a Next "Runtime API" under Cache Components, so only the subtree that
// needs it is dynamic, behind its own `<Suspense>` — the slug-only parts
// above it (and every prerendered phase) stay static.
//
// `generateMetadata` below only reads `params`, so it still resolves (and
// can call `notFound()`) before this Suspense boundary commits to a 200: an
// unknown slug gets a real 404, same as before. If a slug check ever moves
// inside `ProjectRoute` (the part that reads `searchParams`), a `notFound()`
// there would fire after the 200 is already sent — Next then injects
// `<meta name="robots" content="noindex">` instead of changing the status
// (node_modules/next/dist/docs/01-app/02-guides/streaming.md, "Status
// codes"). e2e/project-states.spec.ts's unknown-slug test checks the
// not-found UI and the noindex meta, not a status code, so it holds either way.
import { PHASE_SLUGS } from "@plinth/fixtures";
import type { Metadata } from "next";
import { Suspense } from "react";
import { loadEvidenceMap } from "@/src/features/project/page/evidence";
import { loadProject } from "@/src/features/project/page/load-project";
import { ProjectPageView } from "@/src/features/project/page/project-page";
import { SimpleView } from "@/src/features/project/simple/simple-view";

export function generateStaticParams() {
  return PHASE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await loadProject(slug);
  const { phase } = page.risk;
  return {
    title: phase.name,
    description: page.hero.summary_line,
    alternates: { canonical: page.risk.meta.live_url },
  };
}

async function ProjectRoute({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rawState = sp.state;
  const state = typeof rawState === "string" && rawState.length > 0 ? rawState : null;
  const data = await loadProject(slug, state);

  if (sp.view === "simple") return <SimpleView page={data.page} bands={data.bands} />;

  const evidence = await loadEvidenceMap(data.page);
  return <ProjectPageView data={data} evidence={evidence} />;
}

export default async function Page(props: PageProps<"/gurugram/projects/[slug]">) {
  const { slug } = await props.params;
  return (
    <Suspense fallback={null}>
      <ProjectRoute slug={slug} searchParams={props.searchParams} />
    </Suspense>
  );
}
