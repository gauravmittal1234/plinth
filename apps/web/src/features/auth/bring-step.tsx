"use client";

// State 3: Bring follows (DESIGN.md §5b "WebSignIn"). Nothing is pre-ticked
// and nothing merges without a tap (AGENTS.md §9 "no confirmation without a
// record" — this screen only ever shows what the reader is about to accept,
// never a result the next step hasn't produced yet).
import { RiskChip } from "@plinth/web-ui";
import Image from "next/image";
import { COPY } from "./copy";
import type { WaFollowItem } from "./data";

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
  waFollows,
  alsoChecked,
  onToggleAlso,
  onBring,
  onSkip,
}: {
  maskedPhone: string;
  projectName: string | null;
  waFollows: readonly WaFollowItem[];
  alsoChecked: boolean;
  onToggleAlso: () => void;
  onBring: () => void;
  onSkip: () => void;
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
      <p className="m-0 text-lead">{COPY.bringIntro}</p>

      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {waFollows.map((item) => {
          return (
            <li key={item.kind === "project" ? item.slug : item.name} className="flex min-h-17 items-center gap-3.5">
              {item.kind === "sheet" ? (
                <span className="flex size-14 shrink-0 items-center justify-center bg-track text-ink">
                  <SheetIcon />
                </span>
              ) : item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.imageAlt}
                  width={56}
                  height={56}
                  className="size-14 shrink-0 bg-photo object-cover"
                />
              ) : (
                <span className="size-14 shrink-0 bg-photo" aria-hidden="true" />
              )}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-lead font-semibold">{item.name}</span>
                <span className="text-small text-ink2">{item.metaLine}</span>
              </span>
              {item.kind === "project" ? (
                <RiskChip chip={item.chip} srPrefix={COPY.deliveryRiskSr} />
              ) : null}
            </li>
          );
        })}
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
          className="h-14 cursor-pointer rounded-pill border-0 bg-accent px-7 font-sans text-lead font-semibold text-on-accent"
        >
          {COPY.bringThemHere}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="min-h-11 border-0 bg-transparent p-0 font-sans text-body font-semibold text-ink underline underline-offset-5"
        >
          {COPY.notNowBring}
        </button>
      </div>
      <p className="m-0 text-small text-ink2">{COPY.bringFooter}</p>
    </div>
  );
}
