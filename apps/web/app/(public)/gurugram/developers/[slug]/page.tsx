// WebDeveloper (T23; WORK_BREAKDOWN §4 T23, OWNERSHIP.md). The 6 seeded
// developer groups are prerendered; any other slug renders on request and
// 404s through `loadDeveloper`'s `notFound()` when the fixtures (or, in time,
// the backend) have no such group.
//
// This page never reads `searchParams`, so it stays fully static. The
// `?state=<state>` fixture preview (e.g. `facts_only`) keeps its public URL
// through a next.config.ts rewrite to the internal `~preview/state/[state]`
// route beside this file (src/features/developer/page/preview.ts), which is
// noindex.
import { GROUP_SLUGS } from "@plinth/fixtures";
import type { Metadata } from "next";
import { DeveloperPageView } from "@/src/features/developer/page/developer-page";
import { loadDeveloper } from "@/src/features/developer/page/load-developer";
import { developerMetadata } from "@/src/features/developer/page/preview";

export function generateStaticParams() {
  return GROUP_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return developerMetadata(await loadDeveloper(slug, null));
}

export default async function Page(props: PageProps<"/gurugram/developers/[slug]">) {
  const { slug } = await props.params;
  const data = await loadDeveloper(slug, null);
  return <DeveloperPageView data={data} />;
}
