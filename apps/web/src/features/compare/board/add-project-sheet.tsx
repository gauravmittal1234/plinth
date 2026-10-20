"use client";

// "Add a project" (WORK_BREAKDOWN T24 Build: add/remove). A Sheet (T14) over
// `api.suggest`, the same debounce HeroSearch (WebHome) uses, filtered to
// phase matches only -- a developer or locality has no single compare
// column.
import { Sheet } from "@plinth/web-ui";
import type { Slug } from "@plinth/contracts";
import { useEffect, useRef, useState, useTransition } from "react";
import { searchCandidates, type AddCandidate } from "./actions";
import { COPY } from "../page/copy";

const DEBOUNCE_MS = 300;

export function AddProjectSheet({
  open,
  onOpenChange,
  excludeSlugs,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excludeSlugs: readonly Slug[];
  onAdd: (slug: Slug) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly AddCandidate[]>([]);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset the box each time the sheet opens, adjusted during render rather
  // than in an effect (react.dev "you might not need an effect" -- the lint
  // rule this project runs flags a setState called synchronously in an
  // effect body).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setResults([]);
    }
  }

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (query.trim() === "") {
        setResults([]);
        return;
      }
      startTransition(async () => {
        setResults(await searchCandidates(query, excludeSlugs));
      });
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // excludeSlugs changes with every add; re-running the search on that is
    // what keeps an already-added project out of the next result list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      modal
      title={COPY.addProject}
      description={COPY.addSlotHint}
      closeLabel={COPY.cancel}
    >
      <label htmlFor="compare-add-q" className="sr-only">
        {COPY.searchLabel}
      </label>
      <input
        id="compare-add-q"
        type="text"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        placeholder={COPY.searchPlaceholder}
        className="h-12 w-full rounded-pill border-0 bg-track px-5 font-sans text-body text-ink outline-none placeholder:text-ink2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      />
      <ul className="m-0 flex list-none flex-col gap-1 p-0" aria-busy={isPending}>
        {results.map((item) => (
          <li key={item.slug}>
            <button
              type="button"
              onClick={() => onAdd(item.slug)}
              className="flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-panel border-0 bg-transparent px-3 py-2.5 text-left transition-colors hover:bg-track focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span className="text-body font-semibold text-ink">{item.label}</span>
              {item.detailLine ? (
                <span className="text-caption text-ink2">{item.detailLine}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      {query.trim() !== "" && !isPending && results.length === 0 ? (
        <p className="m-0 text-body text-ink2">{COPY.noMatch}</p>
      ) : null}
    </Sheet>
  );
}
