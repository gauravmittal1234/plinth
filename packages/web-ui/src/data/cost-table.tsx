// The cost table (DESIGN §4 item 12): what you really pay, line by line, from
// the rules engine's CostBreakdown. A <dl> of label and amount (right-aligned),
// a tag where a line is negotiable or set by law, then the all-in total on a
// tone step (no hairline after the taste pass) and "17% more than quoted ·
// ₹18,900 per sq ft carpet". Amounts are the server's labels; nothing is summed here.
import type { CostBreakdown, CostTag } from "@plinth/contracts";
import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { Pill } from "../primitives/pill";

export type CostTableProps = {
  cost: CostBreakdown | null;
  /** The total row's term ("All-in"), from the artboard. */
  totalLabel: ReactNode;
  /** Names for the line tags ("Often negotiable", "Set by law"). A tag without a name is not shown. */
  tagLabels?: Partial<Record<CostTag, string>>;
  /** The ground the table sits on, so the total row and tags stay one step above it. */
  surface?: "bg" | "track";
  className?: string;
};

export function CostTable({
  cost,
  totalLabel,
  tagLabels,
  surface = "bg",
  className,
}: CostTableProps) {
  if (!cost) return null;
  const footnote = [cost.vs_quoted_line, cost.per_sqft_carpet_label].filter(
    (s): s is string => !!s,
  );
  return (
    <div data-cost-rules={cost.rules_version} className={cx("flex flex-col gap-3", className)}>
      <dl className="m-0 flex flex-col">
        {cost.lines.map((line) => {
          const tag = line.tag ? tagLabels?.[line.tag] : undefined;
          return (
            <div
              key={line.code}
              data-line={line.code}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1.5 py-3"
            >
              <dt className="min-w-0">{line.label}</dt>
              <dd className="m-0 text-right font-semibold whitespace-nowrap">
                {line.amount_label}
              </dd>
              {tag ? (
                <dd className="col-span-full m-0">
                  <Pill tone={surface === "track" ? "chip-on-track" : "chip"}>{tag}</Pill>
                </dd>
              ) : null}
            </div>
          );
        })}
        <div
          data-line="all_in"
          className={cx(
            "mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-panel px-5 py-4 font-bold",
            surface === "track" ? "bg-bg-solid" : "bg-track",
          )}
        >
          <dt>{totalLabel}</dt>
          <dd className="m-0 text-right whitespace-nowrap">{cost.all_in_label}</dd>
        </div>
      </dl>
      {footnote.length ? <p className="m-0 text-small text-ink2">{footnote.join(" · ")}</p> : null}
    </div>
  );
}
