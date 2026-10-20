// Seedmap: canonical/family.json -> supabase/seed/52_family.sql (DATA_MODEL §5).
// Rohan's circle: Meera (joined 6 Oct 2026), the AH2-7KQ invite for Meera's father and the
// RC4-2MW link (both to 25 Oct 2026), and the shared shortlist's notes. A member row carries no
// phone. Waits for T40 (`m2_people`). Owner: T03b.
export const output = "52_family.sql";
export const requires = ["m2_people"];

export function build({ load, sql }) {
  const c = load("catalogue");
  const p = load("people");
  const f = load("family");
  const { q, ts, uuids, insert } = sql;
  const ph = Object.fromEntries(c.phases.map((x) => [x.slug, x.id]));
  const uid = Object.fromEntries(p.people.map((x) => [x.key, x.id]));
  const orDefault = (v, fn = q) => (v === null || v === undefined ? "default" : fn(v));
  const circle = f.circles[0];
  const parts = [];
  parts.push(
    insert(
      "app.family_circles",
      ["id", "owner_user_id"],
      f.circles.map((x) => [q(x.id), q(uid[x.owner])]),
    ),
  );
  parts.push(
    insert(
      "app.family_members",
      [
        "id",
        "circle_id",
        "member_user_id",
        "invite_code",
        "scope_phase_ids",
        "scope_all",
        "status",
        "invited_at",
        "expires_at",
        "joined_at",
        "joined_via",
        "can_add_notes",
      ],
      f.members.map((m) => {
        // A relative without an account (Meera's father) is only an invite until JOIN.
        const account = m.member && p.people.find((x) => x.key === m.member)?.account;
        return [
          q(m.id),
          q(circle.id),
          q(account ? uid[m.member] : null),
          q(m.invite_code),
          uuids(m.scope_phases.map((s) => ph[s])),
          q(m.scope_all),
          q(m.status),
          ts(m.invited_at),
          ts(m.expires_at),
          ts(m.joined_at),
          q(m.joined_via),
          orDefault(m.can_add_notes),
        ];
      }),
    ),
  );
  parts.push(
    insert(
      "app.shortlist_notes",
      ["id", "circle_id", "phase_id", "author_user_id", "body", "created_at"],
      f.shortlist.notes.map((n) => [
        q(n.id),
        q(circle.id),
        q(ph[n.phase]),
        q(uid[n.author]),
        q(n.body),
        ts(n.created_at),
      ]),
    ),
  );
  return parts.join("\n");
}
