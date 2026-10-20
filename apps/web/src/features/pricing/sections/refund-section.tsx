// "What if Pro wasn't worth it?" (T26 Build item: "refunds"). This policy's
// window and processing time aren't in DESIGN.md §5b yet — see the PR's
// Handoff note; this copy is the WebPricing artboard's own wording.
import { REFUND_COPY } from "../copy";

export function RefundSection() {
  return (
    <section aria-labelledby="refund-h" className="bg-bg py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-4 px-4 sm:px-8">
        <h2 id="refund-h" className="m-0 font-display text-h2 font-extrabold">
          {REFUND_COPY.heading}
        </h2>
        <p className="m-0 max-w-measure text-lead">{REFUND_COPY.lead}</p>
        <p className="m-0 max-w-measure text-body text-ink2">{REFUND_COPY.how}</p>
        <p className="m-0 text-small text-ink2">{REFUND_COPY.payments}</p>
      </div>
    </section>
  );
}
