"use client";

// "Notify me" / "Join the waitlist" (DESIGN §5b coverage). Handoff: needs an
// api.waitlist_join (area, WhatsApp consent) RPC; until then nothing is
// recorded, so a click shows an honest "nothing was saved" status instead of
// a fake waitlist confirmation.
import { Button } from "@plinth/web-ui";
import { useState } from "react";
import { HOME_COPY } from "./copy";

export function NotifyToggle({ idleLabel }: { idleLabel: string }) {
  const [clicked, setClicked] = useState(false);
  if (clicked) {
    return (
      <p role="status" className="m-0 text-body">
        {HOME_COPY.waitlistNotSaved}
      </p>
    );
  }
  return (
    <Button variant="secondary" surface="track" onClick={() => setClicked(true)}>
      {idleLabel}
    </Button>
  );
}
