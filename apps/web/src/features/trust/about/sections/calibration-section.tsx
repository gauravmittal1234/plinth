// "Were we right?" (T25 Build: "the calibration table signature with the
// 'Illustrative numbers' pill"; Accept: "the calibration shows 36 of 100
// (76/212) and Moderate 31 against 15–30"). Every number is
// `api.about().calibration`, never composed here.
import type { About } from "@/src/data";
import { Pill } from "@plinth/web-ui";
import { formatDate } from "../../format";

type CalibrationRow = About["calibration"]["rows"][number];

/** The artboard's short verdict for one row ("Below: fewer were late" etc). */
function verdict(row: CalibrationRow): string {
  if (row.inside_range) return "Inside our range";
  return row.per_100 < row.said_low ? "Below: fewer were late" : "Above: more were late";
}

export function CalibrationSection({ calibration }: { calibration: About["calibration"] }) {
  const { rows, base_rate, brier_line, pill, first_public_bands_on } = calibration;
  return (
    <section id="calibration" aria-labelledby="calibration-h" className="bg-bg py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-6 px-4 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="calibration-h" className="m-0 font-display text-h2 font-extrabold">
            Were we right?
          </h2>
          {pill ? <Pill tone="accent">{pill}</Pill> : null}
        </div>
        <p className="m-0 max-w-measure text-body text-ink2">
          We scored 212 past Gurugram projects as they looked two years before their RERA date.
          Then we checked when each one really got its OC.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-body">
            <thead>
              <tr className="border-b border-line text-small text-ink2">
                <th scope="col" className="py-3 pr-4 font-semibold">
                  Band
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold">
                  We said
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold">
                  Projects
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold">
                  OC 12+ months late
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold">
                  Per 100
                </th>
                <th scope="col" className="py-3 font-semibold">
                  Inside our range?
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.band} data-band={row.band} className="border-b border-line">
                  <td className="py-3 pr-4 font-semibold">{row.label}</td>
                  <td className="py-3 pr-4 text-ink2">
                    {row.said_low}–{row.said_high} of 100
                  </td>
                  <td className="py-3 pr-4 text-ink2">{row.n_projects}</td>
                  <td className="py-3 pr-4 text-ink2">{row.n_late}</td>
                  <td className="py-3 pr-4 font-semibold">{row.per_100} of 100</td>
                  <td className="py-3">{verdict(row)}</td>
                </tr>
              ))}
              <tr data-band="all" className="font-semibold">
                <td className="py-3 pr-4">All bands</td>
                <td className="py-3 pr-4 text-ink2">—</td>
                <td className="py-3 pr-4">{base_rate.n_projects}</td>
                <td className="py-3 pr-4">{base_rate.n_late}</td>
                <td className="py-3 pr-4">{base_rate.per_100} of 100</td>
                <td className="py-3">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        {base_rate.line ? <p className="m-0 max-w-measure text-body">{base_rate.line}</p> : null}
        {brier_line ? <p className="m-0 max-w-measure text-small text-ink2">{brier_line}</p> : null}
        {first_public_bands_on ? (
          <p className="m-0 max-w-measure text-small text-ink2">
            Our first public bands went live on {formatDate(first_public_bands_on)}. The table
            above is hindsight: the real test is a band published before the outcome.
          </p>
        ) : null}
      </div>
    </section>
  );
}
