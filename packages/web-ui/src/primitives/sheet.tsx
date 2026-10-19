"use client";

// Sheet: a Radix Dialog drawn as a side sheet (bottom sheet on a phone). It
// truly floats, so it is the one place with a shadow (DESIGN §0, §3.4). Radix
// gives the dialog role, labelling, Escape, focus moving in, and outside-click
// dismissal. Focus returns to whatever opened it (a source chip is not a Radix
// trigger, so the sheet remembers it). Non-modal by default, like the evidence
// drawer in WebProject.dc.html: the page stays readable beside it.
import { Dialog } from "radix-ui";
import { useRef, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { CloseIcon } from "../lib/icons";

export type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The sheet's heading; Radix wires it as the dialog's name. */
  title: ReactNode;
  /** An optional line under the title, wired as the dialog's description. */
  description?: ReactNode;
  /** The close button's accessible name ("Close evidence"), from the artboard. */
  closeLabel: string;
  /** Beside the close button, e.g. the lane pill. */
  headerStart?: ReactNode;
  /** Modal: traps focus and dims the page with the scrim. Default false. */
  modal?: boolean;
  children?: ReactNode;
  className?: string;
};

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  headerStart,
  modal = false,
  children,
  className,
}: SheetProps) {
  const opener = useRef<HTMLElement | null>(null);
  const leftByPointer = useRef(false);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={modal}>
      <Dialog.Portal>
        {modal ? <Dialog.Overlay className="ui-fade fixed inset-0 z-50 bg-scrim" /> : null}
        <Dialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          onOpenAutoFocus={() => {
            leftByPointer.current = false;
            opener.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onPointerDownOutside={() => {
            leftByPointer.current = true;
          }}
          onCloseAutoFocus={(event) => {
            // Closed by Escape or the close button: back to the opener. Closed by a
            // click elsewhere: focus stays where the reader clicked.
            const el = opener.current;
            if (leftByPointer.current) {
              event.preventDefault();
              return;
            }
            if (el && el.isConnected) {
              event.preventDefault();
              el.focus();
            }
          }}
          className={cx(
            "ui-sheet fixed z-50 flex flex-col gap-4 overflow-y-auto bg-sheet text-ink shadow-sheet",
            "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-panel px-5 pt-5 pb-7",
            "sm:inset-x-auto sm:top-4 sm:right-4 sm:bottom-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[min(27.5rem,calc(100vw-2rem))] sm:rounded-panel sm:px-6.5 sm:pt-6 sm:pb-7",
            "focus-visible:outline-none",
            className,
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">{headerStart}</div>
            <Dialog.Close
              aria-label={closeLabel}
              className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-pill border-0 bg-track text-ink transition-transform duration-(--pl-motion-duration-press) ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <CloseIcon />
            </Dialog.Close>
          </div>
          <Dialog.Title className="m-0 font-display text-h3 font-extrabold">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="m-0 text-body font-semibold">
              {description}
            </Dialog.Description>
          ) : null}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
