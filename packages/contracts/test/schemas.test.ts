import type { ValidateFunction } from "ajv";
import { describe, expect, it } from "vitest";
import { addAllSchemas, makeAjv } from "../scripts/lib/ajv.mjs";
import { aureliaRiskSummary } from "../scripts/lib/doc-examples.mjs";
import { loadSchemas, typeRef } from "../scripts/lib/schemas.mjs";
import { VALIDATORS, isRef, validate, validatePayload, type ExportedTypeName } from "../src";
import { exampleFolders, folderOf, loadExampleSet } from "./examples";

const loaded = loadSchemas();
const ajv = addAllSchemas(makeAjv(), loaded);
const compiled = (name: string): ValidateFunction => {
  const t = loaded.types.get(name);
  if (!t) throw new Error(`unknown type ${name}`);
  const fn = ajv.getSchema(typeRef(t));
  if (!fn) throw new Error(`cannot compile ${name}`);
  return fn;
};

describe("schemas", () => {
  it("every schema file and every named type compiles (JSON Schema 2020-12, strict)", () => {
    for (const e of loaded.entries) expect(ajv.getSchema(e.json.$id), e.file).toBeTruthy();
    for (const name of loaded.types.keys()) expect(compiled(name), name).toBeTypeOf("function");
  });

  it("covers every type of API_CONTRACTS §2 and §4", () => {
    expect(loaded.exported).toEqual(
      expect.arrayContaining([
        "RiskSummary",
        "ProjectPage",
        "SearchResults",
        "DeveloperPage",
        "Compare",
        "Evidence",
        "Methodology",
        "About",
        "Flags",
        "Follow",
        "FollowingFeed",
        "AlertPrefs",
        "WhoHasMyNumber",
        "FamilyInvite",
        "FamilyInvitePreview",
        "ShareCard",
        "DocCheck",
        "CostBreakdown",
        "AffordTheWait",
        "PayeeCheck",
        "AskAnswer",
        "ApiError",
      ]),
    );
    for (const sub of [
      "SourceRef",
      "PendingFact",
      "Chip",
      "Reason",
      "Band",
      "Frequency",
      "RiskMeta",
    ])
      expect(loaded.types.has(sub), sub).toBe(true);
  });

  it("every payload carries a plinth.<type>/1 envelope", () => {
    expect(Object.keys(loaded.schemaIds).length).toBeGreaterThanOrEqual(22);
    for (const id of Object.keys(loaded.schemaIds)) expect(id).toMatch(/^plinth\.[a-z_]+\/1$/);
  });
});

describe("examples", () => {
  const folders = exampleFolders();

  it("every exported type has an examples folder and every folder is an exported type", () => {
    expect(folders).toEqual(loaded.exported.map(folderOf).sort());
  });

  for (const name of loaded.exported as ExportedTypeName[]) {
    const set = loadExampleSet(folderOf(name));
    describe(name, () => {
      it("has at least one valid and one invalid example", () => {
        expect(set.valid.length).toBeGreaterThanOrEqual(1);
        expect(set.invalid.length).toBeGreaterThanOrEqual(1);
      });
      for (const ex of set.valid)
        it(`valid/${ex.file} passes (runtime and standalone validators)`, () => {
          const fn = compiled(name);
          expect(fn(ex.data), JSON.stringify(fn.errors)).toBe(true);
          expect(VALIDATORS[name](ex.data), JSON.stringify(VALIDATORS[name].errors)).toBe(true);
          expect(validate(name, ex.data).ok).toBe(true);
        });
      for (const ex of set.invalid)
        it(`invalid/${ex.file} fails at ${ex.spec.expect || "/"} (${ex.spec.why})`, () => {
          const fn = compiled(name);
          expect(fn(ex.data)).toBe(false);
          const paths = (fn.errors ?? []).map((e) => e.instancePath);
          expect(
            paths.some((p) => p === ex.spec.expect || p.startsWith(`${ex.spec.expect}/`)),
            `errors at ${paths.join(", ")}`,
          ).toBe(true);
          expect(VALIDATORS[name](ex.data)).toBe(false);
        });
    });
  }

  it("the Aurelia RiskSummary is API_CONTRACTS §2.1, verbatim", () => {
    const set = loadExampleSet("risk_summary");
    const file = set.valid.find((v) => v.file === "aurelia-heights-phase-2.json");
    expect(file?.data).toEqual(aureliaRiskSummary());
  });

  it("validatePayload picks the validator from the envelope", () => {
    const aurelia = loadExampleSet("risk_summary").valid[0]?.data;
    expect(validatePayload(aurelia).ok).toBe(true);
    expect(validatePayload({ schema: "plinth.nothing/1" }).ok).toBe(false);
    expect(validatePayload(null).ok).toBe(false);
  });
});

describe("reference formats", () => {
  it("the consent ref accepts C-1018-11 and rejects PLN-C-261017-0623", () => {
    expect(isRef("C", "C-1018-11")).toBe(true);
    expect(isRef("C", "PLN-C-261017-0623")).toBe(false);
    const consentRef = compiled("ConsentRef");
    expect(consentRef("C-1018-11")).toBe(true);
    expect(consentRef("PLN-C-261017-0623")).toBe(false);
    expect(consentRef("C-1018-104")).toBe(true);
  });
});
