#!/usr/bin/env node
// Validates every packages/fixtures/expected/<fn>/<key>.json.
//
// 1. Always: structural checks from API_CONTRACTS.md (the `schema` envelope, the required
//    top-level fields, a `_requests.json` entry for every key, no client-composed risk copy).
// 2. When packages/contracts/schemas/*.json exist (T02): JSON Schema 2020-12 validation with
//    ajv. A payload's schema is found by its envelope ("plinth.risk_summary/1" -> a schema
//    whose $id or file name names risk_summary). Until T02 merges, step 2 is reported as
//    pending and the run still passes on step 1; the T07 gate runs it for real.
//
// Usage: node scripts/validate.mjs [--require-schemas]
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(PKG, "../..");
const EXPECTED = join(PKG, "expected");
const SCHEMAS = join(ROOT, "packages", "contracts", "schemas");

/** Required top-level fields per payload type (API_CONTRACTS §2, §4). */
export const REQUIRED = {
  risk_summary: [
    "schema",
    "phase",
    "display",
    "band",
    "chip",
    "confidence",
    "frequency",
    "late12",
    "reasons",
    "what_would_change",
    "pending",
    "developer_response",
    "progress",
    "price",
    "complaints",
    "withheld",
    "meta",
    "share",
  ],
  project_page: [
    "schema",
    "risk",
    "hero",
    "truth_panel",
    "progress",
    "homes",
    "from_developer",
    "cost",
    "wait_defaults",
    "afford_default",
    "next_steps",
    "before_booking",
    "pre_rera",
    "records",
    "meta",
  ],
  search_results: [
    "schema",
    "parsed",
    "notes",
    "sort_line",
    "items",
    "hidden_count",
    "next_cursor",
    "zero_results",
  ],
  developer_page: [
    "schema",
    "group",
    "track_record",
    "ongoing",
    "complaints",
    "insolvency_line",
    "pre_rera",
    "reply",
    "how_buyers_find_you",
    "meta",
  ],
  compare: ["schema", "columns", "rows", "notes"],
  evidence: [
    "schema",
    "chip",
    "lane",
    "document",
    "dates_line",
    "page",
    "extract",
    "read_line",
    "used_in",
    "developer_says",
    "corrections_line",
    "snapshot",
    "official_url",
    "view_label",
    "report_error",
  ],
  methodology: ["schema"],
  about: ["schema"],
  flags: [],
  // T03b (API_CONTRACTS §4.7–§4.14); the schemas hold the full lists.
  following_feed: ["schema", "since", "summary_line", "changes", "quiet", "projects", "replay"],
  who_has_my_number: ["schema", "count_line", "rule_line", "parties", "relays", "ended"],
  consent_history: ["schema", "count_line", "rule_line", "items"],
  family_invite_preview: ["schema", "inviter_first_name", "scope_line", "number_line"],
  family_invite: ["schema", "code", "link", "expires_on", "rules", "private_line"],
  alert_prefs: ["schema", "prefs", "whatsapp_optin", "lines", "number_line"],
  share_card: ["schema", "kind", "phase", "sent", "now", "changed", "changes", "live_url"],
  digest_card: ["schema", "heading_line", "projects"],
  doc_check: ["schema", "id", "kind", "status", "rows", "notes", "rules_version"],
  cost_breakdown: ["schema", "rules_version", "lines", "all_in_inr", "all_in_label"],
  afford_the_wait: ["schema", "answer_line", "now", "by_completion", "delay", "series"],
  payee_check: ["schema", "payee", "cap", "method", "never_line"],
  follow: ["schema", "slug", "follow_type", "followed_at", "alerts_line", "private_line"],
  ok: ["ok"],
  consent_withdrawal: ["ref", "withdrawn_at", "effects"],
  // T45a (the buyer API's own result schemas).
  link_whatsapp_follows: ["schema", "accepted", "linked", "follows", "cost_sheets"],
  family_circle: [
    "schema",
    "members",
    "invites",
    "member_of",
    "rules",
    "private_line",
    "number_line",
  ],
  saved_searches: ["schema", "items", "max_items"],
  request_project: ["schema", "ref", "requested_on", "due_on", "status", "line"],
};
const FN_TYPE = {
  risk_summary: "risk_summary",
  project_page: "project_page",
  search_projects: "search_results",
  developer_page: "developer_page",
  compare: "compare",
  evidence: "evidence",
  methodology: "methodology",
  about: "about",
  flags: "flags",
  // T03b: M2–M3 reads and the M2 write answers. A folder is named after the RPC; where the RPC
  // differs from the folder (alert_prefs_get, before_you_pay_check), _requests.json says `rpc`.
  following_feed: "following_feed",
  who_has_my_number: "who_has_my_number",
  consent_history: "consent_history",
  family_invite_preview: "family_invite_preview",
  alert_prefs: "alert_prefs",
  share_card: "share_card",
  digest_card: "digest_card",
  doc_check: "doc_check",
  cost_breakdown: "cost_breakdown",
  afford_the_wait: "afford_the_wait",
  payee_check: "payee_check",
  follow: "follow",
  alert_prefs_set: "alert_prefs",
  family_invite_create: "family_invite",
  consent_withdraw: "consent_withdrawal",
  unfollow: "ok",
  mark_following_seen: "ok",
  family_invite_cancel: "ok",
  family_member_remove: "ok",
  family_member_undo: "ok",
  shortlist_note_add: "ok",
  // T45a
  link_whatsapp_follows: "link_whatsapp_follows",
  set_follow_type: "follow",
  family_circle: "family_circle",
  saved_searches: "saved_searches",
  request_project: "request_project",
};
/** Acknowledgements without a `schema` envelope, validated against a $def (API_CONTRACTS §1). */
const DEF_REF = {
  ok: "https://plinth.in/schemas/common.schema.json#/$defs/Ok",
  consent_withdrawal:
    "https://plinth.in/schemas/who_has_my_number.schema.json#/$defs/ConsentWithdrawal",
};
/**
 * Functions the OpenAPI marks `x-plinth-shape: pending` (no contract schema
 * yet, by design — the owning milestone task hasn't defined the real one).
 * Their fixture payloads still get every structural check above; only the
 * ajv "no JSON Schema" check is expected here, not a failure, until that
 * task adds the real schema and this entry comes out. T45a gave
 * api.link_whatsapp_follows its real schema; api.digest_card (the lead's M2 gate gap 5) waits
 * for its contract schema (a Handoff to the contracts owner).
 */
