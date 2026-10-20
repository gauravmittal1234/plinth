// "Will it be delivered on time?" (DESIGN §4a, WebProject.dc.html): the
// page's central answer. One instrument (the riskometer/icon-array toggle),
// the confidence line beside the band (never attached to its name), the
// pending public fact with the developer's claim, up to 4 ranked reasons each
// with a source chip into the one evidence drawer, what would change the
// band, the developer's fuller reply, and the five-band scale for context.
import type { BandRange, RiskSummary } from "@plinth/contracts";
import {
  BandScale,
  DeveloperSaysField,
  DisclaimerLine,
  PendingFact,
  RiskHeader,
  SectionBand,
} from "@plinth/web-ui";
import { formatDate } from "../../page/format";
import { RISK_COPY, HERO_COPY, DISCLAIMER_LINKS } from "../../page/copy";
import { ReasonsWithEvidence } from "./reasons-with-evidence";
import { RiskInstrument } from "./risk-instrument";

export function RiskSection({
  risk,
  bands,
}: {
  risk: RiskSummary;
  bands: readonly BandRange[];
}) {
  const bandLabel = risk.band?.label ?? risk.chip.label;

  return (
    <SectionBand id="risk" tone="track">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start lg:gap-16">
        <div className="flex flex-col gap-6">
          <h2 className="m-0 max-w-[14ch] text-balance font-display text-h2 font-extrabold">
            {RISK_COPY.heading}
          </h2>
          <p className="m-0 max-w-measure text-lead">{risk.late12.line}</p>
          <p className="m-0 max-w-measure text-body text-ink2">{risk.late12.oc_not_keys_line}</p>
          {risk.progress.latest_qpr ? (
            <p className="m-0 text-small text-ink2">
              Latest QPR on file: {risk.progress.latest_qpr.label}
            </p>
          ) : null}

          <RiskHeader
            risk={risk}
            size="l"
            srPrefix={HERO_COPY.srDeliveryRisk}
            caption={
              <>
                Delivery risk · data as of {formatDate(risk.meta.data_as_of)} · {risk.meta.model_version}
              </>
            }
          />

          <BandScale bands={bands} current={risk.band?.code ?? null} label={RISK_COPY.scaleLabel} />
        </div>

        <div className="flex flex-col gap-8">
          <RiskInstrument
            band={risk.band}
            frequency={risk.frequency}
            bands={bands}
            shareLabel={risk.share.card_alt}
          />

          {risk.frequency ? (
            <div className="flex flex-col gap-1 text-center">
              <p className="m-0 max-w-measure text-body">{risk.frequency.sentence}</p>
              <p className="m-0 text-small text-ink2">{risk.frequency.reference_class_line}</p>
            </div>
          ) : null}

          {risk.pending.length > 0 ? (
            <div className="flex flex-col gap-4 rounded-panel bg-bg-solid p-5 sm:p-7">
              {risk.pending.map((fact) => (
                <PendingFact key={fact.code} fact={fact} />
              ))}
            </div>
          ) : null}

          {risk.reasons.length > 0 ? (
            <div className="flex flex-col gap-4">
              <h3 className="m-0 font-display text-h4 font-extrabold">
                {RISK_COPY.whyHeading} {bandLabel}?
              </h3>
              <p className="m-0 text-small text-ink2">{RISK_COPY.whyNote}</p>
              <ReasonsWithEvidence reasons={risk.reasons} />
            </div>
          ) : null}

          {risk.what_would_change ? (
            <div className="rounded-panel bg-accent-soft px-5 py-4 text-on-accent-soft">
              <p className="m-0 font-semibold">{RISK_COPY.whatWouldChangeHeading}</p>
              <p className="m-0 mt-1">{risk.what_would_change}</p>
            </div>
          ) : null}

          {risk.developer_response ? (
            <DeveloperSaysField says={risk.developer_response}>
              <p className="m-0 text-small">
                Our status: under review since {formatDate(risk.developer_response.published_on)}.
                {risk.developer_response.check_by
                  ? ` Decision due by ${formatDate(risk.developer_response.check_by)}.`
                  : null}
              </p>
            </DeveloperSaysField>
          ) : null}

          <DisclaimerLine
            meta={risk.meta}
            trailing={`Data as of ${formatDate(risk.meta.data_as_of)} · model ${risk.meta.model_version}.`}
            links={DISCLAIMER_LINKS}
          />
        </div>
      </div>
    </SectionBand>
  );
}
