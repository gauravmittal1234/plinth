// The house date format (AGENTS.md §5, DESIGN §2.7): "18 Oct 2026".
const FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

/** `"2026-10-14"` or a full timestamp → `"14 Oct 2026"`. */
export function formatDate(iso: string): string {
  const withTime = iso.length > 10 ? iso : `${iso}T00:00:00+05:30`;
  return FORMATTER.format(new Date(withTime));
}
