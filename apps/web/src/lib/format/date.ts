// The one shared date formatter (AGENTS.md §5, DESIGN §2.7/§5b): house
// copy is "18 Oct 2026", short month "Sep", and quarter ranges like
// "Jul–Sep 2026". Every feature's own format.ts delegates to this module so
// there is exactly one place that turns an ISO date (or `DateOrMonth`) from
// the payload into house copy. It never invents a date.
//
// `Intl.DateTimeFormat(locale, { month: "short" })` renders September as
// "Sept" under the en-IN and en-GB locale data shipped with Node's ICU
// build — DESIGN.md and AGENTS.md §5b always use "Sep". So month names come
// from our own fixed table, never from a locale-dependent "short" style.
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const DAY_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  timeZone: "Asia/Kolkata",
});

const YEAR_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

// Only used to read back which calendar month (1-12) a Date falls on in
// IST; "numeric" is locale-independent, so the locale here doesn't matter.
const MONTH_NUMBER_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "numeric",
  timeZone: "Asia/Kolkata",
});

/** An ISO date (`"2026-10-14"`) or a full timestamp -> a `Date`, read in IST. */
function toDate(isoOrTimestamp: string): Date {
  const withTime = isoOrTimestamp.length > 10 ? isoOrTimestamp : `${isoOrTimestamp}T00:00:00+05:30`;
  return new Date(withTime);
}

/** A `Date` -> its house short month name ("Sep"), never "Sept". */
function shortMonthOf(date: Date): string {
  const monthNumber = Number(MONTH_NUMBER_FORMATTER.format(date));
  return SHORT_MONTHS[monthNumber - 1] ?? "";
}

/** `"2026-10-14"` or a full timestamp -> `"14 Oct 2026"`. */
export function formatDate(isoOrTimestamp: string): string {
  const date = toDate(isoOrTimestamp);
  return `${DAY_FORMATTER.format(date)} ${shortMonthOf(date)} ${YEAR_FORMATTER.format(date)}`;
}

/** A `DateOrMonth` (`"2019-06"` or `"2019-06-15"`) -> `"Jun 2019"`. */
export function formatMonth(dateOrMonth: string): string {
  const day = dateOrMonth.length === 7 ? "01" : dateOrMonth.slice(8, 10) || "01";
  const date = toDate(`${dateOrMonth.slice(0, 7)}-${day}`);
  return `${shortMonthOf(date)} ${YEAR_FORMATTER.format(date)}`;
}

/**
 * Two `DateOrMonth`s spanning a quarter -> a range like `"Jul–Sep 2026"`:
 * the start month's bare name, an en dash, then `formatMonth` of the end
 * month (which carries the year).
 */
export function formatQuarterRange(startDateOrMonth: string, endDateOrMonth: string): string {
  const startDate = toDate(`${startDateOrMonth.slice(0, 7)}-01`);
  return `${shortMonthOf(startDate)}–${formatMonth(endDateOrMonth)}`;
}
