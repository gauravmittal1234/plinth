// The house date format (AGENTS.md §5, DESIGN §2.7): "18 Oct 2026". The
// actual formatting lives in the one shared module (never "Sept").
import { formatDate as formatHouseDate } from "@/src/lib/format/date";
import { COPY } from "./copy";

/** `"2026-10-14"` -> `"14 Oct 2026"`. */
export function formatDate(iso: string): string {
  return formatHouseDate(iso);
}

/** A row cell: the server's text, or the house line for a blank one (AGENTS.md §5, never a guess). */
export function cellText(cell: string | null): string {
  return cell ?? COPY.blankCell;
}
