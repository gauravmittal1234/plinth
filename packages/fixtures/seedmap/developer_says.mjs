// Seedmap: canonical/developer_content.json -> supabase/seed/33_developer_says.sql
// The "Developer says" rows: ws.developer_claims and ws.developer_replies (DATA_MODEL §4),
// created by T12 (20261101). Split from developer_content.mjs so they load as soon as T12's
// tables exist, without waiting for T13 (INTEGRATION_NOTES, wave 2: "the claims and replies
// seedmap requires only 20261101 and inserts signatory_name and scope").
// Owner: T03b (handed over from T03). Facts: DESIGN §5b and round 2 C-19.
export const output = "33_developer_says.sql";
export const requires = ["20261101"];

export function build({ load, sql }) {
  const c = load("catalogue");
  const d = load("developer_content");
  const { q, date, ts, insert } = sql;
  const ph = Object.fromEntries(c.phases.map((p) => [p.slug, p.id]));
  const parts = [];
  parts.push(
    insert(
      "ws.developer_claims",
      [
        "id",
        "phase_id",
        "text",
        "said_on",
        "check_by",
        "verified_state",
        "linked_fact_id",
        "public",
      ],
      d.developer_claims.map((x) => [
        q(x.id),
        q(ph[x.phase]),
        q(x.text),
        date(x.said_on),
        date(x.check_by),
        q(x.verified_state),
        q(x.linked_fact),
        q(x.public),
      ]),
    ),
  );
  // scope = project: RiskSummary.developer_response of its phase (Aurelia). scope = group: the
  // developer page's group reply, filed against Heron Point Ph 1 (round 2 C-19).
  parts.push(
    insert(
      "ws.developer_replies",
      [
        "id",
        "phase_id",
        "scope",
        "text",
        "signatory_title",
        "signatory_name",
        "published_at",
        "check_by",
        "status",
      ],
      d.developer_replies.map((x) => [
        q(x.id),
        q(ph[x.phase]),
        q(x.scope),
        q(x.text),
        q(x.signatory_title),
        q(x.signatory_name),
        ts(`${x.published_on}T00:00:00+05:30`),
        date(x.check_by),
        q(x.status),
      ]),
    ),
  );
  return parts.join("\n");
}
