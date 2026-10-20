// "What's free, and what's Pro?" (WebPricing.dc.html top). ₹999 and the
// never_line are `api.about().money`; the rest is layout copy (copy.ts).
import type { About } from "@/src/data";
import { HERO_COPY } from "../copy";
import { formatDate } from "../format";

export function IntroSection({ money, meta }: { money: About["money"]; meta: About["meta"] }) {
  return (
    <section aria-label="What's free, and what's Pro?" className="bg-bg py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-5 px-4 sm:px-8">
        <h1 className="m-0 max-w-[20ch] text-balance font-display text-h1 font-extrabold tracking-[-0.03em]">
          {HERO_COPY.heading}
        </h1>
        <p className="m-0 max-w-measure text-lead">{HERO_COPY.lead}</p>
        <p className="m-0 max-w-measure text-body text-ink2">{HERO_COPY.proLead}</p>
        <p className="m-0 text-small text-ink2">
          Updated {formatDate(meta.generated_at)} · {money.never_line}
        </p>
        <a href="#sample" className="text-body font-semibold text-ink underline underline-offset-[0.2em]">
          {HERO_COPY.tryTheSample}
        </a>
      </div>
    </section>
  );
}
