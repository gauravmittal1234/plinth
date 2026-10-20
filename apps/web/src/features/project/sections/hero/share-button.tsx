"use client";

// "Share the live page" (WebProject.dc.html hero): the Web Share sheet on a
// phone, a clipboard copy with a confirming toast everywhere else. It shares
// the live page's own URL, never a screenshot, so whoever opens it always
// sees today's band. UI v2 (benchmark-thapki.md item 5): an icon-only button
// in the action bar, never a third text label beside Follow and Ask.
import { Toast } from "@plinth/web-ui";
import { useState } from "react";
import { HERO_COPY } from "../../page/copy";
import { ShareIcon } from "./action-icons";

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
      <button
        type="button"
        aria-label={HERO_COPY.share}
        onClick={() => void share()}
        className="inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-button border-0 bg-chip-fill text-ink transition-[transform,filter] duration-(--pl-motion-duration-press) ease-out hover:brightness-95 night:hover:brightness-125 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <ShareIcon aria-hidden="true" className="size-5" />
      </button>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
