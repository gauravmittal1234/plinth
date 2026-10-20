// Seedmap: canonical/{people,family}.json -> supabase/seed/54_buyer_api.sql (T45a's columns).
// The fixture world as the buyer RPCs wrote it: Rohan's two open invites carry the p_client_id of
// the api.family_invite_create call that made them, and a scope_all invite carries the follows
// it named (Rohan's 4, in his follow order), so its text and /j/[code] list them as he sent them;
// R-1018-07 carries the p_client_id of his api.request_project call. A replay of those calls
// returns the seeded rows (expected/family_invite_create, expected/request_project).
// Waits for T40 (`m2_people`) and T45a (20261120). Owner: T45a.
import { uuid5 } from "../src/author/lib.mjs";

export const output = "54_buyer_api.sql";
export const requires = ["m2_people", "20261120"];

export function build({ load, sql }) {
  const c = load("catalogue");
  const p = load("people");
  const f = load("family");
  const { q, ts, uuids } = sql;
  const ph = Object.fromEntries(c.phases.map((x) => [x.slug, x.id]));
  const owner = f.circles[0].owner;
  const followed = p.follows.filter((x) => x.user === owner).map((x) => ph[x.phase]);
  const codes = new Set(f.invites.map((i) => i.code));
  const client = (key) => uuid5("client_id", key);
  const lines = [];
  for (const m of f.members) {
    const sets = [];
    if (m.scope_all) sets.push(`scope_phase_ids = ${uuids(followed)}`);
    if (m.status === "invited" && codes.has(m.invite_code))
      sets.push(`client_id = ${q(client(`family_invite/${m.invite_code}`))}`);
    if (sets.length)
      lines.push(`update app.family_members set ${sets.join(", ")} where id = ${q(m.id)};`);
  }
  for (const r of p.project_requests)
    lines.push(
      `update app.project_requests set client_id = ${q(client(`project_request/${r.ref}`))}, requested_at = ${ts(r.requested_at)} where id = ${q(r.id)};`,
    );
  return `${lines.join("\n")}\n`;
}
