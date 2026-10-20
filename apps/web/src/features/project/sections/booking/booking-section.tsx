// "What else before booking?" (WORK_BREAKDOWN §4 T20b; fix-project2.md
// G-14 payment plans, G-15 loans, G-17 NRI, G-40 selling before possession).
// Four explainers, each with the rules behind it, straight from
// ProjectPage.before_booking. Loan copy stays to the §5b rule — "Loan checks
// arrive in 2027" — and never names a lender (PRD F-13, "Loans are R2"); the
// Developer-says line here only quotes the brochure's own claim.
import type { BeforeBooking, BookingPara } from "@plinth/contracts";
import { SectionBand } from "@plinth/web-ui";
import { cx } from "../../page/cx";

const BOOKING_COPY = {
  heading: "What else before booking?",
  intro: "Four things buyers ask about before the first cheque, with the rules behind them.",
  note: "General information, not legal, tax or financial advice.",
};

function ParaView({ para }: { para: BookingPara }) {
  const claimToned = para.tone === "developer_says" || para.tone === "from_developer";
  const keyToned = para.tone === "key";
  return (
    <p
      className={cx(
        "m-0",
        claimToned && "rounded-panel bg-claim-bg px-4 py-3",
        keyToned && "rounded-panel bg-accent-soft px-4 py-3 text-on-accent-soft",
      )}
    >
      {para.lead ? <strong className="font-semibold">{para.lead} </strong> : null}
      {para.text}
    </p>
  );
}

function Topic({
  title,
  sub,
  line,
  paras,
  points,
}: {
  title: string;
  sub?: string | null;
  line?: string | null;
  paras: readonly BookingPara[];
  points?: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-panel bg-bg-solid p-5 sm:p-7">
      <div className="flex flex-col gap-1">
        <h3 className="m-0 font-display text-h4 font-extrabold">{title}</h3>
        {sub ? <p className="m-0 text-small text-ink2">{sub}</p> : null}
        {line ? <p className="m-0 font-semibold">{line}</p> : null}
      </div>
      <div className="flex flex-col gap-3">
        {paras.map((para, i) => (
          <ParaView key={i} para={para} />
        ))}
      </div>
      {points && points.length > 0 ? (
        <ul role="list" className="m-0 flex flex-col gap-1.5 p-0 text-small text-ink2">
          {points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function BookingSection({ beforeBooking }: { beforeBooking: BeforeBooking }) {
  const { payment_plans, loans, nri, selling_before_possession } = beforeBooking;

  return (
    <SectionBand id="book" tone="track">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="m-0 max-w-[18ch] text-balance font-display text-h2 font-extrabold">
            {BOOKING_COPY.heading}
          </h2>
          <p className="m-0 max-w-measure text-lead">{beforeBooking.payment_plans?.sub ?? BOOKING_COPY.intro}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {payment_plans ? (
            <Topic
              title={payment_plans.title}
              sub={payment_plans.sub}
              line={payment_plans.line}
              paras={payment_plans.paras}
              points={payment_plans.points}
            />
          ) : null}
          <Topic title={loans.title} sub={loans.sub} line={loans.line} paras={loans.paras} points={loans.points} />
          {nri ? (
            <Topic title={nri.title} sub={nri.sub} line={nri.line} paras={nri.paras} points={nri.points} />
          ) : null}
          {selling_before_possession ? (
            <Topic
              title={selling_before_possession.title}
              sub={selling_before_possession.sub}
              line={selling_before_possession.line}
              paras={selling_before_possession.paras}
              points={selling_before_possession.points}
            />
          ) : null}
        </div>

        <p className="m-0 text-small text-ink2">{BOOKING_COPY.note}</p>
      </div>
    </SectionBand>
  );
}
