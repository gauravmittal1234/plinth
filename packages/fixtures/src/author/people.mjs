// Canonical fixtures, part 3 (owner: T03b): people, consents, family, workspace, agents, visits
// and checks. DESIGN.md §5b is the only source of facts; every record carries `source`.
// Gaps stay null and are listed in CONFLICTS.md (C-30 onwards). Generated JSON lives in
// canonical/{people,consents,family,workspace,agents,visits,checks}.json.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { IST, R2, S5, S5B, S5B_ENG, S5B_SWEEP, derived } from "./canonical.mjs";
import { uuid5 } from "./lib.mjs";

const AH2 = "aurelia-heights-phase-2";
const KP = "kestrel-park";
const SG1 = "sapphire-grove-phase-1";
const CT = "coral-towers";
const CW2 = "cedar-walk-phase-2";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

/** DESIGN §5b section names, so each record says which block it comes from. */
export const SEC = {
  number: `${S5B} · Who has my number`,
  consent: `${S5B} · Rohan's consent history`,
  refs: `${S5B} · Consent references`,
  following: `${S5B} · Following, digest and family`,
  workspace: `${S5B} · Developer workspace`,
  agents: `${S5B} · Agents`,
  visit: `${S5B} · Site-visit co-pilot and Pay-as-built`,
  claims: `${S5B} · Claims vs records example`,
  discovery: `${S5B} · Discovery, cost and Ask Plinth`,
  onboarding: `${S5B} · Developer onboarding and capture`,
  aurelia: `${S5B} · Aurelia Heights, Phase 2`,
  round2: `${S5B} · Project pages, round 2`,
};
const C = (id) => `CONFLICTS.md ${id}`;
const id = (kind, key) => uuid5(kind, key);

// Test phone numbers (not facts; never displayed). API_CONTRACTS §5.4 names Rohan's test OTP
// number; the rest of the block follows it (CONFLICTS.md C-31).
const PHONE_BLOCK = "+9199000003";
const phone = (nn) => `${PHONE_BLOCK}${nn}`;
const masked = (nn) => `+91 99••• ••3${nn}`;

