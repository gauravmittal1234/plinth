// WebMethodology (T25; WORK_BREAKDOWN §2.1, OWNERSHIP.md).
import type { Metadata } from "next";
import { loadMethodologyData } from "@/src/features/trust/methodology/data";
import { MethodologyView } from "@/src/features/trust/methodology/methodology-view";
import { breadcrumbListJsonLd, organizationJsonLd } from "@/src/seo/json-ld";

export const metadata: Metadata = {
  title: "How Delivery Risk works",
  description:
    "One question for every RERA phase in Gurugram: will the OC arrive more than 12 months late? Here is exactly how we answer it.",
};

const organization = organizationJsonLd();
const breadcrumb = breadcrumbListJsonLd([
  { name: "Home", path: "/" },
  { name: "Methodology", path: "/methodology" },
]);

export default async function Page() {
  const methodology = await loadMethodologyData();
  return (
    <>
      {/* Server-rendered only: no client JS (T28 brief, M1 polish). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <MethodologyView methodology={methodology} />
    </>
  );
}
