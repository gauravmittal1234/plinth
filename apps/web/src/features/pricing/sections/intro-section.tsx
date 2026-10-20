// "What does Plinth cost?" (free at launch, founder decision 20 Oct 2026).
// The heading and lead are layout copy (copy.ts); the "Updated" stamp is the
// server's own `api.about().meta`.
import type { About } from "@/src/data";
import { HERO_COPY } from "../copy";
import { formatDate } from "../format";

export function IntroSection({ meta }: { meta: About["meta"] }) {
  return (
    <section aria-label="What does Plinth cost?" className="bg-bg py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-5 px-4 sm:px-8">
        <h1 className="m-0 max-w-[20ch] text-balance font-display text-h1 font-bold tracking-[-0.03em]">
          {HERO_COPY.heading}
        </h1>
        <p className="m-0 max-w-measure text-lead">{HERO_COPY.lead}</p>
        <p className="m-0 text-small text-ink2">Updated {formatDate(meta.generated_at)}</p>
      </div>
    </section>
  );
}
