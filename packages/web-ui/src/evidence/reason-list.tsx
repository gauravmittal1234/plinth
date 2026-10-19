// The reasons (DESIGN §0, §2, §4 item 8): a real ordered list, ranked by how
// much each adds, at most 4. No number badges: order is the list's own. The
// factor group leads the sentence ("Finances: 72% of units sold, 41% built."),
// then the source chips that open the evidence.
import type { Reason, SourceRef } from "@plinth/contracts";
import { cx } from "../lib/cx";
import { SourceChip } from "./source-chip";

export type ReasonListProps = {
  reasons: readonly Reason[];
  /** Opens the evidence drawer for a source. Without it, chips link to `evidence_url`. */
  onOpenSource?: (source: SourceRef, reason: Reason) => void;
  /** Accessible name for each source chip; must contain the chip's label (WCAG 2.5.3). */
  sourceLabel?: (source: SourceRef) => string;
  /** The ground the list sits on, for the chips' tone. */
  surface?: "bg" | "track";
  className?: string;
};

export function ReasonList({
  reasons,
  onOpenSource,
  sourceLabel,
  surface = "bg",
  className,
}: ReasonListProps) {
  if (!reasons.length) return null;
  const ranked = [...reasons].sort((a, b) => a.rank - b.rank).slice(0, 4);
  return (
    <ol role="list" className={cx("m-0 flex list-none flex-col gap-6.5 p-0", className)}>
      {ranked.map((r) => (
        <li
          key={`${r.rank}-${r.factor}`}
          data-factor={r.factor}
          className="flex min-w-0 flex-col gap-2.5"
        >
          <p className="m-0">
            <strong className="font-bold">{r.factor_label}:</strong> {r.text}
          </p>
          <div className="flex flex-wrap gap-2">
            {r.sources.map((s, i) => (
              <SourceChip
                key={`${s.label}-${i}`}
                source={s}
                surface={surface}
                ariaLabel={sourceLabel?.(s)}
                onOpen={onOpenSource ? (src) => onOpenSource(src, r) : undefined}
              />
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
