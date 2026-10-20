// "What are you watching for?" (WORK_BREAKDOWN T49 Build: "saved searches").
// api.saved_search_save/delete are writes only (API_CONTRACTS §3.2); there is
// no read to list what a buyer already saved yet (no contract schema, no
// packages/fixtures/expected folder), so this section can only point at
// where a search is made and saved, not list one — a Handoff in this PR, not
// invented data.
import { Button, SectionBand } from "@plinth/web-ui";
import Link from "next/link";
import { SAVED_SEARCHES_COPY } from "../page/copy";

export function SavedSearchesSection() {
  return (
    <SectionBand id="saved-searches" tone="bg">
      <div className="flex flex-col gap-4">
        <h2 className="m-0 font-display text-h2 font-extrabold">{SAVED_SEARCHES_COPY.heading}</h2>
        <p className="m-0 max-w-[60ch] text-body text-ink2">{SAVED_SEARCHES_COPY.subheading}</p>
        <div>
          <Button asChild variant="secondary">
            <Link href="/search">{SAVED_SEARCHES_COPY.runSearch}</Link>
          </Button>
        </div>
      </div>
    </SectionBand>
  );
}
