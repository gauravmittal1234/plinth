// The house date format (AGENTS.md §5, DESIGN §2.7): "18 Oct 2026". Formats
// an existing ISO date from the payload; it never invents one.

const FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

/** `"2026-10-14"` (or a full timestamp) -> `"14 Oct 2026"`. */
export function formatDate(iso: string): string {
  const date = iso.length > 10 ? new Date(iso) : new Date(`${iso}T00:00:00+05:30`);
  return FORMATTER.format(date);
}

/** The calendar date part of an ISO timestamp or date, `"2026-10-14"`. */
export function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

/** `date` shifted by `deltaDays` (negative goes back), pure UTC date-number arithmetic. */
export function shiftDate(date: string, deltaDays: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + deltaDays)).toISOString().slice(0, 10);
}

/**
 * Every calendar date from `from` to `to` inclusive, for the replay slider's
 * day-by-day stops. Pure UTC date-number arithmetic (no `Date` parsed from a
 * local or IST string): a calendar date never shifts a day from a timezone
 * conversion.
 */
export function daysBetween(from: string, to: string): string[] {
  const [fy, fm, fd] = from.split("-").map(Number) as [number, number, number];
  const [ty, tm, td] = to.split("-").map(Number) as [number, number, number];
  const start = Date.UTC(fy, fm - 1, fd);
  const end = Date.UTC(ty, tm - 1, td);
  const out: string[] = [];
  for (let t = start; t <= end; t += 24 * 60 * 60 * 1000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}
