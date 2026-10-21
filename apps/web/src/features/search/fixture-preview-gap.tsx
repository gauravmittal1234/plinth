// Shown when a typed or rebuilt query matches none of the fixture world's 5
// searches (apps/web/src/data/registry.ts: search_projects's fixtureMiss is
// `fixture_missing`; packages/fixtures/expected/search_projects/_requests.json
// lists the 5 keys). This never invents a result set for an unmapped query —
// it says so, and offers the demo searches that do have one.
import Link from "next/link";
import { EXAMPLE_SEARCHES, SEARCH_COPY } from "./copy";

export function FixturePreviewGap() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-panel bg-track p-6 sm:p-8">
      <h1 className="m-0 max-w-measure font-display text-h2 font-bold">
        {SEARCH_COPY.previewGapHeading}
      </h1>
      <p className="m-0 max-w-measure text-body text-ink2">{SEARCH_COPY.previewGapBody}</p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {EXAMPLE_SEARCHES.map((ex) => (
          <li key={ex.label}>
            <Link
              href={ex.q ? `/search?q=${encodeURIComponent(ex.q)}` : "/search"}
              className="text-body font-semibold text-ink underline underline-offset-2"
            >
              {ex.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
