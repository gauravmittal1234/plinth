// "What does the paywall hide?" (T26 Build: the Free/Pro switch). The server
// reads the Aurelia sample once (data.ts); `FreeProSample` is the only client
// piece on this page.
import type { RiskSummary } from "@/src/data";
import { SAMPLE_COPY } from "../copy";
import { FreeProSample } from "./free-pro-sample";

export function SampleSection({
  sample,
  proPaywallOn,
}: {
  sample: RiskSummary;
  proPaywallOn: boolean;
}) {
  return (
    <section id="sample" aria-labelledby="sample-h" className="bg-bg py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-6 px-4 sm:px-8">
        <h2 id="sample-h" className="m-0 font-display text-h2 font-extrabold">
          {SAMPLE_COPY.heading}
        </h2>
        <p className="m-0 max-w-measure text-body text-ink2">{SAMPLE_COPY.lead}</p>
        <FreeProSample sample={sample} proPaywallOn={proPaywallOn} />
      </div>
    </section>
  );
}
