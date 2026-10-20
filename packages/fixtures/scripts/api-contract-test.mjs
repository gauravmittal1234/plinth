#!/usr/bin/env node
// API contract tests (owner: T12; T13 and later API tasks reuse it unchanged).
//
// For every function with a folder in packages/fixtures/expected/<fn>/ and a matching
// api.<fn> in the database, it calls the RPC with each fixture key's arguments
// (expected/<fn>/_requests.json), then:
//   1. deep-compares the live payload with expected/<fn>/<key>.json (ignoring meta.generated_at);
//   2. validates the live payload with @plinth/contracts (the schema named by its envelope).
//
//   npm run -w @plinth/fixtures test:api
//   npm run -w @plinth/fixtures test:api -- --only risk_summary,evidence
//   npm run -w @plinth/fixtures test:api -- --db pglite      # or --db postgres
//   npm run -w @plinth/fixtures test:api -- --ignore-ids     # mask uuids (a database not loaded from the §5b seed)
//   npm run -w @plinth/fixtures test:api -- --verbose
//
// Databases:
//   postgres  psql with the PG* variables or DATABASE_URL (ci-db's Supabase Postgres 17 after
//             `supabase db reset` and the clock freeze). The default when PGHOST or DATABASE_URL is set.
//   pglite    a throwaway PGlite database built from the Supabase shim, supabase/migrations and
//             supabase/seed, exactly as `npm run db:check` builds it. The default otherwise.
//
// Every call runs as `anon` (the public read API), or, when its request names `as.user_id`
// (the buyer API), as `authenticated` with that user's JWT claims. All calls share one
// transaction that is rolled back, and each call is also undone on its own (its block raises
// after the call), so a mutation fixture (consent_withdraw) never changes what a later fixture
// reads. Acknowledgements carry no envelope (API_CONTRACTS §1): ACKNOWLEDGEMENTS names their type.
//
// A request's `rpc` names the function when it differs from the folder (alert_prefs answers
// api.alert_prefs_get, payee_check api.before_you_pay_check).
//
// Skipped on purpose:
//   - keys ending in `--facts-only`, and any request carrying a `state`: design states that are
//     not seeded (packages/fixtures CONFLICTS C-23, INTEGRATION_NOTES);
//   - requests marked `"seeded": false`: fixture-mode answers the §5b seed cannot reach
//     (link_whatsapp_follows: Rohan's WhatsApp contact is already linked);
//   - functions whose api.<fn> does not exist yet (later tasks), unless named in --only.
//
// Seed top-up: ws.developer_claims and ws.developer_replies (T12's tables) are seeded by
// seedmap/developer_content.mjs, which also waits for T13's tables (requires 20261101 and
// 20261102). Until that seed lands, the runner inserts the claims and replies from
// canonical/developer_content.json inside its rolled-back transaction (`on conflict do nothing`,
// so it is a no-op once they are seeded).
//
// Fields awaiting a later table (AWAITING below) are tolerated only while that table is absent;
// once it exists they must match like every other field.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(PKG, "../..");
const EXPECTED = join(PKG, "expected");
const SUPABASE = join(ROOT, "supabase");

/** Contract type of the functions that answer with an acknowledgement (no envelope). */
const ACKNOWLEDGEMENTS = {
  consent_withdraw: "ConsentWithdrawal",
  relay_renew: "RelayRenewal",
  device_register: "Ok",
  unfollow: "Ok",
  mark_following_seen: "Ok",
  family_invite_cancel: "Ok",
  family_member_remove: "Ok",
  family_member_undo: "Ok",
  shortlist_note_add: "Ok",
  doc_check_save: "Ok",
};

/** Fields that need a table a later task creates, tolerated while `table` is absent.
 *  `fixture` is the expected/<fn>/<fixture>.json key. */
const AWAITING = [
  {
    fn: "risk_summary",
    fixture: "aurelia-heights-phase-2",
    path: "price.basis_line",
    table: "ws.cost_sheets",
    why: "the cost sheet's option (park-facing) is read from ws.cost_sheets, which T13 creates",
  },
];

// ---------------------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const opt = {
  only: value("--only")
    ? value("--only")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null,
  db: value("--db") ?? (process.env.PGHOST || process.env.DATABASE_URL ? "postgres" : "pglite"),
  ignoreIds: flag("--ignore-ids"),
  verbose: flag("--verbose"),
};
if (!["postgres", "pglite"].includes(opt.db)) {
  console.error(`--db must be postgres or pglite, not ${opt.db}`);
  process.exit(2);
}

