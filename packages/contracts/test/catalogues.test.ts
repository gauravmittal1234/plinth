import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { makeAjv } from "../scripts/lib/ajv.mjs";
import { aureliaRiskSummary } from "../scripts/lib/doc-examples.mjs";
import { BUYER_RPCS, PUBLIC_RPCS } from "../scripts/lib/endpoints.mjs";
import { loadSchemas } from "../scripts/lib/schemas.mjs";
import { FLAG_KEYS, catalogues, fillTemplate, flagDefault, isRef, type RefPrefix } from "../src";
import { PKG_DIR } from "./examples";

const loaded = loadSchemas();
const enumOf = (name: string): unknown[] => {
  const t = loaded.types.get(name);
  if (!t || !Array.isArray(t.schema.enum)) throw new Error(`${name} is not an enum`);
  return t.schema.enum;
};
const readJson = (rel: string) => JSON.parse(readFileSync(join(PKG_DIR, rel), "utf8"));
const placeholders = (s: string) =>
  [...s.matchAll(/\{([a-z][a-z0-9_]*)\}/g)].map((m) => m[1]).sort();

describe("catalogue files", () => {
  const meta = readJson("catalogues/catalogue.schema.json");
  const ajv = makeAjv();
  ajv.addSchema(meta);
  const DEFS: Record<keyof typeof catalogues, string> = {
    flags: "Flags",
    events: "Events",
    reason_codes: "ReasonCodes",
    wa_templates: "WaTemplates",
    ai_tasks: "AiTasks",
    purposes: "Purposes",
    ref_formats: "RefFormats",
  };
  for (const [name, def] of Object.entries(DEFS))
    it(`${name}.json matches catalogue.schema.json#/$defs/${def}`, () => {
      const fn = ajv.getSchema(`${meta.$id}#/$defs/${def}`);
      expect(fn).toBeTruthy();
      expect(fn!(catalogues[name as keyof typeof catalogues]), JSON.stringify(fn!.errors)).toBe(
        true,
      );
      expect(catalogues[name as keyof typeof catalogues].catalogue).toBe(name);
    });
});

describe("flags", () => {
  it("lists the 19 R1 flags of BUILD_PLAN §10, each once", () => {
    expect(FLAG_KEYS).toHaveLength(19);
    expect(new Set(FLAG_KEYS).size).toBe(19);
  });
  it("matches the keys of the Flags schema", () => {
    const props = Object.keys(loaded.types.get("FlagValues")!.schema.properties).sort();
    expect([...FLAG_KEYS].sort()).toEqual(props);
  });
  it("seeds bands_public off (S1 launch, T04) and harera_live_fetch off", () => {
    expect(flagDefault("bands_public")).toBe(false);
    expect(flagDefault("harera_live_fetch")).toBe(false);
    expect(flagDefault("pro_paywall")).toBe(false);
  });
});

describe("reason codes", () => {
  const rc = catalogues.reason_codes;
  it("factors are the core.factor enum, weighted 30/30/20/15/5", () => {
    expect(rc.factors.map((f) => f.code)).toEqual(enumOf("Factor"));
    expect(rc.factors.map((f) => f.weight_pct)).toEqual([30, 30, 20, 15, 5]);
  });
  it("every template names exactly its params", () => {
    for (const r of rc.reasons)
      expect(placeholders(r.template_en), r.code).toEqual([...r.params].sort());
    for (const r of rc.red_flag_rules)
      if (r.line_template)
        expect(placeholders(r.line_template), r.code).toEqual([...r.params].sort());
  });
  it("the templates reproduce Aurelia's four reasons (API_CONTRACTS §2.1)", () => {
    const want = aureliaRiskSummary().reasons as { factor: string; text: string }[];
    const byFactor = new Map(rc.reasons.map((r) => [r.factor, r]));
    for (const reason of want) {
      const t = byFactor.get(reason.factor);
      expect(t, reason.factor).toBeTruthy();
      expect(fillTemplate(t!.template_en, t!.example)).toBe(reason.text);
    }
  });
  it("red-flag rule 1 reproduces Laurel Residency's line (API_CONTRACTS §2.2)", () => {
    const rf1 = rc.red_flag_rules.find((r) => r.code === "RF1_GROUP_CIRP")!;
    expect(fillTemplate(rf1.line_template!, rf1.example ?? {})).toBe(
      "Set by red-flag rule 1, not our model: a group company was admitted to insolvency (NCLT order, 12 Mar 2023).",
    );
  });
  it("pending codes include the two the contract uses", () => {
    expect(rc.pending_codes.map((p) => p.code)).toEqual(
      expect.arrayContaining(["qpr_missing", "rescore_due"]),
    );
  });
});

