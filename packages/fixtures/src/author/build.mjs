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
import { makeExpectedB } from "./expected_b.mjs";
import { buildRecordedWa } from "./recorded_wa.mjs";
import { format } from "prettier";
import { json, uuid5 } from "./lib.mjs";
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
  const AH2 = "aurelia-heights-phase-2";
  const KP = "kestrel-park";
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
  // ---- T03b: M2–M3 reads, the M2 write answers and the recorded WhatsApp payloads.
  const XB = makeExpectedB({ cat, ev, sc, dc, vec, X, B });
  const people = Object.fromEntries(B.people.people.map((p) => [p.key, p.id]));
  const as = (user) => ({ user, user_id: people[user] });
  const client = (key) => uuid5("client_id", key);
  const R = as("rohan");
  exp("following_feed", "rohan", XB.followingFeed(), { p_since: null, as: R });
  exp("who_has_my_number", "rohan", XB.whoHasMyNumber(), { as: R });
  for (const code of ["AH2-7KQ", "RC4-2MW"])
    exp("family_invite_preview", code, XB.invitePreview(code), { p_code: code });
  exp("alert_prefs", "rohan", XB.alertPrefs(), { rpc: "alert_prefs_get", as: R });
  const card = B.people.share_cards[0];
  exp("share_card", "aurelia-old-card", XB.shareCard(), {
    p_code: card.short_code,
    note: "The old Aurelia card: v1.1 run of 2 Sep 2026, data as of 30 Sep 2026 (CONFLICTS C-24, C-37).",
  });
  const DC = {
    flyer: {},
    "flyer--confirm-project": {
      state: "confirm_project",
      note: "Design state: before the buyer confirms the project (nothing is checked yet).",
    },
    hoarding: {},
    "demand-letter": { as: as("kavya-nair") },
    "payment-request": {},
    "booking-form": {},
    "visit-recap": {
      as: R,
      state: "illustrative",
      note: "Illustrative visit-day frame of Sat 24 Oct 2026 (DESIGN §5b); not reachable at the fixture clock.",
    },
  };
  for (const [key, extra] of Object.entries(DC)) {
    const body = XB.docCheck(key);
    exp("doc_check", key, body, { p_id: body.id, ...extra });
  }
  const costReq = (waive) => ({ p_slug: AH2, p_unit: "3 BHK", p_buyer: "male", p_waive: waive });
  exp("cost_breakdown", AH2, XB.costBreakdown([]), costReq([]));
  exp(
    "cost_breakdown",
    `${AH2}--waive-plc-club`,
    XB.costBreakdown(["plc", "club"]),
    costReq(["plc", "club"]),
  );
  const waitReq = (delay) => ({
    p_slug: AH2,
    p_tower: "A",
    p_take_home_inr: 450000,
    p_rent_inr: 55000,
    p_down_pct: 20,
    p_rate_pct: 8.5,
    p_tenure_years: 20,
    p_delay_months: delay,
  });
  exp("afford_the_wait", AH2, XB.affordTheWait(12), waitReq(12));
  exp("afford_the_wait", `${AH2}--delay-24`, XB.affordTheWait(24), waitReq(24));
  for (const pc of B.checks.payee_checks) {
    const key = pc.purpose_line.includes("booking form")
      ? "aurelia-booking-form"
      : "aurelia-eoi-whatsapp";
    exp("payee_check", key, XB.payeeCheck(key), {
      rpc: "before_you_pay_check",
      p_slug: pc.phase,
      p_payee_name: pc.entered.payee_name,
      p_account_number: pc.entered.account_number,
      p_ifsc: pc.entered.ifsc,
      p_amount_inr: pc.amount_inr,
      p_stage: pc.stage,
      p_paid_so_far_inr: pc.paid_so_far_inr,
      p_method: pc.method,
    });
  }
  // M2 write answers (T17 handoff). Idempotent on p_client_id, so a replay returns these too.
  const W = XB.writes;
  for (const f of B.people.follows)
    exp("follow", f.phase, W.follow(f.phase), {
      p_slug: f.phase,
      p_follow_type: f.follow_type,
      p_source: "web",
      p_client_id: client(`follow/${f.id}`),
      as: R,
      note: "Replays Rohan's follow of 1 Jul 2026; p_source is the request's, not a §5b fact.",
    });
  exp("unfollow", KP, W.OK, { p_slug: KP, as: R });
  exp("mark_following_seen", "rohan", W.OK, { as: R });
  exp("alert_prefs_set", "rohan", W.alertPrefsSet("weekly_sun_9am"), {
    p_prefs: XB.alertPrefs().prefs,
    p_client_id: client("alert_prefs/rohan"),
    as: R,
  });
  exp("alert_prefs_set", "rohan--weekly-off", W.alertPrefsSet("off"), {
    p_prefs: { ...XB.alertPrefs().prefs, whatsapp: { band_change: "instant", digest: "off" } },
    p_client_id: client("alert_prefs/rohan/weekly-off"),
    as: R,
    note: "Stop weekly: band changes still come.",
  });
  for (const inv of B.family.invites)
    exp("family_invite_create", inv.code, W.inviteCreate(inv.code), {
      p_scope: inv.rera_number ? { slugs: [AH2] } : { all: true },
      p_client_id: client(`family_invite/${inv.code}`),
      as: R,
    });
  exp("family_invite_cancel", "AH2-7KQ", W.OK, { p_code: "AH2-7KQ", as: R });
  const meera = B.family.members.find((m) => m.member === "meera");
  exp("family_member_remove", "meera", W.OK, { p_member_id: meera.id, as: R });
  exp("family_member_undo", "meera", W.OK, { p_member_id: meera.id, as: R });
  const note0 = B.family.shortlist.notes.find((n) => n.author === "rohan" && n.phase === AH2);
  exp("shortlist_note_add", AH2, W.OK, {
    p_slug: AH2,
    p_body: note0.body,
    p_client_id: client(`shortlist_note/${note0.id}`),
    as: R,
    note: "Replays Rohan's seeded note of 17 Oct 2026.",
  });
  for (const ref of ["C-1012-04", "C-1012-05", "C-1015-02"])
    exp("consent_withdraw", ref, W.consentWithdraw(ref), { p_ref: ref, as: R });
  for (const [p, v] of Object.entries(buildRecordedWa(B))) put(p, v);

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
  // T03b
  "following_feed",
  "who_has_my_number",
  "family_invite_preview",
  "alert_prefs",
  "share_card",
  "doc_check",
  "cost_breakdown",
  "afford_the_wait",
  "payee_check",
  "follow",
  "unfollow",
  "mark_following_seen",
  "alert_prefs_set",
  "family_invite_create",
  "family_invite_cancel",
  "family_member_remove",
  "family_member_undo",
  "shortlist_note_add",
  "consent_withdraw",
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
  for (const f of listJson(join(PKG, "recorded", "wa")))
    if (!files[`recorded/wa/${f}`]) stale.push(`recorded/wa/${f}`);
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
