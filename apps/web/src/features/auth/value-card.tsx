// The value card (DESIGN.md §5b "WebSignIn": "value before the ask"): the
// project risk card stays fully open through every step, so signing in is
// never the price of reading it. Facts are the project's own project_page;
// this file only lays them out (AGENTS.md §5, "never composed in a client").
import { ReasonList, RiskChip } from "@plinth/web-ui";
import Image from "next/image";
import type { ProjectPage } from "@/src/data";
import { COPY } from "./copy";
import { formatDate } from "./format";

export function ValueCard({ page }: { page: ProjectPage }) {
  const { risk, hero } = page;
  const { phase, price } = risk;
  return (
    <article
      aria-labelledby="value-card-h"
      className="flex min-w-0 flex-1 basis-[32rem] flex-col overflow-hidden rounded-panel"
    >
      <div className="relative h-44 overflow-hidden bg-track">
        {hero.image_url ? (
          <Image
            src={hero.image_url}
            alt={`Illustrative image: ${phase.name}`}
            fill
            sizes="(min-width: 640px) 32rem, 100vw"
            className="object-cover"
          />
        ) : null}
        <span className="absolute bottom-3 left-3 rounded-pill bg-bg-solid px-2.5 py-1 text-caption text-ink">
          {COPY.illustrativeImage}
        </span>
      </div>
      <div className="flex flex-col gap-3.5 bg-track px-7 py-6.5">
        <div className="flex flex-col">
          <h2 id="value-card-h" className="m-0 font-display text-h3 font-extrabold">
            {phase.name}
          </h2>
          <span className="text-body text-ink2">
            {phase.developer.name} · {phase.locality_line}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 gap-y-2">
          <RiskChip chip={risk.chip} srPrefix={COPY.deliveryRiskSr} />
          <span className="text-small text-ink2">
            {COPY.riskCaption(formatDate(risk.meta.data_as_of), risk.meta.model_version)}
          </span>
        </div>
        {risk.frequency ? <p className="m-0 text-body">{risk.frequency.sentence}</p> : null}
        <ReasonList reasons={risk.reasons.slice(0, 3)} surface="track" />
        {price ? (
          <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <strong className="font-display text-lead font-extrabold">{price.all_in_label} all-in</strong>
            <span className="text-small text-ink2">
              quoted {price.quoted_label} · {price.basis_line}
            </span>
          </p>
        ) : null}
        <p className="m-0 text-small text-ink2">{COPY.readingWithoutAccount}</p>
      </div>
    </article>
  );
}
