#!/usr/bin/env node
// Writes T03's canonical, expected and vector JSON from the authoring modules.
//
//   node src/author/build.mjs           # write files
//   node src/author/build.mjs --check   # exit 1 if any file would change (CI drift check)
//
// Owner: T03 (T03b adds people, consents, family, workspace, agents, visits, checks, their
// expected outputs and the recorded WhatsApp payloads). Facts come only from DESIGN.md §5/§5b; gaps are null and listed in CONFLICTS.md.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalogue, buildEvidence } from "./canonical.mjs";
import { GROUP_SLUGS, SLUGS, makeExpected } from "./expected.mjs";
import { format } from "prettier";
import { json } from "./lib.mjs";
import { buildConsents, buildFamily, buildPeople } from "./people.mjs";
import { buildDeveloperContent, buildScoring } from "./scoring.mjs";
import { buildVectors } from "./vectors.mjs";
import { buildAgents, buildChecks, buildVisits, buildWorkspace } from "./workspace.mjs";

export const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Every file T03 authors, as { relativePath: content }, formatted like `npm run format` would. */
export async function buildAll() {
  const cat = buildCatalogue();
  const ev = buildEvidence(cat);
  const sc = buildScoring(cat, ev);
  const dc = buildDeveloperContent(cat, ev);
  const vec = buildVectors(cat);
  const X = makeExpected(cat, ev, sc, dc, vec);
  const out = {};
  const put = (p, v) => {
    out[p] = json(v);
  };

  put("canonical/catalogue.json", cat);
  put("canonical/evidence.json", ev);
  put("canonical/scoring.json", sc);
  put("canonical/developer_content.json", dc);
  // T03b: people, consents, family, workspace, agents, visits, checks.
  const B = {
    people: buildPeople(sc),
    consents: buildConsents(),
    family: buildFamily(),
    workspace: buildWorkspace(cat, sc, dc),
    agents: buildAgents(),
    visits: buildVisits(),
    checks: buildChecks(),
  };
  for (const [name, v] of Object.entries(B)) put(`canonical/${name}.json`, v);
  for (const [name, v] of Object.entries(vec)) put(`vectors/${name}.json`, v);

  const requests = {};
  const exp = (fn, key, body, args) => {
    put(`expected/${fn}/${key}.json`, body);
    (requests[fn] ??= {})[key] = args;
  };
  const FO = "--facts-only";
  for (const s of SLUGS) {
    exp("risk_summary", s, X.riskSummary(s), { p_slug: s });
    exp("project_page", s, X.projectPage(s), { p_slug: s });
  }
  exp(
    "risk_summary",
    `aurelia-heights-phase-2${FO}`,
    X.riskSummary("aurelia-heights-phase-2", { factsOnly: true }),
    {
      p_slug: "aurelia-heights-phase-2",
      state: "facts_only",
      note: "Design state: needs core.developer_groups.facts_only_since = 2026-10-18 for Northfield (see CONFLICTS.md C-23).",
    },
  );
  exp(
    "project_page",
    `aurelia-heights-phase-2${FO}`,
    X.projectPage("aurelia-heights-phase-2", { factsOnly: true }),
    {
      p_slug: "aurelia-heights-phase-2",
      state: "facts_only",
      note: "Design state (CONFLICTS.md C-23).",
    },
  );
  for (const g of GROUP_SLUGS) exp("developer_page", g, X.developerPage(g), { p_slug: g });
  exp(
    "developer_page",
    `northfield-estates${FO}`,
    X.developerPage("northfield-estates", { factsOnly: true }),
    {
      p_slug: "northfield-estates",
      state: "facts_only",
      note: "Design state (CONFLICTS.md C-23).",
    },
  );
  for (const s of X.searches()) exp("search_projects", s.key, s.body, s.request);
  const cmp = [
    ["aurelia-heights-phase-2", "kestrel-park", "sapphire-grove-phase-1"],
    ["aurelia-heights-phase-2", "kestrel-park", "sapphire-grove-phase-1", "coral-towers"],
  ];
  for (const slugs of cmp) exp("compare", slugs.join("_"), X.compare(slugs), { p_slugs: slugs });
  for (const e of X.evidence()) exp("evidence", e.key, e.body, { p_fact_id: e.key });
  exp("methodology", "default", X.methodology(), {});
  exp("about", "default", X.about(), {});
  exp("flags", "anon", X.flags(), { audience: "anon" });
  for (const [fn, map] of Object.entries(requests))
    put(`expected/${fn}/_requests.json`, {
      note: "Arguments for each fixture key of this function (fixture key → RPC args). Not a payload.",
      requests: map,
    });
  for (const p of Object.keys(out))
    out[p] = await format(out[p], { parser: "json", printWidth: 100 });
  return out;
}

export const OWNED_EXPECTED = [
  "risk_summary",
  "project_page",
  "developer_page",
  "search_projects",
  "compare",
  "evidence",
  "methodology",
  "about",
  "flags",
];

function listJson(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json"));
}

async function main() {
  const check = process.argv.includes("--check");
  const files = await buildAll();
  const stale = [];
  for (const fn of OWNED_EXPECTED)
    for (const f of listJson(join(PKG, "expected", fn)))
      if (!files[`expected/${fn}/${f}`]) stale.push(`expected/${fn}/${f}`);
  for (const f of listJson(join(PKG, "vectors")))
    if (!files[`vectors/${f}`]) stale.push(`vectors/${f}`);
  const changed = Object.entries(files).filter(
    ([p, c]) => !existsSync(join(PKG, p)) || readFileSync(join(PKG, p), "utf8") !== c,
  );
  if (check) {
    for (const [p] of changed) console.log(`drift: ${p}`);
    for (const p of stale) console.log(`stale: ${p}`);
    console.log(
      `author --check: ${Object.keys(files).length} files, ${changed.length} changed, ${stale.length} stale`,
    );
    process.exit(changed.length || stale.length ? 1 : 0);
  }
  for (const p of stale) rmSync(join(PKG, p));
  for (const [p, c] of changed) {
    mkdirSync(dirname(join(PKG, p)), { recursive: true });
    writeFileSync(join(PKG, p), c);
  }
  console.log(
    `author: wrote ${changed.length} of ${Object.keys(files).length} files, removed ${stale.length} (${relative(process.cwd(), PKG) || "."})`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
