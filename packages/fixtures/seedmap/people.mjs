// Seedmap: canonical/people.json -> supabase/seed/50_people.sql (DATA_MODEL §5).
// auth.users and auth.identities for the fixture accounts (app.profiles is created by T40's
// trigger, then updated here), app.user_roles, Rohan's follows and alert subscriptions, and the
// R-1018-07 request. Waits for T40's migrations (file names carry `m2_people`). Owner: T03b.
//
// A value §5b does not give is written as `default`, so the column's own default applies.
import { uuid5 } from "../src/author/lib.mjs";

export const output = "50_people.sql";
export const requires = ["m2_people"];

// Supabase Auth (GoTrue) loads a user by selecting every auth.users column into a Go struct, so a
// NULL in a column it reads as a plain string (or time.Time) fails every sign-in of that row with
// 500 "Database error finding user" (M2 gate gap 8). Its own inserts write '' into these, and
// this seed does the same. encrypted_password '' means "no password", as GoTrue writes it for a
// phone-only account: a password grant never matches it.
const GOTRUE_EMPTY_STRINGS = [
  "encrypted_password",
  "confirmation_token",
  "recovery_token",
  "email_change_token_new",
  "email_change",
  "email_change_token_current",
  "phone_change",
  "phone_change_token",
  "reauthentication_token",
];
/** GoTrue's single-tenant instance id (uuid.Nil); it looks users up by it. */
const GOTRUE_INSTANCE_ID = "00000000-0000-0000-0000-000000000000";

export function build({ load, sql }) {
  const c = load("catalogue");
  const p = load("people");
  const { q, ts, date, jsonb, insert } = sql;
  const ph = Object.fromEntries(c.phases.map((x) => [x.slug, x.id]));
  const uid = Object.fromEntries(p.people.map((x) => [x.key, x.id]));
  const orDefault = (v, f = q) => (v === null || v === undefined ? "default" : f(v));
  const accounts = p.people.filter((x) => x.account);
  // When each account was made. §5b dates no sign-up, but an account must exist before its
  // earliest dated row (Rohan "has followed 4 projects since 1 Jul 2026"), so that is its date;
  // an account with no dated row was made at the frozen clock (people.json `clock`). Never the
  // load time, so the seed stays deterministic.
  const firstDated = new Map();
  for (const f of p.follows) {
    const at = f.followed_at;
    if (at && (!firstDated.has(f.user) || Date.parse(at) < Date.parse(firstDated.get(f.user))))
      firstDated.set(f.user, at);
  }
  const madeAt = (x) => firstDated.get(x.key) ?? p.clock;
  const parts = [];
  // Phone sign-in accounts, written as GoTrue writes them. GoTrue stores the phone without "+".
  // Test numbers only. A phone account was confirmed by its first code, when it was made.
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
        ...GOTRUE_EMPTY_STRINGS,
        "raw_app_meta_data",
        "raw_user_meta_data",
        "created_at",
        "updated_at",
      ],
      accounts.map((x) => [
        q(GOTRUE_INSTANCE_ID),
        q(x.id),
        q("authenticated"),
        q("authenticated"),
        q(x.wa_id),
        x.wa_id ? ts(madeAt(x)) : "null",
        ...GOTRUE_EMPTY_STRINGS.map(() => q("")),
        jsonb(x.wa_id ? { provider: "phone", providers: ["phone"] } : { provider: "fixture" }),
        jsonb({ first_name: x.first_name }),
        ts(madeAt(x)),
        ts(madeAt(x)),
      ]),
    ).replace(/;\n$/, "")}\non conflict (id) do nothing;\n`,
  );
  // The phone identity GoTrue creates with a phone account (provider_id is the user id).
  const phoneAccounts = accounts.filter((x) => x.wa_id);
  parts.push(
    `${insert(
      "auth.identities",
      [
        "id",
        "provider_id",
        "user_id",
        "provider",
        "identity_data",
        "last_sign_in_at",
        "created_at",
        "updated_at",
      ],
      phoneAccounts.map((x) => [
        q(uuid5("auth_identity", `phone/${x.key}`)),
        q(x.id),
        q(x.id),
        q("phone"),
        jsonb({ sub: x.id, phone: x.wa_id, email_verified: false, phone_verified: true }),
        "null",
        ts(madeAt(x)),
        ts(madeAt(x)),
      ]),
    ).replace(/;\n$/, "")}\non conflict (provider_id, provider) do nothing;\n`,
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
