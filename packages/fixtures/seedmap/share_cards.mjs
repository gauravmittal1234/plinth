// Seedmap: canonical/people.json -> supabase/seed/40_share_cards.sql (DATA_MODEL §2,
// core.share_cards, created by T04). The old Aurelia card that WaDigest's returned-card flow
// answers: issued from the v1.1 Moderate run of 2 Sep 2026, data as of 30 Sep 2026 (round 2
// C-24; INTEGRATION_NOTES "Share card (T03b)"). Owner: T03b.
export const output = "40_share_cards.sql";
export const requires = ["20261020"];

export function build({ load, sql }) {
  const c = load("catalogue");
  const p = load("people");
  const { q, ts, date, insert } = sql;
  const ph = Object.fromEntries(c.phases.map((x) => [x.slug, x.id]));
  return insert(
    "core.share_cards",
    [
      "id",
      "phase_id",
      "kind",
      "run_id",
      "issued_at",
      "data_as_of",
      "model_version",
      "band",
      "phash",
      "short_code",
    ],
    p.share_cards.map((s) => [
      q(s.id),
      q(ph[s.phase]),
      q(s.kind),
      q(s.run),
      ts(s.issued_at),
      date(s.data_as_of),
      q(s.model_version),
      q(s.band),
      s.phash ? `${q(s.phash)}::bit(64)` : "null",
      q(s.short_code),
    ]),
  );
}
