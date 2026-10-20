// The developer hero (WebDeveloper.dc.html): breadcrumb, the group's name,
// its one-line summary and, when the group is facts-only, the short notice
// with a link down to the full explainer (`#facts-only`, FactsOnlySection).
// The claim line itself (Build: "the claim line (claimed / not yet
// claimed)") lives in ClaimSection, right below, so it appears once.
import type { DeveloperPage } from "@plinth/contracts";
import { Button } from "@plinth/web-ui";
import Link from "next/link";
import { FACTS_ONLY_COPY, HERO_COPY } from "../../page/copy";
import { formatDate } from "../../page/format";
import { AskIcon } from "./action-icons";
import { ShareButton } from "./share-button";

export function HeroSection({ page }: { page: DeveloperPage }) {
  const { group, meta } = page;
  const factsOnly = group.mode === "facts_only" ? page.facts_only : null;

  return (
    <section aria-label={group.name} className="bg-bg text-ink">
      <div aria-hidden="true" className="relative h-[clamp(12rem,26vw,18rem)] w-full bg-track">
        <span className="absolute bottom-4 left-4 inline-flex h-7 items-center rounded-pill bg-inverse px-3 text-caption font-semibold text-on-inverse">
          {HERO_COPY.imageCaption}
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-6 px-4 py-9 sm:px-8 sm:py-12">
        <p className="m-0 text-small text-ink2">
          <span>Gurugram / Developers / {group.name}</span>
          <br />
          Records as of {formatDate(meta.data_as_of)}
          {meta.model_version ? ` · model ${meta.model_version}` : null}
        </p>

        <h1 className="m-0 max-w-[20ch] text-balance font-display text-[clamp(2.75rem,6.5vw,4.5rem)] leading-[0.96] font-bold tracking-[-0.03em]">
          {group.name}
        </h1>

        {page.summary_line ? (
          <p className="m-0 max-w-measure text-lead">{page.summary_line}</p>
        ) : null}

        {factsOnly ? (
          <p className="m-0 max-w-measure rounded-panel bg-track px-5 py-4 text-body">
            {factsOnly.line}{" "}
            <a
              href={`#${factsOnly.anchor ?? FACTS_ONLY_COPY.anchor}`}
              className="text-ink underline"
            >
              {HERO_COPY.howFactsOnlyWorks}
            </a>
          </p>
        ) : null}

        <div className="flex flex-nowrap items-center gap-3 overflow-x-auto">
          <Button variant="secondary" size="lg" asChild>
            <Link href="/#ask">
              <AskIcon aria-hidden="true" className="size-5 shrink-0" />
              {HERO_COPY.ask(group.name)}
            </Link>
          </Button>
          <ShareButton url={meta.live_url ?? ""} title={group.name} />
        </div>
      </div>
    </section>
  );
}