const PENDING_SHAPE = new Set(["digest_card"]);
const LANES = new Set([
  "records_show",
  "developer_says",
  "from_developer",
  "our_estimate",
  "reported_unverified",
  "buyer_upload",
]);
// AGENTS.md §5 copy bans, applied to every string in the fixtures (they reach users verbatim).
const BANNED = [
  /\bsafe(?:ly|r|st)?\b/i,
  /\bguarantee(?:d|s)?\b/i,
  /\bclear title\b/i,
  /\bfraud/i,
  /\bscam/i,
  /\bavoid/i,
  /\brisky builders?\b/i,
  /\b(?:lie|lies|lied|lying)\b/i,
  /\bmislead|\bmisled\b/i,
  /%\s*(?:chance|probability|likely|likelihood)\b/i,
  /\b(?:1|one)\s+in\s+\d/i,
  /\bunlock/i,
  /\bseamless/i,
  /\bget started\b/i,
  /\blearn more\b/i,
];

export function listExpected() {
  const out = [];
  if (!existsSync(EXPECTED)) return out;
  for (const fn of readdirSync(EXPECTED, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort())
    for (const f of readdirSync(join(EXPECTED, fn))
      .filter((x) => x.endsWith(".json") && !x.startsWith("_"))
      .sort())
      out.push({ fn, key: basename(f, ".json"), path: join(EXPECTED, fn, f) });
  return out;
}

function walkStrings(v, cb, path = "$") {
  if (typeof v === "string") cb(v, path);
  else if (Array.isArray(v)) v.forEach((x, i) => walkStrings(x, cb, `${path}[${i}]`));
  else if (v && typeof v === "object")
    for (const [k, x] of Object.entries(v)) walkStrings(x, cb, `${path}.${k}`);
}

/** Structural problems for one payload (empty array = fine). */
export function structuralProblems(fn, body) {
  const problems = [];
  const type = FN_TYPE[fn];
  if (!type)
    return [`unknown fixture function "${fn}" (add it to FN_TYPE in scripts/validate.mjs)`];
  if (type === "flags") {
    // T04's api.flags(): { schema: "plinth.flags/1", flags: { key: boolean } }.
    if (body.schema !== "plinth.flags/1")
      problems.push(`schema is ${JSON.stringify(body.schema)}, expected "plinth.flags/1"`);
    if (!body.flags || typeof body.flags !== "object") problems.push("missing flags");
    for (const [k, v] of Object.entries(body.flags ?? {}))
      if (typeof v !== "boolean") problems.push(`flag ${k} is not a boolean`);
    return problems;
  }
  if (DEF_REF[type]) {
    if ("schema" in body) problems.push(`an acknowledgement (${type}) carries no schema envelope`);
  } else if (body.schema !== `plinth.${type}/1`)
    problems.push(`schema is ${JSON.stringify(body.schema)}, expected "plinth.${type}/1"`);
  for (const k of REQUIRED[type]) if (!(k in body)) problems.push(`missing ${k}`);
  walkStrings(body, (s, p) => {
    for (const re of BANNED)
      if (re.test(s)) problems.push(`${p}: banned copy ${re} in ${JSON.stringify(s)}`);
  });
  const lanes = [];
  (function walk(v, p) {
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${p}[${i}]`));
    else if (v && typeof v === "object")
      for (const [k, x] of Object.entries(v)) {
        if ((k === "lane" || k.endsWith("_lane")) && x !== null) lanes.push([`${p}.${k}`, x]);
        walk(x, `${p}.${k}`);
      }
  })(body, "$");
  for (const [p, l] of lanes)
    if (!LANES.has(l)) problems.push(`${p}: unknown lane ${JSON.stringify(l)}`);
  if (type === "risk_summary") {
    const st = body.display?.state;
    if (st !== "scored" && (body.band !== null || body.frequency !== null || body.reasons?.length))
      problems.push("band, frequency and reasons must be null/empty unless the state is scored");
    if (body.band?.set_by === "red_flag_rule" && body.frequency !== null)
      problems.push("a red-flag band carries no frequency");
    if ((body.reasons ?? []).length > 4) problems.push("more than 4 reasons");
    for (const r of body.reasons ?? [])
      if (!r.sources?.length || !r.sources.every((s) => s.fact_ids?.length))
        problems.push(`reason ${r.rank} has no cited fact`);
    if (body.complaints && !body.complaints.line.includes("per 100 units"))
      problems.push("complaints line must carry the rate");
    if ((body.share?.lines ?? []).length > 3) problems.push("share card has more than 3 lines");
  }
  return problems;
}

async function loadAjv() {
  if (!existsSync(SCHEMAS)) return null;
  const files = readdirSync(SCHEMAS).filter((f) => f.endsWith(".json"));
  if (!files.length) return null;
  const { default: Ajv2020 } = await import("ajv/dist/2020.js");
  const { default: addFormats } = await import("ajv-formats");
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const schemas = files.map((f) => ({
    file: f,
    schema: JSON.parse(readFileSync(join(SCHEMAS, f), "utf8")),
  }));
  for (const s of schemas) ajv.addSchema(s.schema, s.schema.$id ?? s.file);
  const find = (type) => {
    if (DEF_REF[type]) return ajv.getSchema(DEF_REF[type]) ?? null;
    const s =
      schemas.find((x) =>
        (x.schema.$id ?? "").match(new RegExp(`(^|[/.])${type}(\\.schema)?(\\.json)?(/\\d+)?$`)),
      ) ?? schemas.find((x) => [`${type}.json`, `${type}.schema.json`].includes(x.file));
    return s ? ajv.getSchema(s.schema.$id ?? s.file) : null;
  };
  return { find, count: files.length };
}

async function main() {
  const requireSchemas = process.argv.includes("--require-schemas");
  const items = listExpected();
  let failures = 0;
  const requests = {};
  for (const { fn } of items)
    if (!(fn in requests)) {
      const p = join(EXPECTED, fn, "_requests.json");
      requests[fn] = existsSync(p) ? JSON.parse(readFileSync(p, "utf8")).requests : {};
    }
  const ajv = await loadAjv();
  let schemaChecked = 0;
  let noSchema = 0;
  for (const it of items) {
    const rel = relative(ROOT, it.path);
    let body;
    try {
      body = JSON.parse(readFileSync(it.path, "utf8"));
    } catch (e) {
      console.log(`FAIL ${rel}: not JSON (${e.message})`);
      failures++;
      continue;
    }
    const problems = structuralProblems(it.fn, body);
    if (!(it.key in requests[it.fn]))
      problems.push(`no entry for "${it.key}" in ${it.fn}/_requests.json`);
    if (ajv) {
      const validate = ajv.find(FN_TYPE[it.fn]);
      if (validate) {
        schemaChecked++;
        if (!validate(body))
          for (const e of validate.errors)
            problems.push(`schema: ${e.instancePath || "/"} ${e.message}`);
      } else {
        noSchema++;
        if (!PENDING_SHAPE.has(it.fn))
          problems.push(`no JSON Schema in packages/contracts for "${FN_TYPE[it.fn]}"`);
        else console.log(`PENDING ${rel}: x-plinth-shape: pending, no JSON Schema yet (expected)`);
      }
    }
    if (problems.length) {
      failures++;
      for (const p of problems) console.log(`FAIL ${rel}: ${p}`);
    }
  }
  console.log(
    `validate: ${items.length} expected payloads, ${failures} failing (structural checks${ajv ? `; JSON Schema on ${schemaChecked}, ${noSchema} without a matching schema` : ""})`,
  );
  if (!ajv) {
    console.log(
      "validate: packages/contracts/schemas has no schemas yet (T02). JSON Schema validation is pending and runs at the T07 gate.",
    );
    if (requireSchemas) failures++;
  }
  process.exit(failures ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