// ---------------------------------------------------------------------------- fixtures
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const expectedFns = () =>
  readdirSync(EXPECTED)
    .filter((d) => statSync(join(EXPECTED, d)).isDirectory())
    .sort();

function plan(fn) {
  const reqPath = join(EXPECTED, fn, "_requests.json");
  const requests = existsSync(reqPath) ? readJson(reqPath).requests : {};
  const keys = readdirSync(join(EXPECTED, fn))
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.slice(0, -5))
    .sort();
  return keys.map((key) => {
    const req = requests[key] ?? {};
    const designState = key.endsWith("--facts-only") || "state" in req;
    // `rpc` names the function when it differs from the folder (alert_prefs → alert_prefs_get).
    const rpc = typeof req.rpc === "string" ? req.rpc : fn;
    return {
      fn,
      rpc,
      key,
      req,
      designState,
      unseeded: req.seeded === false,
      expected: readJson(join(EXPECTED, fn, `${key}.json`)),
    };
  });
}

// ---------------------------------------------------------------------------- SQL building
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const sqlValue = (v) => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return lit(v);
  if (Array.isArray(v) && v.every((x) => typeof x === "string"))
    return `array[${v.map(lit).join(", ")}]::text[]`;
  return `${lit(JSON.stringify(v))}::jsonb`;
};
const callSql = (fn, req) => {
  const args = Object.entries(req)
    .filter(([k]) => k.startsWith("p_"))
    .map(([k, v]) => `${k} => ${sqlValue(v)}`);
  return `select (api.${fn}(${args.join(", ")}))::text`;
};

function topUpSql(tables) {
  const out = [];
  const cat = readJson(join(PKG, "canonical", "catalogue.json"));
  const dc = readJson(join(PKG, "canonical", "developer_content.json"));
  const phaseId = Object.fromEntries(cat.phases.map((p) => [p.slug, p.id]));
  if (tables.has("ws.developer_claims") && dc.developer_claims?.length) {
    const rows = dc.developer_claims.map(
      (c) =>
        `(${[
          lit(c.id),
          lit(phaseId[c.phase]),
          lit(c.text),
          `${lit(c.said_on)}::date`,
          c.check_by ? `${lit(c.check_by)}::date` : "null",
          lit(c.verified_state),
          c.linked_fact ? lit(c.linked_fact) : "null",
          c.public ? "true" : "false",
        ].join(", ")})`,
    );
    out.push({
      table: "ws.developer_claims",
      sql: `insert into ws.developer_claims (id, phase_id, text, said_on, check_by, verified_state, linked_fact_id, public) values ${rows.join(", ")} on conflict (id) do nothing`,
    });
  }
  if (tables.has("ws.developer_replies") && dc.developer_replies?.length) {
    const rows = dc.developer_replies.map(
      (r) =>
        `(${[
          lit(r.id),
          lit(phaseId[r.phase]),
          lit(r.text),
          lit(r.signatory_title),
          r.signatory_name ? lit(r.signatory_name) : "null",
          lit(r.scope ?? "project"),
          `${lit(`${r.published_on}T00:00:00+05:30`)}::timestamptz`,
          r.check_by ? `${lit(r.check_by)}::date` : "null",
          lit(r.status),
        ].join(", ")})`,
    );
    out.push({
      table: "ws.developer_replies",
      sql: `insert into ws.developer_replies (id, phase_id, text, signatory_title, signatory_name, scope, published_at, check_by, status) values ${rows.join(", ")} on conflict (id) do nothing`,
    });
  }
  return out;
}

// jsonb, not json: its text form is always one line, which psql -A -t needs.
const PROBE_SQL = `select jsonb_build_object(
  'fns', (select coalesce(jsonb_agg(distinct p.proname::text), '[]') from pg_catalog.pg_proc p
           join pg_catalog.pg_namespace n on n.oid = p.pronamespace where n.nspname = 'api'),
  'tables', (select coalesce(jsonb_agg(n.nspname || '.' || c.relname), '[]') from pg_catalog.pg_class c
           join pg_catalog.pg_namespace n on n.oid = c.relnamespace
           where n.nspname in ('core', 'ws', 'app') and c.relkind in ('r', 'p')),
  'env', ops.env(),
  'now', ops.now()
)::text as probe`;

