// The facts-only mode explainer (Build: "the facts-only mode explainer
// #facts-only"). Rendered only when `group.mode === "facts_only"`
// (DeveloperGroup.mode: "Facts-only is data on the group... not a flag.").
// Every line is the contract's `facts_only.explainer_lines`; nothing here is
// composed from the band or the reasons it is withheld.
import type { FactsOnlyNotice } from "@plinth/contracts";
import { SectionBand } from "@plinth/web-ui";
import { FACTS_ONLY_COPY } from "../../page/copy";
import { formatDate } from "../../page/format";

export function FactsOnlySection({ notice }: { notice: FactsOnlyNotice }) {
  return (
    <SectionBand id={notice.anchor ?? FACTS_ONLY_COPY.anchor} tone="track">
      <div className="flex flex-col gap-5">
        <h2 className="m-0 max-w-[22ch] text-balance font-display text-h2 font-extrabold">
          {FACTS_ONLY_COPY.heading}
        </h2>
        <p className="m-0 max-w-measure text-small text-ink2">
          Withheld since {formatDate(notice.since)}.
        </p>
        <div className="flex flex-col gap-3">
          {notice.explainer_lines.map((line, i) => (
            <p key={i} className="m-0 max-w-measure text-body">
              {line}
            </p>
          ))}
        </div>
      </div>
    </SectionBand>
  );
}
