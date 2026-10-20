// T03b acceptance: people, consent, family, workspace, agents, checks, the expected M2–M3
// payloads and the recorded WhatsApp bodies agree with DESIGN §5b and with each other.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSeed } from "../scripts/build-seed.mjs";
import { RECORDED_WA, WRITE_FUNCTIONS } from "./index";
import {
  FIXTURES_DIR,
  expectedKeys,
  loadCanonical,
  loadExpected,
  loadRecordedWa,
  loadRecordedWaIndex,
  loadRequests,
} from "./node";

type Rec = Record<string, unknown> & { source?: string; id?: string };
type Canon = Record<string, unknown>;
const NAMES_A = ["catalogue", "evidence", "scoring", "developer_content"] as const;
const NAMES_B = [
  "people",
  "consents",
  "family",
  "workspace",
  "agents",
  "visits",
  "checks",
] as const;
const canon = Object.fromEntries(
  [...NAMES_A, ...NAMES_B].map((n) => [n, loadCanonical<Canon>(n)]),
) as Record<(typeof NAMES_A)[number] | (typeof NAMES_B)[number], Canon>;
const records = (c: Canon): Rec[] => Object.values(c).filter(Array.isArray).flat() as Rec[];
const arr = <T = Rec>(c: Canon, k: string) => c[k] as T[];
const refFormats = JSON.parse(
  readFileSync(join(FIXTURES_DIR, "../contracts/catalogues/ref_formats.json"), "utf8"),
) as { formats: { prefix: string; regex: string }[] };
const refRe = (prefix: string) =>
  new RegExp(refFormats.formats.find((f) => f.prefix === prefix)!.regex);
const factKeys = new Set(arr<{ key: string }>(canon.evidence, "facts").map((f) => f.key));

describe("canonical B records", () => {
  it("every record carries a DESIGN §5b-based source", () => {
    const allowed =
      /DESIGN §5|BUILD_PLAN|DATA_MODEL|API_CONTRACTS|artboard|derived:|CONFLICTS\.md|WORK_BREAKDOWN/;
    for (const n of NAMES_B)
      for (const r of records(canon[n])) {
        expect(typeof r.source, `${n}: ${JSON.stringify(r).slice(0, 120)}`).toBe("string");
        expect(r.source, `${n}: ${r.id ?? ""}`).toMatch(allowed);
      }
  });

  it("ids are unique UUIDs across every canonical file", () => {
    const seen = new Set<string>();
    for (const n of [...NAMES_A, ...NAMES_B])
      for (const r of records(canon[n]))
        if (typeof r.id === "string") {
          expect(r.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
          );
          expect(seen.has(r.id), r.id).toBe(false);
          seen.add(r.id);
        }
  });

  it("every evidence key cited by people, workspace, visits and checks exists", () => {
    const cited: string[] = [];
    const walk = (v: unknown) => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object")
        for (const [k, x] of Object.entries(v)) {
          if (k === "facts" && Array.isArray(x)) cited.push(...(x as string[]));
          else walk(x);
        }
    };
    for (const n of ["people", "workspace", "visits", "checks"] as const) walk(canon[n]);
    expect(cited.length).toBeGreaterThan(30);
    expect(cited.filter((k) => !factKeys.has(k))).toEqual([]);
  });

  it("test phone numbers stay in the fixture block and never appear unmasked elsewhere", () => {
    const people = arr<{ test_phone_e164: string | null; wa_id: string | null }>(
      canon.people,
      "people",
    );
    for (const p of people)
      if (p.test_phone_e164) {
        expect(p.test_phone_e164).toMatch(/^\+9199000003\d{2}$/);
        expect(p.wa_id).toBe(p.test_phone_e164.slice(1));
      }
    const rohan = people.find((p) => (p as unknown as { key: string }).key === "rohan")!;
    expect(rohan.test_phone_e164).toBe("+919900000318"); // API_CONTRACTS §5.4
    // Only people.json and the recorded payloads may hold a number; no other file does.
    for (const n of ["consents", "family", "workspace", "agents", "visits"] as const)
      expect(JSON.stringify(canon[n])).not.toMatch(/(\+?91)?9900000\d{3}/);
  });
});

