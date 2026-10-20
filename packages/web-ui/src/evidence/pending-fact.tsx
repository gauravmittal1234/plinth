// A pending fact (API_CONTRACTS §2): a public fact that may move the band, with
// what happens next ("If it is still missing on 25 Oct 2026, this band may
// change; followers hear first.") and the developer's claim beside it. It never
// carries the proposed band. Every line is the contract's.
import type { PendingFact as PendingFactData } from "@plinth/contracts";
import { cx } from "../lib/cx";
import { ClockIcon } from "../lib/icons";
import { DeveloperSaysField } from "./developer-says-field";

export type PendingFactProps = {
  fact: PendingFactData | null | undefined;
  className?: string;
};

export function PendingFact({ fact, className }: PendingFactProps) {
  if (!fact) return null;
  return (
    <div data-pending={fact.code} className={cx("flex flex-col gap-2.5", className)}>
      <p className="m-0 flex items-start gap-3">
        <ClockIcon className="mt-[0.15em] shrink-0" />
        <span>
          <strong className="font-semibold">{fact.line}</strong>
          {fact.marker_line ? <> {fact.marker_line}</> : null}
        </span>
      </p>
      <DeveloperSaysField says={fact.developer_says} variant="compact" />
    </div>
  );
}