// ---------------------------------------------------------------- people
export function buildPeople(sc) {
  const person = (key, o) => ({
    id: id("user", key),
    key,
    first_name: o.first_name ?? null,
    display_name: o.display_name,
    kind: o.kind,
    account: o.account ?? false,
    roles: o.roles ?? [],
    test_phone_e164: o.nn ? phone(o.nn) : null,
    wa_id: o.nn ? phone(o.nn).slice(1) : null,
    wa_contact_id: o.nn ? id("wa_contact", key) : null,
    phone_masked: o.nn ? masked(o.nn) : null,
    org: o.org ?? null,
    org_role: o.org_role ?? null,
    note: o.note ?? null,
    source: o.source,
  });
  const people = [
    person("rohan", {
      first_name: "Rohan",
      display_name: "Rohan",
      kind: "buyer",
      account: true,
      roles: ["buyer"],
      nn: "18",
      note: "The buyer persona of Following, Who has my number, the family circle and the visit pass.",
      source: `${SEC.following}; ${SEC.number}; test number API_CONTRACTS §5.4`,
    }),
    person("meera", {
      first_name: "Meera",
      display_name: "Meera",
      kind: "buyer",
      account: true,
      roles: ["buyer"],
      nn: "19",
      note: "In Rohan's family circle since 6 Oct 2026, can add notes. Also the Meera of Larkspur's Cobalt Square brief (C-1007-04).",
      source: `${SEC.following}; ${SEC.agents}; one person per ${S5B} (Kavya is "not the Meera of the broker and family examples")`,
    }),
    person("meera-father", {
      display_name: "Meera's father",
      kind: "relative",
      account: false,
      nn: "20",
      note: "Invited 18 Oct 2026 with AH2-7KQ. No account and no WhatsApp contact until he sends JOIN AH2-7KQ himself; the test number is the sender of the recorded JOIN payload only.",
      source: SEC.following,
    }),
    person("kavya-nair", {
      first_name: "Kavya",
      display_name: "Kavya Nair",
      kind: "buyer",
      account: true,
      roles: ["buyer"],
      nn: "21",
      note: "The Pay-as-built allottee (A-1104). Not the Meera of the broker and family examples.",
      source: SEC.visit,
    }),
    ...[
      ["aman", "Aman", "22"],
      ["nisha", "Nisha", "23"],
      ["ishita", "Ishita", "24"],
      ["farah", "Farah", "25"],
      ["kabir", "Kabir", "26"],
      ["dev", "Dev", "27"],
    ].map(([key, name, nn]) =>
      person(key, {
        first_name: name,
        display_name: name,
        kind: "buyer",
        account: true,
        roles: ["buyer"],
        nn,
        note: "A buyer record in Northfield's workspace inbox.",
        source: `${SEC.workspace} (inbox)`,
      }),
    ),
    person("tanvi", {
      first_name: "Tanvi",
      display_name: "Tanvi",
      kind: "buyer",
      account: true,
      roles: ["buyer"],
      nn: "28",
      note: "Larkspur's Sapphire Grove brief, ended 14 Oct 2026.",
      source: SEC.agents,
    }),
    ...[
      ["ananya-rao", "Ananya Rao", "admin", "Admin, authorised signatory"],
      ["vikram-sethi", "Vikram Sethi", "sales", "Sales"],
      ["neha-kapoor", "Neha Kapoor", "compliance", "Compliance"],
      ["arjun-mehta", "Arjun Mehta", "marketing", "Marketing"],
      ["pradeep-yadav", "Pradeep Yadav", "site", "Site, Sector 37D sales gallery"],
    ].map(([key, name, role, note]) =>
      person(key, {
        first_name: name.split(" ")[0],
        display_name: name,
        kind: "developer_member",
        account: true,
        roles: ["developer_member"],
        org: "northfield-estates",
        org_role: role,
        note,
        source: `${SEC.workspace} (team)`,
      }),
    ),
    person("priya-khanna", {
      first_name: "Priya",
      display_name: "Priya Khanna",
      kind: "agent_principal",
      account: true,
      roles: ["agent"],
      note: "Principal of Larkspur Realty.",
      source: SEC.agents,
    }),
    person("kabir-malhotra", {
      first_name: "Kabir",
      display_name: "Kabir Malhotra",
      kind: "agent_principal",
      account: true,
      roles: ["agent"],
      note: "Individual agent. Kept apart from Kabir, the buyer in Northfield's inbox (CONFLICTS.md C-36).",
      source: `${SEC.agents}; ${C("C-36")}`,
    }),
  ];

  const at = (date, time = "00:00:00") => IST(date, time);
  const rohan = people.find((p) => p.key === "rohan");
  const profiles = people
    .filter((p) => p.account && p.kind === "buyer")
    .map((p) => ({
      user: p.key,
      user_id: p.id,
      first_name: p.first_name,
      phone_masked: p.phone_masked,
      following_seen_at: p.key === "rohan" ? at("2026-10-14", "08:40:00") : null,
      adult_attested_at: null,
      source: p.key === "rohan" ? `${SEC.following} (last look 14 Oct 2026, 8:40 am)` : p.source,
    }));

  // Rohan's 4 follows since 1 Jul 2026 (the 4 projects of the 12–18 Oct digest: Aurelia, Kestrel,
  // Sapphire and Coral, the only follows that give "1 extension … 1 price change").
  const follows = [AH2, KP, SG1, CT].map((phase) => ({
    id: id("follow", `rohan/${phase}`),
    user: "rohan",
    phase,
    follow_type: "watching",
    follow_source: null,
    followed_at: at("2026-07-01"),
    source: `${SEC.following} ("followed 4 projects since 1 Jul 2026"); which 4 ${derived("the 5 changes since 14 Oct name Coral's extension, Sapphire's price list and filings for Aurelia and Coral; Kestrel is the quiet one")}; watching: no booking in §5b; time unknown (00:00 IST per README)`,
  }));

  // Alert preferences (app.alert_subscriptions). §5b: WhatsApp alerts and the weekly digest ON,
  // Sundays 9 am. Push and quiet hours come from the WebFollowing and AppYou artboards (C-32).
  const sub = (channel, kind, cadence, source) => ({
    id: id("alert_subscription", `rohan/${channel}/${kind}`),
    user: "rohan",
    channel,
    kind,
    cadence,
    quiet_from: "22:00",
    quiet_to: "08:00",
    enabled: true,
    source,
  });
  const alert_subscriptions = [
    sub("push", "band_change", "instant", `artboards WebFollowing, AppYou (push on); ${C("C-32")}`),
    sub("push", "filings", "instant", `artboards WebFollowing, AppYou (push on); ${C("C-32")}`),
    sub("whatsapp", "band_change", "instant", `${SEC.following} (WhatsApp alerts ON)`),
    sub("whatsapp", "digest", "weekly_sun_9am", `${SEC.following} (weekly, Sundays 9 am)`),
  ];

  const project_requests = [
    {
      id: id("project_request", "R-1018-07"),
      ref: "R-1018-07",
      ref_year: 2026,
      user: null,
      name_text: "Indigo Terraces, Sector 79",
      rera_text: null,
      requested_at: at("2026-10-18"),
      due_on: "2026-11-01",
      status: "open",
      reason: null,
      line: "We'll add it by 1 Nov 2026 or tell you why not.",
      source: `${SEC.discovery} (Request a project; requester not named)`,
    },
  ];

  // Since you last looked: the 11 dated changes on Rohan's 4 projects (WebFollowing, AppFollowing,
  // WaDigest). `facts` are evidence keys, resolved to fact ids in the expected outputs. Lines are
  // risk copy and final here.
  const ev = (key, o) => ({ id: id("event", key), key, ...o });
  const events = [
    ev("sapphire/price-list/2026-10-16", {
      phase: SG1,
      kind: "price_list_published",
      occurred_on: "2026-10-16",
      line: "New price list from the developer: 3 BHK quoted ₹1.95 Cr. All-in is now about ₹2.27 Cr.",
      before_pill: "₹1.89 Cr",
      after_pill: "₹1.95 Cr",
      facts: [`${SG1}/price/quoted-3bhk`],
      lane: "from_developer",
      summary_kind: "price change",
      source: `${SEC.following} (3 BHK ₹1.89 Cr → ₹1.95 Cr, all-in ≈ ₹2.27 Cr)`,
    }),
    ev("sapphire/qpr/2026-Q3/filed", {
      phase: SG1,
      kind: "qpr_filed",
      occurred_on: "2026-10-15",
      line: "The Jul–Sep 2026 QPR was filed on time on 15 Oct and is on HARERA since 16 Oct. We update the band by 19 Oct 2026, 7:40 pm.",
      before_pill: "Due 15 Oct",
      after_pill: "Filed 15 Oct, on time",
      facts: [`${SG1}/qpr/2026-Q3/filing`],
      summary_kind: "filing on time",
      source: `${SEC.round2} (Sapphire re-scoring example)`,
    }),
    ev("coral/qpr/2026-Q3/missing", {
      phase: CT,
      kind: "qpr_missing",
      occurred_on: "2026-10-15",
      line: "The Jul–Sep 2026 QPR is not on HARERA yet. It was due 15 Oct 2026. The Apr–Jun QPR is missing too, so the newest figures are 187 days old.",
      before_pill: "Due 15 Oct",
      after_pill: "Not on HARERA as of 18 Oct",
      facts: [`${CT}/qpr/2026-Q3/missing`],
      summary_kind: "missing filing",
      source: `${SEC.round2} (Coral stale-data example)`,
    }),
    ev("aurelia/qpr/2026-Q3/missing", {
      phase: AH2,
      kind: "qpr_missing",
      occurred_on: "2026-10-15",
      line: "The Jul–Sep 2026 QPR is not on HARERA yet. It was due 15 Oct 2026.",
      before_pill: "Due 15 Oct",
      after_pill: "Not on HARERA as of 18 Oct",
      developer_says_line: "Developer says: filed 12 Oct, not yet verified.",
      facts: [`${AH2}/qpr/2026-Q3/missing`],
      summary_kind: "missing filing",
      source: `${SEC.aurelia} (pending public fact)`,
    }),
    ev("coral/extension-2", {
      phase: CT,
      kind: "extension_granted",
      occurred_on: "2026-10-14",
      line: "Coral Towers got a second extension, to Aug 2029.",
      before_pill: "Feb 2029",
      after_pill: "Aug 2029",
      facts: [`${CT}/extension-2`],
      summary_kind: "extension",
      source: `${S5B} · Other projects (Extension 2 granted 14 Oct 2026)`,
    }),
    ev("kestrel/qpr/2026-Q3/filed", {
      phase: KP,
      kind: "qpr_filed",
      occurred_on: "2026-10-12",
      line: "The Jul–Sep 2026 QPR was filed on time: 63% built, 58% of the promised time used.",
      before_pill: "59%",
      after_pill: "63%",
      facts: [`${KP}/qpr/2026-Q3/status`, `${KP}/qpr/2026-Q3/progress`],
      source: `${S5B} · Other projects; ${SEC.following} (built 59% → 63%)`,
    }),
    ev("aurelia/complaint-order/2026-10-09", {
      phase: AH2,
      kind: "order_decided",
      occurred_on: "2026-10-09",
      line: "One more complaint decided against the promoter. That makes 14 in 24 months · 2.8 per 100 units. Median count for similar projects: 3.",
      before_pill: "13",
      after_pill: "14",
      facts: [`${AH2}/complaints-24m`],
      source: `${SEC.following} (Aurelia complaints 13 → 14); latest order 9 Oct 2026 ${SEC.aurelia}`,
    }),
    ev("aurelia/band/2026-10-02", {
      phase: AH2,
      kind: "band_changed",
      occurred_on: "2026-10-02",
      line: "Delivery risk moved from Moderate to Elevated. The trigger: the Apr–Jun 2026 QPR together with new complaint orders.",
      before_pill: "Moderate",
      after_pill: "Elevated",
      band: "elevated",
      facts: [`${AH2}/qpr/2026-Q2/progress`, `${AH2}/complaints-24m`],
      source: `${SEC.aurelia} (band history; trigger)`,
    }),
    ev("sapphire/qpr/2026-Q2/late", {
      phase: SG1,
      kind: "qpr_late",
      occurred_on: "2026-07-27",
      line: "The Apr–Jun 2026 QPR was filed 12 days late: 48% built.",
      before_pill: "Due 15 Jul",
      after_pill: "Filed 27 Jul",
      facts: [`${SG1}/qpr/2026-Q2/status`, `${SG1}/qpr/2026-Q2/progress`],
      source: `${S5B} · Other projects (filed 27 Jul 2026, 12 days late); 48% built ${S5}`,
    }),
    ev("aurelia/qpr/2026-Q2/filed", {
      phase: AH2,
      kind: "qpr_filed",
      occurred_on: "2026-07-15",
      line: "The Apr–Jun 2026 QPR was filed on time: 72% of units sold, 41% built, Tower A at slab 9.",
      before_pill: "38%",
      after_pill: "41%",
      facts: [`${AH2}/qpr/2026-Q2/status`, `${AH2}/qpr/2026-Q2/progress`],
      source: `${SEC.aurelia} (QPR table: Jan–Mar 2026 38% built, Apr–Jun 2026 41%, filed 15 Jul 2026)`,
    }),
    ev("coral/qpr/2026-Q2/missing", {
      phase: CT,
      kind: "qpr_missing",
      occurred_on: "2026-07-15",
      line: "The Apr–Jun 2026 QPR is not on HARERA. It was due 15 Jul 2026. The newest QPR is Jan–Mar 2026, filed 14 Apr: 22% built.",
      before_pill: "Due 15 Jul",
      after_pill: "Not on HARERA as of 18 Oct",
      facts: [`${CT}/qpr/2026-Q2/missing`],
      source: `${SEC.round2} (Coral stale-data example)`,
    }),
  ].map((e) => ({
    developer_says_line: null,
    band: null,
    lane: "records_show",
    summary_kind: null,
    ...e,
  }));
  const following = {
    user: "rohan",
    user_id: rohan.id,
    followed_since: "2026-07-01",
    last_look_at: at("2026-10-14", "08:40:00"),
    unread: 5,
    summary_line:
      "5 changes across your 4 projects: 1 extension, 1 filing on time, 2 missing filings and 1 price change. No band moved.",
    events,
    digest: {
      cadence: "weekly_sun_9am",
      next_at: at("2026-10-25", "09:00:00"),
      next_line: "Next digest Sun 25 Oct, 9 am",
      week_line: "This week in your projects · 12–18 Oct 2026 · 5 changes on record",
    },
    source: `${SEC.following}; summary line product/design/review/fix-since-family.md §1`,
  };

  // The old forwarded card (WaDigest; INTEGRATION_NOTES "Share card (T03b)"): issued from
  // Aurelia's v1.1 Moderate run of 2 Sep 2026, data as of 30 Sep 2026 (round 2 C-24).
  const oldRun = sc.runs.find(
    (r) => r.phase === AH2 && r.model_version === "v1.1" && r.published_on === "2026-09-02",
  );
  const cardId = id("share_card", `${AH2}/risk/2026-09-30`);
  const share_cards = [
    {
      id: cardId,
      phase: AH2,
      kind: "risk",
      run: oldRun.id,
      issued_at: at("2026-09-30"),
      data_as_of: "2026-09-30",
      model_version: "v1.1",
      band: "moderate",
      phash: null,
      short_code: cardId.split("-").join("").slice(0, 8),
      source: `${SEC.following} (old card: data as of 30 Sep 2026, v1.1, Moderate); run ${R2("C-24")}; issued 30 Sep per the WaDigest artboard ("Card of 30 Sep 2026"); short code ${derived("first 8 hex digits of the card id")} (${C("C-37")})`,
    },
  ];

  return {
    schema: "plinth.fixtures.people/1",
    note: "Fictional people (DESIGN §5b): buyers, relatives, developer members and agent principals; Rohan's profile, follows, alert preferences, project request and the dated changes behind Since you last looked. Owner: T03b. Generated; edit src/author. Test phone numbers are not facts and never shown (CONFLICTS.md C-31).",
    clock: "2026-10-18T12:00:00+05:30",
    test_phones: {
      block: `${PHONE_BLOCK}NN`,
      rule: "Fixture-only numbers for test OTP sign-in and recorded WhatsApp payloads. Never real, never displayed except masked.",
      source: `API_CONTRACTS §5.4 (Rohan +919900000318); ${C("C-31")}`,
    },
    people,
    profiles,
    follows,
    alert_subscriptions,
    project_requests,
    following,
    share_cards,
  };
}

