// "N projects hidden by your filters" (G-36, C-21): named, never silent. Every
// project and its `why_line` come from SearchResults.hidden.
import { useId, useState } from "react";
import { SEARCH_COPY } from "./copy";
import type { HiddenProject } from "./types";

export type HiddenListProps = {
  count: number;
  hidden: readonly HiddenProject[];
};

export function HiddenList({ count, hidden }: HiddenListProps) {
  const [open, setOpen] = useState(hidden.length <= 3);
  const listId = useId();
  if (count <= 0) return null;
  const shown = open ? hidden : hidden.slice(0, 3);
  return (
    <div className="rounded-panel bg-track p-4">
      <p className="m-0 text-body font-semibold">
        {count} {count === 1 ? "project" : "projects"} hidden by your filters
      </p>
      {hidden.length > 0 ? (
        <>
          <ul id={listId} className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-small text-ink2">
            {shown.map((h) => (
              <li key={h.slug}>{`${h.name} · ${h.why_line}`}</li>
            ))}
          </ul>
          {hidden.length > 3 && !open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-controls={listId}
              aria-expanded={open}
              className="mt-2 cursor-pointer border-0 bg-transparent p-0 text-small font-semibold text-ink underline underline-offset-2"
            >
              {SEARCH_COPY.showAll}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
