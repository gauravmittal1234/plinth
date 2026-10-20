// "What does each band mean?" (context for the four Build items below; also
// carries T25 Build's "a link to the calibration").
import type { Methodology } from "@/src/data";
import { BandScale } from "@plinth/web-ui";
import Link from "next/link";

export function BandsSection({ methodology }: { methodology: Methodology }) {
  return (
    <section aria-labelledby="bands-h" className="bg-track py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-6 px-4 sm:px-8">
        <h2 id="bands-h" className="m-0 font-display text-section font-bold">
          What does each band mean?
        </h2>
        {methodology.similar_line ? (
          <p className="m-0 max-w-measure text-body text-ink2">
            What counts as similar: {methodology.similar_line}
          </p>
        ) : null}

        <BandScale bands={methodology.bands} current={null} label="Delivery risk scale" />

        <ol role="list" className="m-0 flex flex-col gap-4 p-0">
          {methodology.bands.map((band) => (
            <li
              key={band.code}
              data-band={band.code}
              className="rounded-panel bg-bg-solid px-6 py-5"
            >
              <p className="m-0 font-semibold">{band.label}</p>
              <p className="m-0 mt-1 text-body text-ink2">{band.sentence}</p>
            </li>
          ))}
        </ol>

        {methodology.bands_note_line ? (
          <p className="m-0 max-w-measure text-small text-ink2">
            {methodology.bands_note_line}{" "}
            <Link href="/about#calibration">See how we will check ourselves</Link>.
          </p>
        ) : null}
      </div>
    </section>
  );
}
