// openapi/plinth.yaml (OpenAPI 3.1, JSON Schema 2020-12 dialect). Component
// schemas point at the schema files, so the YAML never restates a type.
import { stringify } from "yaml";
import { BUYER_RPCS, EDGE_FUNCTIONS, PUBLIC_RPCS } from "./endpoints.mjs";
import { HEADER } from "./emit-ts.mjs";

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

function body(spec) {
  if (spec === null || spec === undefined)
    return { type: "object", description: "Defined by the task that builds it." };
  return typeof spec === "string" ? ref(spec) : spec;
}

function response(name, status = "200") {
  if (!name)
    return {
      [status]: {
        description: "Shape defined by the milestone task that builds this endpoint.",
        content: { "application/json": { schema: { type: "object" } } },
      },
    };
  return {
    [status]: { description: name, content: { "application/json": { schema: ref(name) } } },
  };
}

const RPC_ERRORS = {
  default: {
    description: "SQLSTATE PT<http> raised by the function; message is the domain code.",
    content: { "application/json": { schema: ref("RpcError") } },
  },
};
const EDGE_ERRORS = {
  default: {
    description: "{ error: { code, message } } with the same codes as the RPCs.",
    content: { "application/json": { schema: ref("ApiError") } },
  },
};

function rpcPath(e, audience) {
  const op = (method) => {
    const o = {
      operationId: method === "get" ? `${e.fn}_get` : e.fn,
      summary: `api.${e.fn}`,
      tags: [audience === "public" ? "Public read API" : "Buyer API"],
      "x-plinth-milestone": e.m,
      parameters: [
        { $ref: "#/components/parameters/ContentProfile" },
        { $ref: "#/components/parameters/AcceptProfile" },
      ],
      security: audience === "public" ? [{ apikey: [] }] : [{ apikey: [], bearer: [] }],
      responses: { ...response(e.response), ...RPC_ERRORS },
    };
    if (e.note) o.description = e.note;
    if (!e.response) o["x-plinth-shape"] = "pending";
    if (method === "post")
      o.requestBody = {
        required: true,
        content: { "application/json": { schema: body(e.request) } },
      };
    else {
      o.description = [o.description, "STABLE: the same arguments as query parameters."]
        .filter(Boolean)
        .join(" ");
      // Inline argument lists become query parameters; a named request type
      // (SearchRequest, …) is documented by its schema and passed the same way.
      if (e.request && typeof e.request === "object")
        for (const [name, schema] of Object.entries(e.request.properties ?? {}))
          o.parameters.push({
            name,
            in: "query",
            required: (e.request.required ?? []).includes(name),
            schema,
          });
    }
    return o;
  };
  const item = { post: op("post") };
  if (e.stable) item.get = op("get");
  return item;
}

export function emitOpenapi(loaded) {
  const paths = {};
  for (const e of PUBLIC_RPCS) paths[`/rest/v1/rpc/${e.fn}`] = rpcPath(e, "public");
  for (const e of BUYER_RPCS) paths[`/rest/v1/rpc/${e.fn}`] = rpcPath(e, "buyer");
  for (const e of EDGE_FUNCTIONS) {
    const p = (paths[`/functions/v1/${e.name}`] ??= {});
    const o = {
      operationId: `${e.name.replace(/-/g, "_")}_${e.method}`,
      summary: e.purpose,
      tags: ["Edge functions"],
      "x-plinth-milestone": e.m,
      "x-plinth-auth": e.auth,
      security:
        e.auth === "bearer"
          ? [{ apikey: [], bearer: [] }]
          : e.auth === "optional_bearer"
            ? [{ apikey: [] }, { apikey: [], bearer: [] }]
            : [],
      responses: { ...response(e.response, e.status), ...EDGE_ERRORS },
    };
    if (!e.response) o["x-plinth-shape"] = "pending";
    if (e.method === "post")
      o.requestBody = {
        required: true,
        content: { "application/json": { schema: body(e.request) } },
      };
    p[e.method] = o;
  }

  const schemas = {};
  for (const t of [...loaded.types.values()].sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  ))
    schemas[t.name] = { $ref: `../schemas/${t.file}${t.pointer ? `#${t.pointer}` : ""}` };

  const doc = {
    openapi: "3.1.0",
    jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
    info: {
      title: "Plinth API",
      version: "1",
      description: [
        HEADER,
        "",
        "RPCs: POST {SUPABASE_URL}/rest/v1/rpc/<fn> with apikey, Authorization, Content-Profile: api and Accept-Profile: api.",
        'Edge functions: {SUPABASE_URL}/functions/v1/<name>. Every payload carries "schema": "plinth.<type>/<major>";',
        "changes are additive and a breaking change is a new <fn>_v2. Source of truth: packages/contracts/schemas.",
        "Workspace (ws_*) and admin (admin_*) functions are added by their milestone's API task (M3–M6).",
      ].join("\n"),
    },
    servers: [
      { url: "{supabase_url}", variables: { supabase_url: { default: "http://127.0.0.1:54321" } } },
    ],
    tags: [
      { name: "Public read API", description: "anon (publishable key), cacheable" },
      { name: "Buyer API", description: "user JWT" },
      { name: "Edge functions", description: "Deno edge functions" },
    ],
    paths,
    components: {
      securitySchemes: {
        apikey: {
          type: "apiKey",
          in: "header",
          name: "apikey",
          description: "The publishable key",
        },
        bearer: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "A user JWT (or the publishable key for anon)",
        },
      },
      parameters: {
        ContentProfile: {
          name: "Content-Profile",
          in: "header",
          required: true,
          schema: { const: "api" },
        },
        AcceptProfile: {
          name: "Accept-Profile",
          in: "header",
          required: true,
          schema: { const: "api" },
        },
      },
      schemas,
    },
  };
  const yaml = stringify(doc, { lineWidth: 0, aliasDuplicateObjects: false });
  return { "openapi/plinth.yaml": `# ${HEADER}\n${yaml}` };
}
