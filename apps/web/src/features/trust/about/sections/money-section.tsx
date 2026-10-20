// "How do we make money?" (api.about().money; linked from the footer and from
// WebHome's own money section as /about#money). Every line is the server's;
// nothing here is composed. Not one of T25's four named Build items, but the
// id this section carries is already linked from the shell footer (nav.ts)
// and from WebHome (home/money-section.tsx), so About keeps the anchor alive.
// Free at launch (founder, 20 Oct 2026): no Pro plan, no agent fee split.
import type { About } from "@/src/data";

/** `about().money.lines` reads "Who: what" ("Buyers: free. Every band, reason, …"). */
function splitLine(line: string): [string, string] {
  const i = line.indexOf(": ");
  return i < 0 ? [line, ""] : [line.slice(0, i), line.slice(i + 2)];
}

export function MoneySection({ money }: { money: About["money"] }) {
  return (
    <section id="money" aria-labelledby="money-h" className="bg-track py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-6 px-4 sm:px-8">
        <h2 id="money-h" className="m-0 font-display text-h2 font-extrabold">
          How do we make money?
        </h2>
        <p className="m-0 max-w-measure text-lead">
          {money.never_line} No developer pays us, in any form.
        </p>
        <dl className="m-0 grid w-full grid-cols-1 gap-8 sm:grid-cols-3">
          {money.lines.map((line) => {
            const [who, what] = splitLine(line);
            return (
              <div key={line} className="flex flex-col gap-1.5">
                <dt className="font-semibold">{who}</dt>
                <dd className="m-0 text-body text-ink2">{what}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
