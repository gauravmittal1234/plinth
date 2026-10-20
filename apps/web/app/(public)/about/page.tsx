// WebAbout (T25; WORK_BREAKDOWN §2.1, OWNERSHIP.md).
import type { Metadata } from "next";
import { AboutView } from "@/src/features/trust/about/about-view";
import { loadAboutData } from "@/src/features/trust/about/data";

export const metadata: Metadata = {
  title: "Who is Plinth?",
  description:
    "A small Gurugram company that reads public records for home buyers. Here is who answers for it, how it earns, and whether its bands held up.",
};

export default async function Page() {
  const about = await loadAboutData();
  return <AboutView about={about} />;
}