function runSql(cases, topUps) {
  const block = [];
  for (const t of topUps) {
    block.push(`  execute ${lit(t.sql)};`);
    block.push("  get diagnostics v_n = row_count;");
    block.push(`  insert into pg_temp._contract_topup values (${lit(t.table)}, v_n);`);
  }
  for (const c of cases) {
    const userId = c.req.as?.user_id;
    const claims = userId ? JSON.stringify({ sub: userId, role: "authenticated" }) : "";
    block.push("  v_out := null;");
    block.push("  begin");
    block.push(`    execute 'set local role ${userId ? "authenticated" : "anon"}';`);
    block.push(`    perform pg_catalog.set_config('request.jwt.claims', ${lit(claims)}, true);`);
    block.push(`    execute ${lit(callSql(c.rpc, c.req))} into v_out;`);
    // Undo this call's writes, role and claims: the raise rolls the block back; v_out survives.
    block.push("    raise exception using errcode = 'P0001', message = '__contract_rollback__';");
    block.push("  exception when others then");
    block.push("    if sqlerrm = '__contract_rollback__' then");
    block.push(
      `      insert into pg_temp._contract_result values (${lit(c.fn)}, ${lit(c.key)}, v_out, null);`,
    );
    block.push("    else");
    block.push(
      `      insert into pg_temp._contract_result values (${lit(c.fn)}, ${lit(c.key)}, null, sqlstate || ': ' || sqlerrm);`,
    );
    block.push("    end if;");
    block.push("  end;");
  }
  return [
    "begin;",
    "create temp table _contract_result (fn text, key text, payload text, error text) on commit drop;",
    "create temp table _contract_topup (tbl text, inserted integer) on commit drop;",
    "do $contract$",
    "declare",
    "  v_out text;",
    "  v_n integer;",
    "begin",
    ...block,
    "end",
    "$contract$;",
    `select jsonb_build_object(
      'results', (select coalesce(jsonb_agg(to_jsonb(r)), '[]') from pg_temp._contract_result r),
      'topup', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from pg_temp._contract_topup t)
    )::text as out;`,
    "rollback;",
  ].join("\n");
}

// ---------------------------------------------------------------------------- databases
function psql(sql) {
  const args = ["-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1"];
  if (process.env.DATABASE_URL) args.push("-d", process.env.DATABASE_URL);
  args.push("-f", "-");
  const r = spawnSync("psql", args, { input: sql, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new Error(`psql: ${r.error.message} (is the PostgreSQL client installed?)`);
  if (r.status !== 0) throw new Error(`psql exited ${r.status}:\n${r.stderr}`);
  const lines = r.stdout.split("\n").filter((l) => l.trim().startsWith("{"));
  if (!lines.length) throw new Error(`psql returned no JSON:\n${r.stdout}\n${r.stderr}`);
  return JSON.parse(lines[lines.length - 1]);
}

const UNAVAILABLE = ["postgis", "pg_cron", "pg_net", "pgmq"];
const keepLines = (m, r) => r + "\n".repeat((m.match(/\n/g) ?? []).length);
// The same rewrites as supabase/tools/pglite-check.mjs (T04): no PostGIS, pg_cron, pg_net or
// pgmq in PGlite; geography columns become bytea.
function forPglite(sql) {
  return sql
    .replace(/create\s+extension\s+(?:if\s+not\s+exists\s+)?"?([a-z_]+)"?[^;]*;/gi, (m, name) =>
      UNAVAILABLE.includes(name.toLowerCase())
        ? keepLines(m, `/* pglite: skipped extension ${name} */;`)
        : m,
    )
    .replace(/\b(?:extensions\.)?(?:geography|geometry)\s*\(\s*[a-z]+\s*(?:,\s*\d+\s*)?\)/gi, (m) =>
      keepLines(m, "bytea"),
    )
    .replace(/::\s*(?:extensions\.)?(?:geography|geometry)\b/gi, "::bytea");
}

async function openPglite() {
  const { PGlite } = await import("@electric-sql/pglite");
  const { btree_gist } = await import("@electric-sql/pglite/contrib/btree_gist");
  const { pg_trgm } = await import("@electric-sql/pglite/contrib/pg_trgm");
  const { pgcrypto } = await import("@electric-sql/pglite/contrib/pgcrypto");
  const { pgtap } = await import("@electric-sql/pglite/pgtap");
  const { vector } = await import("@electric-sql/pglite/vector");
  const db = new PGlite({ extensions: { btree_gist, pg_trgm, pgcrypto, pgtap, vector } });
  const sqlFiles = (dir) =>
    existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => f.endsWith(".sql"))
          .sort()
          .map((f) => join(dir, f))
      : [];
  await db.exec(readFileSync(join(SUPABASE, "tests", "shim", "supabase_shim.psql"), "utf8"));
  for (const f of [
    ...sqlFiles(join(SUPABASE, "migrations")),
    ...sqlFiles(join(SUPABASE, "seed")),
  ]) {
    const raw = readFileSync(f, "utf8");
    if (/--\s*pglite:\s*skip\b/i.test(raw.split("\n").slice(0, 20).join("\n"))) continue;
    try {
      await db.exec(forPglite(raw));
    } catch (e) {
      throw new Error(`${f.slice(ROOT.length + 1)}: ${e.message}`);
    }
  }
  const one = async (sql) => {
    const res = await db.exec(sql);
    for (let i = res.length - 1; i >= 0; i--) {
      const r = res[i];
      if (r.fields?.length === 1 && r.rows.length) return JSON.parse(r.rows[0][r.fields[0].name]);
    }
    throw new Error("PGlite returned no JSON");
  };
  return { query: one, close: () => db.close() };
}

// ---------------------------------------------------------------------------- comparison
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const maskIds = (v) =>
  typeof v === "string"
    ? v.replace(UUID, "<id>")
    : Array.isArray(v)
      ? v.map(maskIds)
      : v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, maskIds(x)]))
        : v;