// ---------------------------------------------------------------- consents
export function buildConsents() {
  const catalogue = JSON.parse(
    readFileSync(join(ROOT, "packages/contracts/catalogues/purposes.json"), "utf8"),
  );
  const purposes = catalogue.purposes.map((p) => ({
    code: p.code,
    description: p.description,
    retention_class: p.retention_class,
    notice_section: p.notice_section,
    source: "DATA_MODEL §6 app.purposes (text: packages/contracts/catalogues/purposes.json)",
  }));
  const at = (date, time = "00:00:00") => IST(date, time);
  const consent = (ref, o) => {
    const [, mmdd] = ref.split("-");
    return {
      id: id("consent", `2026/${ref}`),
      ref,
      ref_year: 2026,
      ref_date: `2026-${mmdd.slice(0, 2)}-${mmdd.slice(2)}`,
      principal: o.principal,
      purpose_code: o.purpose,
      recipient_kind: o.recipient_kind,
      recipient_group: o.group ?? null,
      recipient_agent: o.agent ?? null,
      // The ws.orgs (M4) and core.agents (M5) rows will carry these ids (canonical/workspace.json,
      // canonical/agents.json).
      recipient_org_id: o.group ? id("org", o.group) : null,
      recipient_agent_id: o.agent ? id("agent", o.agent) : null,
      party: o.party,
      detail: o.detail,
      phase: o.phase ?? null,
      notice_version: null,
      channel: null,
      evidence: { tap_event_id: id("tap_event", `2026/${ref}`) },
      scope: o.scope ?? null,
      granted_at: o.granted_at ?? at(`2026-${mmdd.slice(0, 2)}-${mmdd.slice(2)}`),
      expires_at: o.expires_at ?? null,
      ended_on: o.ended_on ?? null,
      number_shared: !!o.number_shared,
      relay: !!o.relay,
      pays_line: o.pays_line ?? null,
      source: o.source,
    };
  };
  const DEV_PAYS = "Developer · pays us nothing";
  const consents = [
    consent("C-1018-11", {
      principal: "rohan",
      purpose: "visit_share",
      recipient_kind: "site_office",
      group: "northfield-estates",
      party: "Northfield Estates site office",
      detail: "Aurelia visit Sat 24 Oct, 11 am, code 4821",
      phase: AH2,
      scope: {
        first_name: true,
        visit: "2026-10-24T11:00:00+05:30",
        code: "4821",
        questions_sent_ahead: [
          "Can I see the HARERA receipt for the Jul–Sep 2026 QPR?",
          "Which charges on the cost sheet are optional?",
        ],
      },
      granted_at: at("2026-10-18", "09:15:00"),
      relay: true,
      source: `${SEC.consent}; ${SEC.refs} (booked 9:15 am on 18 Oct 2026); ${SEC.visit} (questions sent ahead)`,
    }),
    consent("C-1015-02", {
      principal: "rohan",
      purpose: "number_share",
      recipient_kind: "site_office",
      group: "meridian-habitat",
      party: "Meridian Habitat site office",
      detail: "Sapphire Grove Ph 1 site visit",
      phase: SG1,
      expires_at: at("2026-11-14"),
      number_shared: true,
      pays_line: DEV_PAYS,
      source: `${SEC.number}; ${SEC.consent}`,
    }),
    consent("C-1012-05", {
      principal: "rohan",
      purpose: "number_share",
      recipient_kind: "agent",
      agent: "larkspur-realty",
      party: "Larkspur Realty",
      detail:
        "Your agent of record for Kestrel Park (you added them; shared by your tap after the visit)",
      phase: KP,
      number_shared: true,
      pays_line: "Agent · paid by the developer or you, never by Plinth",
      source: `${SEC.number}; ${SEC.consent}; ${SEC.agents} (Rohan, Kestrel: C-1012-04/05)`,
    }),
    consent("C-1012-04", {
      principal: "rohan",
      purpose: "number_share",
      recipient_kind: "site_office",
      group: "orbis-land",
      party: "Orbis Land site office",
      detail: "Kestrel Park site visit",
      phase: KP,
      expires_at: at("2026-11-11"),
      number_shared: true,
      pays_line: DEV_PAYS,
      source: `${SEC.number}; ${SEC.consent}`,
    }),
    consent("C-0902-01", {
      principal: "rohan",
      purpose: "number_share",
      recipient_kind: "sales_office",
      group: "meridian-habitat",
      party: "Meridian Habitat sales office",
      detail: "Price list",
      phase: null,
      expires_at: at("2026-10-02"),
      ended_on: "2026-10-02",
      number_shared: true,
      source: `${SEC.number} (Ended); ${SEC.consent} (ended 2 Oct 2026); project not named (${C("C-33")})`,
    }),
    // Northfield's inbox (WebDevInbox): the consent behind each buyer record.
    consent("C-1017-03", {
      principal: "aman",
      purpose: "visit_share",
      recipient_kind: "site_office",
      group: "northfield-estates",
      party: "Northfield Estates site office",
      detail: "Aurelia visit Sat 24 Oct, 3 pm, code 5190",
      phase: AH2,
      scope: { first_name: true, visit: "2026-10-24T15:00:00+05:30", code: "5190" },
      source: `${SEC.workspace} (inbox)`,
    }),
    consent("C-1017-05", {
      principal: "nisha",
      purpose: "visit_share",
      recipient_kind: "site_office",
      group: "northfield-estates",
      party: "Northfield Estates site office",
      detail: "Cedar Walk Ph 2 visit Sun 25 Oct, 4 pm, code 3376",
      phase: CW2,
      scope: {
        first_name: true,
        visit: "2026-10-25T16:00:00+05:30",
        code: "3376",
        agent: "bluegate-homes",
      },
      source: `${SEC.workspace} (inbox; agent Bluegate Homes)`,
    }),
    consent("C-1017-06", {
      principal: "ishita",
      purpose: "enquiry_share",
      recipient_kind: "sales_office",
      group: "northfield-estates",
      party: "Northfield Estates sales office",
      detail: "3 BHK price-list enquiry, 17 Oct",
      phase: AH2,
      scope: { enquiry: "price_list", unit: "3 BHK", agent: "larkspur-realty" },
      source: `${SEC.workspace} (inbox; agent Larkspur Realty); project ${derived("Larkspur's brief for Ishita is Aurelia (C-1017-09)")}`,
    }),
    consent("C-1016-04", {
      principal: "farah",
      purpose: "enquiry_share",
      recipient_kind: "sales_office",
      group: "northfield-estates",
      party: "Northfield Estates sales office",
      detail: "Cedar Walk payment-plan enquiry, 16 Oct",
      phase: CW2,
      scope: { enquiry: "payment_plan" },
      source: `${SEC.workspace} (inbox); phase ${derived("Cedar Walk Ph 2 is Northfield's only Cedar Walk phase on sale")}`,
    }),
    consent("C-1016-08", {
      principal: "kabir",
      purpose: "number_share",
      recipient_kind: "site_office",
      group: "northfield-estates",
      party: "Northfield Estates site office",
      detail: "Visited 16 Oct; shared his number by his own tap",
      phase: null,
      number_shared: true,
      pays_line: DEV_PAYS,
      source: `${SEC.workspace} (inbox); project not named (${C("C-33")})`,
    }),
    consent("C-1015-07", {
      principal: "dev",
      purpose: "enquiry_share",
      recipient_kind: "sales_office",
      group: "northfield-estates",
      party: "Northfield Estates sales office",
      detail: "4 BHK enquiry, 15 Oct; replied 16 Oct",
      phase: AH2,
      scope: { enquiry: "unit", unit: "4 BHK" },
      source: `${SEC.workspace} (inbox); phase ${derived("Aurelia is the only Northfield project with a 4 BHK (§5b Discovery)")}`,
    }),
    // Larkspur's briefs (agent_brief consents).
    consent("C-1017-09", {
      principal: "ishita",
      purpose: "agent_brief",
      recipient_kind: "agent",
      agent: "larkspur-realty",
      party: "Larkspur Realty",
      detail: "Brief for Aurelia Heights, Phase 2",
      phase: AH2,
      source: `${SEC.agents} (Larkspur's briefs)`,
    }),
    consent("C-1007-04", {
      principal: "meera",
      purpose: "agent_brief",
      recipient_kind: "agent",
      agent: "larkspur-realty",
      party: "Larkspur Realty",
      detail: "Brief for Cobalt Square; visit 9 Oct, window to 8 Dec 2026",
      phase: null,
      scope: { society: "Cobalt Square", visit_on: "2026-10-09", window_to: "2026-12-08" },
      source: `${SEC.agents} (Larkspur's briefs; Cobalt Square is a resale society, not a RERA phase)`,
    }),
    consent("C-1002-02", {
      principal: "tanvi",
      purpose: "agent_brief",
      recipient_kind: "agent",
      agent: "larkspur-realty",
      party: "Larkspur Realty",
      detail: "Brief for Sapphire Grove, Phase 1",
      phase: SG1,
      expires_at: at("2026-10-14"),
      ended_on: "2026-10-14",
      source: `${SEC.agents} (Larkspur's briefs; ended 14 Oct 2026)`,
    }),
  ];

  // app.contact_shares: one row per number share (consents with number_shared), and the relay.
  const contact_shares = consents
    .filter((c) => c.number_shared)
    .map((c) => ({
      id: id("contact_share", `2026/${c.ref}`),
      consent: c.ref,
      buyer: c.principal,
      recipient_group: c.recipient_group,
      recipient_agent: c.recipient_agent,
      recipient_org_id: c.recipient_org_id,
      recipient_agent_id: c.recipient_agent_id,
      phase: c.phase,
      number_shared: true,
      starts_at: c.granted_at,
      ends_at: c.expires_at,
      ended_reason: c.ended_on ? "expired" : null,
      source: c.source,
    }))
    // In the order they were shared, so a cap check sees them as it would have live.
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at) || a.consent.localeCompare(b.consent));
  const relay_sessions = [
    {
      id: id("relay_session", "2026/C-1018-11"),
      consent: "C-1018-11",
      buyer: "rohan",
      recipient_group: "northfield-estates",
      recipient_org_id: id("org", "northfield-estates"),
      phase: AH2,
      channel: "whatsapp_text",
      deal_active: true,
      opened_at: at("2026-10-18", "09:15:00"),
      last_message_at: null,
      closes_at: null,
      line: "The relay stays alive while a deal is active, and ends 30 days after your last message unless you renew.",
      source: `${SEC.number}; relay lifetime ${S5B} (D13); WhatsApp text relay ${S5B_ENG}`,
    },
  ];

  // ops.ref_counters: the highest seeded NN per prefix and IST day, so live refs never collide.
  const counters = new Map();
  const bump = (prefix, date, n) => {
    const k = `${prefix}|${date}`;
    counters.set(k, Math.max(counters.get(k) ?? 0, n));
  };
  for (const c of consents) bump("C", c.ref_date, Number(c.ref.split("-")[2]));
  bump("R", "2026-10-18", 7);
  const ref_counters = [...counters.entries()]
    .map(([k, last]) => {
      const [prefix, scope_date] = k.split("|");
      return {
        prefix,
        scope_date,
        last,
        source: derived("highest seeded ref per prefix and IST day (WORK_BREAKDOWN T03b)"),
      };
    })
    .sort((a, b) => a.prefix.localeCompare(b.prefix) || a.scope_date.localeCompare(b.scope_date));

  return {
    schema: "plinth.fixtures.consents/1",
    note: "The consent ledger (app.consents, C-MMDD-NN), number shares, the relay and the ref counters. Rohan's 5 refs and the workspace and agent refs of DESIGN §5b. Owner: T03b. Generated; edit src/author.",
    count_line: "3 parties can reach you",
    count_rule:
      "Counts active number-holding parties: Orbis Land site office, Larkspur Realty and Meridian Habitat site office. The ended Meridian sales office and the relay do not count.",
    count_source: `${SEC.number}; ${S5B_SWEEP} (Who has my number)`,
    purposes,
    consents,
    contact_shares,
    relay_sessions,
    ref_counters,
  };
}

