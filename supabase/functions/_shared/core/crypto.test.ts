import { assertEquals, assertNotEquals, assertThrows } from "../testing/mod.ts";
import {
  fromBase64,
  hmacSha256,
  pseudonym,
  sha256Hex,
  timingSafeEqual,
  timingSafeEqualText,
  toBase64,
  toHex,
  utf8,
} from "./crypto.ts";

Deno.test("sha256 and HMAC-SHA256 match the published test vectors", async () => {
  assertEquals(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  // RFC 4231 test case 2.
  assertEquals(
    toHex(await hmacSha256("Jefe", "what do ya want for nothing?")),
    "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
  );
});

Deno.test("base64 round-trips, standard and URL-safe, and rejects junk", () => {
  const bytes = utf8("plinth ✓ edge");
  assertEquals(fromBase64(toBase64(bytes)), bytes);
  assertEquals(
    fromBase64(toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")),
    bytes,
  );
  assertThrows(() => fromBase64("not base64 at all!"));
});

Deno.test("constant-time comparisons", async () => {
  assertEquals(timingSafeEqual(utf8("abc"), utf8("abc")), true);
  assertEquals(timingSafeEqual(utf8("abc"), utf8("abd")), false);
  assertEquals(timingSafeEqual(utf8("abc"), utf8("abcd")), false);
  assertEquals(await timingSafeEqualText("same", "same"), true);
  assertEquals(await timingSafeEqualText("same", "sane"), false);
  assertEquals(await timingSafeEqualText("", "x"), false);
});

Deno.test("pseudonyms are stable per salt and differ across salts", async () => {
  const a = await pseudonym("+910000000001", "salt-one");
  assertEquals(a, await pseudonym("+910000000001", "salt-one"));
  assertNotEquals(a, await pseudonym("+910000000001", "salt-two"));
  assertEquals(/^[0-9a-f]{64}$/.test(a), true);
  assertEquals(a.includes("910000000001"), false);
});
