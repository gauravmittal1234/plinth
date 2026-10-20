// A section-level stub (WORK_BREAKDOWN §1 rule 4 "stubs, then fill"; T20a
// creates these for T20b's and T20c's folders). It keeps the guided story's
// anchors and band alternation intact while the section's real content is
// still to come, the same way src/shell/placeholder.tsx stands in for a whole
// route. Never shown as finished work: it visibly says what is missing.
import { SectionBand, type SectionBandProps } from "@plinth/web-ui";

export function StubSection({
  id,
  heading,
  task,
  tone = "bg",
}: {
  id: string;
  heading: string;
  /** The task that fills this section in, e.g. "T20b". */
  task: string;
  tone?: SectionBandProps["tone"];
}) {
  return (
    <SectionBand id={id} tone={tone} data-stub-section={id}>
      <h2 className="m-0 font-display text-h3 font-extrabold text-balance sm:text-h2">
        {heading}
      </h2>
      <p className="mt-5 mb-0 max-w-measure text-lead text-ink2">
        Placeholder. {task} builds this section from the WebProject artboard.
      </p>
    </SectionBand>
  );
}
