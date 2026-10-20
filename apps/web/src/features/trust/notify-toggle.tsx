"use client";

// "Notify me" (DESIGN §5b coverage). Handoff: needs an api.waitlist_join
// (area, WhatsApp consent) RPC; until then nothing is recorded, so a click
// shows an honest "nothing was saved" status instead of a fake waitlist
// confirmation. Mirrors apps/web/src/features/home/notify-toggle.tsx (T21),
// kept local so this task edits only the paths it owns (OWNERSHIP.md).
import { Button } from "@plinth/web-ui";
import { useState } from "react";
import { TRUST_COPY } from "./copy";

export function NotifyToggle({ idleLabel }: { idleLabel: string }) {
  const [clicked, setClicked] = useState(false);
  if (clicked) {
    return (
      <p role="status" className="m-0 text-body">
        {TRUST_COPY.waitlistNotSaved}
      </p>
    );
  }
  return (
    <Button variant="secondary" surface="track" onClick={() => setClicked(true)}>
      {idleLabel}
    </Button>
  );
}
