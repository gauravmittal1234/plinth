import {
  assertEquals,
  assertRejects,
  assertThrows,
  captureLogs,
  fakeRpc,
  frozenClock,
  SECOND,
} from "../testing/mod.ts";
import { HttpError } from "./errors.ts";
import { FLAG_KEYS, flagsReader, parseFlags, rpcFlagsLoader } from "./flags.ts";
import { createLogger } from "./log.ts";

const ROOT = new URL("../../../../", import.meta.url);
const readJsonFile = async (path: string) =>
  JSON.parse(await Deno.readTextFile(new URL(path, ROOT)));
const catalogue = await readJsonFile("packages/contracts/catalogues/flags.json");
// What api.flags() returns to anon on the seeded fixture world (T03 expected output).
const fixtureWorld = await readJsonFile("packages/fixtures/expected/flags/anon.json");

Deno.test("FLAG_KEYS equals the catalogue, in order", () => {
  assertEquals([...FLAG_KEYS], catalogue.flags.map((f: { key: string }) => f.key));
});

Deno.test("in the fixture world the AI kill switches are off until M5", async () => {
  const flags = flagsReader(rpcFlagsLoader(fakeRpc({ flags: { data: fixtureWorld } })));
  for (const key of ["ai_ask", "ai_doc_check", "ai_staging"] as const) {
    assertEquals(await flags.isOn(key), false, key);
    const e = await assertRejects(() => flags.require(key), HttpError);
    assertEquals([e.code, e.status], ["flag_off", 503]);
  }
  assertEquals(await flags.isOn("bands_public"), true);
});

Deno.test("flags are read through api.flags (GET) and cached for 60 s", async () => {
  const rpc = fakeRpc({ flags: { data: fixtureWorld } });
  const clock = frozenClock();
  const flags = flagsReader(rpcFlagsLoader(rpc), { clock });
  await flags.all();
  await flags.isOn("ai_ask");
  assertEquals(rpc.calls, [{ fn: "flags", args: {}, get: true }]);
  clock.advance(61 * SECOND);
  await flags.all();
  assertEquals(rpc.calls.length, 2);
});

Deno.test("unknown keys and unreadable payloads count as off", async () => {
  const logs = captureLogs();
  const log = createLogger({ fn: "ask", sink: logs.sink });
  const broken = flagsReader(() => Promise.resolve({ flags: { ai_ask: true } }), { log });
  assertEquals(await broken.isOn("ai_ask"), false);
  assertEquals(logs.lines[0]?.msg, "flags unavailable; treating every flag as off");
  const sparse = flagsReader(() => Promise.resolve({ schema: "plinth.flags/1", flags: {} }));
  assertEquals(await sparse.isOn("maintenance_mode"), false);
});

Deno.test("parseFlags accepts only plinth.flags/1 with boolean values", () => {
  assertEquals(parseFlags({ schema: "plinth.flags/1", flags: { a: true } }), { a: true });
  assertThrows(() => parseFlags({ schema: "plinth.flags/1", flags: { a: "yes" } }));
  assertThrows(() => parseFlags({ schema: "plinth.flags/1", flags: [] }));
  assertThrows(() => parseFlags({ ai_ask: true }));
});
