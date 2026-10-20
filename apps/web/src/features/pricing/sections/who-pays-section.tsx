// "Who pays us?" (free at launch, founder decision 20 Oct 2026). The never_line
// is `api.about().money`, never composed here; the second line is this page's
// own extension of it for launch (no lender, no agent fee either).
import type { About } from "@/src/data";
import { WHO_PAYS_COPY } from "../copy";

export function WhoPaysSection({ money }: { money: About["money"] }) {
  return (
    <section aria-labelledby="who-pays-h" className="bg-track py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-4 px-4 sm:px-8">
        <h2 id="who-pays-h" className="m-0 font-display text-section font-bold">
          {WHO_PAYS_COPY.heading}
        </h2>
        <p className="m-0 max-w-measure text-lead">{money.never_line}</p>
        <p className="m-0 max-w-measure text-body text-ink2">{WHO_PAYS_COPY.extra}</p>
      </div>
    </section>
  );
}
