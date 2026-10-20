// The house date format (AGENTS.md §5, BUILD_PLAN §1 rule 7, DESIGN §2.7):
// "18 Oct 2026". The actual formatting lives in the one shared module
// (never "Sept"); this just forwards, so call sites keep their names.
import { formatDate as formatHouseDate, formatMonth as formatHouseMonth } from "@/src/lib/format/date";

/** `"2026-10-14"` → `"14 Oct 2026"`. */
export function formatDate(iso: string): string {
  return formatHouseDate(iso);
}

/** A `DateOrMonth` (`"2019-06"` or `"2019-06-15"`) → `"Jun 2019"`. */
export function formatMonth(dateOrMonth: string): string {
  return formatHouseMonth(dateOrMonth);
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
