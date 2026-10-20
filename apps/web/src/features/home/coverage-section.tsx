// "Where does Plinth work?" (DESIGN §5b coverage; WORK_BREAKDOWN T21:
// "Coverage and request-a-project"). Every line is `api.about().coverage`.
import type { About } from "@/src/data";
import { NotifyToggle } from "./notify-toggle";
import { RequestProjectForm } from "./request-project-form";

export function CoverageSection({ coverage }: { coverage: About["coverage"] }) {
  return (
    <section id="coverage" aria-labelledby="coverage-h" className="bg-bg py-18 md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-10 px-4 sm:px-8">
        <div className="flex flex-col gap-3">
          <h2
            id="coverage-h"
            className="m-0 max-w-[18ch] font-display text-question font-bold tracking-[-0.03em]"
          >
            Where does Plinth work?
          </h2>
          <p className="m-0 max-w-[48ch] text-lead">{coverage.today.line}</p>
          {coverage.today.items.map((item) => (
            <p key={item} className="m-0 text-body text-ink2">
              {item}
            </p>
          ))}
        </div>

        <ul role="list" className="m-0 flex flex-col gap-4 p-0">
          {coverage.next.map((next) => (
            <li
              key={next.name}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-panel bg-track px-6 py-5"
            >
              <span className="text-body">
                <strong className="font-semibold">{next.name}:</strong> {next.when_line}
              </span>
              {next.notify ? <NotifyToggle idleLabel="Notify me" /> : null}
            </li>
          ))}
        </ul>

        <RequestProjectForm />
      </div>
    </section>
  );
}
