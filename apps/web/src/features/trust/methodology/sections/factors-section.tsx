// "What is in the score?" (T25 Build: "factor weights"). Every weight is
// `api.methodology().factors`.
import type { Methodology } from "@/src/data";

export function FactorsSection({ methodology }: { methodology: Methodology }) {
  return (
    <section aria-labelledby="factors-h" className="bg-bg py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-6 px-4 sm:px-8">
        <h2 id="factors-h" className="m-0 font-display text-h2 font-extrabold">
          What is in the score?
        </h2>
        {methodology.how_line ? (
          <p className="m-0 max-w-measure text-body text-ink2">{methodology.how_line}</p>
        ) : null}

        <ol role="list" className="m-0 flex flex-col gap-3 p-0">
          {methodology.factors.map((factor) => (
            <li
              key={factor.factor}
              data-factor={factor.factor}
              className="flex items-center justify-between gap-6 rounded-panel bg-track px-6 py-4"
            >
              <span className="font-semibold">{factor.label}</span>
              <span className="font-display text-h4 font-extrabold" aria-hidden="true">
                {factor.weight_pct}%
              </span>
              <span className="sr-only">{factor.weight_pct}% of the score</span>
            </li>
          ))}
        </ol>

        {methodology.factors_note_line ? (
          <p className="m-0 max-w-measure text-small text-ink2">{methodology.factors_note_line}</p>
        ) : null}
        {methodology.data_rules?.line ? (
          <p className="m-0 max-w-measure text-small text-ink2">{methodology.data_rules.line}</p>
        ) : null}
      </div>
    </section>
  );
}
