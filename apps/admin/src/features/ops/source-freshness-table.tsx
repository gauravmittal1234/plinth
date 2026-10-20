// Per-source freshness (BUILD_PLAN §11): last fetch and age ÷ cadence, computed by
// api.admin_source_freshness() from core.sources/core.snapshots (T04).
import { Pill } from "@plinth/web-ui";
import type { AdminSourceFreshness } from "@/src/data/types";

function formatAge(seconds: number | null): string {
  if (seconds === null) return "never";
  const days = Math.floor(seconds / 86400);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} ago`;
  const hours = Math.floor(seconds / 3600);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

export function SourceFreshnessTable({
  freshness,
}: {
  readonly freshness: AdminSourceFreshness;
}) {
  return (
    <section aria-labelledby="freshness-heading">
      <h2 id="freshness-heading" className="text-h3 font-display font-semibold">
        Source freshness
      </h2>
      {freshness.sources.length === 0 ? (
        <p className="mt-2 text-body">No sources yet.</p>
      ) : (
        <table className="mt-3 w-full text-left text-body">
          <thead>
            <tr>
              <th className="pr-4 text-small font-semibold">Source</th>
              <th className="pr-4 text-small font-semibold">Last fetch</th>
              <th className="pr-4 text-small font-semibold">Snapshots</th>
              <th className="text-small font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {freshness.sources.map((source) => (
              <tr key={source.code} className="bg-slab">
                <td className="px-0 py-2 pr-4">{source.name}</td>
                <td className="py-2 pr-4">{formatAge(source.age_seconds)}</td>
                <td className="py-2 pr-4">{source.snapshots_total}</td>
                <td className="py-2">
                  {source.stale === null ? (
                    <Pill tone="track">no cadence set</Pill>
                  ) : source.stale ? (
                    <Pill tone="claim">stale</Pill>
                  ) : (
                    <Pill tone="track">fresh</Pill>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
