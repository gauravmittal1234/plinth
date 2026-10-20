// Date display (AGENTS.md §5 copy rules: "18 Oct 2026", day/month/year, no
// client-composed risk copy — only the digits' shape changes here).
export function formatIsoDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00+05:30`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
