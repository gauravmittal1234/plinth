"use client";

// "Share the live page" (WebProject.dc.html hero): the Web Share sheet on a
// phone, a clipboard copy with a confirming toast everywhere else. It shares
// the live page's own URL, never a screenshot, so whoever opens it always
// sees today's band.
import { Button, Toast } from "@plinth/web-ui";
import { useState } from "react";
import { HERO_COPY } from "../../page/copy";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [toast, setToast] = useState<string | null>(null);

  async function share() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ url, title });
        return;
      } catch {
        // Cancelled or unsupported mid-call: fall through to the clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast(HERO_COPY.shareCopied);
    } catch {
      setToast(url);
    }
  }

  return (
    <>
      <Button variant="secondary" size="lg" onClick={() => void share()}>
        {HERO_COPY.share}
      </Button>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
