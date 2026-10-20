// The fixtures adapter (PLINTH_DATA=fixtures): serves
// packages/fixtures/expected/<fn>/<key>.json, the same files the API's
// contract tests compare against (API_CONTRACTS §1 "Fixture parity").
// No accounts, no network.
//
// - Files are bundled by `import.meta.glob` (Turbopack in Next, Vite in
//   Vitest), so a fixture build reads nothing from disk at runtime, and a key
//   added under expected/ is served without a change here.
// - A call finds its key through `_requests.json` (key → RPC args), comparing
//   the `p_` args only (`p_client_id` ignored, null and absent equal). A
//   request with a `state` (a design state such as facts_only) is served only
//   when the caller asks for that state.
// - No key: `not_found` where the server would say so for an unknown slug, id
//   or code, otherwise `fixture_missing` (registry.ts `fixtureMiss`).
// - Writes are held in the in-memory session (fixture-session.ts). A write is
//   answered by its own expected payload when one exists, by `{ ok: true }`
//   when its contract is Ok, and is otherwise `fixture_missing`.
import "server-only";
import { DataError } from "../errors";
import { apiFunction, fixtureDir, type RpcArgs, type RpcName } from "../registry";
import { recordWrite, replayOf } from "./fixture-session";
import { emulateSuggest } from "./fixture-suggest";

type Loader = () => Promise<unknown>;

// apps/web/src/data/adapters → repository root → packages/fixtures/expected.
const FILES: Record<string, Loader> = import.meta.glob<unknown>(
  "../../../../../packages/fixtures/expected/*/*.json",
  { import: "default" },
);

const FILE_RE = /\/expected\/([^/]+)\/([^/]+)\.json$/;
const REQUESTS = "_requests";

/** expected/<dir>/<key>.json, indexed: dir → key → loader. */
const INDEX: ReadonlyMap<string, ReadonlyMap<string, Loader>> = (() => {
  const index = new Map<string, Map<string, Loader>>();
  for (const [path, load] of Object.entries(FILES)) {
    const m = FILE_RE.exec(path);
    if (!m) continue;
    const [, dir, key] = m as unknown as [string, string, string];
    let keys = index.get(dir);
    if (!keys) index.set(dir, (keys = new Map()));
    keys.set(key, load);
  }
  return index;
})();

/** The expected/ folders and their payload keys (`_requests` excluded). */
export function fixtureIndex(): ReadonlyMap<string, readonly string[]> {
  return new Map(
    [...INDEX].map(([dir, keys]) => [dir, [...keys.keys()].filter((k) => k !== REQUESTS).sort()]),
  );
}

/** One expected payload by folder and key (a copy), or undefined. */
export async function loadFixture(dir: string, key: string): Promise<unknown> {
  const load = INDEX.get(dir)?.get(key);
  return load ? clone(await load()) : undefined;
}

type FixtureRequest = { readonly state?: unknown; readonly [arg: string]: unknown };

const requestCache = new Map<string, Promise<Readonly<Record<string, FixtureRequest>> | null>>();

/** `_requests.json` of a folder: key → request, or null when the folder has none. */
export function fixtureRequests(
  dir: string,
): Promise<Readonly<Record<string, FixtureRequest>> | null> {
  let pending = requestCache.get(dir);
  if (!pending) {
    const load = INDEX.get(dir)?.get(REQUESTS);
    pending = load
      ? load().then((doc) => (doc as { requests?: Record<string, FixtureRequest> }).requests ?? {})
      : Promise.resolve(null);
    requestCache.set(dir, pending);
  }
  return pending;
}

/**
 * Server defaults the fixture requests spell out, applied to a call that
 * leaves them out (API_CONTRACTS §4.3: lowest_risk is the default sort; the
 * fixture world's page size is 20).
 */
const ARG_DEFAULTS: Partial<Record<RpcName, Readonly<Record<string, unknown>>>> = {
  search_projects: { p_sort: "lowest_risk", p_limit: 20 },
};

const IGNORED_ARGS = new Set(["p_client_id"]);

