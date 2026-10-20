// "What has HARERA decided on complaints?" (Accept: "24 decided against the
// group, or 0.7 per 100 units" is shown — `GroupComplaints.line_24m`,
// unchanged from the payload).
import type { GroupComplaints } from "@plinth/contracts";
import { SectionBand } from "@plinth/web-ui";
import { COMPLAINTS_COPY } from "../../page/copy";
import { strField } from "../../page/safe";
import { ComplaintsChart } from "./complaints-chart";

export function ComplaintsSection({ complaints }: { complaints: GroupComplaints }) {
  const unitsLine = strField(complaints, "units_line");
  return (
    <SectionBand id="complaints" tone="track">
      <div className="flex flex-col gap-6">
        <h2 className="m-0 max-w-[22ch] text-balance font-display text-section font-bold">
          {COMPLAINTS_COPY.heading}
        </h2>
        <p className="m-0 max-w-measure text-lead">{complaints.line_24m}</p>

        {complaints.half_years.length > 0 ? (
          <ComplaintsChart halfYears={complaints.half_years} />
        ) : null}

        {complaints.fairness_line ? (
          <p className="m-0 max-w-measure text-body text-ink2">{complaints.fairness_line}</p>
        ) : null}
        {unitsLine ? <p className="m-0 max-w-measure text-small text-ink2">{unitsLine}</p> : null}
      </div>
    </SectionBand>
  );
}
