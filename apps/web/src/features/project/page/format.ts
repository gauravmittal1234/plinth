// The house date format (AGENTS.md §5, BUILD_PLAN §1 rule 7, DESIGN §2.7):
// "18 Oct 2026". Formats an existing ISO date from the payload; it never
// invents a date.
const FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

/** `"2026-10-14"` → `"14 Oct 2026"`. */
export function formatDate(iso: string): string {
  return FORMATTER.format(new Date(`${iso}T00:00:00+05:30`));
}
