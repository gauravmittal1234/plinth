"use client";

// State 4: Done — "One account, three places" (DESIGN.md §5b "WebSignIn").
// Signature move: the WhatsApp follows (if brought over) rise in beside the
// new one, staggered by position (`--ui-stagger`). `ui-rise`
// (packages/web-ui/src/styles.css) already turns itself off under
// prefers-reduced-motion, so this needs no motion check of its own.
import { RiskChip } from "@plinth/web-ui";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { COPY } from "./copy";
import type { FollowedProject } from "./data";

export function DoneStep({
  merged,
  followed,
  maskedPhone,
  alsoChecked,
  projectName,
}: {
  merged: boolean;
  followed: readonly FollowedProject[];
  maskedPhone: string;
  alsoChecked: boolean;
  projectName: string | null;
}) {
  const places = [
    { k: COPY.placeWeb, v: COPY.placeWebLine(followed.length) },
    { k: COPY.placeAndroid, v: COPY.placeAndroidLine },
    {
      k: COPY.placeWhatsapp,
      v: COPY.placeWhatsappLine(maskedPhone, alsoChecked && projectName ? projectName : null),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 id="flow-h" className="m-0 font-display text-h2 leading-tight font-extrabold">
        {COPY.doneHeading}
      </h1>
      <p className="m-0 text-lead">{COPY.doneLine(merged)}</p>

      <ul aria-label="Projects you follow" className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
        {followed.map((f, i) => {
          return (
            <li
              key={f.slug}
              style={{ "--ui-stagger": i } as CSSProperties}
              className="ui-rise flex min-h-15 items-center gap-3.5"
            >
              {f.imageUrl ? (
                <Image
                  src={f.imageUrl}
                  alt={f.imageAlt}
                  width={48}
                  height={48}
                  className="size-12 shrink-0 bg-photo object-cover"
                />
              ) : (
                <span className="size-12 shrink-0 bg-track" aria-hidden="true" />
              )}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-body font-semibold">{f.name}</span>
                <span className="text-small text-ink2">{f.metaLine}</span>
              </span>
              <RiskChip chip={f.chip} srPrefix={COPY.deliveryRiskSr} />
            </li>
          );
        })}
      </ul>

      <dl className="m-0 mt-2 flex flex-col gap-2.5 rounded-panel bg-track px-5 py-4.5">
        {places.map((pl) => (
          <div key={pl.k} className="flex flex-wrap items-baseline gap-x-3.5 gap-y-0.5">
            <dt className="basis-28 text-body font-bold">{pl.k}</dt>
            <dd className="m-0 flex-1 basis-60 text-body">{pl.v}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-1">
        <Link
          href="/following"
          className="inline-flex h-14 items-center rounded-pill bg-accent px-7 font-sans text-lead font-semibold text-on-accent no-underline"
        >
          {COPY.openFollowing}
        </Link>
        <Link
          href="/privacy"
          className="text-body font-semibold text-ink underline underline-offset-5"
        >
          {COPY.whoHasMyNumber}
        </Link>
      </div>
    </div>
  );
}
