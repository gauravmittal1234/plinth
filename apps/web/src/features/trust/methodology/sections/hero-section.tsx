// "How Delivery Risk works" (WebMethodology.dc.html top).
import type { Methodology } from "@/src/data";
import { formatDate } from "../../format";

export function HeroSection({ methodology }: { methodology: Methodology }) {
  return (
    <section aria-label="How Delivery Risk works" className="bg-bg py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-5 px-4 sm:px-8">
        <h1 className="m-0 max-w-[22ch] text-balance font-display text-h1 font-extrabold tracking-[-0.03em]">
          How Delivery Risk works
        </h1>
        {methodology.question_line ? (
          <p className="m-0 max-w-measure text-lead">{methodology.question_line}</p>
        ) : null}
        <p className="m-0 text-small text-ink2">
          Methodology {methodology.current_version}
          {methodology.published_on ? `, published ${formatDate(methodology.published_on)}` : ""}.{" "}
          {methodology.never_line}
        </p>
      </div>
    </section>
  );
}