describe("WhatsApp templates", () => {
  const wa = catalogues.wa_templates;
  it("lists every template of API_CONTRACTS §5.2 once", () => {
    const codes = wa.templates.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.sort()).toEqual(
      [
        "login_code",
        "band_change_alert",
        "filing_alert",
        "weekly_digest",
        "daily_digest",
        "developer_replied",
        "family_removed",
        "export_ready",
        "visit_booked",
        "visit_reminder",
        "visit_recap_prompt",
        "relay_message",
        "dev_heads_up",
        "dev_notice_7day",
        "dev_new_enquiry",
        "dev_visits_today",
        "dev_capture_link",
        "dev_stale_price_list",
        "agent_verified",
      ].sort(),
    );
  });
  it("respects Meta's button limits (≤ 3 buttons, ≤ 20 characters, ≤ 1 CTA URL)", () => {
    const lim = wa.interactive_limits;
    for (const t of wa.templates) {
      expect(t.buttons.length, t.code).toBeLessThanOrEqual(lim.reply_buttons_max);
      expect(t.buttons.filter((b) => b.type === "cta_url").length, t.code).toBeLessThanOrEqual(
        lim.cta_url_buttons_max,
      );
      for (const b of t.buttons)
        if (b.text) expect([...b.text].length, `${t.code}: ${b.text}`).toBeLessThanOrEqual(20);
    }
  });
  it("only utility and authentication categories (no marketing in R1)", () => {
    for (const t of wa.templates) expect(["UTILITY", "AUTHENTICATION"]).toContain(t.category);
  });
});

describe("AI tasks", () => {
  const ai = catalogues.ai_tasks;
  it("keys are id@version and unique", () => {
    for (const t of ai.tasks) expect(t.key).toBe(`${t.id}@${t.version}`);
    expect(new Set(ai.tasks.map((t) => t.key)).size).toBe(ai.tasks.length);
  });
  it("lists the R1 tasks of BUILD_PLAN §14", () => {
    expect(ai.tasks.map((t) => t.key).sort()).toEqual(
      [
        "ocr.document@1",
        "classify.document@1",
        "extract.marketing_claims@1",
        "extract.cost_sheet@1",
        "extract.demand_letter@1",
        "extract.payment_request@1",
        "transcribe.voice@1",
        "parse.search_query@1",
        "answer.ask@1",
        "extract.harera_order@1",
        "stage.room@1",
      ].sort(),
    );
  });
  it("no model is pinned before the bake-off", () => {
    for (const t of ai.tasks) expect(t.model_id, t.key).toBeNull();
  });
  it("response schemas resolve to contract types", () => {
    const byFile = new Map(loaded.entries.map((e) => [e.file, e]));
    for (const t of ai.tasks) {
      if (!t.response_schema) continue;
      const [file, pointer] = t.response_schema.split("#");
      const entry = byFile.get(file!);
      expect(entry, t.key).toBeTruthy();
      if (pointer) expect(entry!.json.$defs?.[pointer.split("/").pop()!], t.key).toBeTruthy();
    }
  });
  it("Ask Plinth's tools are api functions", () => {
    const fns = new Set([...PUBLIC_RPCS, ...BUYER_RPCS].map((e) => e.fn));
    const ask = ai.tasks.find((t) => t.key === "answer.ask@1")!;
    for (const tool of ask.tools ?? []) expect(fns.has(tool), tool).toBe(true);
  });
  it("refusal codes match the AskAnswer RefusalCode enum", () => {
    expect(ai.refusals.map((r) => r.code)).toEqual(enumOf("RefusalCode"));
    for (const r of ai.refusals)
      if (r.template_en && r.example)
        expect(() => fillTemplate(r.template_en!, r.example)).not.toThrow();
  });
  it("the refusal templates reproduce DESIGN §5b", () => {
    const by = new Map(ai.refusals.map((r) => [r.code, r]));
    const fill = (code: string) => {
      const r = by.get(code)!;
      return fillTemplate(r.template_en!, r.example ?? {});
    };
    expect(fill("unknown_project")).toBe(
      "I can't find Indigo Terraces in our records. If it has a Gurugram RERA number, we'll add it by 1 Nov 2026 or tell you why not.",
    );
    expect(fill("outside_coverage")).toBe(
      "We don't cover Noida yet, so I won't guess. Plinth covers Gurugram today. Noida and Greater Noida West are planned for Jul–Sep 2027.",
    );
  });
});

