// "When does a rule override the model?" (T25 Build: "red-flag rules").
// Every rule is `api.methodology().red_flag_rules`.
import type { Methodology } from "@/src/data";

export function RedFlagsSection({ methodology }: { methodology: Methodology }) {
  return (
    <section aria-labelledby="red-flags-h" className="bg-track py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-6 px-4 sm:px-8">
        <h2 id="red-flags-h" className="m-0 font-display text-h2 font-extrabold">
          When does a rule override the model?
        </h2>
        <p className="m-0 max-w-measure text-body text-ink2">
          Four published rules. If any one applies, the band is Severe, with the order linked. The
          model can&rsquo;t soften it.
        </p>

        <ol className="m-0 flex flex-col gap-4 p-0">
          {methodology.red_flag_rules.map((rule) => (
            <li
              key={rule.code}
              data-rule={rule.code}
              className="rounded-panel bg-bg-solid px-6 py-5"
            >
              <p className="m-0 text-small text-ink2">Red-flag rule {rule.n}</p>
              <p className="m-0 mt-1 font-semibold">{rule.title}</p>
              <p className="m-0 mt-1 text-body text-ink2">{rule.line}</p>
            </li>
          ))}
        </ol>

        {methodology.red_flag_example_line ? (
          <p className="m-0 max-w-measure text-small text-ink2">
            {methodology.red_flag_example_line}
          </p>
        ) : null}
      </div>
    </section>
  );
}
