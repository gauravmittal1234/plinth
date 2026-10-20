// WebCompare, the SEO route `/compare/[a]-vs-[b]` (T24; WORK_BREAKDOWN §4
// T24, OWNERSHIP.md): one path segment joining 2-4 slugs with "-vs-"
// (features/compare/page/pair.ts). A malformed segment 404s; a well-formed
// one with no fixture key still renders (CompareScreen's own fallback) --
// the smoke sample ("aurelia-heights-phase-2-vs-kestrel-park") is exactly
// that case today (INTEGRATION_NOTES: "a query without a fixture key gives
// fixture_missing; new keys come from the fixtures owner").
//
// No generateStaticParams: every pair renders on request, so `params` is a
// Request-time API here too and is awaited inside <Suspense>, same as the
// `?p=` route.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ComparePlaceholder } from "@/src/features/compare/page/compare-placeholder";
import { CompareScreen } from "@/src/features/compare/page/compare-screen";
import { parsePair } from "@/src/features/compare/page/pair";

export const metadata: Metadata = {
  title: "Compare",
  description:
    "Compare 2 to 4 Gurugram projects side by side: delivery risk, all-in cost and what's on record, each fact with its source and date.",
};

export default function Page({ params }: PageProps<"/compare/[pair]">) {
  return (
    <Suspense fallback={<ComparePlaceholder />}>
      <CompareFromPair params={params} />
    </Suspense>
  );
}

async function CompareFromPair({ params }: Pick<PageProps<"/compare/[pair]">, "params">) {
  const { pair } = await params;
  const slugs = parsePair(pair);
  if (!slugs) notFound();
  return <CompareScreen slugs={slugs} />;
}
