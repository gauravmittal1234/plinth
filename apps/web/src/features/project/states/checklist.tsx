// "What to check instead" (WORK_BREAKDOWN §4 T20c; fixpass-buyer.md §4):
// Limited history and Not scored have no band, so the page points at what a
// buyer can check themselves, each line with a source chip (not a live
// evidence link — these records aren't in our fact store yet, so the chip is
// a plain label, same fallback records-section.tsx uses for a fact with no
// prefetched evidence).
import { SourceChip } from "@plinth/web-ui";
import { CHECKLIST_COPY, type ChecklistItem } from "./copy";

export function Checklist({ items }: { items: readonly ChecklistItem[] }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="m-0 font-display text-h2 font-extrabold">{CHECKLIST_COPY.heading}</h2>
      <ul role="list" className="m-0 flex flex-col gap-4 p-0">
        {items.map((item, i) => (
          <li key={i} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
            {item.chip ? (
              <SourceChip source={{ label: item.chip, evidence_url: null }} surface="track" />
            ) : null}
            <p className="m-0 min-w-0 flex-1 text-ink2">
              {item.heading ? (
                <strong className="font-semibold text-ink">{item.heading}: </strong>
              ) : null}
              {item.body}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
