// "How much is built?" (DESIGN §0 signature instrument: the replay tower).
// A native-range replay over every QPR quarter, plus one more stop for today,
// drives the 3D tower, the Built/Sold/Time-used tiles and the "band then"
// line — so the page is honest that a quarter's QPR never carried a band more
// severe than it actually was at the time (BUILD_PLAN T20a accept: the replay
// never shows Elevated before the Jun 2026 stop, and "Elevated since 2 Oct
// 2026" shows only at today). Reduced motion needs no extra path here: the
// range and the tower both render their resting state with no animation.
//
// The heading and intro line are the only static part; everything else reads
// the replay's `index`/`towerFilter` state, so it stays with `BuiltInstrument`
// (built-instrument.tsx, "use client"). This section itself server-renders
// the heading/intro and passes them in as `children` (project-page JS budget,
// lighthouserc.cjs), same split as states/booked-toggle.tsx.
import type { BandRange } from "@plinth/contracts";
import { SectionBand } from "@plinth/web-ui";
import { BUILT_COPY } from "../../page/copy";
import { BuiltInstrument, type BuiltSectionPage } from "./built-instrument";

export type { BuiltSectionPage };

export function BuiltSection({
  page,
  bands,
}: {
  page: BuiltSectionPage;
  bands: readonly BandRange[];
}) {
  return (
    <SectionBand id="built" tone="bg">
      <BuiltInstrument page={page} bands={bands}>
        <h2 className="m-0 max-w-[14ch] text-balance font-display text-section font-bold">
          {BUILT_COPY.heading}
        </h2>
        <p className="m-0 max-w-measure text-lead">{page.risk.progress.line}</p>
      </BuiltInstrument>
    </SectionBand>
  );
}
