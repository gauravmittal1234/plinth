// WebPricing's own read (T26; AGENTS.md "pages import only from @/src/data").
// Free at launch (founder, 20 Oct 2026): the page is short, server-rendered
// copy plus `api.about().money` — no sample, no payment flow, so no other
// read is needed.
import "server-only";
import { about } from "@/src/data";
import type { About } from "@/src/data";

export type PricingData = {
  about: About;
};

export async function loadPricingData(): Promise<PricingData> {
  return { about: await about() };
}
