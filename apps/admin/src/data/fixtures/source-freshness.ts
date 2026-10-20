// Fixture data for api.admin_source_freshness(), modelled on core.sources (T04,
// DATA_MODEL §2: harera_registration, harera_qpr, dtcp_oc, …).
import type { AdminSourceFreshness, SourceFreshness } from "../types";

const DAY = 24 * 60 * 60;

const row = (
  code: string,
  name: string,
  cadenceDays: number,
  ageDays: number,
  snapshots: number,
): SourceFreshness => ({
  code,
  name,
  cadence_seconds: cadenceDays * DAY,
  last_fetched_at: "2026-10-16T09:00:00+05:30",
  snapshots_total: snapshots,
  age_seconds: ageDays * DAY,
  stale: ageDays * DAY > cadenceDays * DAY,
});

export const FIXTURE_SOURCE_FRESHNESS: AdminSourceFreshness = {
  schema: "plinth.admin_source_freshness/1",
  sources: [
    row("harera_registration", "HARERA registration", 7, 2, 212),
    row("harera_qpr", "HARERA quarterly progress report", 90, 40, 848),
    row("dtcp_oc", "DTCP occupation certificate", 30, 55, 36),
    row("news", "News and press", 1, 1, 1204),
  ],
};
