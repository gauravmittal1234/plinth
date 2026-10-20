// The hero (DESIGN §4a item 5, WebProject.dc.html): a full-bleed photo, the
// project's name, one plain summary sentence and the page's one primary
// action (Follow) beside Ask and Share. No floating action bar (DESIGN §0
// overrides §4a item 6): the buttons sit in the hero's own flow.
import type { ProjectPage } from "@plinth/contracts";
import { Button } from "@plinth/web-ui";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "../../page/format";
import { HERO_COPY } from "../../page/copy";
import { RiskChipGate } from "../../page/risk-chip-gate";
import { ShareButton } from "./share-button";

const IMAGE_SIZES = "(min-width: 1280px) 1216px, 100vw";

export function HeroSection({ page }: { page: ProjectPage }) {
  const { risk, hero } = page;
  const { phase } = risk;
  const developerHref = `/gurugram/developers/${phase.developer.slug}`;

  return (
    <section aria-label={phase.name} className="bg-bg text-ink">
      <div className="relative h-[clamp(22rem,50vw,34rem)] w-full">
        {hero.image_url ? (
          <Image
            src={hero.image_url}
            alt=""
            fill
            preload
            fetchPriority="high"
            sizes={IMAGE_SIZES}
            className="object-cover"
          />
        ) : (
          <div aria-hidden="true" className="h-full w-full bg-track" />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-2/3 bg-[linear-gradient(to_top,var(--pl-color-scrim),transparent)]"
        />
        {hero.image_caption ? (
          <span className="absolute bottom-4 left-4 inline-flex h-7 items-center rounded-pill bg-inverse px-3 text-caption font-semibold text-on-inverse">
            {hero.image_caption}
          </span>
        ) : null}
      </div>

      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-6 px-4 py-9 sm:px-8 sm:py-12">
        <p className="m-0 text-small text-ink2">
          <a
            href={hero.rera_badge.authority_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline"
          >
            RERA {hero.rera_badge.number}
          </a>
          {" · verified "}
          {formatDate(risk.meta.data_as_of)}
          <br />
          {phase.locality_line}, Gurugram · by{" "}
          <Link href={developerHref} className="text-ink underline">
            {phase.developer.name}
          </Link>{" "}
          · {phase.developer.claim.line}
        </p>

        <p className="m-0">
          <span className="sr-only">{HERO_COPY.srDeliveryRisk}</span>
          <RiskChipGate chip={risk.chip} />
        </p>

        <h1 className="m-0 max-w-[16ch] text-balance font-display text-[clamp(2.75rem,6.5vw,4.5rem)] leading-[0.96] font-extrabold tracking-[-0.03em]">
          {phase.name}
        </h1>

        <p className="m-0 max-w-measure text-lead">{hero.summary_line}</p>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" asChild>
            <Link href={`/sign-in?next=/gurugram/projects/${phase.slug}`}>{HERO_COPY.follow}</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <a href="#ask">{HERO_COPY.ask}</a>
          </Button>
          <ShareButton url={risk.meta.live_url} title={phase.name} />
        </div>
        <p className="m-0 text-small text-ink2">{HERO_COPY.alertsLine}</p>
      </div>
    </section>
  );
}
