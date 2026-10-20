// Outbox counts and failures, plus the "mail catcher" (mock WhatsApp and email
// viewer) this task's brief asks for. `available: false` means T42 (comms.outbox)
// hasn't merged yet (PR #63) on a real database — the panel says so rather than
// showing zeros that look like an empty queue.
import { Pill } from "@plinth/web-ui";
import type { AdminOutbox, OutboxRow } from "@/src/data/types";

export function OutboxPanel({ outbox }: { readonly outbox: AdminOutbox }) {
  return (
    <section aria-labelledby="outbox-heading">
      <h2 id="outbox-heading" className="text-h3 font-display font-semibold">
        Outbox
      </h2>
      {!outbox.available ? (
        <p className="mt-2 text-body">
          comms.outbox doesn&apos;t exist on this database yet (T42, not merged). This panel will
          show real counts once it does.
        </p>
      ) : (
        <>
          <dl className="mt-3 flex flex-wrap gap-6">
            {Object.entries(outbox.counts).map(([status, n]) => (
              <div key={status}>
                <dt className="text-small">{status}</dt>
                <dd className="text-h3 font-display font-semibold">{n}</dd>
              </div>
            ))}
          </dl>

          <h3 className="mt-6 text-body font-semibold">Recent failures</h3>
          {outbox.recent_failures.length === 0 ? (
            <p className="mt-1 text-body">No failures.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {outbox.recent_failures.map((row) => (
                <OutboxFailureRow key={row.id} row={row} />
              ))}
            </ul>
          )}

          <h3 className="mt-6 text-body font-semibold">
            Mock WhatsApp and email viewer
          </h3>
          {outbox.recent.length === 0 ? (
            <p className="mt-1 text-body">Nothing sent yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {outbox.recent.map((row) => (
                <OutboxRowView key={row.id} row={row} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function OutboxFailureRow({ row }: { readonly row: OutboxRow }) {
  return (
    <li className="bg-slab px-4 py-3">
      <div className="flex items-center gap-2">
        <Pill tone="claim">{row.channel}</Pill>
        <span className="text-small">{row.template_code ?? "—"}</span>
        <span className="text-small">attempt {row.attempts ?? 0}</span>
      </div>
      {row.last_error ? <p className="mt-1 text-small">{row.last_error}</p> : null}
    </li>
  );
}

function OutboxRowView({ row }: { readonly row: OutboxRow }) {
  return (
    <li className="bg-slab px-4 py-3">
      <div className="flex items-center gap-2">
        <Pill tone="track">{row.channel}</Pill>
        <span className="text-small">{row.template_code ?? "—"}</span>
        <span className="text-small">{row.status ?? ""}</span>
      </div>
      {row.payload ? (
        <pre className="mt-1 overflow-x-auto text-small">{JSON.stringify(row.payload)}</pre>
      ) : null}
    </li>
  );
}
