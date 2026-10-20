// Month-index helpers for the series in afford-the-wait.ts. No Date arithmetic (time
// zones, DST, days-in-month) is needed: every month here is a calendar month, so a plain
// "months since epoch" integer is both simpler and exact.

/** `"YYYY-MM"` -> months since year 0 (`year * 12 + (month - 1)`). */
export function monthIndexOf(yearMonth: string): number {
  const [year, month] = yearMonth.split("-").map(Number) as [number, number];
  return year * 12 + (month - 1);
}

/** The inverse of `monthIndexOf`: months since year 0 -> `"YYYY-MM"`. */
export function yearMonthOf(monthIndex: number): string {
  const year = Math.floor(monthIndex / 12);
  const month = (((monthIndex % 12) + 12) % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}
