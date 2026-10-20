// Stubs for /queue, /disputes, /notices and /inbox (AGENTS.md §1 "Stubs, then
// fill"): the task that fills each one is named in API_CONTRACTS §3.4 and
// WORK_BREAKDOWN M3-M4, not yet assigned a task id in this brief.
export function Placeholder({
  title,
  milestone,
}: {
  readonly title: string;
  readonly milestone: "M3" | "M4";
}) {
  return (
    <div className="max-w-prose">
      <h1 className="text-h2 font-display font-semibold">{title}</h1>
      <p className="mt-3 text-body">
        Planned for {milestone}. This screen isn&apos;t built yet; its task will fill this route.
      </p>
    </div>
  );
}
