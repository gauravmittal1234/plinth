"use client";

// "Join the Noida waitlist" (G-30, outside-coverage). There is no waitlist API
// yet (no entry in apps/web/src/data/registry.ts). Handoff: needs an
// api.waitlist_join (area, WhatsApp consent) RPC; until then nothing is
// recorded, so a click shows an honest "nothing was saved" status instead of
// a fake waitlist confirmation.
import { useState } from "react";
import { Button } from "@plinth/web-ui";
import { SEARCH_COPY } from "./copy";

export type NoidaWaitlistProps = {
  /** "One WhatsApp message when Noida opens, planned for Jul–Sep 2027. Nothing else." */
  detailLine: string;
};

export function NoidaWaitlist({ detailLine }: NoidaWaitlistProps) {
  const [clicked, setClicked] = useState(false);
  if (clicked) {
    return (
      <div role="status" className="flex flex-col items-start gap-2">
        <p className="m-0 text-body">{SEARCH_COPY.waitlistNotSaved}</p>
        <p className="m-0 text-small text-ink2">{detailLine}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={() => setClicked(true)}>{SEARCH_COPY.joinWaitlist}</Button>
      <p className="m-0 text-small text-ink2">{detailLine}</p>
    </div>
  );
}
