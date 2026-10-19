// Seedmap: canonical/evidence.json -> supabase/seed/20_evidence.sql (core.sources, core.snapshots, core.facts; DATA_MODEL §2).
// Also links the catalogue rows to their snapshots (10_catalogue inserts them without one).
export const output = "20_evidence.sql";
export const requires = ["20261020"]; // T04 core schema

export function build({ load, sql }) {
  const c = load("catalogue");
  const e = load("evidence");
  const { q, date, ts, jsonb, insert } = sql;
  const srcId = Object.fromEntries(e.sources.map((s) => [s.code, s.id]));
  const snapId = Object.fromEntries(e.snapshots.map((s) => [s.key, s.id]));
  const ids = {
    phase: Object.fromEntries(c.phases.map((p) => [p.slug, p.id])),
    registration: Object.fromEntries(c.rera_registrations.map((r) => [r.phase, r.id])),
    group: Object.fromEntries(c.developer_groups.map((g) => [g.slug, g.id])),
    developer: Object.fromEntries(c.developers.map((d) => [d.key, d.id])),
    tower: Object.fromEntries(c.towers.map((t) => [`${t.phase}/${t.code}`, t.id])),
  };
  const subjectId = (f) => {
    const v = ids[f.subject_type]?.[f.subject];
    if (!v) throw new Error(`fact ${f.key}: unknown subject ${f.subject_type}/${f.subject}`);
    return v;
  };
  const parts = [];
  parts.push(
    insert(
      "core.sources",
      ["id", "code", "name", "base_url", "cadence", "terms_note"],
      e.sources.map((s) => [
        q(s.id),
        q(s.code),
        q(s.name),
        q(s.base_url),
        q(s.cadence),
        q(s.terms_note),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.snapshots",
      [
        "id",
        "source_id",
        "url",
        "method",
        "fetched_at",
        "http_status",
        "sha256",
        "storage_key",
        "content_type",
        "bytes",
        "parser_version",
        "fixture",
      ],
      e.snapshots.map((s) => [
        q(s.id),
        q(srcId[s.source_code]),
        q(s.url),
        q(s.method),
        ts(s.fetched_at),
        q(s.http_status),
        q(s.sha256),
        q(s.storage_key),
        q(s.content_type),
        q(s.bytes),
        q(s.parser_version),
        q(s.fixture),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.facts",
      [
        "id",
        "subject_type",
        "subject_id",
        "attribute",
        "value",
        "as_of",
        "valid_from",
        "valid_to",
        "learned_at",
        "snapshot_id",
        "page_ref",
        "extract_text",
        "method",
        "method_version",
        "read_note",
        "reviewed_at",
        "lane",
        "superseded_by",
      ],
      e.facts.map((f) => [
        q(f.id),
        q(f.subject_type),
        q(subjectId(f)),
        q(f.attribute),
        jsonb(f.value),
        date(f.as_of),
        date(f.valid_from),
        date(f.valid_to),
        ts(f.learned_at),
        q(f.snapshot ? snapId[f.snapshot] : null),
        q(f.page_ref),
        q(f.extract_text),
        q(f.method),
        q(f.method_version),
        q(f.read_note),
        ts(f.reviewed_at),
        q(f.lane),
        q(f.superseded_by),
      ]),
    ),
  );

  // Snapshot links for the catalogue rows.
  const link = (table, rows) =>
    rows.length
      ? `update ${table} t set snapshot_id = v.snapshot_id::uuid from (values\n${rows.map(([rid, sid]) => `  (${q(rid)}, ${q(sid)})`).join(",\n")}\n) as v(id, snapshot_id) where t.id = v.id::uuid;\n`
      : "";
  parts.push(
    link(
      "core.rera_registrations",
      c.rera_registrations.filter((r) => r.snapshot).map((r) => [r.id, snapId[r.snapshot]]),
    ),
  );
  parts.push(
    link(
      "core.qpr_filings",
      c.qpr_filings.filter((f) => f.snapshot).map((f) => [f.id, snapId[f.snapshot]]),
    ),
  );
  parts.push(
    link(
      "core.extensions",
      c.extensions.filter((x) => x.snapshot).map((x) => [x.id, snapId[x.snapshot]]),
    ),
  );
  parts.push(
    link(
      "core.insolvency_events",
      c.insolvency_events.filter((x) => x.snapshot).map((x) => [x.id, snapId[x.snapshot]]),
    ),
  );
  return parts.join("\n");
}
