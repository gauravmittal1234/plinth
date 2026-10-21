// "Does {name} deliver on time?" (Build: the promised-vs-actual timeline).
// `track_record.line` gives the one-sentence verdict; the Timeline gives it a
// shape. The insolvency line sits here too — it is about the group's record,
// the same register as "2 of 6 finished projects got OC more than 12 months
// late."
import type { DeveloperPage } from "@plinth/contracts";
import { SectionBand } from "@plinth/web-ui";
import { TRACK_RECORD_COPY } from "../../page/copy";
import { Timeline } from "./timeline";

export function TrackRecordSection({
  group,
  trackRecord,
  insolvencyLine,
}: {
  group: DeveloperPage["group"];
  trackRecord: DeveloperPage["track_record"];
  insolvencyLine: string | null;
}) {
  const hasProjects = trackRecord.projects.length > 0;
  if (!hasProjects && !trackRecord.line && !insolvencyLine) return null;

  return (
    <SectionBand id="track-record" tone="track">
      <div className="flex flex-col gap-6">
        <h2 className="m-0 max-w-[20ch] text-balance font-display text-section font-bold">
          {TRACK_RECORD_COPY.heading(group.name)}
        </h2>
        {trackRecord.line ? (
          <p className="m-0 max-w-measure text-lead">{trackRecord.line}</p>
        ) : null}
        {hasProjects ? <Timeline projects={trackRecord.projects} /> : null}
        {insolvencyLine ? (
          <p className="m-0 max-w-measure text-body text-ink2">{insolvencyLine}</p>
        ) : null}
      </div>
    </SectionBand>
  );
}
