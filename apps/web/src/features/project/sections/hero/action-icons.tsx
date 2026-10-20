// The hero action bar's icons (UI v2, benchmark-thapki.md: "Plinth's 'Ask
// Plinth' and 'Map' buttons have no icons"). Inline SVG, 20 px, 1.75 px round
// stroke, `currentColor` (DESIGN §3.5) — no emoji, no icon font.
import type { ComponentPropsWithoutRef } from "react";

type IconProps = Omit<ComponentPropsWithoutRef<"svg">, "viewBox" | "fill">;

const BASE = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Follow: add this project to the buyer's followed list. */
export function FollowIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6.75v6.5M6.75 10h6.5" />
    </svg>
  );
}

/** Ask Plinth: open the question composer. */
export function AskIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M3.5 5.75A2.25 2.25 0 0 1 5.75 3.5h8.5a2.25 2.25 0 0 1 2.25 2.25v5.5a2.25 2.25 0 0 1-2.25 2.25H8.5l-3.25 2.75v-2.75h-.25a2.25 2.25 0 0 1-1.5-2.25z" />
    </svg>
  );
}

/** Share the live page's URL. */
export function ShareIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M10 3v9.5M6.75 6.25 10 3l3.25 3.25" />
      <path d="M4.5 10v4.25a1.25 1.25 0 0 0 1.25 1.25h8.5a1.25 1.25 0 0 0 1.25-1.25V10" />
    </svg>
  );
}
