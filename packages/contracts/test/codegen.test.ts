import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { stringEnums } from "../scripts/lib/bundle.mjs";
import { BUYER_RPCS, EDGE_FUNCTIONS, PUBLIC_RPCS } from "../scripts/lib/endpoints.mjs";
import { loadSchemas } from "../scripts/lib/schemas.mjs";
import { EXPORTED_TYPES, SCHEMA_IDS } from "../src";
import { PKG_DIR } from "./examples";

const loaded = loadSchemas();
const read = (rel: string) => readFileSync(join(PKG_DIR, rel), "utf8");
const isClassLike = (s: { type?: unknown; additionalProperties?: unknown }) =>
  s.type === "object" && typeof s.additionalProperties !== "object";

describe("generated files", () => {
  it("are up to date (TS, Dart, OpenAPI; Python drift is checked by ci-contracts)", () => {
    const out = execFileSync("node", ["scripts/gen.mjs", "--check", "--only", "ts,dart,openapi"], {
      cwd: PKG_DIR,
      encoding: "utf8",
    });
    expect(out).toContain("up to date");
  }, 60_000);

  it("TS exports every type, and the registries list every exported type", () => {
    const ts = read("gen/ts/types.ts");
    for (const name of loaded.types.keys())
      expect(ts, name).toMatch(new RegExp(`export (interface|type) ${name}\\b`));
    expect([...EXPORTED_TYPES].sort()).toEqual([...loaded.exported].sort());
    expect(SCHEMA_IDS).toEqual(loaded.schemaIds);
  });

  it("Dart has a class per object type and a constants class per string enum", () => {
    const models = read("dart/lib/src/models.g.dart");
    const enums = read("dart/lib/src/enums.g.dart");
    for (const t of loaded.types.values())
      if (isClassLike(t.schema))
        expect(models, t.name).toMatch(new RegExp(`\\nclass ${t.name} \\{`));
    for (const e of stringEnums(loaded))
      expect(enums, e.name).toContain(`abstract final class ${e.name} {`);
    expect(models).not.toMatch(/^enum /m);
  });

  it("Python has a model per exported type", () => {
    const py = read("python/plinth_contracts/models.py");
    for (const name of loaded.exported)
      expect(py, name).toMatch(new RegExp(`^class ${name}\\(`, "m"));
  });
});

describe("openapi/plinth.yaml", () => {
  const doc = parse(read("openapi/plinth.yaml"));
  const schemas: Record<string, { $ref: string }> = doc.components.schemas;

  it("is OpenAPI 3.1 on the JSON Schema 2020-12 dialect", () => {
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.jsonSchemaDialect).toBe("https://json-schema.org/draft/2020-12/schema");
  });

  it("points every component at a schema file and a defined type", () => {
    expect(Object.keys(schemas).sort()).toEqual([...loaded.types.keys()].sort());
    for (const [name, { $ref }] of Object.entries(schemas)) {
      const [file, pointer] = $ref.replace("../schemas/", "").split("#");
      expect(existsSync(join(PKG_DIR, "schemas", file!)), $ref).toBe(true);
      const t = loaded.types.get(name)!;
      expect(t.file).toBe(file);
      expect(t.pointer).toBe(pointer ?? "");
    }
  });

  it("only references components that exist", () => {
    const refs = [...read("openapi/plinth.yaml").matchAll(/#\/components\/schemas\/(\w+)/g)].map(
      (m) => m[1]!,
    );
    for (const r of refs) expect(schemas[r], r).toBeTruthy();
    for (const name of loaded.exported) {
      // schemas/ai/** (T61): the AI gateway resolves these straight off disk as a task's
      // response_schema (catalogues/ai_tasks.json); no api.* RPC or edge function returns one
      // directly, so they never appear on an OpenAPI path. Checked below instead.
      if (loaded.types.get(name)!.file.startsWith("ai/")) continue;
      expect(refs, name).toContain(name);
    }
  });

  it("every schemas/ai/** reader-output type is some AI task's response_schema", () => {
    const aiTasks = JSON.parse(read("catalogues/ai_tasks.json")) as {
      tasks: { response_schema: string | null }[];
    };
    const referenced = new Set(
      aiTasks.tasks
        .map((t) => t.response_schema)
        .filter((s): s is string => typeof s === "string" && s.startsWith("ai/")),
    );
    for (const name of loaded.exported) {
      const t = loaded.types.get(name)!;
      if (t.file.startsWith("ai/")) expect(referenced, name).toContain(t.file);
    }
  });

  it("covers the RPCs of API_CONTRACTS §3.1–§3.2 and the edge functions of §3.5", () => {
    for (const e of [...PUBLIC_RPCS, ...BUYER_RPCS])
      expect(doc.paths[`/rest/v1/rpc/${e.fn}`], e.fn).toBeTruthy();
    for (const e of EDGE_FUNCTIONS)
      expect(doc.paths[`/functions/v1/${e.name}`]?.[e.method], e.name).toBeTruthy();
    for (const fn of [
      "risk_summary",
      "project_page",
      "search_projects",
      "suggest",
      "developer_page",
      "compare",
      "evidence",
      "methodology",
      "about",
      "flags",
    ])
      expect(doc.paths[`/rest/v1/rpc/${fn}`]?.get, `${fn} is STABLE`).toBeTruthy();
    const ids = Object.values(doc.paths).flatMap((item) =>
      Object.values(item as Record<string, { operationId: string }>).map((o) => o.operationId),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });
});
