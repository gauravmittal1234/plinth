"use client";

// "Not now" (T52, WORK_BREAKDOWN T52 Build; rule 9 "no confirmation without a
// record"). There is no decline RPC for an anonymous relative, so a tap never
// claims anything was sent or saved — it only reveals the one line that's
// true either way. Same shape as home/notify-toggle.tsx's honest "not saved"
// toggle. The one client island on this page; everything else is static.
import { Button } from "@plinth/web-ui";
import { useState } from "react";
import { FAMILY_JOIN_COPY } from "./copy";

export function DeclineControl({ declineText }: { declineText: string }) {
  const [declined, setDeclined] = useState(false);
  if (declined) {
    return (
      <p role="status" className="m-0 text-body text-ink2">
        {declineText}
      </p>
    );
  }
  return (
    <Button variant="tertiary" onClick={() => setDeclined(true)}>
      {FAMILY_JOIN_COPY.notNow}
    </Button>
  );
}
