// "Reading the new filing" (WORK_BREAKDOWN §4 T20c; fix-project2.md §2(c),
// WebProjectStates.dc.html): the 72-hour re-score track. Every rescoring
// phase is read while the model shows its old band and no figures from the
// new filing (DESIGN.md §5b, Sapphire Grove Ph 1), so the track is always at
// "two extractors, now" — the step names are the artboard's own labels; the
// dates and times are the pending fact's own sentence (`risk.pending[0].line`),
// not re-typed here.
import type { PendingFact as PendingFactData } from "@plinth/contracts";
import { RESCORING_COPY } from "./copy";
import { cx } from "../page/cx";

function Step({ label, status }: { label: string; status: "done" | "now" | "pending" }) {
  return (
    <li className="flex flex-1 flex-col items-center gap-2 text-center">
      <span
        aria-hidden="true"
        className={cx(
          "size-3 rounded-circle",
          status === "done" && "bg-accent",
          status === "now" && "bg-ink",
          status === "pending" && "border border-ink2 bg-track",
        )}
      />
      <span
        className={cx("text-small", status === "pending" ? "text-ink2" : "font-semibold text-ink")}
      >
        {label}
      </span>
      <span className="sr-only">
        {status === "done" ? "Done" : status === "now" ? "Under way now" : "Not yet"}
      </span>
    </li>
  );
}

export function RescoringSteps({ fact }: { fact: PendingFactData | undefined }) {
  if (!fact) return null;
  return (
    <div className="flex flex-col gap-6">
      <h2 className="m-0 font-display text-section font-bold">{RESCORING_COPY.heading}</h2>
      <ol role="list" className="m-0 flex list-none gap-2 p-0">
        {RESCORING_COPY.steps.map((step, i) => (
          <Step
            key={step.label}
            label={step.label}
            status={
              i < RESCORING_COPY.currentStep
                ? "done"
                : i === RESCORING_COPY.currentStep
                  ? "now"
                  : "pending"
            }
          />
        ))}
      </ol>
      <p className="m-0 max-w-measure text-body text-ink2">{fact.line}</p>
      <p className="m-0 text-small text-ink2">{RESCORING_COPY.note}</p>
    </div>
  );
}
