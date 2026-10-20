import type { Metadata } from "next";
import { getAdminFlags, getAdminOutbox, getAdminSourceFreshness } from "@/src/data/admin-api";
import { FlagsEditor } from "@/src/features/ops/flags-editor";
import { OutboxPanel } from "@/src/features/ops/outbox-panel";
import { SourceFreshnessTable } from "@/src/features/ops/source-freshness-table";

export const metadata: Metadata = { title: "Ops · Plinth admin" };

// Already inside the (admin) layout's <Suspense><AdminGate>…</AdminGate></Suspense>
// boundary, so this page can read request data (via the api.admin_* calls below)
// without its own boundary.
export default async function OpsPage() {
  const [outbox, freshness, flags] = await Promise.all([
    getAdminOutbox(),
    getAdminSourceFreshness(),
    getAdminFlags(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-h1 font-display font-semibold">Ops</h1>
      <OutboxPanel outbox={outbox} />
      <SourceFreshnessTable freshness={freshness} />
      <FlagsEditor flags={flags.flags} />
    </div>
  );
}
