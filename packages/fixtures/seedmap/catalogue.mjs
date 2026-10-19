// Seedmap: canonical/catalogue.json -> supabase/seed/10_catalogue.sql (core catalogue tables, DATA_MODEL §1).
// Snapshot links are set in 20_evidence (snapshots are inserted there).
export const output = "10_catalogue.sql";
export const requires = ["20261020"]; // T04 core schema

export function build({ load, sql }) {
  const c = load("catalogue");
  const { q, date, month, jsonb, insert } = sql;
  const byKey = (arr, k = "slug") => Object.fromEntries(arr.map((x) => [x[k], x.id]));
  const loc = byKey(c.localities);
  const grp = byKey(c.developer_groups);
  const dev = byKey(c.developers, "key");
  const prj = byKey(c.projects);
  const ph = byKey(c.phases);
  const regByPhase = Object.fromEntries(c.rera_registrations.map((r) => [r.phase, r.id]));
  const tower = Object.fromEntries(c.towers.map((t) => [`${t.phase}/${t.code}`, t.id]));
  const norm = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const parts = [];

  // The fixture world runs on the frozen clock (ops.now() honours it only when plinth.env is
  // test or fixture). Set it for this database unless the caller chose an env already.
  parts.push(`do $$
begin
  if coalesce(current_setting('plinth.env', true), '') = '' then
    execute format('alter database %I set plinth.env = %L', current_database(), 'fixture');
  end if;
end
$$;
`);
  parts.push(
    insert(
      "core.localities",
      ["id", "kind", "name", "slug", "parent_id"],
      c.localities.map((l) => [
        q(l.id),
        q(l.kind),
        q(l.name),
        q(l.slug),
        q(l.parent ? loc[l.parent] : null),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.developer_groups",
      [
        "id",
        "slug",
        "name",
        "claim_state",
        "invited_on",
        "claimed_on",
        "facts_only_since",
        "facts_only_line",
      ],
      c.developer_groups.map((g) => [
        q(g.id),
        q(g.slug),
        q(g.name),
        q(g.claim_state),
        date(g.invited_on),
        date(g.claimed_on),
        date(g.facts_only_since),
        q(g.facts_only_line),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.developers",
      ["id", "group_id", "legal_name", "cin", "llpin", "status", "name_norm"],
      c.developers.map((d) => [
        q(d.id),
        q(grp[d.group]),
        q(d.legal_name),
        q(d.cin),
        q(d.llpin),
        q(d.status),
        q(norm(d.legal_name)),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.projects",
      ["id", "slug", "name", "group_id", "locality_id"],
      c.projects.map((p) => [
        q(p.id),
        q(p.slug),
        q(p.name),
        q(grp[p.group]),
        q(p.locality ? loc[p.locality] : null),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.phases",
      ["id", "project_id", "slug", "name", "promoter_id", "units_total", "status", "short_code"],
      c.phases.map((p) => [
        q(p.id),
        q(prj[p.project]),
        q(p.slug),
        q(p.name),
        q(p.promoter ? dev[p.promoter] : null),
        q(p.units_total),
        q(p.status),
        q(p.short_code),
      ]),
    ),
  );
  // rera_number is NOT NULL in core.rera_registrations, but §5b gives no number for five phases
  // (CONFLICTS.md C-04). Until the lead adds them, those rows carry a visible PENDING token,
  // never a HARERA-shaped number. registered_on has no precision column: month dates are the 1st.
  const pendingNumbers = c.rera_registrations.filter((r) => !r.rera_number).map((r) => r.phase);
  if (pendingNumbers.length)
    parts.push(`-- PENDING RERA numbers (CONFLICTS.md C-04): ${pendingNumbers.join(", ")}\n`);
  parts.push(
    insert(
      "core.rera_registrations",
      [
        "id",
        "phase_id",
        "authority",
        "rera_number",
        "registered_on",
        "original_completion",
        "original_completion_precision",
        "current_completion",
        "current_completion_precision",
        "status",
        "collection_account_name",
        "collection_bank",
        "collection_branch",
        "collection_account_number",
        "collection_ifsc",
        "official_url",
      ],
      c.rera_registrations.map((r) => [
        q(r.id),
        q(ph[r.phase]),
        q(r.authority),
        q(r.rera_number ?? `PENDING-C04-${r.phase}`),
        date(r.registered_on),
        date(r.original_completion),
        q(r.original_completion_precision),
        date(r.current_completion),
        q(r.current_completion_precision),
        q(r.status),
        q(r.collection_account_name),
        q(r.collection_bank),
        q(r.collection_branch),
        q(r.collection_account_number),
        q(r.collection_ifsc),
        q(r.official_url),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.towers",
      ["id", "phase_id", "code", "floors_planned", "units"],
      c.towers.map((t) => [q(t.id), q(ph[t.phase]), q(t.code), q(t.floors_planned), q(t.units)]),
    ),
  );
  parts.push(
    insert(
      "core.unit_types",
      ["id", "phase_id", "label", "carpet_sqft", "super_sqft", "units", "lane"],
      c.unit_types.map((u) => [
        q(u.id),
        q(ph[u.phase]),
        q(u.label),
        q(u.carpet_sqft),
        q(u.super_sqft),
        q(u.units),
        q(u.carpet_lane ?? "from_developer"),
      ]),
    ),
  );
  // status is NOT NULL; filings whose timeliness §5b does not give stay out of the table
  // (their figures are still seeded as facts in 20_evidence). CONFLICTS.md C-06.
  const unknown = c.qpr_filings.filter((f) => f.status == null);
  if (unknown.length)
    parts.push(
      `-- QPR rows not seeded, timeliness unknown (CONFLICTS.md C-06): ${unknown.map((f) => `${f.phase} ${f.quarter}`).join(", ")}\n`,
    );
  parts.push(
    insert(
      "core.qpr_filings",
      [
        "id",
        "registration_id",
        "quarter",
        "due_on",
        "filed_on",
        "appeared_on",
        "fetched_at",
        "status",
        "sold_pct",
        "built_pct",
        "time_used_pct",
      ],
      c.qpr_filings
        .filter((f) => f.status != null)
        .map((f) => [
          q(f.id),
          q(regByPhase[f.phase]),
          q(f.quarter),
          date(f.due_on),
          date(f.filed_on),
          date(f.appeared_on),
          sql.ts(f.fetched_at),
          q(f.status),
          q(f.sold_pct),
          q(f.built_pct),
          q(f.time_used_pct),
        ]),
    ),
  );
  parts.push(
    insert(
      "core.qpr_tower_progress",
      ["filing_id", "tower_id", "slab_reached", "built_pct"],
      c.qpr_tower_progress
        .filter((t) => c.qpr_filings.find((f) => f.id === t.filing)?.status != null)
        .map((t) => [
          q(t.filing),
          q(tower[`${t.phase}/${t.tower}`]),
          q(t.slab_reached),
          q(t.built_pct),
        ]),
    ),
  );
  parts.push(
    insert(
      "core.extensions",
      [
        "id",
        "registration_id",
        "kind",
        "granted_on",
        "from_completion",
        "from_completion_precision",
        "to_completion",
        "to_completion_precision",
        "order_ref",
      ],
      c.extensions.map((e) => [
        q(e.id),
        q(regByPhase[e.phase]),
        q(e.kind),
        date(e.granted_on),
        date(e.from_completion),
        q("month"),
        date(e.to_completion),
        q("month"),
        q(e.order_ref),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.blanket_extensions",
      [
        "id",
        "authority",
        "advisory_on",
        "applies_from_completion",
        "applies_to_completion",
        "months",
        "source_url",
      ],
      c.blanket_extensions.map((b) => [
        q(b.id),
        q(b.authority),
        date(b.advisory_on),
        date(b.applies_from_completion),
        date(b.applies_to_completion),
        q(b.months),
        q(b.source_url),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.insolvency_events",
      ["id", "developer_id", "kind", "event_on", "forum", "case_ref"],
      c.insolvency_events.map((e) => [
        q(e.id),
        q(dev[e.developer]),
        q(e.kind),
        date(e.event_on),
        q(e.forum),
        q(e.case_ref),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.reported_incidents",
      ["id", "locality_id", "kind", "reported_on", "place_text", "source_kind", "url", "lane"],
      c.reported_incidents.map((r) => [
        q(r.id),
        q(loc[r.locality]),
        q(r.kind),
        date(r.reported_on),
        q(r.place_text),
        q(r.source_kind),
        q(r.url),
        q(r.lane),
      ]),
    ),
  );
  parts.push(
    insert(
      "core.pre_rera_records",
      ["id", "group_id", "project_name", "sector", "promised", "oc_on", "months_late", "sources"],
      c.pre_rera_records.map((r) => [
        q(r.id),
        q(grp[r.group]),
        q(r.project_name),
        q(r.sector),
        month(r.promised),
        month(r.oc_on),
        q(r.months_late),
        jsonb(r.sources),
      ]),
    ),
  );
  return parts.join("\n");
}
