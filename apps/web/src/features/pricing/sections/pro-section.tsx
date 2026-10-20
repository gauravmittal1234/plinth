// "What does Pro add?" ₹999 comes from `api.about().money`'s Pro line; the
// three items describe what the deep report contains (layout copy).
import type { About } from "@/src/data";
import { PRO_ITEMS } from "../copy";

export function ProSection({ money }: { money: About["money"] }) {
  const proLine = money.lines.find((line) => line.startsWith("Pro:"));
  return (
    <section aria-labelledby="pro-h" className="bg-bg py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-6 px-4 sm:px-8">
        <h2 id="pro-h" className="m-0 font-display text-h2 font-extrabold">
          What does Pro add?
        </h2>
        {proLine ? <p className="m-0 max-w-measure text-lead">{proLine}</p> : null}

        <ol role="list" className="m-0 flex flex-col gap-4 p-0">
          {PRO_ITEMS.map((item) => (
            <li key={item.title} className="rounded-panel bg-track px-6 py-5">
              <p className="m-0 font-semibold">{item.title}</p>
              <p className="m-0 mt-1 text-body text-ink2">{item.text}</p>
            </li>
          ))}
        </ol>

        <p className="m-0 max-w-measure text-small text-ink2">
          Pro never changes a band. Pro buyers see the same score as everyone else, on the same
          day.
        </p>
      </div>
    </section>
  );
}
