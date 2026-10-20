// "How do we make money?" (WORK_BREAKDOWN T21 money ledger): every line is
// `api.about().money`, never composed here — buyers, agents and loans, never
// developers (AGENTS.md §5, DESIGN §0). Free at launch (founder, 20 Oct
// 2026): no Pro plan, no agent fee split.
import type { About } from "@/src/data";
import Link from "next/link";

export function MoneySection({ money }: { money: About["money"] }) {
  return (
    <section id="money" aria-labelledby="money-h" className="bg-track py-18 md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col items-center gap-12 px-4 text-center sm:px-8">
        <div className="flex flex-col items-center gap-2">
          <h2 id="money-h" className="sr-only">
            How do we make money?
          </h2>
          <p
            aria-hidden="true"
            className="m-0 font-display text-[clamp(8.75rem,20vw,17.5rem)] leading-[0.86] font-extrabold tracking-[-0.06em]"
          >
            ₹0
          </p>
          <p className="m-0 max-w-[32ch] text-lead">
            {money.never_line} They can&rsquo;t buy a better band, an early look or a place in
            results.
          </p>
        </div>

        <dl className="m-0 grid w-full grid-cols-1 gap-8 text-left sm:grid-cols-3">
          {money.lines.map((line) => {
            const [who, what] = splitLine(line);
            return (
              <div key={line} className="flex flex-col gap-1.5">
                <dt className="font-semibold text-body">{who}</dt>
                <dd className="m-0 text-body text-ink2">{what}</dd>
              </div>
            );
          })}
        </dl>

        <div className="flex w-full flex-wrap items-baseline justify-between gap-x-12 gap-y-4 rounded-panel bg-bg-solid px-8 py-7 text-left">
          <p className="m-0 flex-1 basis-[28rem] text-body">
            <strong className="font-semibold">Never for sale:</strong> anything to developers, a
            better band, an early look, a place in results, or your number. It is never shared
            without your tap.
          </p>
          <Link
            href="/about#money"
            className="text-body font-semibold text-ink underline underline-offset-[0.2em]"
          >
            Read our full disclosure
          </Link>
        </div>
      </div>
    </section>
  );
}

/** `about().money.lines` reads "Who: what" ("Buyers: free. Every band, reason, …"). */
function splitLine(line: string): [string, string] {
  const i = line.indexOf(": ");
  return i < 0 ? [line, ""] : [line.slice(0, i), line.slice(i + 2)];
}
