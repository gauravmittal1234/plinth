// Pill: a short label on a tone, fully round, no border (DESIGN §0). Lane tags
// ("Records show", "Developer says · not yet verified"), cost tags ("Often
// negotiable"), "Illustrative image". As a button it is a toggle: pressed
// fills with ink (the tower picker, the Dial / 100 projects switch).
import type { ComponentPropsWithoutRef } from "react";
import type { Tone } from "../lib/lane";
import { cx } from "../lib/cx";

export type PillTone = Tone | "chip" | "chip-on-track" | "inverse";

const TONE: Readonly<Record<PillTone, string>> = {
  track: "bg-track text-ink",
  claim: "bg-claim-bg text-ink",
  accent: "bg-accent-soft text-on-accent-soft",
  chip: "bg-chip-fill text-ink",
  "chip-on-track": "bg-chip-fill-on-track text-ink",
  inverse: "bg-inverse text-on-inverse",
};

const BASE = "inline-flex items-center rounded-pill font-sans font-semibold";

type SpanPillProps = ComponentPropsWithoutRef<"span"> & {
  as?: "span";
  tone?: PillTone;
  /** s: 28 px tags. m: 30 px with a slightly larger label. */
  size?: "s" | "m";
};

type ButtonPillProps = Omit<ComponentPropsWithoutRef<"button">, "type"> & {
  as: "button";
  /** The tone when not pressed. Buttons are always 44 px targets. */
  tone?: PillTone;
  /** A toggle's state; sets aria-pressed. */
  pressed?: boolean;
};

export type PillProps = SpanPillProps | ButtonPillProps;

const SIZE = { s: "min-h-7 px-3 text-caption", m: "min-h-[30px] px-3 text-small" } as const;

export function Pill(props: PillProps) {
  if (props.as === "button") {
    const { as: _as, tone = "chip", pressed, className, ...rest } = props;
    void _as;
    return (
      <button
        type="button"
        aria-pressed={pressed}
        className={cx(
          BASE,
          "min-h-11 min-w-11 max-w-full cursor-pointer justify-center border-0 px-3.5 py-1.5 text-center text-small leading-snug transition-[transform,filter] duration-(--pl-motion-duration-press) ease-out hover:brightness-95 active:scale-[0.97] night:hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          pressed ? "bg-inverse text-on-inverse" : TONE[tone],
          className,
        )}
        {...rest}
      />
    );
  }
  const { as: _as, tone = "track", size = "s", className, ...rest } = props;
  void _as;
  return (
    <span className={cx(BASE, "whitespace-nowrap", SIZE[size], TONE[tone], className)} {...rest} />
  );
}
