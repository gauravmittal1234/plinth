// Before RERA · from court orders and news (Build: "pre-RERA"). Same native
// <details> pattern as WebProject's Records section: real disclosure
// semantics, no extra script. Never counted in a band (`PreRera.line`).
import type { PreRera } from "@plinth/contracts";
import { SectionBand } from "@plinth/web-ui";
import { PRE_RERA_COPY } from "../../page/copy";
import { strField } from "../../page/safe";

export function PreReraSection({ preRera }: { preRera: PreRera }) {
  const intro = strField(preRera, "intro_line");
  const coverage = strField(preRera, "coverage_line");

  return (
    <SectionBand id="pre-rera" tone="bg">
      <details className="group rounded-panel bg-bg-solid p-5 sm:p-7">
        <summary className="cursor-pointer font-semibold text-ink">{PRE_RERA_COPY.toggle}</summary>
        <div className="mt-4 flex flex-col gap-4">
          {intro ? <p className="m-0 text-ink2">{intro}</p> : null}
          <ul role="list" className="m-0 flex flex-col gap-3 p-0">
            {preRera.items.map((item) => (
              <li key={item.name}>
                <p className="m-0">
                  <strong className="font-semibold">{item.name}:</strong> {item.line}
                </p>
                {item.sources && item.sources.length > 0 ? (
                  <p className="m-0 text-small text-ink2">{item.sources.join(" · ")}</p>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="m-0 text-small text-ink2">
            {coverage}
            {coverage && preRera.line ? " " : null}
            {preRera.line}
          </p>
        </div>
      </details>
    </SectionBand>
  );
}
