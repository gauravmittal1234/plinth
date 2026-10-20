// "What will I really pay?" (WORK_BREAKDOWN §4 T20b; fixpass-buyer.md §1).
// The static cost table ("Where the all-in goes"), the EMI figures already
// computed at the wait section's defaults (no sliders yet — M3's calc_live
// wires them live), and the "From the developer" expander: the price-list
// history and the construction-linked plan, with slab 12 flagged against the
// latest QPR (the Pay-as-built example, fix-project2.md G-02/G-14).
import type { AffordTheWait, CostBreakdown, FromDeveloper, PaymentStage, WaitDefaults } from "@plinth/contracts";
import { CostTable, FromDeveloperBlock, SectionBand } from "@plinth/web-ui";
import Link from "next/link";
import { formatInr, formatRatePct } from "./money";

const COST_COPY = {
  heading: "What will I really pay?",
  noCostSheet: "No cost sheet with us, so no all-in yet.",
  emiHeading: "What the monthly payment looks like",
  emiNote: "Arithmetic, not advice. Your bank sets the rate and the loan amount.",
  priceListHeading: "Price list",
  priceHistoryHeading: "Price lists we have on file",
  beforeYouPay: "Check before you pay anything",
};

const TAG_LABELS = {
  often_negotiable: "Often negotiable",
  set_by_law: "Set by law",
  included_in_base: "Included in the base",
  refundable_deposit: "Refundable deposit",
} as const;

function flagSlab12(stage: PaymentStage): boolean {
  return stage.slab_no === 12;
}

/** A finished line the fixture adds beside the typed fields (open contract objects). */
function textOf(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function CostSection({
  cost,
  fromDeveloper,
  waitDefaults,
  affordDefault,
}: {
  cost: CostBreakdown | null;
  fromDeveloper: FromDeveloper | null;
  waitDefaults: WaitDefaults;
  affordDefault: AffordTheWait | null;
}) {
  const demandLine = textOf(fromDeveloper?.payment_plan?.demand_line);
  const planLine = textOf(fromDeveloper?.payment_plan?.line);
  const byTowerLine = textOf(fromDeveloper?.payment_plan?.by_tower_line);
  const priceBasisLine = textOf(fromDeveloper?.price_basis_line);

  return (
    <SectionBand id="cost" tone="bg">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <h2 className="m-0 max-w-[18ch] text-balance font-display text-section font-bold">
            {COST_COPY.heading}
          </h2>
        </div>

        {cost ? (
          <div className="flex flex-col gap-3">
            <h3 className="m-0 font-display text-h4 font-bold">
              Where the {cost.all_in_label} goes
            </h3>
            <p className="m-0 max-w-measure text-ink2">{cost.basis_line}</p>
            <CostTable cost={cost} totalLabel="All-in" tagLabels={TAG_LABELS} surface="bg" />
            {cost.area_line ? <p className="m-0 text-small text-ink2">{cost.area_line}</p> : null}
            {cost.negotiable_line ? (
              <p className="m-0 text-small text-ink2">{cost.negotiable_line}</p>
            ) : null}
            {cost.edc_idc_line ? <p className="m-0 text-small text-ink2">{cost.edc_idc_line}</p> : null}
            {cost.move_in_line ? <p className="m-0 text-small text-ink2">{cost.move_in_line}</p> : null}
          </div>
        ) : (
          <p className="m-0 max-w-measure text-lead">{COST_COPY.noCostSheet}</p>
        )}

        {affordDefault ? (
          <div className="flex flex-col gap-3 rounded-panel bg-bg-solid p-5 sm:p-7">
            <h3 className="m-0 font-display text-h4 font-bold">{COST_COPY.emiHeading}</h3>
            <dl className="m-0 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-small text-ink2">Monthly EMI</dt>
                <dd className="m-0 font-sans text-number font-bold">
                  {formatInr(affordDefault.after_keys.emi_inr)}
                </dd>
              </div>
              <div>
                <dt className="text-small text-ink2">Down payment</dt>
                <dd className="m-0 font-sans text-number font-bold">{waitDefaults.down_pct}%</dd>
              </div>
              <div>
                <dt className="text-small text-ink2">Interest</dt>
                <dd className="m-0 font-sans text-number font-bold">
                  {formatRatePct(waitDefaults.rate_pct)}%
                </dd>
              </div>
              <div>
                <dt className="text-small text-ink2">Tenure</dt>
                <dd className="m-0 font-sans text-number font-bold">
                  {waitDefaults.tenure_years} years
                </dd>
              </div>
            </dl>
            {affordDefault.loan ? (
              <p className="m-0 text-small text-ink2">
                On a loan of {formatInr(affordDefault.loan.loan_inr)}, after a down payment of{" "}
                {formatInr(affordDefault.loan.down_payment_inr)}.
              </p>
            ) : null}
            <p className="m-0 text-small text-ink2">{COST_COPY.emiNote}</p>
          </div>
        ) : null}

        {fromDeveloper ? (
          <FromDeveloperBlock
            data={fromDeveloper}
            priceListHeading={
              <h4 className="m-0 font-semibold">
                {COST_COPY.priceListHeading}
                {fromDeveloper.price_lists[0] ? `, ${fromDeveloper.price_lists[0].label}` : null}
              </h4>
            }
            paymentPlanHeading={
              <h4 className="m-0 font-semibold">
                {fromDeveloper.payment_plan?.name ?? "Payment plan"}
              </h4>
            }
            flagStage={flagSlab12}
            stageNote={(stage) => (flagSlab12(stage) ? demandLine : null)}
          >
            {planLine ? <p className="m-0 max-w-measure text-ink2">{planLine}</p> : null}
            {byTowerLine ? <p className="m-0 text-small text-ink2">{byTowerLine}</p> : null}

            {fromDeveloper.price_lists.length > 1 ? (
              <div className="flex flex-col gap-2">
                <p className="m-0 font-semibold">{COST_COPY.priceHistoryHeading}</p>
                <ul role="list" className="m-0 flex flex-col gap-1.5 p-0 text-small">
                  {fromDeveloper.price_lists.map((list) => (
                    <li key={list.published_on} className="flex flex-wrap gap-x-3">
                      <span className="font-semibold">{list.label}</span>
                      {list.items.map((item) => (
                        <span key={item.unit_label} className="text-ink2">
                          {item.unit_label} {item.price_line}
                        </span>
                      ))}
                    </li>
                  ))}
                </ul>
                {priceBasisLine ? <p className="m-0 text-small text-ink2">{priceBasisLine}</p> : null}
              </div>
            ) : null}

            <p className="m-0">
              <Link
                href="/check/before-you-pay"
                className="inline-flex min-h-11 items-center rounded-pill bg-inverse px-4.5 text-small font-semibold text-on-inverse no-underline"
              >
                {COST_COPY.beforeYouPay}
              </Link>
            </p>
          </FromDeveloperBlock>
        ) : null}
      </div>
    </SectionBand>
  );
}
