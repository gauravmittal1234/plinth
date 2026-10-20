// Closing line (free at launch, founder decision 20 Oct 2026): the promise
// that any future charge is announced here first, and that the band, its
// reasons and sources, and alerts never move behind it.
import { CLOSING_LINE } from "../copy";

export function ClosingSection() {
  return (
    <section aria-label="If we ever charge for something" className="bg-bg py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] px-4 sm:px-8">
        <p className="m-0 max-w-measure text-lead">{CLOSING_LINE}</p>
      </div>
    </section>
  );
}
