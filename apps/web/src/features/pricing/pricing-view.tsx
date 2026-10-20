// WebPricing (T26; WORK_BREAKDOWN T26 Build: the Free/Pro switch on the
// Aurelia sample, "Never on a Plinth paywall", refunds, the sample-only buy
// toast).
import type { PricingData } from "./data";
import { FreeSection } from "./sections/free-section";
import { IntroSection } from "./sections/intro-section";
import { NeverSection } from "./sections/never-section";
import { ProSection } from "./sections/pro-section";
import { RefundSection } from "./sections/refund-section";
import { SampleSection } from "./sections/sample-section";

export function PricingView({ data }: { data: PricingData }) {
  return (
    <>
      <IntroSection money={data.about.money} meta={data.about.meta} />
      <FreeSection />
      <ProSection money={data.about.money} />
      <SampleSection sample={data.sample} proPaywallOn={data.proPaywallOn} />
      <NeverSection />
      <RefundSection />
    </>
  );
}
