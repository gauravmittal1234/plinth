// WebCompare, the working list (T24; WORK_BREAKDOWN §4 T24, OWNERSHIP.md).
// `?p=a,b,c` is what the board's add/remove rewrites the URL to
// (features/compare/page/pair.ts); no `p` falls back to the default trio, so
// the bare nav link ("Compare") and this route both just work.
//
// `searchParams` is a Cache Components Request-time API: reading it at the
// top would make this whole route dynamic with no static shell, so it's
// pushed into a <Suspense>-wrapped child instead (see the migration guide
// cited in ComparePlaceholder).
import type { Metadata } from "next";
import { Suspense } from "react";
import { ComparePlaceholder } from "@/src/features/compare/page/compare-placeholder";
import { CompareScreen } from "@/src/features/compare/page/compare-screen";
import { DEFAULT_SLUGS, parseSlugsQuery } from "@/src/features/compare/page/pair";

export const metadata: Metadata = {
  title: "Compare",
  description:
    "Compare 2 to 4 Gurugram projects side by side: delivery risk, all-in cost and what's on record, each fact with its source and date.",
};

export default function Page({ searchParams }: PageProps<"/compare">) {
  return (
    <Suspense fallback={<ComparePlaceholder />}>
      <CompareFromQuery searchParams={searchParams} />
    </Suspense>
  );
}

async function CompareFromQuery({
  searchParams,
}: Pick<PageProps<"/compare">, "searchParams">) {
  const sp = await searchParams;
  const slugs = parseSlugsQuery(sp.p) ?? DEFAULT_SLUGS;
  return <CompareScreen slugs={slugs} />;
}
