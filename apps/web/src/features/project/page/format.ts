// The house date format (AGENTS.md §5, BUILD_PLAN §1 rule 7, DESIGN §2.7):
// "18 Oct 2026". The actual formatting lives in the one shared module
// (never "Sept").
import { formatDate as formatHouseDate } from "@/src/lib/format/date";

/** `"2026-10-14"` → `"14 Oct 2026"`. */
export function formatDate(iso: string): string {
  return formatHouseDate(iso);
}
