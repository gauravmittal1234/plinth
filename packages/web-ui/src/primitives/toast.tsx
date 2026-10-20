"use client";

// Toast: one short confirmation ("Link copied. It opens the live page, not a
// screenshot."), bottom centre, ink on the inverse tone. The live region is
// always in the page so screen readers announce each new message; the message
// leaves on its own after `duration`. It floats, so it may carry the sheet
// shadow. The words come from the page.
import { useEffect, useRef } from "react";
import { cx } from "../lib/cx";

export type ToastProps = {
  /** The message to show; null or empty shows nothing. */
  message: string | null;
  /** Called when the message should go (after `duration`). */
  onDismiss: () => void;
  /** Milliseconds on screen. Default 3200, as in WebProject.dc.html. */
  duration?: number;
  className?: string;
};

export function Toast({ message, onDismiss, duration = 3200, className }: ToastProps) {
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  }, [onDismiss]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => dismiss.current(), duration);
    return () => clearTimeout(t);
  }, [message, duration]);
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cx(
        "pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-6",
        className,
      )}
    >
      {message ? (
        <p
          key={message}
          className="ui-rise m-0 w-max max-w-full rounded-panel bg-inverse px-5 py-3 text-body text-on-inverse shadow-sheet"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
