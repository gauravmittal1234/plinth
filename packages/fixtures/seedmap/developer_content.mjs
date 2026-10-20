// Seedmap: canonical/developer_content.json -> supabase/seed/35_developer_content.sql
// ("From the developer" ws.* tables and core.cost_rule_sets; DATA_MODEL §1, §4).
// The price lists, plans, cost sheets, documents and core.cost_rule_sets arrive with T13 (20261102).
// ws.developer_claims and ws.developer_replies (T12, 20261101) are seeded by developer_says.mjs.
export const output = "35_developer_content.sql";
export const requires = ["20261102"];

export function build({ load, sql }) {
  const c = load("catalogue");
  const d = load("developer_content");
  const { q, date, jsonb, insert } = sql;
  const ph = Object.fromEntries(c.phases.map((p) => [p.slug, p.id]));
  const parts = [];
  parts.push(
    insert(
      "core.cost_rule_sets",
      [
        "version",
        "state",
        "effective_from",
        "gst_uc_pct",
        "stamp_duty_pct",
        "registration_fee_inr",
        "rounding",
      ],
      d.cost_rule_sets.map((r) => [
        q(r.version),
        q(r.state),
        date(r.effective_from),
        q(r.gst_uc_pct),
        jsonb(r.stamp_duty_pct),
        q(r.registration_fee_inr),
        jsonb(r.rounding),
      ]),
    ),
  );
  parts.push(
    insert(
      "ws.price_lists",
      ["id", "phase_id", "published_on", "status", "version", "lane"],
      d.price_lists.map((l) => [
        q(l.id),
        q(ph[l.phase]),
        date(l.published_on),
        q(l.status),
        q(l.version),
        q(l.lane),
      ]),
    ),
  );
  parts.push(
    insert(
      "ws.price_list_items",
      ["price_list_id", "unit_type_id", "base_price_inr", "per_sqft_carpet_inr"],
      d.price_lists.flatMap((l) =>
        l.items.map((i) => [
          q(l.id),
          q(i.unit_type),
          q(i.base_price_inr),
          q(i.per_sqft_carpet_inr),
        ]),
      ),
    ),
  );
  parts.push(
    insert(
      "ws.payment_plans",
      ["id", "phase_id", "kind", "name", "published_on", "status"],
      d.payment_plans.map((p) => [
        q(p.id),
        q(ph[p.phase]),
        q(p.kind),
        q(p.name),
        date(p.published_on),
        q(p.status),
      ]),
    ),
  );
  parts.push(
    insert(
      "ws.payment_plan_stages",
      ["plan_id", "seq", "label", "stage_kind", "slab_no", "pct"],
      d.payment_plans.flatMap((p) =>
        p.stages.map((s) => [
          q(p.id),
          q(s.seq),
          q(s.label),
          q(s.stage_kind),
          q(s.slab_no),
          q(s.pct),
        ]),
      ),
    ),
  );
  parts.push(
    insert(
      "ws.cost_sheets",
      [
        "id",
        "phase_id",
        "unit_type_id",
        "dated",
        "unit_label",
        "carpet_sqft",
        "super_sqft",
        "lane",
      ],
      d.cost_sheets.map((s) => [
        q(s.id),
        q(ph[s.phase]),
        q(s.unit_type),
        date(s.dated),
        q(s.option_label),
        q(s.carpet_sqft),
        q(s.super_sqft),
        q(s.lane),
      ]),
    ),
  );
  parts.push(
    insert(
      "ws.cost_sheet_lines",
      ["cost_sheet_id", "seq", "code", "label", "amount_inr", "tag"],
      d.cost_sheets.flatMap((s) =>
        s.lines.map((l) => [q(s.id), q(l.seq), q(l.code), q(l.label), q(l.amount_inr), q(l.tag)]),
      ),
    ),
  );
  parts.push(
    insert(
      "ws.developer_documents",
      ["id", "phase_id", "kind", "dated", "storage_key", "summary", "lane"],
      d.developer_documents.map((x) => [
        q(x.id),
        q(ph[x.phase]),
        q(x.kind),
        date(x.dated),
        q(x.storage_key),
        jsonb(x.summary),
        q(x.lane),
      ]),
    ),
  );
  return parts.join("\n");
}
