"use client";

// "If you've already booked here" (WORK_BREAKDOWN §4 T20c; fixpass-buyer.md
// §4): the rights every allottee has, calm and factual (no "avoid", no
// "fraud"), plus the "I've booked here" toggle that switches the alerts
// line to allottee wording and points at the before-you-pay check
// (fixpass-buyer.md §4: "links to Before you pay").
import type { Slug } from "@plinth/contracts";
import { Pill } from "@plinth/web-ui";
import { useState } from "react";
import { BOOKED_INTRO, BOOKED_INTRO_DEFAULT, BOOKED_PANEL_COPY } from "./copy";

function Bullet({ heading, body, chip }: { heading: string; body: string; chip: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-panel bg-bg-solid p-5 sm:p-7">
      <h3 className="m-0 font-semibold text-ink">{heading}</h3>
      <p className="m-0 text-ink2">{body}</p>
      <span className="inline-flex w-fit items-center rounded-pill bg-chip-fill-on-track px-3 py-1 text-caption font-semibold text-ink">
        {chip}
      </span>
    </div>
  );
}

export function BookedPanel({
  slug,
  notScored = false,
  insolvency = false,
  insolvencyDate,
  watch = [],
}: {
  slug: Slug;
  /** Adds the s.13 10% rule (fixpass-buyer.md §4: "Not-scored projects add the s.13 10% rule"). */
  notScored?: boolean;
  /** True when a red-flag rule (RF1_GROUP_CIRP) admits insolvency against the promoter's group. */
  insolvency?: boolean;
  /** The NCLT order's own date, read from `risk.reasons` by the caller; required when `insolvency`. */
  insolvencyDate?: string;
  /** "What to watch" bullets, built from the payload by `watch.ts` (project-states-section.tsx). */
  watch?: readonly string[];
}) {
  const [booked, setBooked] = useState(false);
  const intro = BOOKED_INTRO[slug] ?? BOOKED_INTRO_DEFAULT;
  const copy = BOOKED_PANEL_COPY;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="m-0 font-display text-h2 font-extrabold">{copy.heading}</h2>
        <Pill
          as="button"
          pressed={booked}
          onClick={() => setBooked((b) => !b)}
          aria-label={copy.toggleLabel}
        >
          {copy.toggleLabel}
        </Pill>
      </div>

      <p className="m-0 max-w-measure text-body text-ink2">{intro}</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Bullet heading={copy.complain.heading} body={copy.complain.body} chip={copy.complain.chip} />
        <Bullet
          heading={copy.refund.heading}
          body={copy.refund.body + (notScored ? copy.refundNotScoredAddendum : "")}
          chip={copy.refund.chip}
        />
        <Bullet
          heading={copy.associations.heading}
          body={
            copy.associations.body +
            (insolvency && insolvencyDate ? copy.associationsInsolvencyAddendum(insolvencyDate) : "")
          }
          chip={copy.associations.chip}
        />
      </div>

      {watch.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h4 className="m-0 text-small font-semibold text-ink2 uppercase">What to watch</h4>
          <ul role="list" className="m-0 flex flex-col gap-1.5 p-0 text-ink2">
            {watch.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {booked ? (
        <p className="m-0 rounded-panel bg-accent-soft px-5 py-4 text-on-accent-soft">
          {copy.bookedNote}
        </p>
      ) : null}

      <p className="m-0">
        <a href={copy.beforePayHref} className="text-ink underline underline-offset-[0.2em]">
          {copy.beforePayPrompt}
        </a>
      </p>

      <p className="m-0 text-small text-ink2">{copy.footerNote}</p>
    </div>
  );
}
