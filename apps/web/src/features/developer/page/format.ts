// The house date format (AGENTS.md §5, BUILD_PLAN §1 rule 7, DESIGN §2.7):
// "18 Oct 2026". Formats an existing ISO date from the payload; it never
// invents a date.
const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

/** `"2026-10-14"` → `"14 Oct 2026"`. */
export function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(`${iso}T00:00:00+05:30`));
}

/** A `DateOrMonth` (`"2019-06"` or `"2019-06-15"`) → `"Jun 2019"`. */
export function formatMonth(dateOrMonth: string): string {
  const day = dateOrMonth.length === 7 ? "01" : dateOrMonth.slice(8, 10) || "01";
  return MONTH_FORMATTER.format(new Date(`${dateOrMonth.slice(0, 7)}-${day}T00:00:00+05:30`));
}

/** A `DateOrMonth` as a fractional year, for placing it on a timeline. `null` when absent or unparseable. */
export function monthFraction(dateOrMonth: string | null | undefined): number | null {
  if (!dateOrMonth) return null;
  const m = /^(\d{4})-(\d{2})/.exec(dateOrMonth);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  return year + (month - 1) / 12;
}
