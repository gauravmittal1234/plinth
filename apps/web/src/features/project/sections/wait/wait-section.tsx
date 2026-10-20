// "Can we afford the wait?" (WORK_BREAKDOWN §4 T20b; fixpass-buyer.md §1
// G-04). The static chart from ProjectPage.afford_default, at the wait
// defaults: a month-by-month stacked bar of pre-EMI and rent, hatched for the
// delay months, with a half-of-take-home reference line. The take-home and
// rent inputs stay on the page but disabled — they go live with M3's
// calc_live (packages/calc), the same gate the EMI sliders wait behind in
// the cost section.
import type { AffordTheWait, WaitDefaults } from "@plinth/contracts";
import { SectionBand } from "@plinth/web-ui";
import { formatInr, formatInrPlain } from "../cost/money";

const WAIT_COPY = {
  heading: "Can we afford the wait?",
  takeHomeLabel: "Household take-home pay, a month",
  rentLabel: "Rent you pay now, a month",
  inputsNote: "What you type stays on this device. Live recalculation arrives with M3.",
  nowLabel: "Each month now",
  afterKeysLabel: "After keys",
  afterKeysNote: "full EMI; rent stops",
  delayHeading: "If it's late",
  assumptionsHeading: "How we worked this out",
  framing: "Arithmetic, not advice.",
};