function diff(exp, act, path, out) {
  if (path.endsWith(".generated_at") || path === "generated_at") return;
  const te = Array.isArray(exp) ? "array" : exp === null ? "null" : typeof exp;
  const ta = Array.isArray(act) ? "array" : act === null ? "null" : typeof act;
  if (te !== ta) {
    out.push({ path, expected: exp, actual: act });
    return;
  }
  if (te === "array") {
    if (exp.length !== act.length)
      out.push({ path: `${path}.length`, expected: exp.length, actual: act.length });
    for (let i = 0; i < Math.min(exp.length, act.length); i++)
      diff(exp[i], act[i], `${path}[${i}]`, out);
    return;
  }
  if (te === "object") {
    for (const k of new Set([...Object.keys(exp), ...Object.keys(act)])) {
      const p = path ? `${path}.${k}` : k;
      if (!(k in act)) out.push({ path: p, expected: exp[k], actual: "(missing)" });
      else if (!(k in exp)) out.push({ path: p, expected: "(absent)", actual: act[k] });
      else diff(exp[k], act[k], p, out);
    }
    return;
  }
  if (exp !== act) out.push({ path, expected: exp, actual: act });
}

const show = (v) => (typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v ?? null));

// ---------------------------------------------------------------------------- main
async function main() {
  const { VALIDATORS, validatorForPayload } = await import("@plinth/contracts/validators");
  const db =
    opt.db === "postgres"
      ? { query: async (sql) => psql(sql), close: async () => {} }
      : await openPglite();

  const probe = await db.query(PROBE_SQL);
  const fnsInDb = new Set(probe.fns);
  const tables = new Set(probe.tables);
  const where =
    opt.db === "postgres"
      ? `postgres ${process.env.DATABASE_URL ? "(DATABASE_URL)" : `${process.env.PGHOST ?? "localhost"}:${process.env.PGPORT ?? "5432"}`}`
      : "PGlite (shim + migrations + seed)";
  console.log(`API contract tests · ${where} · env ${probe.env} · ops.now() ${probe.now}`);

  const fns = opt.only ?? expectedFns();
  const missing = fns.filter((fn) => !existsSync(join(EXPECTED, fn)));
  if (missing.length) {
    console.log(`FAIL no expected/ folder for: ${missing.join(", ")}`);
    process.exit(1);
  }

  let failures = 0;
  const cases = [];
  const skipped = [];
  for (const fn of fns) {
    const planned = plan(fn);
    const rpcs = [...new Set(planned.map((c) => c.rpc))];
    if (rpcs.length === 0) rpcs.push(fn);
    if (!rpcs.some((rpc) => fnsInDb.has(rpc))) {
      if (opt.only) {
        console.log(`FAIL api.${rpcs.join(", api.")} does not exist in this database`);
        failures += 1;
      } else skipped.push(`${fn} (api.${rpcs.join(", api.")} not in this database yet)`);
      continue;
    }
    for (const c of planned) {
      if (c.designState) skipped.push(`${fn}/${c.key} (design state, not seeded: CONFLICTS C-23)`);
      else if (c.unseeded)
        skipped.push(`${fn}/${c.key} (not reachable from the seed: seeded false)`);
      else if (!fnsInDb.has(c.rpc))
        skipped.push(`${fn}/${c.key} (api.${c.rpc} not in this database yet)`);
      else cases.push(c);
    }
  }

  const topUps = topUpSql(tables);
  const { results, topup } = cases.length
    ? await db.query(runSql(cases, topUps))
    : { results: [], topup: [] };
  await db.close();
  for (const t of topup)
    console.log(
      `  seed top-up  ${t.tbl}: ${t.inserted} row(s) from canonical/developer_content.json` +
        (t.inserted ? " (the generated seed waits for 20261102)" : " (already seeded)"),
    );

  const byKey = new Map(results.map((r) => [`${r.fn}/${r.key}`, r]));
  const totals = { equal: 0, awaiting: 0, valid: 0, run: 0 };
  let currentFn = null;
  for (const c of cases) {
    if (c.fn !== currentFn) {
      currentFn = c.fn;
      console.log(c.fn);
    }
    totals.run += 1;
    const r = byKey.get(`${c.fn}/${c.key}`);
    if (!r || r.error || r.payload === null) {
      failures += 1;
      console.log(`  FAIL ${c.key}: ${r?.error ?? "no result"}`);
      continue;
    }
    const live = JSON.parse(r.payload);
    const problems = [];

    const ack = ACKNOWLEDGEMENTS[c.fn];
    const validate = ack ? VALIDATORS[ack] : validatorForPayload(live);
    if (!validate)
      problems.push(
        ack
          ? `no contract type ${ack} for api.${c.fn}`
          : `no contract schema for envelope ${show(live?.schema)}`,
      );
    else if (!validate(live))
      for (const e of validate.errors ?? [])
        problems.push(`schema: ${e.instancePath || "/"} ${e.message}`);
    else totals.valid += 1;

    const out = [];
    diff(
      opt.ignoreIds ? maskIds(c.expected) : c.expected,
      opt.ignoreIds ? maskIds(live) : live,
      "",
      out,
    );
    const awaited = [];
    const real = out.filter((d) => {
      const a = AWAITING.find(
        (w) => w.fn === c.fn && w.fixture === c.key && w.path === d.path && !tables.has(w.table),
      );
      if (a) awaited.push(`${d.path} awaits ${a.table}: ${a.why}`);
      return !a;
    });
    if (!out.length) totals.equal += 1;
    else if (!real.length) totals.awaiting += 1;
    for (const d of real)
      problems.push(`${d.path}: expected ${show(d.expected)}, got ${show(d.actual)}`);

    if (problems.length) {
      failures += 1;
      console.log(`  FAIL ${c.key}`);
      for (const p of opt.verbose ? problems : problems.slice(0, 12)) console.log(`       ${p}`);
      if (!opt.verbose && problems.length > 12)
        console.log(`       … ${problems.length - 12} more (--verbose)`);
    } else {
      console.log(`  ok   ${c.key}${awaited.length ? `  (tolerated: ${awaited.join("; ")})` : ""}`);
    }
  }
  for (const s of skipped) console.log(`  skip ${s}`);

  const summary =
    `${totals.equal}/${totals.run} deep-equal` +
    (totals.awaiting ? ` (+${totals.awaiting} equal except fields awaiting a later table)` : "") +
    `, ${totals.valid}/${totals.run} schema-valid, ${skipped.length} skipped`;
  if (failures) {
    console.log(`\ntest:api FAILED (${failures}): ${summary}`);
    process.exit(1);
  }
  console.log(`\ntest:api OK: ${summary}`);
}

main().catch((e) => {
  console.error(e.stack ?? e.message ?? e);
  process.exit(1);
});
