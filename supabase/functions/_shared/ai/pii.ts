// PII stripping before any model call (T63; BUILD_PLAN §14 hard rule 5, ai_tasks.json pii_policies).
//
// A PiiStripper replaces personal data in document text with stable tokens, numbered per kind in
// order of first appearance: the same phone twice is [PHONE_1] twice. What it removes:
//   EMAIL    any e-mail address
//   ACCOUNT  under strip_and_redact_bank only: a 9–18 digit run within a few words after
//            "A/c", "Acct", "Account" or "Ac no", or on a line with an IFSC code
//   AADHAAR  12 digits (grouped 4-4-4 or not) that pass the Verhoeff check
//   PAN      AAAAA9999A
//   PHONE    Indian mobiles (+91 / 0091 / 0 prefixed, or bare 6–9 starting, spaced 5-5 or 3-3-4)
//            and landlines with an STD code (0124 4567890, +91 11 2345 6789)
// It runs on the whole document at once, so a token is stable across lines and an IFSC on the next
// line still marks an account number. The vault maps each token to a salted SHA-256 (HMAC with
// PLINTH_HASH_SALT) and, for numbers, the last 4 digits; it never holds the value itself, and it
// never leaves the process (it prints as "[pii vault]").

import { hmacSha256, toHex } from "../core/crypto.ts";
import type { Secret } from "../core/env.ts";
import type { PiiPolicy } from "./catalogue.ts";

export type PiiKind = "EMAIL" | "ACCOUNT" | "AADHAAR" | "PAN" | "PHONE" | "NUMBER";

export interface VaultEntry {
  token: string;
  kind: PiiKind;
  /** Hex HMAC-SHA256 of the canonical value (digits only; e-mail lower-cased), keyed by the salt. */
  sha256: string;
  /** The last 4 digits of a number (ACCOUNT, AADHAAR, PHONE); null otherwise. */
  last4: string | null;
}

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/** True when a digit string passes the Verhoeff check (its last digit is the check digit). */
export function verhoeffValid(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let c = 0;
  const rev = [...digits].reverse();
  for (let i = 0; i < rev.length; i++) {
    c = VERHOEFF_D[c]![VERHOEFF_P[i % 8]![Number(rev[i])]!]!;
  }
  return c === 0;
}

/** The Verhoeff check digit for a digit string (for building test numbers). */
export function verhoeffCheckDigit(digits: string): string {
  let c = 0;
  const rev = [...digits].reverse();
  for (let i = 0; i < rev.length; i++) {
    c = VERHOEFF_D[c]![VERHOEFF_P[(i + 1) % 8]![Number(rev[i])]!]!;
  }
  return String(VERHOEFF_INV[c]);
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const PAN_RE = /(?<![A-Za-z0-9])[A-Z]{5}\d{4}[A-Z](?![A-Za-z0-9])/g;
const AADHAAR_RE = /(?<![\d+])[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}(?![\d])/g;
// Account candidates: a 4-4-4(-n) grouped run, or a plain run of 9–18 digits.
const ACCOUNT_RE = /(?<![\d])(?:\d{4}(?:[ -]\d{4}){2,3}(?:[ -]\d{1,4})?|\d{9,18})(?![\d])/g;
const ACCOUNT_WORD_RE = /(?:^|[^a-z])(?:a\/c|acct|account|ac\.? ?no)(?:[^a-z]|$)/i;
const IFSC_RE = /(?<![A-Za-z0-9])[A-Z]{4}0[A-Z0-9]{6}(?![A-Za-z0-9])/;
const MOBILE = String.raw`[6-9]\d{9}|[6-9]\d{4}[ -]\d{5}|[6-9]\d{2}[ -]\d{3}[ -]\d{4}`;
const PHONE_RE = new RegExp(
  [
    // +91 / 0091 / "91 " then a mobile
    String.raw`(?:\+ ?91|0091|91(?=[ -]))[ -]?(?:${MOBILE})`,
    // +91 / 0091 then an STD code and number (10 digits in all; checked below)
    String.raw`(?:\+ ?91|0091)[ -]?\(?[1-5]\d{1,3}\)?[ -]?\d{2,4}[ -]?\d{3,8}`,
    // 0 then a mobile
    String.raw`0(?:${MOBILE})`,
    // 0 then an STD code and number
    String.raw`\(?0[1-5]\d{1,3}\)?[ -]?\d{2,4}[ -]?\d{3,8}`,
    // a bare mobile
    MOBILE,
  ].map((p) => `(?<![\\d+])(?:${p})(?![\\d])`).join("|"),
  "g",
);
const LONG_NUMBER_RE = /(?<![\d])\d{9,18}(?![\d])/g;

/** Is this phone candidate 10 national digits (after +91 / 0091 / 0)? */
function isIndianPhone(raw: string): boolean {
  let d = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+") || raw.startsWith("0091") || /^91[ -]/.test(raw)) {
    d = d.replace(/^(?:00)?91/, "");
  } else if (d.startsWith("0")) d = d.slice(1);
  return d.length === 10;
}

