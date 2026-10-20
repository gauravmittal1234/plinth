// Seedmap: canonical/people.json -> supabase/seed/50_people.sql (DATA_MODEL §5).
// auth.users for the fixture accounts (app.profiles is created by T40's trigger, then updated
// here), app.user_roles, Rohan's follows and alert subscriptions, and the R-1018-07 request.
// Waits for T40's migrations (file names carry `m2_people`). Owner: T03b.
//
// A value §5b does not give is written as `default`, so the column's own default applies.
export const output = "50_people.sql";
export const requires = ["m2_people"];

export function build({ load, sql }) {
  const c = load("catalogue");
  const p = load("people");
  const { q, ts, date, jsonb, insert } = sql;
  const ph = Object.fromEntries(c.phases.map((x) => [x.slug, x.id]));
  const uid = Object.fromEntries(p.people.map((x) => [x.key, x.id]));
  const orDefault = (v, f = q) => (v === null || v === undefined ? "default" : f(v));
  const accounts = p.people.filter((x) => x.account);
  const parts = [];
  // Phone sign-in accounts. GoTrue stores the phone without "+". Test numbers only.
  parts.push(
    `${insert(
      "auth.users",
      [
        "instance_id",
        "id",
        "aud",
        "role",
        "phone",
        "phone_confirmed_at",
        "raw_app_meta_data",
        "raw_user_meta_data",
      ],
      accounts.map((x) => [
        q("00000000-0000-0000-0000-000000000000"),
        q(x.id),
        q("authenticated"),
        q("authenticated"),
        q(x.wa_id),
        x.wa_id ? "ops.now()" : "null",
        jsonb(x.wa_id ? { provider: "phone", providers: ["phone"] } : { provider: "fixture" }),
        jsonb({ first_name: x.first_name }),
      ]),
    ).replace(/;\n$/, "")}\non conflict (id) do nothing;\n`,
  );
  parts.push(
    `${insert(
      "app.profiles",
      ["id", "first_name", "phone_masked", "following_seen_at", "adult_attested_at"],
      accounts.map((x) => {
        const pr = p.profiles.find((r) => r.user === x.key);
        return [
          q(x.id),
          q(x.first_name),
          q(x.phone_masked),
          ts(pr?.following_seen_at ?? null),
          ts(pr?.adult_attested_at ?? null),
        ];
      }),
    ).replace(
      /;\n$/,
      "",
    )}\non conflict (id) do update set first_name = excluded.first_name, phone_masked = excluded.phone_masked, following_seen_at = excluded.following_seen_at;\n`,
  );
  parts.push(
    `${insert(
      "app.user_roles",
      ["user_id", "role"],
      accounts.flatMap((x) => x.roles.map((r) => [q(x.id), q(r)])),
    ).replace(/;\n$/, "")}\non conflict do nothing;\n`,
  );
  parts.push(
    insert(
      "app.follows",
      ["id", "user_id", "phase_id", "follow_type", "source", "followed_at"],
      p.follows.map((f) => [
        q(f.id),
        q(uid[f.user]),
        q(ph[f.phase]),
        q(f.follow_type),
        orDefault(f.follow_source),
        ts(f.followed_at),
      ]),
    ),
  );
  parts.push(
    insert(
      "app.alert_subscriptions",
      ["id", "user_id", "channel", "kind", "cadence", "quiet_from", "quiet_to", "enabled"],
      p.alert_subscriptions.map((s) => [
        q(s.id),
        q(uid[s.user]),
        q(s.channel),
        q(s.kind),
        q(s.cadence),
        `${q(s.quiet_from)}::time`,
        `${q(s.quiet_to)}::time`,
        q(s.enabled),
      ]),
    ),
  );
  parts.push(
    insert(
      "app.project_requests",
      ["id", "ref", "ref_year", "user_id", "name_text", "rera_text", "due_on", "status", "reason"],
      p.project_requests.map((r) => [
        q(r.id),
        q(r.ref),
        q(r.ref_year),
        q(r.user ? uid[r.user] : null),
        q(r.name_text),
        q(r.rera_text),
        date(r.due_on),
        q(r.status),
        q(r.reason),
      ]),
    ),
  );
  return parts.join("\n");
}
