// The house date format (AGENTS.md §5, DESIGN §2.7): "18 Oct 2026". The
// actual formatting lives in the one shared module (never "Sept").
import { formatDate as formatHouseDate } from "@/src/lib/format/date";

/** `"2026-10-14"` or a full timestamp → `"14 Oct 2026"`. */
export function formatDate(iso: string): string {
  return formatHouseDate(iso);
}
