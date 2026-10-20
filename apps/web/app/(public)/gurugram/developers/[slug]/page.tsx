// WebDeveloper (T23; WORK_BREAKDOWN §4 T23, OWNERSHIP.md). The 6 seeded
// developer groups are prerendered; any other slug renders on request and
// 404s through `loadDeveloper`'s `notFound()` when the fixtures (or, in time,
// the backend) have no such group.
//
// `?state=` previews a design state in fixture mode (e.g. `facts_only`), the
// same mechanism WebProjectStates is planned to use (src/features/project/states).
// Reading `searchParams` is a Next "Runtime API" under Cache Components, so
// only the subtree that needs it is dynamic, behind its own `<Suspense>` —
// the slug-only parts above it (and every prerendered group) stay static.
import { GROUP_SLUGS } from "@plinth/fixtures";
import type { Metadata } from "next";
import { Suspense } from "react";
import { DeveloperPageView } from "@/src/features/developer/page/developer-page";
import { loadDeveloper } from "@/src/features/developer/page/load-developer";

export function generateStaticParams() {
  return GROUP_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await loadDeveloper(slug, null);
  return {
    title: page.group.name,
    description: page.summary_line ?? undefined,
    alternates: { canonical: page.meta.live_url },
  };
}

async function DeveloperRoute({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rawState = sp.state;
  const state = typeof rawState === "string" && rawState.length > 0 ? rawState : null;
  const data = await loadDeveloper(slug, state);
  return <DeveloperPageView data={data} />;
}

export default async function Page(props: PageProps<"/gurugram/developers/[slug]">) {
  const { slug } = await props.params;
  return (
    <Suspense fallback={null}>
      <DeveloperRoute slug={slug} searchParams={props.searchParams} />
    </Suspense>
  );
}