// ---------------------------------------------------------------- family
export function buildFamily() {
  const at = (date, time = "00:00:00") => IST(date, time);
  const members = [
    {
      id: id("family_member", "rohan/meera"),
      member: "meera",
      invite_code: null,
      scope_all: true,
      scope_phases: [],
      status: "joined",
      invited_at: null,
      expires_at: null,
      joined_at: at("2026-10-06"),
      joined_via: null,
      can_add_notes: true,
      line: "Joined 6 Oct 2026 · same alerts for your 4 projects · can add notes",
      source: `${SEC.following} (Meera joined 6 Oct 2026, all 4 projects, can add notes); code and channel not in §5b (${C("C-34")})`,
    },
    {
      id: id("family_member", "rohan/AH2-7KQ"),
      member: "meera-father",
      invite_code: "AH2-7KQ",
      scope_all: false,
      scope_phases: [AH2],
      status: "invited",
      invited_at: at("2026-10-18"),
      expires_at: at("2026-10-25"),
      joined_at: null,
      joined_via: null,
      can_add_notes: null,
      line: "Invited today · Aurelia Heights Ph 2 · hasn't tapped the link yet",
      source: `${SEC.following} (invited 18 Oct 2026 to Aurelia; AH2-7KQ; 7 days, to 25 Oct)`,
    },
    {
      id: id("family_member", "rohan/RC4-2MW"),
      member: null,
      invite_code: "RC4-2MW",
      scope_all: true,
      scope_phases: [],
      status: "invited",
      invited_at: at("2026-10-18"),
      expires_at: at("2026-10-25"),
      joined_at: null,
      joined_via: null,
      can_add_notes: null,
      line: null,
      source: `${SEC.following} (plinth.in/j/RC4-2MW, all 4; 7 days, to 25 Oct); invitee not named`,
    },
  ];
  const note = (phase, author, date, text) => ({
    id: id("shortlist_note", `rohan/${phase}/${author}/${date}`),
    phase,
    author,
    created_at: at(date),
    body: text,
    source: `${SEC.following} (shared shortlist, dated notes 12–17 Oct); text: WebFollowing artboard (${C("C-35")})`,
  });
  return {
    schema: "plinth.fixtures.family/1",
    note: "Rohan's family circle: members, invite codes, the shared shortlist and its notes. A member row carries no phone; the relative's own JOIN message is the opt-in. Owner: T03b. Generated; edit src/author.",
    circles: [
      {
        id: id("family_circle", "rohan"),
        owner: "rohan",
        created_at: null,
        source: SEC.following,
      },
    ],
    members,
    invites: [
      {
        code: "AH2-7KQ",
        link: "https://plinth.in/j/AH2-7KQ",
        scope_line: "Aurelia Heights, Phase 2",
        rera_number: "GGM/673/405/2022/117",
        expires_on: "2026-10-25",
        join_text: "JOIN AH2-7KQ",
        source: SEC.following,
      },
      {
        code: "RC4-2MW",
        link: "https://plinth.in/j/RC4-2MW",
        scope_line: "Your 4 projects",
        rera_number: null,
        expires_on: "2026-10-25",
        join_text: "JOIN RC4-2MW",
        source: SEC.following,
      },
    ],
    rules: {
      lines: [
        "Each link works for one person for 7 days and carries no phone number.",
        "The relative's own WhatsApp message, JOIN and the code, is the opt-in.",
        "Payment alerts, follow type, cost sheets, visit passes and who has my number stay private to Rohan.",
      ],
      source: SEC.following,
    },
    shortlist: {
      phases: [KP, SG1, AH2],
      notes: [
        note(
          KP,
          "rohan",
          "2026-10-15",
          "Asked Larkspur for the 3 BHK cost sheet, so we can compare all-in prices.",
        ),
        note(KP, "meera", "2026-10-12", "Site visit done. The 3 BHK layout works for us."),
        note(
          SG1,
          "meera",
          "2026-10-16",
          "New price list: ₹1.95 Cr quoted. Still under our ₹2.5 Cr all-in limit.",
        ),
        note(
          SG1,
          "rohan",
          "2026-10-15",
          "Visited the site today. The office says the new QPR was filed today; wait for Plinth's re-score.",
        ),
        note(
          AH2,
          "rohan",
          "2026-10-17",
          "Visit on Sat 24 Oct, 11 am. Ask why the Jul–Sep QPR isn't on HARERA.",
        ),
        note(
          AH2,
          "meera",
          "2026-10-17",
          "Over our limit at ₹2.74 Cr all-in. Is the visit still worth it?",
        ),
      ],
      source: SEC.following,
    },
  };
}
