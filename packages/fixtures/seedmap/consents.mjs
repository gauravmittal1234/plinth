// Seedmap: canonical/consents.json -> supabase/seed/51_consents.sql (DATA_MODEL §6).
// app.purposes, the consent ledger (C-MMDD-NN), number shares, Rohan's relay, and the
// ops.ref_counters bump so live refs never collide with fixture refs (C-1018-11 -> next is
// C-1018-12; R-1018-07 -> R-1018-08). Waits for T40 (`m2_people`). Owner: T03b.
//
// Consents and number shares are written the way the product writes them: with the buyer's own
// JWT (request.jwt.claims) and a tap event id, so T40's triggers (DATA_MODEL §12 invariant 4)
// accept them without an exception for the seed.
export const output = "51_consents.sql";
export const requires = ["m2_people"];

export function build({ load, sql }) {
  const c = load("catalogue");
  const p = load("people");
  const k = load("consents");
  const { q, ts, date, jsonb, insert } = sql;
  const ph = Object.fromEntries(c.phases.map((x) => [x.slug, x.id]));
  const uid = Object.fromEntries(p.people.map((x) => [x.key, x.id]));
  const consentId = Object.fromEntries(k.consents.map((x) => [x.ref, x.id]));
  const orDefault = (v, f = q) => (v === null || v === undefined ? "default" : f(v));
  const parts = [];
  parts.push(
    `${insert(
      "app.purposes",
      ["code", "description", "retention_class", "notice_section"],
      k.purposes.map((x) => [
        q(x.code),
        q(x.description),
        q(x.retention_class),
        q(x.notice_section),
      ]),
    ).replace(/;\n$/, "")}\non conflict (code) do nothing;\n`,
  );
  const asBuyer = (user) =>
    `select pg_catalog.set_config('request.jwt.claims', ${q(JSON.stringify({ sub: uid[user], role: "authenticated" }))}, true);\n`;
  const buyers = [...new Set(k.consents.map((x) => x.principal))];
  for (const b of buyers) {
    parts.push(`-- ${b}\n${asBuyer(b)}`);
    parts.push(
      insert(
        "app.consents",
        [
          "id",
          "ref",
          "ref_year",
          "principal_user_id",
          "purpose_code",
          "recipient_kind",
          "recipient_org_id",
          "recipient_agent_id",
          "phase_id",
          "notice_version",
          "channel",
          "evidence",
          "scope",
          "granted_at",
          "expires_at",
        ],
        k.consents
          .filter((x) => x.principal === b)
          .map((x) => [
            q(x.id),
            q(x.ref),
            q(x.ref_year),
            q(uid[x.principal]),
            q(x.purpose_code),
            q(x.recipient_kind),
            q(x.recipient_org_id),
            q(x.recipient_agent_id),
            q(x.phase ? ph[x.phase] : null),
            orDefault(x.notice_version),
            orDefault(x.channel),
            jsonb(x.evidence),
            jsonb(x.scope),
            ts(x.granted_at),
            ts(x.expires_at),
          ]),
      ),
    );
    const relays = k.relay_sessions.filter((r) => r.buyer === b);
    if (relays.length)
      parts.push(
        insert(
          "app.relay_sessions",
          [
            "id",
            "buyer_user_id",
            "recipient_org_id",
            "phase_id",
            "channel",
            "deal_active",
            "opened_at",
            "last_message_at",
            "closes_at",
          ],
          relays.map((r) => [
            q(r.id),
            q(uid[r.buyer]),
            q(r.recipient_org_id),
            q(ph[r.phase]),
            q(r.channel),
            q(r.deal_active),
            ts(r.opened_at),
            ts(r.last_message_at),
            ts(r.closes_at),
          ]),
        ),
      );
    const shares = k.contact_shares.filter((s) => s.buyer === b);
    if (shares.length)
      parts.push(
        insert(
          "app.contact_shares",
          [
            "id",
            "consent_id",
            "buyer_user_id",
            "recipient_org_id",
            "recipient_agent_id",
            "phase_id",
            "number_shared",
            "starts_at",
            "ends_at",
            "ended_reason",
          ],
          shares.map((s) => [
            q(s.id),
            q(consentId[s.consent]),
            q(uid[s.buyer]),
            q(s.recipient_org_id),
            q(s.recipient_agent_id),
            q(s.phase ? ph[s.phase] : null),
            q(s.number_shared),
            ts(s.starts_at),
            ts(s.ends_at),
            q(s.ended_reason),
          ]),
        ),
      );
  }
  parts.push("select pg_catalog.set_config('request.jwt.claims', '', true);\n");
  parts.push(
    `${insert(
      "ops.ref_counters",
      ["prefix", "scope_date", "last"],
      k.ref_counters.map((r) => [q(r.prefix), date(r.scope_date), q(r.last)]),
    ).replace(
      /;\n$/,
      "",
    )}\non conflict (prefix, scope_date) do update set last = greatest(ops.ref_counters.last, excluded.last);\n`,
  );
  return parts.join("\n");
}
