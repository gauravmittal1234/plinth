"use client";

// The one interactive part of "If you've already booked here": the
// "I've booked here" pill and the allottee note it reveals. Everything else
// in the panel is server-rendered and passed in as `children` / `after`, so
// the copy module never ships to the client (project-page JS budget).
import { Pill } from "@plinth/web-ui";
import { useState, type ReactNode } from "react";

export function BookedToggle({
  heading,
  label,
  note,
  children,
  after,
}: {
  heading: string;
  label: string;
  note: string;
  children: ReactNode;
  after: ReactNode;
}) {
  const [booked, setBooked] = useState(false);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="m-0 font-display text-h2 font-extrabold">{heading}</h2>
        <Pill as="button" pressed={booked} onClick={() => setBooked((b) => !b)} aria-label={label}>
          {label}
        </Pill>
      </div>
      {children}
      {booked ? (
        <p className="m-0 rounded-panel bg-accent-soft px-5 py-4 text-on-accent-soft">{note}</p>
      ) : null}
      {after}
    </div>
  );
}
