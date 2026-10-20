// Simple view (T20b's SimpleView; fix-project2.md §1 G-27):
// `/gurugram/projects/<slug>?view=simple` is rewritten here by
// next.config.ts, so the canonical page beside `~preview` never reads
// `searchParams` and stays static. The header toggle is `OnThisPageRail`'s
// "Simple view" link; SimpleView links back to the full page. noindex: the
// same facts as the canonical page, in large type.
import { PHASE_SLUGS } from "@plinth/fixtures";
import type { Metadata } from "next";
import { loadProject } from "@/src/features/project/page/load-project";
import { projectMetadata } from "@/src/features/project/page/preview";
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
  return projectMetadata(await loadProject(slug), { preview: true });
}

export default async function Page(props: PageProps<"/gurugram/projects/[slug]/~preview/simple">) {
  const { slug } = await props.params;
  const { page, bands } = await loadProject(slug);
  return <SimpleView page={page} bands={bands} />;
}
