// "Never on a Plinth paywall" (T26 Build item). NEVERS and PROMISES are
// policy copy from the artboard (copy.ts); the page itself proves them —
// there is no countdown and no pre-ticked box anywhere on this page
// (e2e/pricing.spec.ts checks both).
import { NEVERS, NEVER_SECTION_COPY, PROMISES } from "../copy";

export function NeverSection() {
  return (
    <section aria-labelledby="never-h" className="bg-track py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-6 px-4 sm:px-8">
        <h2 id="never-h" className="m-0 font-display text-h2 font-extrabold">
          {NEVER_SECTION_COPY.heading}
        </h2>
        <ul role="list" className="m-0 grid grid-cols-1 gap-3 p-0 sm:grid-cols-2">
          {NEVERS.map((item) => (
            <li
              key={item}
              className="rounded-panel bg-bg-solid px-5 py-4 text-body text-ink2"
            >
              {item}
            </li>
          ))}
        </ul>

        <dl className="m-0 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PROMISES.map((promise) => (
            <div key={promise.k} className="flex flex-col gap-1">
              <dt className="font-semibold">{promise.k}</dt>
              <dd className="m-0 text-body text-ink2">{promise.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
