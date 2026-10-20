// "From the developer · not verified by Plinth" (F-97; WebProject #from-dev): what
// a developer published in its free workspace, shown as given, in the claim tone.
// It is not a public record and never feeds a band. The header, the current
// price list and the payment plan come from the contract; page-specific lines
// (price history, links) go in `children`.
import type { FromDeveloper, PaymentStage } from "@plinth/contracts";
import { useId, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { SpeechIcon } from "../lib/icons";

export type FromDeveloperBlockProps = {
  data: FromDeveloper | null;
  /** Heading over the current price list ("Price list, 2 Oct 2026"), at the page's level. */
  priceListHeading?: ReactNode;
  /** Heading over the payment plan ("Payment plan: construction-linked"). */
  paymentPlanHeading?: ReactNode;
  /** A line under a stage ("On record: Jan–Mar 2026 QPR"), from the page. */
  stageNote?: (stage: PaymentStage) => ReactNode;
  /** Marks a stage the page wants read first (the slab 12 demand ahead of the record). */
  flagStage?: (stage: PaymentStage) => boolean;
  children?: ReactNode;
  className?: string;
};

/** The finished lines the fixture adds beside the typed fields (open object in the contract). */
function line(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function FromDeveloperBlock({
  data,
  priceListHeading,
  paymentPlanHeading,
  stageNote,
  flagStage,
  children,
  className,
}: FromDeveloperBlockProps) {
  const id = useId();
  if (!data) return null;
  const list = data.price_lists.find((p) => p.current) ?? data.price_lists[0] ?? null;
  const plan = data.payment_plan;
  const updated = line(data.updated_line);
  const note = line(data.note_line);
  const basis = line(data.price_basis_line);
  return (
    <section
      aria-labelledby={`${id}-label`}
      data-lane="from_developer"
      className={cx(
        "flex flex-wrap gap-x-18 gap-y-10 rounded-panel bg-claim-bg p-6 text-ink sm:p-10",
        className,
      )}
    >
      <header className="flex basis-full flex-col gap-1.5">
        <p id={`${id}-label`} className="m-0 flex items-center gap-2.5 font-bold">
          <SpeechIcon className="shrink-0" size={18} />
          {data.label}
        </p>
        {updated ? <p className="m-0 text-small font-semibold">{updated}</p> : null}
        {note ? <p className="m-0 max-w-measure text-small text-ink2">{note}</p> : null}
      </header>

      {list ? (
        <div
          data-price-list={list.published_on}
          className="flex min-w-0 flex-[1_1_20rem] flex-col gap-4"
        >
          {priceListHeading}
          <dl className="m-0 flex flex-col gap-4">
            {list.items.map((item) => (
              <div
                key={item.unit_label}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
              >
                <dt className="flex flex-col">
                  <span>{item.unit_label}</span>
                  {item.per_sqft_line ? (
                    <span className="text-small text-ink2">{item.per_sqft_line}</span>
                  ) : null}
                </dt>
                <dd className="m-0 font-bold">{item.price_line}</dd>
              </div>
            ))}
          </dl>
          {basis ? <p className="m-0 text-small text-ink2">{basis}</p> : null}
        </div>
      ) : null}

      {plan && plan.stages.length ? (
        <div className="flex min-w-0 flex-[1_1_22rem] flex-col gap-4">
          {paymentPlanHeading}
          <ol role="list" className="m-0 flex list-none flex-col gap-0.5 p-0">
            {plan.stages.map((stage) => {
              const flagged = flagStage?.(stage) ?? false;
              const note = stageNote?.(stage);
              return (
                <li
                  key={stage.seq}
                  data-stage={stage.stage_kind}
                  data-flagged={flagged ? "true" : undefined}
                  className={cx(
                    "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 rounded-panel px-3.5 py-2.5",
                    flagged ? "bg-bg-solid" : stage.on_record ? "bg-chip-fill-on-claim" : undefined,
                  )}
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-semibold">{stage.label}</span>
                    {note ? (
                      <span
                        className={cx(
                          "text-small",
                          flagged ? "font-semibold text-ink" : "text-ink2",
                        )}
                      >
                        {note}
                      </span>
                    ) : null}
                  </span>
                  <strong className="text-right whitespace-nowrap">{stage.pct}%</strong>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      {children ? <div className="flex basis-full flex-col gap-3">{children}</div> : null}
    </section>
  );
}
