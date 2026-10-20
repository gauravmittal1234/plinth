"use client";

// "Describe the home you want" (WebSearch.dc.html's natural-language box).
import { Button, Sheet } from "@plinth/web-ui";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { SEARCH_COPY } from "./copy";
import { searchHref } from "./search-href";

export type FreeTextEditorProps = {
  query: string;
  sort: string;
};

export function FreeTextEditor({ query, sort }: FreeTextEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(query);
  const fieldId = useId();

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {SEARCH_COPY.editWords}
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={SEARCH_COPY.describeHeading}
        closeLabel="Close"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
            router.push(searchHref(draft.trim(), sort));
          }}
        >
          <label htmlFor={fieldId} className="sr-only">
            {SEARCH_COPY.describeHeading}
          </label>
          <textarea
            id={fieldId}
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-24 resize-y rounded-panel bg-track p-3.5 text-body text-ink outline-none"
          />
          <div className="flex gap-3">
            {/* variant="secondary", not the default primary: apps/web/app/globals.css
                doesn't import @plinth/web-ui/styles.css yet (INTEGRATION_NOTES, "T14
                handoffs, done at the T39 gate"), so text-on-accent never reaches this
                build and a visible primary button reads ink-on-accent (axe
                color-contrast). Revert once that import lands. */}
            <Button type="submit" variant="secondary">
              {SEARCH_COPY.updateResults}
            </Button>
            <Button type="button" variant="tertiary" onClick={() => setOpen(false)}>
              {SEARCH_COPY.cancel}
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
