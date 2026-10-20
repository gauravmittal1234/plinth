// Inline icons (DESIGN §3.5): 1.3–2 px strokes, round caps, currentColor, always
// aria-hidden. A control that shows only an icon carries its own aria-label.
type IconProps = { className?: string };

const base = { "aria-hidden": true, focusable: false } as const;

/** A filed document: the source chip's mark. */
export function DocIcon({ className }: IconProps) {
  return (
    <svg {...base} width="12" height="14" viewBox="0 0 12 14" className={className}>
      <path
        d="M2 1h5l3 3v9H2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M4 7h4M4 9.5h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A speech bubble: "Developer says" and "From the developer". */
export function SpeechIcon({ className, size = 16 }: IconProps & { size?: number }) {
  return (
    <svg {...base} width={size} height={size} viewBox="0 0 16 16" className={className}>
      <path
        d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A clock: a pending fact. */
export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} width="22" height="22" viewBox="0 0 20 20" className={className}>
      <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M10 5.5V10l3 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} width="18" height="18" viewBox="0 0 20 20" className={className}>
      <path
        d="M12.5 4.5L7 10l5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base} width="18" height="18" viewBox="0 0 20 20" className={className}>
      <path
        d="M7.5 4.5L13 10l-5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...base} width="18" height="18" viewBox="0 0 20 20" className={className}>
      <path
        d="M5 5l10 10M15 5L5 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Opens the authority's own page in a new tab. */
export function ExternalIcon({ className }: IconProps) {
  return (
    <svg {...base} width="14" height="14" viewBox="0 0 20 20" className={className}>
      <path
        d="M8.5 4H5a1.5 1.5 0 0 0-1.5 1.5v9.5A1.5 1.5 0 0 0 5 16.5h9.5A1.5 1.5 0 0 0 16 15v-3.5M11.5 3.5h5v5M16.5 3.5l-7.5 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
