// zip.ts. Run: npx --yes deno@2 task test (in supabase/functions).
import { assertEquals, assertThrows } from "../_shared/testing/mod.ts";
import { crc32, dosDateTime, readZip, zipStore } from "./zip.ts";

const enc = new TextEncoder();

Deno.test("crc32: the standard check value", () => {
  assertEquals(crc32(enc.encode("123456789")), 0xcbf43926);
  assertEquals(crc32(new Uint8Array()), 0);
});

Deno.test("dosDateTime: 18 Oct 2026 12:00 IST", () => {
  const { date, time } = dosDateTime(new Date("2026-10-18T12:00:00+05:30"));
  assertEquals(date, ((2026 - 1980) << 9) | (10 << 5) | 18);
  assertEquals(time, 12 << 11);
});

Deno.test("zipStore → readZip round-trips both files byte for byte, UTF-8 names included", () => {
  const json = enc.encode('{"ref":"C-1018-11","phone":"+91 99••• ••318"}');
  const pdf = enc.encode("%PDF-1.4\n…");
  const zip = zipStore([
    { name: "plinth-my-data.json", data: json },
    { name: "plinth-my-data.pdf", data: pdf },
  ], new Date("2026-10-18T12:00:00+05:30"));
  assertEquals([...zip.subarray(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  const files = readZip(zip);
  assertEquals([...files.keys()], ["plinth-my-data.json", "plinth-my-data.pdf"]);
  assertEquals(files.get("plinth-my-data.json"), json);
  assertEquals(files.get("plinth-my-data.pdf"), pdf);
});

Deno.test("zipStore: same input, same bytes (the stored SHA-256 is reproducible)", () => {
  const at = new Date("2026-10-18T12:00:00+05:30");
  const a = zipStore([{ name: "a.json", data: enc.encode("{}") }], at);
  const b = zipStore([{ name: "a.json", data: enc.encode("{}") }], at);
  assertEquals(a, b);
});

Deno.test("zipStore: refuses duplicate, absolute and parent-relative names", () => {
  const at = new Date();
  const data = enc.encode("x");
  assertThrows(() => zipStore([{ name: "a", data }, { name: "a", data }], at));
  assertThrows(() => zipStore([{ name: "/etc/a", data }], at));
  assertThrows(() => zipStore([{ name: "../a", data }], at));
});

Deno.test("readZip: a flipped byte fails the CRC check", () => {
  const zip = zipStore([{ name: "a.txt", data: enc.encode("hello") }], new Date());
  const at = 30 + "a.txt".length;
  zip[at] = zip[at]! ^ 0xff;
  assertThrows(() => readZip(zip), Error, "CRC");
});
