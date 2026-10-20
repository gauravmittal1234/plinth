// What a developer group is building now: its ongoing phases, each with the
// same risk chip used everywhere else on the product (Accept: the
// facts-only fixture shows "Band withheld · facts only" on every project
// chip — that's `RiskChip` reading `OngoingPhase.chip` unchanged).
import type { OngoingPhase } from "@plinth/contracts";
import { Button, RiskChip, SectionBand } from "@plinth/web-ui";
import Link from "next/link";
import { ONGOING_COPY } from "../../page/copy";

function OngoingCard({ phase }: { phase: OngoingPhase }) {
  return (
    <li className="flex flex-col gap-3 rounded-panel bg-bg-solid p-5 sm:p-6">
      <p className="m-0 font-semibold text-ink">{phase.name ?? phase.slug}</p>
      <RiskChip chip={phase.chip} surface="bg" />
      {phase.progress_line ? (
        <p className="m-0 text-small text-ink2">{phase.progress_line}</p>
      ) : null}
      {phase.price_line ? <p className="m-0 text-small text-ink2">{phase.price_line}</p> : null}
      <Button variant="secondary" asChild className="mt-1 self-start">
        <Link href={`/gurugram/projects/${phase.slug}`}>{ONGOING_COPY.openProject}</Link>
      </Button>
    </li>
  );
}

export function OngoingSection({
  name,
  phases,
}: {
  name: string;
  phases: readonly OngoingPhase[];
}) {
  if (phases.length === 0) return null;
  return (
    <SectionBand id="ongoing" tone="bg">
      <div className="flex flex-col gap-6">
        <h2 className="m-0 max-w-[20ch] text-balance font-display text-h2 font-extrabold">
          {ONGOING_COPY.heading(name)}
        </h2>
        <ul role="list" className="m-0 grid gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {phases.map((phase) => (
            <OngoingCard key={phase.slug} phase={phase} />
          ))}
        </ul>
      </div>
    </SectionBand>
  );
}
