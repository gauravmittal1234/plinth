// Seedmap: canonical/scoring.json -> supabase/seed/30_scoring.sql (core scoring and governance, DATA_MODEL §3).
// Order respects immutability: notices first (without their proposed run), then runs with their notice,
// then the notices get their proposed run. score_runs are never updated.
import { createHash } from "node:crypto";

export const output = "30_scoring.sql";
export const requires = ["20261020"]; // T04 core schema

export function build({ load, sql }) {
  const c = load("catalogue");
  const s = load("scoring");
  const { q, date, ts, jsonb, uuids, insert } = sql;
  const ph = Object.fromEntries(c.phases.map((p) => [p.slug, p.id]));
  const grp = Object.fromEntries(c.developer_groups.map((g) => [g.slug, g.id]));
  const at = (d) => (d ? `${d}T00:00:00+05:30` : null);
  const parts = [];

  parts.push(
    insert(
      "core.score_models",
      ["id", "version", "released_on", "status", "config", "config_sha", "changelog"],
      s.score_models.map((m) => [
        q(m.id),
        q(m.version),
        date(m.released_on),
        q(m.status),
        jsonb(m.config),
        q(createHash("sha256").update(JSON.stringify(m.config)).digest("hex")),
        q([m.title, ...m.changelog, m.note].join("\n")),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.reason_templates",
      ["id", "code", "factor", "template_en", "version"],
      s.reason_templates.map((t) => [
        q(t.id),
        q(t.code),
        q(t.factor),
        q(t.template_en),
        q(t.version),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.red_flag_rules",
      ["id", "code", "text", "published_on"],
      s.red_flag_rules.map((r) => [
        q(r.id),
        q(r.code),
        q(`${r.title}. ${r.text}`),
        date(r.published_on),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.red_flags",
      ["id", "rule_code", "subject_type", "subject_id", "triggered_on", "cleared_on", "fact_ids"],
      s.red_flags.map((r) => [
        q(r.id),
        q(r.rule_code),
        q(r.subject_type),
        q(grp[r.subject]),
        date(r.triggered_on),
        date(r.cleared_on),
        uuids(r.fact_ids),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.band_notices",
      [
        "id",
        "phase_id",
        "kind",
        "from_band",
        "to_band",
        "reason_text",
        "trigger_fact_ids",
        "sent_at",
        "effective_on",
        "public_marker_text",
        "status",
      ],
      s.band_notices.map((n) => [
        q(n.id),
        q(ph[n.phase]),
        q(n.kind),
        q(n.from_band),
        q(n.to_band),
        q(n.reason_text),
        uuids(n.trigger_fact_ids),
        ts(at(n.sent_on)),
        date(n.effective_on),
        q(n.public_marker_text),
        q(n.status),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.score_runs",
      [
        "id",
        "phase_id",
        "model_version",
        "data_cutoff",
        "computed_at",
        "code_commit",
        "status",
        "state",
        "band",
        "set_by",
        "rule_code",
        "confidence",
        "freq_low",
        "freq_high",
        "freq_point",
        "stall",
        "stale",
        "what_would_change",
        "supersedes_run_id",
        "published_at",
        "notice_id",
      ],
      s.runs.map((r) => [
        q(r.id),
        q(ph[r.phase]),
        q(r.model_version),
        date(r.data_cutoff),
        ts(at(r.computed_on)),
        q(r.code_commit),
        q(r.status),
        q(r.state),
        q(r.band),
        q(r.set_by),
        q(r.rule_code),
        q(r.confidence),
        q(r.freq_low),
        q(r.freq_high),
        q(r.freq_point),
        q(r.stall),
        q(r.stale),
        q(r.what_would_change),
        q(r.supersedes),
        ts(at(r.published_on)),
        q(r.notice),
      ]),
    ),
  );
  parts.push(
    `update core.band_notices n set proposed_run_id = v.run_id::uuid from (values\n${s.band_notices.map((n) => `  (${q(n.id)}, ${q(n.proposed_run)})`).join(",\n")}\n) as v(id, run_id) where n.id = v.id::uuid;\n`,
  );
  parts.push(
    insert(
      "core.score_reasons",
      ["run_id", "rank", "factor", "code", "text", "fact_ids"],
      s.reasons.map((r) => [
        q(r.run),
        q(r.rank),
        q(r.factor),
        q(r.code),
        q(r.text),
        uuids(r.fact_ids),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.band_history",
      [
        "phase_id",
        "band",
        "state",
        "confidence",
        "from_date",
        "to_date",
        "run_id",
        "model_version",
      ],
      s.band_history.map((h) => [
        q(ph[h.phase]),
        q(h.band),
        q(h.state),
        q(h.confidence),
        date(h.from_date),
        date(h.to_date),
        q(h.run),
        q(h.model_version),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.calibration",
      [
        "model_version",
        "band",
        "range_low",
        "range_high",
        "n_projects",
        "n_late",
        "per_100",
        "illustrative",
        "brier",
        "brier_baseline",
      ],
      s.calibration.map((k) => [
        q(k.model_version),
        q(k.band),
        q(k.range_low),
        q(k.range_high),
        q(k.n_projects),
        q(k.n_late),
        q(k.per_100),
        q(k.illustrative),
        q(s.calibration_summary.brier),
        q(s.calibration_summary.brier_baseline),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.methodology_changelog",
      ["version", "published_on", "summary", "minutes_url"],
      s.methodology_changelog.map((m) => [
        q(m.version),
        date(m.published_on),
        q(m.summary),
        q(m.minutes_url),
      ]),
    ),
  );
  // The fixture world shows bands: T04 seeds bands_public off (the S1 default).
  parts.push("update ops.feature_flags set enabled = true where key = 'bands_public';\n");
  return parts.join("\n");
}
