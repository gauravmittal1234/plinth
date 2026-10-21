"use client";

// "Ask Plinth read your search as …" (WebSearch.dc.html's signature live
// thing): the parsed query as a sentence of removable tiles. Dropping a tile
// re-runs the search for the words that remain; if that combination isn't one
// of the fixture world's 5 searches, the page says so instead of guessing
// (FixturePreviewGap) — dropping every tile always works, because it's the
// same as clearing the box.
import { Pill } from "@plinth/web-ui";
import { useRouter } from "next/navigation";
import { queryFromTokens, tilesFromTokens, withoutTile, type QueryTokens } from "./query-tokens";
import { searchHref } from "./search-href";

export type QuerySentenceProps = {
  tokens: QueryTokens;
  sort: string;
};

export function QuerySentence({ tokens, sort }: QuerySentenceProps) {
  const router = useRouter();
  const tiles = tilesFromTokens(tokens);
  if (tiles.length === 0) return null;

  function drop(key: string) {
    const next = withoutTile(tokens, key);
    router.push(searchHref(queryFromTokens(next), sort));
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-small font-semibold text-ink2">Ask Plinth read your search as</p>
      {/* One horizontally scrolling row (benchmark-thapki.md "Chips: Wraps onto
          two lines… Fix"), not a wrapping list. */}
      <ul className="m-0 flex list-none flex-nowrap gap-2 overflow-x-auto p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tiles.map((tile) => (
          <li key={tile.key} className="shrink-0">
            <Pill
              as="button"
              tone="chip"
              aria-label={`Drop ${tile.label} from the search`}
              onClick={() => drop(tile.key)}
            >
              {tile.label}
            </Pill>
          </li>
        ))}
      </ul>
    </div>
  );
}
