import { assert, assertEquals, assertFalse, assertStringIncludes } from "../testing/mod.ts";
import { PiiStripper, stripPii, verhoeffCheckDigit, verhoeffValid } from "./pii.ts";

const SALT = "test-hash-salt";

// A 12-digit number with a valid Verhoeff check digit, built here so no real-looking number is
// committed as a literal.
const AADHAAR_BASE = "23456789012";
const AADHAAR = AADHAAR_BASE + verhoeffCheckDigit(AADHAAR_BASE);
const AADHAAR_SPACED = `${AADHAAR.slice(0, 4)} ${AADHAAR.slice(4, 8)} ${AADHAAR.slice(8)}`;
const AADHAAR_WRONG = AADHAAR_BASE + String((Number(verhoeffCheckDigit(AADHAAR_BASE)) + 1) % 10);

Deno.test("Verhoeff: the check digit validates; a changed digit does not", () => {
  assert(verhoeffValid(AADHAAR));
  assertFalse(verhoeffValid(AADHAAR_WRONG));
  assertEquals(verhoeffValid("236"), true); // the textbook example: 23 → check digit 6
  assertEquals(verhoeffCheckDigit("23"), "6");
});

Deno.test("phones: +91 spaced, 0-prefixed, bare, hyphenated and landline become tokens", async () => {
  const cases: [string, string][] = [
    ["Call +91 98765 43210 today", "Call [PHONE_1] today"],
    ["Call 098765 43210 today", "Call [PHONE_1] today"],
    ["Call 9876543210.", "Call [PHONE_1]."],
    ["Call +919876543210", "Call [PHONE_1]"],
    ["Call 98765-43210", "Call [PHONE_1]"],
    ["Call 987 654 3210", "Call [PHONE_1]"],
    ["Office 0124 4567890", "Office [PHONE_1]"],
    ["Office +91 124 456 7890", "Office [PHONE_1]"],
  ];
  for (const [input, want] of cases) {
    const { text, vault } = await stripPii(input, "strip", SALT);
    assertEquals(text, want, input);
    assertEquals(vault.ofKind("PHONE").length, 1, input);
  }
});

Deno.test("the same phone in two formats is one token; a second phone is the next", async () => {
  const s = new PiiStripper("strip", SALT);
  const out = s.strip("Sales +91 98765 43210 / 098765 43210, site 99887 76655");
  assertEquals(out, "Sales [PHONE_1] / [PHONE_1], site [PHONE_2]");
  const v = await s.vault();
  assertEquals(v.ofKind("PHONE").map((e) => e.last4), ["3210", "6655"]);
});

Deno.test("not phones: amounts, dates, RERA numbers, areas and short numbers stay", async () => {
  const text =
    "₹1,67,20,000 · 18/10/2026 · RC/REP/HARERA/GGM/2023/45 · 1,450 sq ft · Tower 4 · 2026";
  assertEquals((await stripPii(text, "strip", SALT)).text, text);
});

Deno.test("email, PAN and a valid Aadhaar become tokens; an invalid Aadhaar stays", async () => {
  const { text, vault } = await stripPii(
    `Mail rohan.s@example.test, PAN ABCDE1234F, Aadhaar ${AADHAAR_SPACED}, ref ${AADHAAR_WRONG}`,
    "strip",
    SALT,
  );
  assertEquals(
    text,
    `Mail [EMAIL_1], PAN [PAN_1], Aadhaar [AADHAAR_1], ref ${AADHAAR_WRONG}`,
  );
  assertEquals(vault.ofKind("AADHAAR")[0]!.last4, AADHAAR.slice(-4));
  assertEquals(vault.ofKind("EMAIL")[0]!.last4, null);
  assertEquals(vault.ofKind("PAN")[0]!.last4, null);
  const contiguous = await stripPii(`id ${AADHAAR}`, "strip", SALT);
  assertEquals(contiguous.text, "id [AADHAAR_1]");
});

Deno.test("bank accounts: tokenised under strip_and_redact_bank with last 4 and a salted hash", async () => {
  const { text, vault } = await stripPii("A/c 50200071824417", "strip_and_redact_bank", SALT);
  assertEquals(text, "A/c [ACCOUNT_1]");
  const e = vault.get("[ACCOUNT_1]")!;
  assertEquals([e.kind, e.last4], ["ACCOUNT", "4417"]);
  assertEquals(e.sha256.length, 64);
  assertFalse(e.sha256.includes("50200071824417"));
  const other = await stripPii("A/c 50200071824417", "strip_and_redact_bank", "another-salt");
  assert(other.vault.get("[ACCOUNT_1]")!.sha256 !== e.sha256, "the hash is salted");
});

Deno.test("bank accounts: account words, IFSC on the next line, grouped digits", async () => {
  const cases: [string, string][] = [
    ["Account No. 123456789012", "Account No. [ACCOUNT_1]"],
    ["Acct: 000123456789", "Acct: [ACCOUNT_1]"],
    ["Beneficiary 917020034567890\nIFSC UTIB0000123", "Beneficiary [ACCOUNT_1]\nIFSC UTIB0000123"],
    ["a/c no 5020 0071 8244 17", "a/c no [ACCOUNT_1]"],
  ];
  for (const [input, want] of cases) {
    assertEquals((await stripPii(input, "strip_and_redact_bank", SALT)).text, want, input);
  }
  // without bank context, or under plain `strip`, a long number is not an account
  assertEquals(
    (await stripPii("Ref 50200071824417", "strip_and_redact_bank", SALT)).text,
    "Ref 50200071824417",
  );
  assertEquals((await stripPii("A/c 50200071824417", "strip", SALT)).text, "A/c 50200071824417");
});

Deno.test("the vault never serialises its entries", async () => {
  const { vault } = await stripPii("A/c 50200071824417", "strip_and_redact_bank", SALT);
  assertEquals(JSON.stringify(vault), '"[pii vault]"');
  assertEquals(String(vault), "[pii vault]");
  assertStringIncludes(Deno.inspect({ vault }), "[pii vault]");
  assertFalse(Deno.inspect({ vault }).includes("4417"));
});

Deno.test("aggressive mode (log redaction) masks any long digit run", () => {
  const s = new PiiStripper("strip_and_redact_bank", SALT, { aggressive: true });
  assertEquals(s.strip("ref 50200071824417 and 12345678"), "ref [NUMBER_1] and 12345678");
});