function WaitChart({
  series,
  halfIncome,
}: {
  series: AffordTheWait["series"];
  halfIncome: number;
}) {
  if (series.length === 0) return null;
  const totals = series.map((p) => p.pre_emi_inr + p.rent_inr);
  const maxValue = Math.max(...totals, halfIncome, 1);

  const width = 640;
  const height = 180;
  const padLeft = 4;
  const padBottom = 18;
  const chartH = height - padBottom;
  const barGap = 3;
  const barW = (width - padLeft * 2) / series.length - barGap;
  const yFor = (v: number) => chartH - (v / maxValue) * (chartH - 6);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Rent and pre-EMI by month, ${formatInrPlain(series[0]!.rent_inr + series[0]!.pre_emi_inr)} at the start, rising as the delay months are hatched.`}
      className="h-auto w-full text-ink2"
    >
      <defs>
        <pattern id="wait-delay-hatch" width={5} height={5} patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width={5} height={5} className="fill-accent-soft" />
          <line x1={0} y1={0} x2={0} y2={5} stroke="currentColor" strokeWidth={1} className="text-accent" />
        </pattern>
      </defs>

      <line
        x1={padLeft}
        x2={width - padLeft}
        y1={yFor(halfIncome)}
        y2={yFor(halfIncome)}
        stroke="currentColor"
        strokeDasharray="4 3"
        strokeWidth={1}
      />

      {series.map((p, i) => {
        const x = padLeft + i * (barW + barGap);
        const rentH = (p.rent_inr / maxValue) * (chartH - 6);
        const preEmiH = (p.pre_emi_inr / maxValue) * (chartH - 6);
        const fill = p.delay ? "url(#wait-delay-hatch)" : undefined;
        return (
          <g key={p.month}>
            <rect
              x={x}
              y={chartH - rentH}
              width={barW}
              height={rentH}
              fill={fill}
              className={p.delay ? undefined : "fill-track"}
            />
            <rect
              x={x}
              y={chartH - rentH - preEmiH}
              width={barW}
              height={preEmiH}
              fill={fill}
              className={p.delay ? undefined : "fill-accent"}
            />
          </g>
        );
      })}
      <line x1={padLeft} x2={width - padLeft} y1={chartH} y2={chartH} stroke="currentColor" strokeWidth={1} />
    </svg>
  );
}

export function WaitSection({
  waitDefaults,
  affordDefault,
}: {
  waitDefaults: WaitDefaults;
  affordDefault: AffordTheWait | null;
}) {
  if (!affordDefault) {
    return (
      <SectionBand id="wait" tone="track">
        <h2 className="m-0 max-w-[18ch] text-balance font-display text-h2 font-extrabold">
          {WAIT_COPY.heading}
        </h2>
        <p className="m-0 max-w-measure text-lead">No all-in yet, so no wait figures either.</p>
      </SectionBand>
    );
  }

  const halfIncome = waitDefaults.take_home_inr / 2;

  return (
    <SectionBand id="wait" tone="track">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,24rem)_1fr] lg:items-start lg:gap-16">
        <div className="flex flex-col gap-6">
          <h2 className="m-0 max-w-[18ch] text-balance font-display text-h2 font-extrabold">
            {WAIT_COPY.heading}
          </h2>
          <p className="m-0 max-w-measure text-lead">{affordDefault.answer_line}</p>

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-small font-semibold text-ink2">{WAIT_COPY.takeHomeLabel}</span>
              <input
                type="text"
                inputMode="numeric"
                disabled
                readOnly
                value={formatInrPlain(waitDefaults.take_home_inr)}
                className="h-11 rounded-panel bg-bg-solid px-4 text-body disabled:text-ink"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-small font-semibold text-ink2">{WAIT_COPY.rentLabel}</span>
              <input
                type="text"
                inputMode="numeric"
                disabled
                readOnly
                value={formatInrPlain(waitDefaults.rent_inr)}
                className="h-11 rounded-panel bg-bg-solid px-4 text-body disabled:text-ink"
              />
            </label>
            <p className="m-0 text-small text-ink2">{WAIT_COPY.inputsNote}</p>
          </div>

          {affordDefault.delay_options && affordDefault.delay_options.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="m-0 text-small font-semibold text-ink2 uppercase">
                {WAIT_COPY.delayHeading}
              </h3>
              <ul role="list" className="m-0 flex flex-col gap-1.5 p-0">
                {affordDefault.delay_options.map((d) => (
                  <li key={d.months}>
                    <strong>{d.months} months late:</strong> {d.cost_label} more, in all.
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {affordDefault.frequency_line ? (
            <p className="m-0 text-small text-ink2">{affordDefault.frequency_line}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-8">
          <WaitChart series={affordDefault.series} halfIncome={halfIncome} />
          <p aria-hidden="true" className="m-0 -mt-4 text-caption text-ink2">
            Dashed line: half your take-home, {formatInrPlain(halfIncome)}.
          </p>

          <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-panel bg-bg-solid p-4">
              <dt className="text-small text-ink2">{WAIT_COPY.nowLabel}</dt>
              <dd className="m-0">
                <span className="block font-display text-number font-extrabold">
                  {formatInrPlain(affordDefault.now.monthly_inr)}
                </span>
                <span className="text-small text-ink2">{affordDefault.now.share_pct}% of take-home</span>
              </dd>
            </div>
            <div className="rounded-panel bg-bg-solid p-4">
              <dt className="text-small text-ink2">{affordDefault.by_completion.label}</dt>
              <dd className="m-0">
                <span className="block font-display text-number font-extrabold">
                  {formatInrPlain(affordDefault.by_completion.monthly_inr)}
                </span>
                <span className="text-small text-ink2">
                  {affordDefault.by_completion.share_pct}% of take-home
                </span>
              </dd>
            </div>
            <div className="rounded-panel bg-bg-solid p-4">
              <dt className="text-small text-ink2">{WAIT_COPY.afterKeysLabel}</dt>
              <dd className="m-0">
                <span className="block font-display text-number font-extrabold">
                  {formatInr(affordDefault.after_keys.emi_inr)}
                </span>
                <span className="text-small text-ink2">{WAIT_COPY.afterKeysNote}</span>
              </dd>
            </div>
          </dl>

          {affordDefault.assumptions.length > 0 ? (
            <details className="rounded-panel bg-bg-solid p-5 sm:p-7">
              <summary className="cursor-pointer font-semibold">{WAIT_COPY.assumptionsHeading}</summary>
              <ul role="list" className="m-0 mt-3 flex flex-col gap-2 p-0 text-small text-ink2">
                {affordDefault.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </details>
          ) : null}

          <p className="m-0 text-small text-ink2">{affordDefault.framing_line}</p>
        </div>
      </div>
    </SectionBand>
  );
}
