// Date display (AGENTS.md §5 copy rules: "18 Oct 2026", day/month/year, no
// client-composed risk copy — only the digits' shape changes here). The
// actual formatting lives in the one shared module (never "Sept").
import { formatDate } from "@/src/lib/format/date";

export function formatIsoDate(iso: string): string {
  return formatDate(iso);
}
