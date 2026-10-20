// "Who runs Plinth?" (T25 Build: "the identity register (founder placeholders,
// never AI faces)"). Every value is `api.about().identity`: a company register
// readers can check, plus the founder photo line. DESIGN §5b: founder details
// are placeholders until the founder supplies them — this page must never show
// an AI-generated face.
import type { About } from "@/src/data";

export function IdentitySection({ identity }: { identity: About["identity"] }) {
  return (
    <section aria-labelledby="who-runs-h" className="bg-track py-18 text-ink md:py-30">
      <div className="mx-auto grid w-full max-w-[79rem] gap-10 px-4 sm:px-8 lg:grid-cols-[18rem_1fr] lg:items-start">
        <div className="flex flex-col gap-3">
          <div
            aria-hidden="true"
            className="flex aspect-[4/5] w-full max-w-64 items-center justify-center rounded-panel bg-bg-solid px-4 text-center text-small text-ink2"
          >
            [Founder photo]
          </div>
          {identity.photo_line ? (
            <p className="m-0 text-small text-ink2">{identity.photo_line}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          <h2 id="who-runs-h" className="m-0 font-display text-h2 font-extrabold">
            Who runs Plinth?
          </h2>
          <p className="m-0 max-w-measure text-body text-ink2">
            One company, one founder, one city. Each line below is a register or a person you can
            check.
          </p>
          {identity.placeholder_note ? (
            <p className="m-0 max-w-measure text-small text-ink2">{identity.placeholder_note}</p>
          ) : null}
          <dl className="m-0 flex flex-col">
            {identity.register.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-1 gap-x-4 gap-y-1 border-b border-line py-3.5 last:border-0 sm:grid-cols-[minmax(0,12rem)_1fr]"
              >
                <dt className="text-small text-ink2">{row.label}</dt>
                <dd className="m-0 font-semibold">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
