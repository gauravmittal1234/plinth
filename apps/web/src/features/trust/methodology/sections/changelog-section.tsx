// "What changed, and when?" (T25 Build: "changelog v1.0–v1.2"). Every
// version is `api.methodology().versions`, newest first, as the server sends
// them.
import type { Methodology } from "@/src/data";
import Link from "next/link";
import { formatDate } from "../../format";

export function ChangelogSection({ methodology }: { methodology: Methodology }) {
  return (
    <section aria-labelledby="changelog-h" className="bg-track py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-6 px-4 sm:px-8">
        <h2 id="changelog-h" className="m-0 font-display text-section font-bold">
          What changed, and when?
        </h2>
        <p className="m-0 max-w-measure text-body text-ink2">
          Every change to the method gets a version number. Each score shows the version that made
          it.
        </p>

        <ol className="m-0 flex flex-col gap-5 p-0">
          {methodology.versions.map((version) => (
            <li
              key={version.version}
              data-version={version.version}
              data-current={version.current ? "true" : undefined}
              className="rounded-panel bg-bg-solid px-6 py-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <p className="m-0 font-display text-section font-bold">{version.version}</p>
                <p className="m-0 text-small text-ink2">{formatDate(version.released_on)}</p>
                {version.current ? (
                  <span className="inline-flex h-6 items-center rounded-pill bg-track px-2.5 text-caption font-semibold">
                    Current
                  </span>
                ) : null}
              </div>
              <p className="m-0 mt-2 font-semibold">{version.title}</p>
              <ul role="list" className="m-0 mt-2 flex flex-col gap-1.5 p-0 text-body text-ink2">
                {version.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {version.note ? (
                <p className="m-0 mt-2 text-small text-ink2">{version.note}</p>
              ) : null}
            </li>
          ))}
        </ol>

        {methodology.meta.disclaimer_line ? (
          <p className="m-0 text-small text-ink2">
            {methodology.meta.disclaimer_line} <Link href="/about#money">How we make money</Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
