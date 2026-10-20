"use client";

// The evidence drawer (WebProject.dc.html, api.evidence): opened from any source
// chip, it shows the filing behind a fact: the lane, the document, its dates,
// the page, our snapshot, the extract we read, how we read it, where the fact
// is used, any developer claim, and a link to the authority's own page. Built
// on Sheet (Radix Dialog). Every value is the Evidence payload; the field names
// ("Document", "Used in") are the page's, from the artboard.
import type { Evidence, Lane } from "@plinth/contracts";
import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { ExternalIcon } from "../lib/icons";
import { laneTone } from "../lib/lane";
import { Pill } from "../primitives/pill";
import { Sheet } from "../primitives/sheet";
import { DeveloperSaysField } from "./developer-says-field";

export type EvidenceDrawerLabels = {
  /** The close button's name ("Close evidence"). */
  close: string;
  /** The lane pill's words for each lane ("Records show", "Developer says · not yet verified"). */
  lanes: Readonly<Record<Lane, string>>;
  /** Terms of the details list. */
  document: string;
  page: string;
  snapshot: string;
  /** Leads the read line ("How we read it:"). */
  read: string;
  /** Leads the used-in line ("Used in:"). */
  usedIn: string;
  /** Read after the authority link's name, since it opens a new tab ("(opens in a new tab)"). */
  newTab: string;
};

export type EvidenceDrawerProps = {
  evidence: Evidence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: EvidenceDrawerLabels;
  /** "Open our saved copy", the report-an-error form: the page's own actions. */
  footer?: ReactNode;
  /** Modal on a phone if the page wants it; non-modal by default, as in the artboard. */
  modal?: boolean;
};

export function EvidenceDrawer({
  evidence,
  open,
  onOpenChange,
  labels,
  footer,
  modal,
}: EvidenceDrawerProps) {
  if (!evidence) return null;
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      modal={modal}
      title={evidence.chip}
      description={evidence.dates_line}
      closeLabel={labels.close}
      headerStart={
        <Pill tone={laneTone(evidence.lane)} size="m" data-lane={evidence.lane}>
          {labels.lanes[evidence.lane]}
        </Pill>
      }
    >
      <dl className="m-0 grid grid-cols-[minmax(0,7.75rem)_minmax(0,1fr)] gap-x-3.5 gap-y-2.5 text-body">
        <dt className="text-ink2">{labels.document}</dt>
        <dd className="m-0">{evidence.document}</dd>
        {evidence.page ? (
          <>
            <dt className="text-ink2">{labels.page}</dt>
            <dd className="m-0">{evidence.page}</dd>
          </>
        ) : null}
        {evidence.snapshot ? (
          <>
            <dt className="text-ink2">{labels.snapshot}</dt>
            <dd className="m-0">
              <code className="text-small break-all">{evidence.snapshot.sha256_short}</code>
            </dd>
          </>
        ) : null}
      </dl>

      {evidence.extract ? (
        <blockquote className="m-0 rounded-panel bg-track px-4 py-3.5 text-body">
          {evidence.extract}
        </blockquote>
      ) : null}

      {evidence.read_line ? (
        <p className="m-0 text-body">
          <strong>{labels.read}</strong> {evidence.read_line}
        </p>
      ) : null}

      {evidence.used_in.length ? (
        <p className="m-0 text-body">
          <strong>{labels.usedIn}</strong> {evidence.used_in.join(" · ")}
        </p>
      ) : null}

      <DeveloperSaysField says={evidence.developer_says} variant="full" inset="s" />

      <p className="m-0 text-small text-ink2">{evidence.corrections_line}</p>

      {evidence.official_url && evidence.view_label ? (
        <div className="flex flex-wrap items-center gap-x-4.5 gap-y-2.5">
          <a
            href={evidence.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cx(
              "inline-flex h-11 items-center gap-2 rounded-pill bg-inverse px-4.5 text-body font-semibold text-on-inverse no-underline",
              "transition-[transform,filter] duration-(--pl-motion-duration-press) ease-out hover:brightness-110 active:scale-[0.97]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
            )}
          >
            {evidence.view_label} <span className="sr-only">{labels.newTab}</span>
            <ExternalIcon />
          </a>
        </div>
      ) : null}

      {footer}

      <p className="m-0 text-small text-ink2">{evidence.report_error.sla_line}</p>
    </Sheet>
  );
}
