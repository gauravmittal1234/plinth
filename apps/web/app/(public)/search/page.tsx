// WebSearch (T22): list + map, filters, a natural-language box, the hidden-
// count note, zero-results guidance, request a project and the Noida
// waitlist (WORK_BREAKDOWN T22; product/design/artboards/WebSearch.dc.html).
// `searchParams` is read inside the Suspense boundary, following the Cache
// Components pattern for a search page (searchProjects is itself a cached
// read, apps/web/src/data/cache.ts).
import { SectionBand } from "@plinth/web-ui";
import type { Metadata } from "next";
import { Suspense } from "react";
import { flags, isDataError, searchProjects } from "@/src/data";
import { FixturePreviewGap } from "@/src/features/search/fixture-preview-gap";
import { SearchExperience } from "@/src/features/search/search-experience";

export const metadata: Metadata = {
  title: "Search Gurugram projects",
  description:
    "Every Gurugram project with a RERA number, its delivery risk and its all-in price, from public records. No paid placement.",
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function Page(props: PageProps<"/search">) {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchRoute searchParams={props.searchParams} />
    </Suspense>
  );
}

async function SearchRoute({
  searchParams,
}: Pick<PageProps<"/search">, "searchParams">) {
  const sp = await searchParams;
  const query = firstParam(sp.q) ?? "";
  const sort = firstParam(sp.sort) ?? "lowest_risk";

  const [flagsResult, resultsOutcome] = await Promise.all([
    flags().catch(() => null),
    searchProjects({ q: query, sort }).then(
      (value) => ({ ok: true as const, value }),
      (error: unknown) => ({ ok: false as const, error }),
    ),
  ]);

  if (!resultsOutcome.ok) {
    if (isDataError(resultsOutcome.error, "fixture_missing")) {
      return (
        <SectionBand>
          <FixturePreviewGap />
        </SectionBand>
      );
    }
    throw resultsOutcome.error;
  }

  const results = resultsOutcome.value;
  return (
    <SearchExperience
      query={results.query ?? query}
      sort={sort}
      items={results.items}
      parsed={results.parsed}
      sortLine={results.sort_line}
      legendLine={results.legend_line ?? "Pins show all-in prices"}
      hiddenCount={results.hidden_count}
      hidden={results.hidden ?? []}
      zeroResults={results.zero_results}
      tilesEnabled={flagsResult?.flags.map_tiles ?? false}
    />
  );
}

function SearchFallback() {
  return (
    <div className="mx-auto w-full max-w-[79rem] px-4 py-16 sm:px-8 sm:py-24">
      <p className="m-0 text-body text-ink2">{"Reading the records…"}</p>
    </div>
  );
}