/** The `p_` args that pick a fixture key, in a comparable form. */
export function matchableArgs(rpc: RpcName, args: Readonly<Record<string, unknown>>): string {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries({ ...ARG_DEFAULTS[rpc], ...dropNullish(args) })) {
    if (!k.startsWith("p_") || IGNORED_ARGS.has(k) || v === null || v === undefined) continue;
    if (k === "p_q" && typeof v === "string") {
      // The search box: case and spacing never change a query.
      const q = v.trim().replace(/\s+/g, " ").toLowerCase();
      if (q !== "") out[k] = q;
      continue;
    }
    out[k] = v;
  }
  return canonical(out);
}

function dropNullish(args: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(args).filter(([, v]) => v !== null && v !== undefined));
}

/** The fixture key for a call, or null. */
export async function resolveFixtureKey(
  rpc: RpcName,
  args: RpcArgs,
  state: string | null,
): Promise<string | null> {
  const dir = fixtureDir(rpc);
  const keys = INDEX.get(dir);
  if (!keys) return null;
  const want = matchableArgs(rpc, args);
  const requests = await fixtureRequests(dir);
  if (requests) {
    for (const [key, req] of Object.entries(requests)) {
      if (!keys.has(key)) continue;
      if ((typeof req.state === "string" ? req.state : null) !== state) continue;
      if (matchableArgs(rpc, req) === want) return key;
    }
    return null;
  }
  // A folder without _requests.json: one identity argument names the key, no
  // argument names "default".
  if (state !== null) return null;
  const values = Object.values(JSON.parse(want) as Record<string, unknown>);
  if (values.length === 0) return keys.has("default") ? "default" : null;
  const [only] = values;
  return values.length === 1 && typeof only === "string" && keys.has(only) ? only : null;
}

/** Serves one api.* call from the fixtures. */
export async function fixtureCall(
  rpc: RpcName,
  args: RpcArgs,
  state: string | null = null,
): Promise<unknown> {
  const fn = apiFunction(rpc);
  if (fn.kind === "write") return fixtureWrite(rpc, args, state);

  const key = await resolveFixtureKey(rpc, args, state);
  if (key !== null) return loadFixture(fixtureDir(rpc), key);
  if (rpc === "suggest" && state === null) {
    return emulateSuggest(typeof args.p_q === "string" ? args.p_q : "", {
      keys: (dir) => fixtureIndex().get(dir) ?? [],
      load: loadFixture,
    });
  }
  throw missing(rpc, args, state, fn.fixtureMiss);
}

async function fixtureWrite(rpc: RpcName, args: RpcArgs, state: string | null): Promise<unknown> {
  const clientId = typeof args.p_client_id === "string" ? args.p_client_id : null;
  const replay = replayOf(rpc, clientId);
  if (replay !== undefined) return clone(replay);

  const key = await resolveFixtureKey(rpc, args, state);
  let result: unknown;
  if (key !== null) result = await loadFixture(fixtureDir(rpc), key);
  else if (apiFunction(rpc).returns === "Ok") result = { ok: true };
  else throw missing(rpc, args, state, "fixture_missing");

  recordWrite(rpc, args, clone(result));
  return result;
}

function missing(
  rpc: RpcName,
  args: RpcArgs,
  state: string | null,
  code: "not_found" | "fixture_missing",
): DataError {
  const dir = fixtureDir(rpc);
  const where = INDEX.has(dir)
    ? `no key in packages/fixtures/expected/${dir}/_requests.json matches`
    : `packages/fixtures/expected/${dir}/ does not exist yet`;
  const variant = state ? ` (state ${state})` : "";
  return new DataError(
    code,
    rpc,
    `Fixture mode has no api.${rpc} payload for ${JSON.stringify(args)}${variant}: ${where}.`,
  );
}

/** JSON with sorted keys, so argument order never matters. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) =>
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) =>
            a < b ? -1 : a > b ? 1 : 0,
          ),
        )
      : v,
  );
}

/** Payloads are module singletons: hand out copies. */
function clone<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}
