// WebDeveloper design-state preview: `/gurugram/developers/<slug>?state=<state>`
// is rewritten here by next.config.ts, so the canonical page beside
// `~preview` never reads `searchParams` and stays static. Internal: noindex,
// never linked, not in the sitemap. `state` is one of
// DEVELOPER_PREVIEW_STATES (src/features/developer/page/preview.ts);
// `loadDeveloper` loads that state's fixture, and 404s (as the canonical
// page does for an unknown slug) when the group has none.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeveloperPageView } from "@/src/features/developer/page/developer-page";
import { loadDeveloper } from "@/src/features/developer/page/load-developer";
import {
  developerMetadata,
  isDeveloperPreviewState,
  statePreviewParams,
} from "@/src/features/developer/page/preview";

export function generateStaticParams() {
  return statePreviewParams();
}

async function load(params: Promise<{ slug: string; state: string }>) {
  const { slug, state } = await params;
  if (!isDeveloperPreviewState(state)) notFound();
  return loadDeveloper(slug, state);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; state: string }>;
}): Promise<Metadata> {
  return developerMetadata(await load(params), { preview: true });
}

export default async function Page(
  props: PageProps<"/gurugram/developers/[slug]/~preview/state/[state]">,
) {
  return <DeveloperPageView data={await load(props.params)} />;
}
