// WebAbout (T25; WORK_BREAKDOWN T25 Build: the identity register, the
// calibration table, the response-time board, coverage today/next with
// Notify me). Built from `@/src/data` reads only, same pattern as WebHome
// (T21): the page composes section components over one `about()` read.
import type { About } from "@/src/data";
import { CalibrationSection } from "./sections/calibration-section";
import { CoverageSection } from "./sections/coverage-section";
import { HeroSection } from "./sections/hero-section";
import { IdentitySection } from "./sections/identity-section";
import { MoneySection } from "./sections/money-section";
import { ResponseTimeSection } from "./sections/response-time-section";

export function AboutView({ about }: { about: About }) {
  return (
    <>
      <HeroSection about={about} />
      <IdentitySection identity={about.identity} />
      <CalibrationSection calibration={about.calibration} />
      <MoneySection money={about.money} />
      <ResponseTimeSection responseTimes={about.response_times} grievance={about.grievance} />
      <CoverageSection coverage={about.coverage} />
    </>
  );
}