describe("purposes", () => {
  it("are the app.purposes codes of DATA_MODEL §6", () => {
    expect(catalogues.purposes.purposes.map((p) => p.code).sort()).toEqual(
      [
        "account",
        "alerts",
        "visit_share",
        "enquiry_share",
        "agent_brief",
        "number_share",
        "analytics",
        "ai_processing",
        "family_alerts",
      ].sort(),
    );
  });
  it("name a known retention class", () => {
    const classes = new Set(catalogues.purposes.retention_classes.map((c) => c.code));
    for (const p of catalogues.purposes.purposes)
      expect(classes.has(p.retention_class), p.code).toBe(true);
  });
});

describe("events", () => {
  it("are unique and carry no personal data", () => {
    const names = catalogues.events.events.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
    for (const e of catalogues.events.events) {
      for (const p of Object.keys(e.properties))
        expect(p, `${e.name}.${p}`).not.toMatch(/phone|email|name|address|pan|aadhaar/);
      for (const r of e.required) expect(Object.keys(e.properties), `${e.name}.${r}`).toContain(r);
    }
  });
  it("include the BUILD_PLAN §11 events", () => {
    expect(catalogues.events.events.map((e) => e.name)).toEqual(
      expect.arrayContaining([
        "report_viewed",
        "reason_expanded",
        "evidence_opened",
        "project_followed",
        "whatsapp_optin_granted",
        "search_submitted",
        "claims_checked",
        "answer_feedback",
        "consent_granted",
        "number_shared",
      ]),
    );
  });
});

describe("reference formats", () => {
  const rf = catalogues.ref_formats.formats;
  it("cover C, R, CL, D, EV, LN, E and G", () => {
    expect(rf.map((f) => f.prefix)).toEqual(["C", "R", "CL", "D", "EV", "LN", "E", "G"]);
  });
  it("C is the regex of WORK_BREAKDOWN T02 and the ConsentRef schema", () => {
    const c = rf.find((f) => f.prefix === "C")!;
    expect(c.regex).toBe("^C-(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])-\\d{2,}$");
    expect(loaded.types.get("ConsentRef")!.schema.pattern).toBe(c.regex);
  });
  for (const f of rf)
    it(`${f.prefix}: accepts its examples and rejects its counter-examples`, () => {
      for (const ok of f.examples) expect(isRef(f.prefix as RefPrefix, ok), ok).toBe(true);
      for (const bad of f.invalid_examples)
        expect(isRef(f.prefix as RefPrefix, bad), bad).toBe(false);
    });
});
