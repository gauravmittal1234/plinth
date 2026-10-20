// WebProject (T20a; WORK_BREAKDOWN §4 T20a, OWNERSHIP.md). The 8 seeded
// phases are prerendered; any other slug renders on request and 404s through
// `loadProject`'s `notFound()` when the fixtures (or, in time, the backend)
// have no such phase.
import { PHASE_SLUGS } from "@plinth/fixtures";
import type { Metadata } from "next";
import { loadEvidenceMap } from "@/src/features/project/page/evidence";
import { loadProject } from "@/src/features/project/page/load-project";
import { ProjectPageView } from "@/src/features/project/page/project-page";

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

export default async function Page(props: PageProps<"/gurugram/projects/[slug]">) {
  const { slug } = await props.params;
  const data = await loadProject(slug);
  const evidence = await loadEvidenceMap(data.page);
  return <ProjectPageView data={data} evidence={evidence} />;
}
