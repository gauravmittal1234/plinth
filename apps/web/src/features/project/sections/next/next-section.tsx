// "So what do we do now?" (fix-project2.md §1 G-08): 2–4 steps for this band,
// each with its own proof elsewhere on the page, then two context lines: the
// Gurugram base rate and any lower-band project nearby, by a published,
// money-blind rule. Never "buy" or "don't buy" (NextSteps.intro_line says so).
import type { NextSteps } from "@plinth/contracts";
import { RiskHeader, SectionBand } from "@plinth/web-ui";
import { NEXT_COPY } from "../../page/copy";

export function NextSection({ nextSteps }: { nextSteps: NextSteps }) {
  return (
    <SectionBand id="next" tone="bg">
      <div className="flex flex-col gap-8 lg:max-w-[52rem]">
        <div className="flex flex-col gap-4">
          <h2 className="m-0 max-w-[16ch] text-balance font-display text-section font-bold">
            {NEXT_COPY.heading}
          </h2>
          <p className="m-0 max-w-measure text-lead">{nextSteps.intro_line}</p>
        </div>

        {nextSteps.steps.length > 0 ? (
          <ol role="list" className="m-0 flex list-none flex-col gap-6 p-0">
            {nextSteps.steps.map((step, i) => (
              <li key={`${i}-${step.heading}`} className="flex flex-col gap-1.5">
                <p className="m-0 font-bold">{step.heading}</p>
                <p className="m-0 text-ink2">{step.body}</p>
              </li>
            ))}
          </ol>
        ) : null}

        {nextSteps.base_rate_line ? (
          <p className="m-0 max-w-measure text-body text-ink2">{nextSteps.base_rate_line}</p>
        ) : null}

        {nextSteps.lower_band_nearby.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-small font-semibold text-ink2">{NEXT_COPY.nearbyHeading}</p>
            <ul role="list" className="m-0 flex flex-col gap-3 p-0">
              {nextSteps.lower_band_nearby.map((nearby) => (
                <li key={nearby.slug} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <a
                    href={`/gurugram/projects/${nearby.slug}`}
                    className="font-semibold text-ink underline"
                  >
                    {nearby.name ?? nearby.slug}
                  </a>
                  <RiskHeader risk={{ band: null, chip: nearby.chip, confidence: null }} size="m" />
                  <span className="text-ink2">{nearby.price_line}</span>
                </li>
              ))}
            </ul>
            {nextSteps.rule_line ? (
              <p className="m-0 text-small text-ink2">{nextSteps.rule_line}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </SectionBand>
  );
}
