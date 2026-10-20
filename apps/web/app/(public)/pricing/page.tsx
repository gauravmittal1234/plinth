// WebPricing (T26; WORK_BREAKDOWN §2.1, OWNERSHIP.md).
import type { Metadata } from "next";
import { loadPricingData } from "@/src/features/pricing/data";
import { PricingView } from "@/src/features/pricing/pricing-view";

export const metadata: Metadata = {
  title: "What does Plinth cost?",
  description:
    "Nothing. Plinth is free while we launch: every band, reason, source, alert and comparison, for everyone.",
};

export default async function Page() {
  const data = await loadPricingData();
  return <PricingView data={data} />;
}
