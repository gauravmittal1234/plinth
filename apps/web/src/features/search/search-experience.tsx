"use client";

// WebSearch.dc.html, composed (T22). Every fact — the count, the band, the
// price, the hidden list, the zero-results guidance — is read straight off
// `results` (api.search_projects); this file only lays it out and wires the
// list ↔ map selection, the sentence tiles, sort and the free-text editor.
import { SectionBand } from "@plinth/web-ui";
import Link from "next/link";
import { useState } from "react";
import { SearchMap, type MapPin } from "@/src/features/map/search-map";
import { SEARCH_COPY } from "./copy";
import { FreeTextEditor } from "./free-text-editor";
import { HiddenList } from "./hidden-list";
import { QuerySentence } from "./query-sentence";
import { ResultCard } from "./result-card";
import { SortMenu } from "./sort-menu";
import { tokensFromFilters } from "./query-tokens";
import type { HiddenProject, ProjectCard, SearchFilters, ZeroResultsPayload } from "./types";
import { ZeroResultsPanel } from "./zero-results-panel";

export type SearchExperienceProps = {
  query: string;
  sort: string;
  items: readonly ProjectCard[];
  parsed: SearchFilters;
  sortLine: string;
  legendLine: string;
  hiddenCount: number;
  hidden: readonly HiddenProject[];
  zeroResults: ZeroResultsPayload | null;
  tilesEnabled: boolean;
};

export function SearchExperience({
  query,
  sort,
  items,
  parsed,
  sortLine,
  legendLine,
  hiddenCount,
  hidden,
  zeroResults,
  tilesEnabled,
}: SearchExperienceProps) {
  const [selected, setSelected] = useState<string | null>(items[0]?.slug ?? null);
  const [showRanking, setShowRanking] = useState(false);
  const tokens = tokensFromFilters(parsed);

  if (zeroResults) {
    return (
      <SectionBand>
        <div className="flex flex-col gap-6">
          <FreeTextEditor query={query} sort={sort} />
          <ZeroResultsPanel zeroResults={zeroResults} name={parsed.name ?? null} hidden={hidden} />
        </div>
      </SectionBand>
    );
  }

  const pins: MapPin[] = items.map((c) => ({
    slug: c.slug,
    name: c.name,
    pinLabel: c.pin_label,
    centroid: c.centroid ? ([c.centroid[0], c.centroid[1]] as const) : null,
  }));

  return (
    <SectionBand>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="m-0 font-display text-h1 font-bold">
            {items.length} {items.length === 1 ? "project matches" : "projects match"}
          </h1>
          <FreeTextEditor query={query} sort={sort} />
        </div>

        <Link href="/#ask" className="text-small text-ink2 underline underline-offset-2">
          {SEARCH_COPY.askPrompt}
        </Link>

        <QuerySentence tokens={tokens} sort={sort} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SortMenu query={query} sort={sort} />
          <p className="m-0 text-small text-ink2">
            <strong className="font-semibold text-ink">{SEARCH_COPY.noPaidPlacement}</strong>{" "}
            <button
              type="button"
              onClick={() => setShowRanking((v) => !v)}
              aria-expanded={showRanking}
              className="cursor-pointer border-0 bg-transparent p-0 text-small text-ink underline underline-offset-2"
            >
              {SEARCH_COPY.howRankingWorks}
            </button>
          </p>
        </div>
        {showRanking ? <p className="m-0 text-small text-ink2">{sortLine}</p> : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {items.map((card) => (
              <ResultCard key={card.slug} card={card} selected={card.slug === selected} onHover={setSelected} />
            ))}
          </ul>
          <SearchMap
            pins={pins}
            selected={selected}
            onSelect={setSelected}
            legendLine={legendLine}
            tilesEnabled={tilesEnabled}
            className="lg:sticky lg:top-24 lg:self-start"
          />
        </div>

        <HiddenList count={hiddenCount} hidden={hidden} />

        <FactsOnlyExplainer />
      </div>
    </SectionBand>
  );
}

/** The persistent explainer every facts-only chip's "Facts only: see why" link opens. */
function FactsOnlyExplainer() {
  const [open, setOpen] = useState(false);
  return (
    <div id="facts-only" className="scroll-mt-30 flex flex-col items-start gap-2">
      <p className="m-0 max-w-measure text-caption text-ink2">
        {SEARCH_COPY.factsOnlyNote}{" "}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="cursor-pointer border-0 bg-transparent p-0 text-caption text-ink underline underline-offset-2"
        >
          {SEARCH_COPY.factsOnlySeeWhy}
        </button>
      </p>
      {open ? (
        <p className="m-0 max-w-measure text-caption text-ink2">{SEARCH_COPY.factsOnlyExplainer}</p>
      ) : null}
    </div>
  );
}
