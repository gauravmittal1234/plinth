// The house date format (AGENTS.md §5, DESIGN §2.7): "18 Oct 2026". Formats
// an existing ISO date from the payload; it never invents one.
const FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

/**
 * `"2026-10-14"` -> `"14 Oct 2026"`. Node's en-IN data gives September as
 * "Sept" (4 letters) while every other month is 3, which breaks "followed
 * on WhatsApp since 14 Sep 2026" (DESIGN.md §5b "WebSignIn"); the one-word
 * fix keeps every month at 3 letters, as the house format expects.
 */
export function formatDate(iso: string): string {
  return FORMATTER.format(new Date(`${iso}T00:00:00+05:30`)).replace("Sept", "Sep");
}
