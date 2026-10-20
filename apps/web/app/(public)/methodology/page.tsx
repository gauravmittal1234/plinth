// WebMethodology (T25; WORK_BREAKDOWN §2.1, OWNERSHIP.md).
import type { Metadata } from "next";
import { loadMethodologyData } from "@/src/features/trust/methodology/data";
import { MethodologyView } from "@/src/features/trust/methodology/methodology-view";

export const metadata: Metadata = {
  title: "How Delivery Risk works",
  description:
    "One question for every RERA phase in Gurugram: will the OC arrive more than 12 months late? Here is exactly how we answer it.",
};

export default async function Page() {
  const methodology = await loadMethodologyData();
  return <MethodologyView methodology={methodology} />;
}
