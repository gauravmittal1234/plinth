"use client";

// Sort (WebSearch.dc.html): "Lowest delivery risk" · "Lowest all-in price" ·
// "Most built". The fixture world only answers lowest_risk (the server
// default); picking another option still asks for real results — if there is
// no fixture for that combination yet, the page says so (FixturePreviewGap)
// rather than silently re-sorting the same list.
import { useId } from "react";
import { useRouter } from "next/navigation";
import { SEARCH_COPY, SORT_OPTIONS } from "./copy";
import { searchHref } from "./search-href";

export type SortMenuProps = {
  query: string;
  sort: string;
};

export function SortMenu({ query, sort }: SortMenuProps) {
  const router = useRouter();
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-small font-semibold text-ink2">
        {SEARCH_COPY.sortLabel}
      </label>
      <select
        id={id}
        value={sort}
        onChange={(e) => router.push(searchHref(query, e.target.value))}
        className="h-11 cursor-pointer rounded-pill bg-chip-fill px-3.5 text-small font-semibold text-ink outline-none"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
