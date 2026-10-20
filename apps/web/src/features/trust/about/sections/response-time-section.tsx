// "How fast do we answer?" (T25 Build: "the response-time board"). Every row
// is `api.about().response_times`; the grievance officer and contact are
// `api.about().grievance` (placeholders until the founder supplies them,
// DESIGN §5b).
import type { About } from "@/src/data";

export function ResponseTimeSection({
  responseTimes,
  grievance,
}: {
  responseTimes: About["response_times"];
  grievance: About["grievance"];
}) {
  return (
    <section aria-labelledby="sla-h" className="bg-track py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-6 px-4 sm:px-8">
        <h2 id="sla-h" className="m-0 font-display text-h2 font-extrabold">
          How fast do we answer?
        </h2>
        <p className="m-0 max-w-measure text-body text-ink2">
          Our own promises. Every case sits in a public log.
        </p>

        <ul role="list" className="m-0 flex flex-col gap-4 p-0">
          {responseTimes.map((row) => (
            <li
              key={row.what}
              data-ref-prefix={row.ref_prefix ?? undefined}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-panel bg-bg-solid px-6 py-5"
            >
              <span className="font-semibold">{row.what}</span>
              <span className="text-body text-ink2">{row.promise_line}</span>
              {row.actual_line ? (
                <span className="basis-full text-small text-ink2">{row.actual_line}</span>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="rounded-panel bg-bg-solid px-6 py-5">
          <p className="m-0 font-semibold">Who do I complain to?</p>
          <p className="m-0 mt-1 text-body text-ink2">
            Our Grievance Officer, {grievance.officer}. Write to {grievance.contact}.{" "}
            {grievance.line}
          </p>
        </div>
      </div>
    </section>
  );
}
