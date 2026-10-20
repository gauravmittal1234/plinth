// The house date format (AGENTS.md §5, DESIGN §2.7): "18 Oct 2026". Formats
// an existing ISO date from the payload; it never invents one.
const FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

/** `"2026-10-14"` -> `"14 Oct 2026"`. */
export function formatDate(iso: string): string {
  return FORMATTER.format(new Date(`${iso}T00:00:00+05:30`));
}

/** A row cell: the server's text, or the house line for a blank one (AGENTS.md §5, never a guess). */
export function cellText(cell: string | null): string {
  return cell ?? "Not in our records yet";
}