describe("Rohan (DESIGN §5b)", () => {
  it("follows 4 projects since 1 Jul 2026 and last looked 14 Oct 2026, 8:40 am", () => {
    const follows = arr<{ user: string; phase: string; followed_at: string }>(
      canon.people,
      "follows",
    ).filter((f) => f.user === "rohan");
    expect(follows.map((f) => f.phase).sort()).toEqual([
      "aurelia-heights-phase-2",
      "coral-towers",
      "kestrel-park",
      "sapphire-grove-phase-1",
    ]);
    for (const f of follows) expect(f.followed_at.slice(0, 10)).toBe("2026-07-01");
    const fw = canon.people.following as { last_look_at: string; unread: number };
    expect(fw.last_look_at).toBe("2026-10-14T08:40:00+05:30");
    expect(fw.unread).toBe(5);
  });

  it("has 5 consents with C-MMDD-NN refs and 3 number holders plus 1 relay", () => {
    const consents = arr<{
      ref: string;
      principal: string;
      number_shared: boolean;
      ended_on: string | null;
      relay: boolean;
    }>(canon.consents, "consents");
    const C = refRe("C");
    for (const c of consents) expect(c.ref).toMatch(C);
    const mine = consents.filter((c) => c.principal === "rohan");
    expect(mine.map((c) => c.ref)).toEqual([
      "C-1018-11",
      "C-1015-02",
      "C-1012-05",
      "C-1012-04",
      "C-0902-01",
    ]);
    expect(mine.filter((c) => c.number_shared && !c.ended_on)).toHaveLength(3);
    expect(mine.filter((c) => c.relay).map((c) => c.ref)).toEqual(["C-1018-11"]);
  });

  it("the ref counters sit at the highest seeded NN per prefix and day", () => {
    const counters = arr<{ prefix: string; scope_date: string; last: number }>(
      canon.consents,
      "ref_counters",
    );
    const at = (p: string, d: string) =>
      counters.find((c) => c.prefix === p && c.scope_date === d)?.last;
    expect(at("C", "2026-10-18")).toBe(11); // C-1018-11 -> the next live ref is C-1018-12
    expect(at("R", "2026-10-18")).toBe(7); // R-1018-07
    for (const c of arr<{ ref: string; ref_date: string }>(canon.consents, "consents"))
      expect(Number(c.ref.split("-")[2])).toBeLessThanOrEqual(at("C", c.ref_date)!);
  });

  it("his circle: Meera joined 6 Oct, her father invited 18 Oct with AH2-7KQ, both codes to 25 Oct", () => {
    const members = arr<{
      member: string | null;
      status: string;
      invite_code: string | null;
      joined_at: string | null;
      expires_at: string | null;
    }>(canon.family, "members");
    expect(members.find((m) => m.member === "meera")).toMatchObject({
      status: "joined",
      joined_at: "2026-10-06T00:00:00+05:30",
    });
    expect(members.find((m) => m.member === "meera-father")).toMatchObject({
      status: "invited",
      invite_code: "AH2-7KQ",
    });
    expect(members.filter((m) => m.invite_code).map((m) => m.invite_code)).toEqual([
      "AH2-7KQ",
      "RC4-2MW",
    ]);
    for (const m of members.filter((x) => x.invite_code))
      expect(m.expires_at).toBe("2026-10-25T00:00:00+05:30");
    // A member row carries no phone (DATA_MODEL app.family_members); no number anywhere.
    for (const m of members) expect(Object.keys(m).join()).not.toMatch(/phone|wa_id/);
    expect(JSON.stringify(canon.family)).not.toMatch(/\+91|9900000/);
  });
});

