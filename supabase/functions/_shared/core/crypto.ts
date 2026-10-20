// Small WebCrypto helpers shared by the verifiers, the rate limiter and the logger (T29).
// No dependencies. Byte arrays are ArrayBuffer-backed so they can go straight to crypto.subtle.

export type Bytes = Uint8Array<ArrayBuffer>;

const encoder = new TextEncoder();

/** UTF-8 bytes of a string; bytes pass through. */
export function utf8(data: string | Bytes): Bytes {
  return typeof data === "string" ? encoder.encode(data) : data;
}

export function toHex(bytes: Bytes): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

export function toBase64(bytes: Bytes): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

/** Decodes standard or URL-safe base64, padded or not. Throws on anything else. */
export function fromBase64(text: string): Bytes {
  const normal = text.trim().replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normal)) throw new Error("not base64");
  const padded = normal.padEnd(Math.ceil(normal.length / 4) * 4, "=");
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function sha256(data: string | Bytes): Promise<Bytes> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", utf8(data)));
}

export async function sha256Hex(data: string | Bytes): Promise<string> {
  return toHex(await sha256(data));
}

export async function hmacSha256(key: string | Bytes, data: string | Bytes): Promise<Bytes> {
  const k = await crypto.subtle.importKey(
    "raw",
    utf8(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, utf8(data)));
}

/** Constant-time comparison of two byte arrays (only the length can leak). */
export function timingSafeEqual(a: Bytes, b: Bytes): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

/**
 * Constant-time comparison of two strings: both are hashed first, so neither the content nor the
 * length of the expected value leaks through timing.
 */
export async function timingSafeEqualText(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  return timingSafeEqual(ha, hb);
}

/**
 * A stable pseudonym for a value (a phone, an IP, a user id): hex HMAC-SHA256 keyed by the salt.
 * Without the salt a phone number's hash could be reversed by trying every number, so the salt
 * (PLINTH_HASH_SALT) must stay secret. Used for rate-limit keys and the logs' user_hash.
 */
export async function pseudonym(value: string, salt: string): Promise<string> {
  return toHex(await hmacSha256(salt, value));
}
