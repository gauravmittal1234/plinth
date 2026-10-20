// Inline SVG icons for the shell (DESIGN §3.5): 1.6 px stroke, round caps,
// currentColor, decorative (the control around them carries the label).

type IconProps = { className?: string };

export function MoonIcon({ className }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className={className}>
      <path
        d="M14.5 11.2A6.2 6.2 0 0 1 6.8 3.5a6.2 6.2 0 1 0 7.7 7.7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className={className}>
      <circle cx="9" cy="9" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The logo mark: a plinth line under a block, on the accent square (DESIGN §4.1). */
export function PlinthMark({ className }: IconProps) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className={className}>
      <rect x="2" y="2" width="24" height="24" rx="6" className="fill-accent" />
      <path d="M8 19h12M10 19v-7h8v7" fill="none" strokeWidth="2" className="stroke-on-accent" />
    </svg>
  );
}
