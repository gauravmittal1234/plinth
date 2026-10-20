// Fixture data for api.admin_flags()/admin_flag_set(), mirroring the real R1 rows
// seeded by supabase/migrations/20261020000700_t04_api_flags_lockdown.sql, so the
// /ops flags editor shows the actual flag catalogue in fixture mode. Writes are kept
// in a module-level copy (fixture-session.ts) so toggling one in the UI sticks for the
// dev server's lifetime, the same pattern as apps/web's fixture session.
import type { AdminFlag } from "../types";

const NOW = "2026-10-18T12:00:00+05:30";

export const FIXTURE_FLAGS: readonly AdminFlag[] = [
  { key: "bands_public", enabled: false, rollout_pct: 100, audience: "anon", surfaces: ["web", "app", "whatsapp"], note: "S1 → S2 gate. Off: api.risk_summary nulls band, frequency, reasons and what_would_change.", updated_at: NOW },
  { key: "harera_live_fetch", enabled: false, rollout_pct: 100, audience: "internal", surfaces: ["pipelines"], note: "Live HARERA fetch. Also needs HARERA_LIVE_FETCH_APPROVED=yes.", updated_at: NOW },
  { key: "ai_ask", enabled: true, rollout_pct: 100, audience: "anon", surfaces: ["web", "app", "whatsapp"], note: "Kill switch: Ask Plinth.", updated_at: NOW },
  { key: "ai_doc_check", enabled: true, rollout_pct: 100, audience: "anon", surfaces: ["web", "app", "whatsapp"], note: "Kill switch: doc-check.", updated_at: NOW },
  { key: "ai_staging", enabled: true, rollout_pct: 100, audience: "anon", surfaces: ["web", "app"], note: "Kill switch: Visualise (AI room staging).", updated_at: NOW },
  { key: "wa_outbound", enabled: true, rollout_pct: 100, audience: "internal", surfaces: ["edge"], note: "Kill switch: WhatsApp sends from the outbox.", updated_at: NOW },
  { key: "wa_inbound", enabled: true, rollout_pct: 100, audience: "internal", surfaces: ["edge"], note: "Kill switch: WhatsApp webhook processing.", updated_at: NOW },
  { key: "push_outbound", enabled: true, rollout_pct: 100, audience: "internal", surfaces: ["edge"], note: "Kill switch: FCM push from the outbox.", updated_at: NOW },
  { key: "email_outbound", enabled: true, rollout_pct: 100, audience: "internal", surfaces: ["edge"], note: "Kill switch: email from the outbox.", updated_at: NOW },
  { key: "since_replay_slider", enabled: false, rollout_pct: 100, audience: "anon", surfaces: ["web", "app"], note: "Since you last looked: the replay slider.", updated_at: NOW },
  { key: "family_circle", enabled: false, rollout_pct: 100, audience: "anon", surfaces: ["web", "app", "whatsapp"], note: "Family circle (JOIN codes). On at the M2 gate.", updated_at: NOW },
  { key: "dev_workspace", enabled: false, rollout_pct: 100, audience: "anon", surfaces: ["web"], note: "Developer workspace. On at the M4 gate.", updated_at: NOW },
  { key: "visit_booking", enabled: false, rollout_pct: 100, audience: "anon", surfaces: ["web", "app", "whatsapp"], note: "Visit booking. On at the M5 gate.", updated_at: NOW },
  { key: "broker_layer", enabled: false, rollout_pct: 100, audience: "anon", surfaces: ["web"], note: "Thin agent layer. On at the M5 gate.", updated_at: NOW },
  { key: "buyer_signals", enabled: false, rollout_pct: 100, audience: "user", surfaces: ["web"], note: "Developer buyer signals (k ≥ 20). On at the M4 gate.", updated_at: NOW },
  { key: "pro_paywall", enabled: false, rollout_pct: 100, audience: "anon", surfaces: ["web", "app"], note: "Paid Pro report. Off until a payment partner exists.", updated_at: NOW },
  { key: "map_tiles", enabled: false, rollout_pct: 100, audience: "anon", surfaces: ["web", "app"], note: "Hosted PMTiles basemap.", updated_at: NOW },
  { key: "facts_only_global", enabled: false, rollout_pct: 100, audience: "anon", surfaces: ["web", "app", "whatsapp"], note: "Emergency switch: every page facts-only.", updated_at: NOW },
  { key: "maintenance_mode", enabled: false, rollout_pct: 100, audience: "anon", surfaces: ["web", "app", "whatsapp"], note: "Read-only maintenance banner; writes refused.", updated_at: NOW },
];
