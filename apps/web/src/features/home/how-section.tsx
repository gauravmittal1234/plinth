// "How does Plinth know?" (product/design/artboards/WebHome.dc.html): the
// methodology teaser, not the project page's full replay tower (that stays
// T20a's signature). One real band, one real reason, real sources.
import type { Methodology, RiskSummary } from "@/src/data";
import { ConfidenceDots, DeveloperSaysField, Riskometer, SourceChip } from "@plinth/web-ui";
import Link from "next/link";
import { formatIsoDate } from "./format";

export function HowSection({
  summary,
  bands,
}: {
  summary: RiskSummary;
  bands: Methodology["bands"];
}) {
  const { band, confidence, frequency, phase, meta, reasons, developer_response } = summary;
  return (
    <section aria-labelledby="how-h" className="bg-track py-18 md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-12 px-4 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-18 gap-y-5">
          <h2
            id="how-h"
            className="m-0 max-w-[16ch] font-display text-question font-bold tracking-[-0.03em]"
          >
            How does Plinth know?
          </h2>
          <p className="m-0 max-w-[29ch] text-lead">
            Records in, reasons out. Every band traces back to filings you can open yourself.
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-10">
          <div className="min-w-0 flex-1 basis-[26rem] rounded-panel bg-bg-solid p-8">
            {band ? (
              <div className="flex flex-col gap-4">
                <Riskometer
                  band={band}
                  label={`Riskometer pointing to ${band.label}, step ${band.step} of 5`}
                  bands={bands}
                />
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-sans text-h3 font-bold tracking-[-0.02em] text-(--ui-band-text)">
                    {band.label}
                  </span>
                  <span className="text-small text-ink2">since {formatIsoDate(band.since)}</span>
                </div>
                {frequency ? <p className="m-0 text-body">{frequency.sentence}</p> : null}
                <ConfidenceDots confidence={confidence} />
              </div>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 basis-[22rem] rounded-panel bg-bg-solid p-8">
            {reasons[0] ? (
              <div className="flex flex-col gap-5">
                <h3 className="m-0 font-sans text-h3 font-bold tracking-[-0.025em]">
                  Why {band?.label}? The first of {reasons.length} reasons
                </h3>
                <div className="flex flex-col gap-3 rounded-panel bg-track px-6 py-5.5">
                  <span className="text-lead">
                    <strong className="font-bold">{reasons[0].factor_label}:</strong>{" "}
                    {reasons[0].text}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {reasons[0].sources.map((s) => (
                      <SourceChip key={s.label} source={s} surface="track" />
                    ))}
                  </div>
                </div>
                <DeveloperSaysField says={developer_response} variant="compact" />
                <Link
                  href={`/gurugram/projects/${phase.slug}`}
                  className="self-start text-body font-semibold text-ink underline underline-offset-[0.2em]"
                >
                  See all {reasons.length} reasons
                </Link>
              </div>
            ) : null}
          </div>
        </div>
        <p className="m-0 text-small text-ink2">
          Example shown: {phase.name}, data as of {formatIsoDate(meta.data_as_of)}.
        </p>
      </div>
    </section>
  );
}
