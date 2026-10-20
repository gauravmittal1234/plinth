// WebPricing (T26; WORK_BREAKDOWN §2.1, OWNERSHIP.md).
import type { Metadata } from "next";
import { loadPricingData } from "@/src/features/pricing/data";
import { PricingView } from "@/src/features/pricing/pricing-view";

export const metadata: Metadata = {
  title: "What's free and what's Pro",
  description:
    "Everything that tells you whether to trust a project is free, for everyone, for good. Pro is a deeper report on one project.",
};

export default async function Page() {
  const data = await loadPricingData();
  return <PricingView data={data} />;
}
