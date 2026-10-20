// WebPricing (T26; free at launch, founder decision 20 Oct 2026: no Pro plan,
// no agent fee, no sample, no buy flow, no refund policy). "Never on a Plinth
// paywall" stays as the artboard wrote it.
import type { PricingData } from "./data";
import { ClosingSection } from "./sections/closing-section";
import { FreeSection } from "./sections/free-section";
import { IntroSection } from "./sections/intro-section";
import { NeverSection } from "./sections/never-section";
import { WhoPaysSection } from "./sections/who-pays-section";

export function PricingView({ data }: { data: PricingData }) {
  return (
    <>
      <IntroSection meta={data.about.meta} />
      <FreeSection />
      <WhoPaysSection money={data.about.money} />
      <NeverSection />
      <ClosingSection />
    </>
  );
}
