// WebMethodology (T25; WORK_BREAKDOWN T25 Build: factor weights, red-flag
// rules, confidence states, changelog v1.0–v1.2, a link to the calibration).
import type { Methodology } from "@/src/data";
import { BandsSection } from "./sections/bands-section";
import { ChangelogSection } from "./sections/changelog-section";
import { ConfidenceSection } from "./sections/confidence-section";
import { FactorsSection } from "./sections/factors-section";
import { HeroSection } from "./sections/hero-section";
import { RedFlagsSection } from "./sections/red-flags-section";

export function MethodologyView({ methodology }: { methodology: Methodology }) {
  return (
    <>
      <HeroSection methodology={methodology} />
      <BandsSection methodology={methodology} />
      <FactorsSection methodology={methodology} />
      <RedFlagsSection methodology={methodology} />
      <ConfidenceSection methodology={methodology} />
      <ChangelogSection methodology={methodology} />
    </>
  );
}