export interface StripOptions {
  /** Also mask any 9–18 digit run as [NUMBER_n] (log redaction, where a false hit is harmless). */
  aggressive?: boolean;
}

/** Replaces PII with stable tokens across every text it is given; keeps the vault in memory. */
export class PiiStripper {
  readonly policy: PiiPolicy;
  readonly #aggressive: boolean;
  readonly #salt: Secret | string;
  readonly #tokens = new Map<string, string>();
  readonly #values = new Map<string, { kind: PiiKind; value: string }>();
  readonly #counts = new Map<PiiKind, number>();

  constructor(policy: PiiPolicy, salt: Secret | string, opts: StripOptions = {}) {
    this.policy = policy;
    this.#salt = salt;
    this.#aggressive = opts.aggressive === true;
  }

  #token(kind: PiiKind, canonical: string): string {
    const key = `${kind}:${canonical}`;
    const hit = this.#tokens.get(key);
    if (hit) return hit;
    const n = (this.#counts.get(kind) ?? 0) + 1;
    this.#counts.set(kind, n);
    const token = `[${kind}_${n}]`;
    this.#tokens.set(key, token);
    this.#values.set(token, { kind, value: canonical });
    return token;
  }

  /** The text with every PII value replaced by its token. */
  strip(text: string): string {
    let out = text.replace(EMAIL_RE, (m) => this.#token("EMAIL", m.toLowerCase()));
    if (this.policy === "strip_and_redact_bank") {
      out = out.replace(ACCOUNT_RE, (m, offset: number, whole: string) => {
        const before = whole.slice(Math.max(0, offset - 40), offset);
        const lineStart = whole.lastIndexOf("\n", offset - 1) + 1;
        const nextBreak = whole.indexOf("\n", offset + m.length);
        const lineEnd = nextBreak === -1 ? whole.length : nextBreak;
        const nearby = whole.slice(
          Math.max(lineStart - 120, 0),
          Math.min(lineEnd + 120, whole.length),
        );
        const digits = m.replace(/\D/g, "");
        if (digits.length < 9 || digits.length > 18) return m;
        if (ACCOUNT_WORD_RE.test(before) || IFSC_RE.test(nearby)) {
          return this.#token("ACCOUNT", digits);
        }
        return m;
      });
    }
    out = out.replace(AADHAAR_RE, (m) => {
      const digits = m.replace(/\D/g, "");
      return verhoeffValid(digits) ? this.#token("AADHAAR", digits) : m;
    });
    out = out.replace(PAN_RE, (m) => this.#token("PAN", m));
    out = out.replace(PHONE_RE, (m) => {
      if (!isIndianPhone(m)) return m;
      const national = m.replace(/\D/g, "").replace(/^(?:0091|91|0)(?=\d{10}$)/, "");
      return this.#token("PHONE", national);
    });
    if (this.#aggressive) {
      out = out.replace(LONG_NUMBER_RE, (m) => this.#token("NUMBER", m));
    }
    return out;
  }

  /** Every token so far, with its salted hash and last 4 digits. */
  async vault(): Promise<PiiVault> {
    const salt = typeof this.#salt === "string" ? this.#salt : this.#salt.reveal();
    const entries: VaultEntry[] = [];
    for (const [token, { kind, value }] of this.#values) {
      const numeric = /^\d+$/.test(value) && kind !== "PAN";
      entries.push({
        token,
        kind,
        sha256: toHex(await hmacSha256(salt, value)),
        last4: numeric ? value.slice(-4) : null,
      });
    }
    return new PiiVault(entries);
  }
}

/** Token → salted hash and last 4. Stays in the process: it never serialises its entries. */
export class PiiVault {
  readonly #entries: ReadonlyMap<string, VaultEntry>;
  constructor(entries: readonly VaultEntry[]) {
    this.#entries = new Map(entries.map((e) => [e.token, e]));
  }
  get size(): number {
    return this.#entries.size;
  }
  get(token: string): VaultEntry | undefined {
    return this.#entries.get(token);
  }
  entries(): VaultEntry[] {
    return [...this.#entries.values()];
  }
  ofKind(kind: PiiKind): VaultEntry[] {
    return this.entries().filter((e) => e.kind === kind);
  }
  toJSON(): string {
    return "[pii vault]";
  }
  toString(): string {
    return "[pii vault]";
  }
  [Symbol.for("Deno.customInspect")](): string {
    return "[pii vault]";
  }
}

/** Strips one text (a fresh stripper): for one-off redaction. */
export async function stripPii(
  text: string,
  policy: PiiPolicy,
  salt: Secret | string,
): Promise<{ text: string; vault: PiiVault }> {
  const s = new PiiStripper(policy, salt);
  const out = s.strip(text);
  return { text: out, vault: await s.vault() };
}
