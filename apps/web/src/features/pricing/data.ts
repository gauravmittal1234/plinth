// WebPricing's own reads (T26; AGENTS.md "pages import only from @/src/data").
// The Aurelia sample is the same phase WebHome defaults to (T21), read fresh
// here so this page never depends on another feature's module.
import "server-only";
import { about, flags, riskSummary } from "@/src/data";
import type { About, RiskSummary } from "@/src/data";

export const SAMPLE_SLUG = "aurelia-heights-phase-2";

export type PricingData = {
  about: About;
  sample: RiskSummary;
  /** `flags().flags.pro_paywall` — off until a payment partner exists (contracts/catalogues/flags.json). */
  proPaywallOn: boolean;
};

export async function loadPricingData(): Promise<PricingData> {
  const [aboutPage, sample, flagsResult] = await Promise.all([
    about(),
    riskSummary(SAMPLE_SLUG),
    flags(),
  ]);
  return {
    about: aboutPage,
    sample,
    proPaywallOn: flagsResult.flags.pro_paywall === true,
  };
}
