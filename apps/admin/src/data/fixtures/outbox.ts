// Mock outbox rows for fixture mode (this task's brief: "The mock outbox rows
// render."). Stands in for comms.outbox (T42, unmerged) the same way the admin_outbox
// RPC does on a real database before that table exists: a small, fixed, clearly-fake
// set so the /ops "mail catcher" has something to show.
//
// The clock (AGENTS.md "Clock"): apps/admin has no dependency on @plinth/fixtures
// (OWNERSHIP.md gives T54 only apps/admin/**, so this app's own package.json is not
// the place to add one), so the frozen "today" is repeated here as a literal,
// matching packages/fixtures/src/index.ts's FIXED_NOW.
import type { AdminOutbox } from "../types";

const FIXED_NOW = "2026-10-18T12:00:00+05:30";

export const FIXTURE_OUTBOX: AdminOutbox = {
  schema: "plinth.admin_outbox/1",
  available: true,
  counts: { queued: 2, sent: 14, delivered: 11, failed: 1 },
  by_channel: { whatsapp_template: 9, whatsapp_session: 3, email: 4, push: 1 },
  recent_failures: [
    {
      id: "00000000-0000-4000-9000-00000000f001",
      channel: "whatsapp_template",
      template_code: "band_change",
      status: "failed",
      attempts: 3,
      last_error: "mock: WhatsApp Graph API timeout",
      created_at: FIXED_NOW,
    },
  ],
  recent: [
    {
      id: "00000000-0000-4000-9000-00000000f002",
      channel: "whatsapp_template",
      template_code: "band_change",
      status: "delivered",
      payload: { phase_name: "Aurelia Heights, Phase 2", band: "elevated" },
      created_at: FIXED_NOW,
    },
    {
      id: "00000000-0000-4000-9000-00000000f003",
      channel: "email",
      template_code: "weekly_digest",
      status: "sent",
      payload: { subject: "Your weekly Plinth digest" },
      created_at: FIXED_NOW,
    },
    {
      id: "00000000-0000-4000-9000-00000000f004",
      channel: "whatsapp_session",
      template_code: null,
      status: "delivered",
      payload: { text: "Here is the evidence for that reason." },
      created_at: FIXED_NOW,
    },
  ],
};
