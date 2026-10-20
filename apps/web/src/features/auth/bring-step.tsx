"use client";

// State 3: Bring follows (DESIGN.md §5b "WebSignIn"). Nothing is pre-ticked
// and nothing merges without a tap (AGENTS.md §9 "no confirmation without a
// record" — this screen only ever shows what the preview call found, never a
// result the next step hasn't produced yet). The counts and names are
// `preview`'s own (src/features/auth/actions.ts), never fixed text (lead
// review of #62).
import { RiskChip } from "@plinth/web-ui";
import Image from "next/image";
import type { WaPreview } from "./actions";
import { COPY } from "./copy";
import { formatDate } from "./format";

function SheetIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3.5h7l4 4v13H7z M14 3.5v4h4 M9.5 12h6M9.5 15.5h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BringStep({
  maskedPhone,
  projectName,
  preview,
  alsoChecked,
  onToggleAlso,
  onBring,
  onSkip,
  pending,
}: {
  maskedPhone: string;
  projectName: string | null;
  preview: WaPreview;
  alsoChecked: boolean;
  onToggleAlso: () => void;
  onBring: () => void;
  onSkip: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h1 id="flow-h" className="m-0 font-display text-h2 leading-tight font-extrabold">
        {COPY.bringHeading}
      </h1>
      <p className="m-0 flex items-center gap-2 text-small text-ink2">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M3.5 8.5l3 3 6-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {COPY.signedLine(maskedPhone, projectName)}
      </p>
      <p className="m-0 text-lead">{COPY.bringIntro(preview.follows.length, preview.costSheets.length)}</p>

      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {preview.follows.map((follow) => (
          <li key={follow.slug} className="flex min-h-17 items-center gap-3.5">
            {follow.imageUrl ? (
              <Image
                src={follow.imageUrl}
                alt={`Illustrative image: ${follow.name}`}
                width={56}
                height={56}
                className="size-14 shrink-0 bg-photo object-cover"
              />
            ) : (
              <span className="size-14 shrink-0 bg-photo" aria-hidden="true" />
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-lead font-semibold">{follow.name}</span>
              <span className="text-small text-ink2">
                Followed on WhatsApp since {formatDate(follow.since)}
              </span>
            </span>
            <RiskChip chip={follow.chip} srPrefix={COPY.deliveryRiskSr} />
          </li>
        ))}
        {preview.costSheets.map((sheet) => (
          <li key={sheet.label} className="flex min-h-17 items-center gap-3.5">
            <span className="flex size-14 shrink-0 items-center justify-center bg-track text-ink">
              <SheetIcon />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-lead font-semibold">{sheet.label}</span>
              <span className="text-small text-ink2">{COPY.costSheetMeta(formatDate(sheet.savedOn))}</span>
            </span>
          </li>
        ))}
      </ul>

      {projectName ? (
        <button
          type="button"
          role="checkbox"
          aria-checked={alsoChecked}
          onClick={onToggleAlso}
          className="flex min-h-14 items-start gap-3.5 border-0 bg-transparent p-0 text-left"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-panel border-2"
            style={{
              borderColor: "var(--pl-color-ink)",
              backgroundColor: alsoChecked ? "var(--pl-color-ink)" : "transparent",
            }}
          >
            {alsoChecked ? (
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  fill="none"
                  stroke="var(--pl-color-on-inverse)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
          <span className="flex flex-col">
            <span className="text-body font-semibold text-ink">{COPY.alsoSendAlerts(projectName)}</span>
            <span className="text-small text-ink2">{COPY.alsoSendAlertsHint}</span>
          </span>
        </button>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
        <button
          type="button"
          onClick={onBring}
          disabled={pending}
          className="h-14 cursor-pointer rounded-pill border-0 bg-accent px-7 font-sans text-lead font-semibold text-on-accent disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-fg"
        >
          {COPY.bringThemHere}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={pending}
          className="min-h-11 border-0 bg-transparent p-0 font-sans text-body font-semibold text-ink underline underline-offset-5 disabled:cursor-not-allowed disabled:text-disabled-fg"
        >
          {COPY.notNowBring}
        </button>
      </div>
      <p className="m-0 text-small text-ink2">{COPY.bringFooter}</p>
    </div>
  );
}
