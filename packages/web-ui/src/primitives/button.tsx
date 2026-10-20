// Button (DESIGN §0, §4 item 2): one primary action per screen, in the accent;
// secondary is a tone fill (no outline after the taste pass); tertiary is an
// ink link with an underline, never green. Fully round, 52 px for the page's
// main action, 44 px otherwise. Press, hover and focus feedback on every one.
// `asChild` renders the styles on a link (Radix Slot), so a navigation stays an <a>.
// `radix-ui/slot` re-exports only `@radix-ui/react-slot`, not the unified
// package's root barrel (every Radix primitive) — see sheet.tsx's comment.
import * as Slot from "radix-ui/slot";
import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../lib/cx";

export type ButtonVariant = "primary" | "secondary" | "tertiary";

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  /** lg: 52 px (the page's main action). md: 44 px. */
  size?: "md" | "lg";
  /** The ground a secondary button sits on, so its fill stays one step above it. */
  surface?: "bg" | "track" | "claim";
  /** Render the styles on the single child (an <a> or a framework Link). */
  asChild?: boolean;
};

const SECONDARY = {
  bg: "bg-chip-fill",
  track: "bg-chip-fill-on-track",
  claim: "bg-chip-fill-on-claim",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  surface = "bg",
  asChild = false,
  className,
  type,
  ...rest
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  const classes = cx(
    "inline-flex cursor-pointer items-center justify-center gap-2.5 border-0 font-sans font-semibold no-underline",
    "transition-[transform,filter,background-color] duration-(--pl-motion-duration-press) ease-out active:scale-[0.97]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    "disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-fg disabled:active:scale-100",
    "aria-disabled:cursor-not-allowed aria-disabled:bg-disabled-bg aria-disabled:text-disabled-fg",
    variant !== "tertiary" && "rounded-pill",
    variant !== "tertiary" && (size === "lg" ? "h-13 px-6.5 text-body" : "h-11 px-4.5 text-body"),
    variant === "primary" &&
      "bg-accent text-on-accent hover:brightness-95 night:hover:brightness-110 aria-pressed:bg-accent-soft aria-pressed:text-on-accent-soft",
    variant === "secondary" &&
      cx(SECONDARY[surface], "text-ink hover:brightness-95 night:hover:brightness-125"),
    variant === "tertiary" &&
      "min-h-11 bg-transparent px-0 text-body text-ink underline decoration-1 underline-offset-[0.2em] hover:decoration-2",
    className,
  );
  if (asChild) return <Comp className={classes} {...rest} />;
  return <button type={type ?? "button"} className={classes} {...rest} />;
}