describe("expected M2–M3 payloads", () => {
  it("following_feed shows exactly 5 changes and the fix-since-family summary", () => {
    const f = loadExpected<{
      changes: { occurred_on: string }[];
      summary_line: string;
      record: unknown[];
      replay: { marks: { date: string; kind: string; band: string | null }[] };
      quiet: { slug: string }[];
    }>("following_feed", "rohan");
    expect(f.changes).toHaveLength(5);
    expect(f.summary_line).toBe(
      "5 changes across your 4 projects: 1 extension, 1 filing on time, 2 missing filings and 1 price change. No band moved.",
    );
    expect(f.record).toHaveLength(6);
    expect(f.quiet.map((q) => q.slug)).toEqual(["kestrel-park"]);
    const bandMarks = f.replay.marks.filter((m) => m.kind === "band_changed");
    expect(bandMarks).toEqual([{ date: "2026-10-02", kind: "band_changed", band: "elevated" }]);
    for (const m of f.replay.marks)
      if (m.band === "elevated") expect(m.date >= "2026-10-02").toBe(true);
    expect(JSON.stringify(f)).not.toMatch(/lender|loan/i);
  });

  it("who_has_my_number gives 3 parties, and 2 after C-1012-04 is withdrawn", () => {
    const w = loadExpected<{ count_line: string; parties: { ref: string }[] }>(
      "who_has_my_number",
      "rohan",
    );
    expect(w.count_line).toBe("3 parties can reach you");
    expect(w.parties.map((p) => p.ref)).toEqual(["C-1012-04", "C-1012-05", "C-1015-02"]);
    expect(JSON.stringify(w)).not.toMatch(/lender|bank/i);
    expect(loadExpected<{ effects: string[] }>("consent_withdraw", "C-1012-04").effects).toContain(
      "2 parties can reach you.",
    );
  });

  it("the old share card is Aurelia's v1.1 run of 2 Sep 2026, Moderate, data as of 30 Sep 2026", () => {
    const card = arr<{ run: string; data_as_of: string; band: string; model_version: string }>(
      canon.people,
      "share_cards",
    )[0]!;
    const run = arr<{ id: string; published_on: string; model_version: string; band: string }>(
      canon.scoring,
      "runs",
    ).find((r) => r.id === card.run)!;
    expect(run).toMatchObject({
      published_on: "2026-09-02",
      model_version: "v1.1",
      band: "moderate",
    });
    expect(card).toMatchObject({
      data_as_of: "2026-09-30",
      band: "moderate",
      model_version: "v1.1",
    });
    const sc = loadExpected<{ sent: { data_as_of: string; band: string }; headline_line: string }>(
      "share_card",
      "aurelia-old-card",
    );
    expect(sc.sent).toMatchObject({ data_as_of: "2026-09-30", band: "moderate" });
    expect(sc.headline_line).toBe(
      "Changed since this card was sent: band Moderate → Elevated (2 Oct).",
    );
  });

  it("the checks match §5b: flyer 4 of 7, hoarding 1 of 3, payment request 0 of 3, booking form 3 of 3", () => {
    const rows = (k: string) => loadExpected<{ rows: { verdict: string }[] }>("doc_check", k).rows;
    expect(rows("flyer").filter((r) => r.verdict === "differs")).toHaveLength(4);
    expect(rows("flyer")).toHaveLength(7);
    expect(rows("hoarding").filter((r) => r.verdict === "differs")).toHaveLength(1);
    const payee = (k: string) =>
      loadExpected<{ payee: { matched: number; of: number } }>("payee_check", k).payee;
    expect(payee("aurelia-eoi-whatsapp")).toMatchObject({ matched: 0, of: 3 });
    expect(payee("aurelia-booking-form")).toMatchObject({ matched: 3, of: 3 });
    const demand = loadExpected<{ summary_line: string; notes: string[] }>(
      "doc_check",
      "demand-letter",
    );
    expect(demand.summary_line).toBe(
      "The latest filing shows slab 9. This letter asks for the slab 12 instalment.",
    );
    expect(JSON.stringify(demand)).not.toMatch(/don't pay|do not pay/i);
  });

  it("every write answer and read key has request args, with the buyer named", () => {
    for (const fn of WRITE_FUNCTIONS) {
      const keys = expectedKeys(fn);
      expect(keys.length, fn).toBeGreaterThan(0);
      const req = loadRequests(fn);
      for (const k of keys) expect(req[k], `${fn}/${k}`).toMatchObject({ as: { user: "rohan" } });
    }
  });
});

describe("recorded WhatsApp payloads", () => {
  const index = loadRecordedWaIndex<{
    payloads: { file: string; from: string | null; route: string; wa_message_id: string }[];
  }>();
  const people = arr<{ key: string; wa_id: string | null }>(canon.people, "people");

  it("the index lists exactly the recorded files", () => {
    const files = readdirSync(join(FIXTURES_DIR, "recorded", "wa"))
      .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
      .sort();
    expect(index.payloads.map((p) => p.file).sort()).toEqual(files);
    expect(RECORDED_WA.map((n) => `${n}.json`).sort()).toEqual(files);
  });

  it("each body is a Meta webhook from a fixture sender, with unique message ids", () => {
    const ids = new Set<string>();
    for (const p of index.payloads) {
      const body = loadRecordedWa<{
        object: string;
        entry: { changes: { field: string; value: Record<string, unknown> }[] }[];
      }>(p.file.replace(/\.json$/, ""));
      expect(body.object).toBe("whatsapp_business_account");
      const value = body.entry[0]!.changes[0]!.value as {
        messages?: { from: string; id: string }[];
        statuses?: { id: string; recipient_id: string }[];
      };
      if (p.from) {
        const msg = value.messages![0]!;
        expect(msg.from).toBe(people.find((x) => x.key === p.from)!.wa_id);
        expect(ids.has(msg.id)).toBe(false);
        ids.add(msg.id);
      } else
        expect(value.statuses![0]!.recipient_id).toBe(people.find((x) => x.key === "rohan")!.wa_id);
    }
  });

  it("routes: aurelia and the RERA number to risk_card, JOIN AH2-7KQ to family_join, STOP to prefs", () => {
    const route = (f: string) => index.payloads.find((p) => p.file === `${f}.json`)!.route;
    expect(route("text-aurelia")).toBe("risk_card");
    expect(route("text-rera-number")).toBe("risk_card");
    expect(route("text-join-ah2-7kq")).toBe("family_join");
    expect(route("text-stop")).toBe("prefs");
    const join = loadRecordedWa<{
      entry: { changes: { value: { messages: { text: { body: string } }[] } }[] }[];
    }>("text-join-ah2-7kq");
    expect(join.entry[0]!.changes[0]!.value.messages[0]!.text.body).toBe("JOIN AH2-7KQ");
  });
});

describe("T03b seed", () => {
  it("writes consents with the buyer's own JWT and bumps the ref counters", async () => {
    const all = (await buildSeed({ all: true })) as Record<string, string>;
    const consents = all["51_consents.sql"]!;
    expect(consents).toContain("set_config('request.jwt.claims'");
    expect(consents).toContain("'C-1018-11'");
    expect(consents).toMatch(/\('C', '2026-10-18'::date, 11\)/);
    expect(consents).toMatch(/\('R', '2026-10-18'::date, 7\)/);
    expect(all["52_family.sql"]).toContain("'AH2-7KQ'");
    expect(all["50_people.sql"]).toContain("'2026-10-14T08:40:00+05:30'::timestamptz");
    expect(all["40_share_cards.sql"]).toContain("'v1.1', 'moderate'");
  });

  it("people, consents and family wait for m2_people; comms for m2_comms and T44", async () => {
    const t04 = (await buildSeed({
      migrations: ["20261020000400_t04_core_catalogue.sql"],
    })) as Record<string, string>;
    for (const f of ["50_people.sql", "51_consents.sql", "52_family.sql", "53_comms.sql"])
      expect(t04[f], f).toContain("-- SKIPPED");
    expect(t04["40_share_cards.sql"]).toContain("insert into core.share_cards");
    const m2 = (await buildSeed({
      migrations: [
        "20261020000400_t04_core_catalogue.sql",
        "20261110000100_t40_m2_people.sql",
        "20261112000100_t42_m2_comms_outbox.sql",
      ],
    })) as Record<string, string>;
    expect(m2["51_consents.sql"]).toContain("insert into app.consents");
    expect(m2["53_comms.sql"]).toContain("-- SKIPPED"); // pii.wa_contacts is T44's (20261114)
  });
});
