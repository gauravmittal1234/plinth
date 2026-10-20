import { compileSchema } from "../core/validate.ts";
import { assert, assertEquals, assertRejects } from "../testing/mod.ts";
import type { AiTask } from "./catalogue.ts";
import { DEFAULT_CATALOGUE } from "./catalogue.ts";
import { AiError } from "./errors.ts";
import { fileSchemaReader, resolveSchema, schemaSource, toGeminiSchema } from "./schema.ts";
import { checkOutput } from "./validate.ts";

const hasRef = (v: unknown): boolean =>
  v !== null && typeof v === "object" &&
  (Object.hasOwn(v, "$ref") || Object.values(v).some(hasRef));

Deno.test("resolveSchema inlines refs across contract files (SearchFilters → common)", async () => {
  const s = await resolveSchema(
    "search_results.schema.json#/$defs/SearchFilters",
    fileSchemaReader(),
  );
  assertEquals(hasRef(s), false);
  assertEquals(s.title, "SearchFilters");
  const validate = await compileSchema(s);
  assert(validate({ bhk: [3], all_in_max_inr: 30000000, corridors: null }));
  assertEquals(validate({ bhk: [9] }), false);
  assertEquals(validate({ surprise: true }), false);
});

Deno.test("the catalogue's parse.search_query schema reference resolves", async () => {
  const task = DEFAULT_CATALOGUE.tasks.find((t) => t.id === "parse.search_query")!;
  const s = await schemaSource().forTask(task);
  assertEquals(s.type, "object");
});

Deno.test("a task without a response schema is schema_missing", async () => {
  const task = { key: "x@1", response_schema: null } as unknown as AiTask;
  const e = await assertRejects(() => schemaSource().forTask(task), AiError);
  assertEquals(e.aiCode, "schema_missing");
});

Deno.test("refs may not leave the contracts or recurse", async () => {
  const read = (docs: Record<string, unknown>) => (p: string) => Promise.resolve(docs[p]);
  const out = await assertRejects(
    () => resolveSchema("a.json", read({ "a.json": { $ref: "../secret.json" } })),
    AiError,
  );
  assertEquals(out.aiCode, "config");
  const loop = await assertRejects(
    () =>
      resolveSchema(
        "a.json",
        read({
          "a.json": {
            $defs: { n: { properties: { next: { $ref: "#/$defs/n" } } } },
            $ref: "#/$defs/n",
          },
        }),
      ),
    AiError,
  );
  assertEquals(loop.aiCode, "config");
});

Deno.test("toGeminiSchema: upper-case types, nullable, enums, ordering, no JSON-Schema-only keys", () => {
  const g = toGeminiSchema({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    additionalProperties: false,
    required: ["kind", "amount"],
    properties: {
      kind: { const: "cost_sheet" },
      amount: { anyOf: [{ type: "integer", minimum: 0 }, { type: "null" }] },
      label: { type: ["string", "null"], enum: ["flyer", "brochure", null], pattern: "^[a-z]+$" },
      lines: { type: "array", maxItems: 5, items: { type: "string", format: "uuid" } },
    },
  });
  assertEquals(g, {
    type: "OBJECT",
    properties: {
      kind: { type: "STRING", enum: ["cost_sheet"] },
      amount: { type: "INTEGER", minimum: 0, nullable: true },
      label: { type: "STRING", enum: ["flyer", "brochure"], nullable: true },
      lines: { type: "ARRAY", maxItems: 5, items: { type: "STRING" } },
    },
    propertyOrdering: ["kind", "amount", "label", "lines"],
    required: ["kind", "amount"],
  });
});

Deno.test("checkOutput: JSON text, fenced JSON, parsed values; issues name a path", async () => {
  const schema = { type: "object", required: ["n"], properties: { n: { type: "integer" } } };
  assertEquals(await checkOutput(schema, { text: '{"n": 1}' }), { ok: true, output: { n: 1 } });
  assertEquals((await checkOutput(schema, { text: '```json\n{"n": 2}\n```' })).ok, true);
  assertEquals(await checkOutput(schema, { text: "" }), {
    ok: false,
    issue: "the answer is empty",
  });
  assertEquals(await checkOutput(schema, { text: "n=1" }), {
    ok: false,
    issue: "the answer is not JSON",
  });
  const bad = await checkOutput(schema, { output: { n: "1" } });
  assertEquals(bad, { ok: false, issue: "/n must be integer" });
});
