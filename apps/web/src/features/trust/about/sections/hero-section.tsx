// "Who is Plinth?" (WebAbout.dc.html top; DESIGN §5b identity register).
import type { About } from "@/src/data";
import { formatDate } from "../../format";

export function HeroSection({ about }: { about: About }) {
  return (
    <section aria-label="Who is Plinth" className="bg-bg py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-5 px-4 sm:px-8">
        <h1 className="m-0 max-w-[20ch] text-balance font-display text-h1 font-extrabold tracking-[-0.03em]">
          Who is Plinth?
        </h1>
        <p className="m-0 max-w-measure text-lead">
          A small Gurugram company that reads public records for home buyers. Here is who answers
          for it, how it earns, and whether its bands held up.
        </p>
        <p className="m-0 text-small text-ink2">
          Page updated {formatDate(about.meta.generated_at)}. {about.meta.promise_line}
        </p>
      </div>
    </section>
  );
}
