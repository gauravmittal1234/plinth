// "What do we cover today?" (T25 Build: "coverage today/next with Notify
// me"). Every line is `api.about().coverage`.
import type { About } from "@/src/data";
import { NotifyToggle } from "../../notify-toggle";

export function CoverageSection({ coverage }: { coverage: About["coverage"] }) {
  return (
    <section aria-labelledby="coverage-h" className="bg-bg py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-8 px-4 sm:px-8">
        <div className="flex flex-col gap-3">
          <h2 id="coverage-h" className="m-0 font-display text-h2 font-extrabold">
            What do we cover today?
          </h2>
          <p className="m-0 max-w-measure text-lead">{coverage.today.line}</p>
          {coverage.today.items.map((item) => (
            <p key={item} className="m-0 max-w-measure text-body text-ink2">
              {item}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="m-0 font-display text-h4 font-extrabold">Not yet, and when</h3>
          <ul role="list" className="m-0 flex flex-col gap-4 p-0">
            {coverage.next.map((next) => (
              <li
                key={next.name}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-panel bg-track px-6 py-5"
              >
                <span className="text-body">
                  <strong className="font-semibold">{next.name}:</strong> {next.when_line}
                </span>
                {next.notify ? (
                  <NotifyToggle
                    idleLabel="Notify me"
                    confirmedLine={`On the waitlist. One message when ${next.name} opens. Nothing else.`}
                  />
                ) : null}
              </li>
            ))}
          </ul>
          <p className="m-0 max-w-measure text-small text-ink2">
            A partner we don&rsquo;t have yet never appears on Plinth as if we did. Dates are
            plans, and we change them here first.
          </p>
        </div>
      </div>
    </section>
  );
}
