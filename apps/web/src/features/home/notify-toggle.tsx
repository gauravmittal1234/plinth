"use client";

// "Notify me" / "Join the waitlist" (DESIGN §5b coverage): there is no
// `api.*` write for a corridor waitlist yet (a handoff in this PR), so this
// is a local, honest opt-in toggle — it never claims to have sent anything,
// only records the reader's wish on this page.
import { Button } from "@plinth/web-ui";
import { useState } from "react";

export function NotifyToggle({
  idleLabel,
  confirmedLine,
}: {
  idleLabel: string;
  confirmedLine: string;
}) {
  const [on, setOn] = useState(false);
  if (on) {
    return (
      <p role="status" className="m-0 text-body">
        {confirmedLine}
      </p>
    );
  }
  return (
    <Button variant="secondary" surface="track" onClick={() => setOn(true)}>
      {idleLabel}
    </Button>
  );
}
