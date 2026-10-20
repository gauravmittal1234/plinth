"use client";

// "Join the Noida waitlist" (G-30, outside-coverage). There is no waitlist API
// yet (no entry in apps/web/src/data/registry.ts) — this is a local, honest
// toggle: it never claims to have messaged anyone, it only reflects what the
// reader just asked for in this visit. Handoff: a durable waitlist write
// arrives with the comms infrastructure (BUILD_PLAN wave 4, T42 Outbox).
import { useState } from "react";
import { Button } from "@plinth/web-ui";
import { SEARCH_COPY } from "./copy";

export type NoidaWaitlistProps = {
  /** "One WhatsApp message when Noida opens, planned for Jul–Sep 2027. Nothing else." */
  detailLine: string;
};

export function NoidaWaitlist({ detailLine }: NoidaWaitlistProps) {
  const [joined, setJoined] = useState(false);
  if (joined) {
    return (
      <div role="status" className="flex flex-col items-start gap-2">
        <p className="m-0 text-body font-semibold">{SEARCH_COPY.onWaitlist}</p>
        <p className="m-0 text-small text-ink2">{detailLine}</p>
        <Button variant="tertiary" onClick={() => setJoined(false)}>
          {SEARCH_COPY.leaveWaitlist}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-2">
      {/* variant="secondary": see the note in free-text-editor.tsx (missing
          @plinth/web-ui/styles.css import; a visible primary button fails
          axe color-contrast until that lands). */}
      <Button variant="secondary" surface="track" onClick={() => setJoined(true)}>
        {SEARCH_COPY.joinWaitlist}
      </Button>
      <p className="m-0 text-small text-ink2">{detailLine}</p>
    </div>
  );
}
