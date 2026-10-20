// The guided story for a developer group (WebDeveloper.dc.html): Hero → Who
// answers here (claim) → why there's no band, when facts-only → Does it
// deliver on time? → What's building now → HARERA complaints → Before RERA →
// What does it say? → How buyers find its projects. One <h1> lives in
// HeroSection; every other heading is an <h2>.
import { DisclaimerLine } from "@plinth/web-ui";
import { ClaimSection } from "../sections/claim/claim-section";
import { ComplaintsSection } from "../sections/complaints/complaints-section";
import { FactsOnlySection } from "../sections/facts-only/facts-only-section";
import { HowBuyersFindSection } from "../sections/find/how-buyers-find-section";
import { HeroSection } from "../sections/hero/hero-section";
import { OngoingSection } from "../sections/ongoing/ongoing-section";
import { PreReraSection } from "../sections/prerera/prerera-section";
import { ReplySection } from "../sections/reply/reply-section";
import { TrackRecordSection } from "../sections/track-record/track-record-section";
import { DISCLAIMER_LINKS } from "./copy";
import { formatDate } from "./format";
import type { DeveloperData } from "./load-developer";

export function DeveloperPageView({ data }: { data: DeveloperData }) {
  const { page } = data;
  const { group } = page;
  const factsOnlyNotice = group.mode === "facts_only" ? page.facts_only : null;

  return (
    <>
      <HeroSection page={page} />

      <ClaimSection group={group} explainerLine={page.claim_explainer_line ?? null} />

      {factsOnlyNotice ? <FactsOnlySection notice={factsOnlyNotice} /> : null}

      <TrackRecordSection
        group={group}
        trackRecord={page.track_record}
        insolvencyLine={page.insolvency_line}
      />

      <OngoingSection name={group.name} phases={page.ongoing} />

      {page.complaints ? <ComplaintsSection complaints={page.complaints} /> : null}

      {page.pre_rera ? <PreReraSection preRera={page.pre_rera} /> : null}

      <ReplySection name={group.name} reply={page.reply} />

      {page.how_buyers_find_you ? (
        <HowBuyersFindSection name={group.name} data={page.how_buyers_find_you} />
      ) : null}

      <section className="bg-bg px-4 py-9 text-ink sm:px-8 sm:py-12">
        <div className="mx-auto w-full max-w-[79rem]">
          <DisclaimerLine
            meta={{ disclaimer_line: page.meta.disclaimer_line ?? "" }}
            trailing={
              page.meta.model_version
                ? `Data as of ${formatDate(page.meta.data_as_of)} · model ${page.meta.model_version}.`
                : `Data as of ${formatDate(page.meta.data_as_of)}.`
            }
            links={DISCLAIMER_LINKS}
          />
        </div>
      </section>
    </>
  );
}
