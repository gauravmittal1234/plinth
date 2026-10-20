// wa-flows crypto: WhatsApp Flows data exchange (T44; API_CONTRACTS §5.3). WebCrypto only.
//
// Meta sends { encrypted_flow_data, encrypted_aes_key, initial_vector } (base64):
//   1. encrypted_aes_key is RSA-OAEP (SHA-256) under our public key → a 128-bit AES key;
//   2. encrypted_flow_data is AES-GCM (128-bit tag appended) under that key and initial_vector;
//   3. the response is AES-GCM under the same key with the IV's bits flipped, base64, text/plain.
// importFlowsPrivateKey takes WA_FLOWS_PRIVATE_KEY as an unencrypted PEM, PKCS#8 ("PRIVATE KEY")
// or PKCS#1 ("RSA PRIVATE KEY"). An encrypted PEM is refused with the openssl line that decrypts it
// once: WebCrypto cannot read passphrase-protected keys, so WA_FLOWS_PRIVATE_KEY_PASSPHRASE is not
// used. Escaped newlines ("\n" in a secret) are accepted.
// encryptFlowRequest / decryptFlowResponse are Meta's side, for tests and local tools.

import type { Bytes } from "../_shared/core/crypto.ts";
import { fromBase64, toBase64 } from "../_shared/core/crypto.ts";
import { EnvError } from "../_shared/core/env.ts";

export interface FlowEnvelope {
  encrypted_flow_data: string;
  encrypted_aes_key: string;
  initial_vector: string;
}

/** A request we could not decrypt: Meta wants HTTP 421 so the client refreshes our public key. */
export class FlowDecryptError extends Error {
  constructor(cause: unknown) {
    super("could not decrypt the Flow request", { cause });
    this.name = "FlowDecryptError";
  }
}

const RSA = { name: "RSA-OAEP", hash: "SHA-256" } as const;

function pemBody(pem: string, label: string): Bytes | null {
  const re = new RegExp(`-----BEGIN ${label}-----([\\s\\S]+?)-----END ${label}-----`);
  const m = re.exec(pem);
  return m ? fromBase64(m[1]!.replace(/\s+/g, "")) : null;
}

function derLength(n: number): number[] {
  if (n < 0x80) return [n];
  const out: number[] = [];
  for (let v = n; v > 0; v >>= 8) out.unshift(v & 0xff);
  return [0x80 | out.length, ...out];
}

/** PKCS#1 RSAPrivateKey → PKCS#8 PrivateKeyInfo (rsaEncryption, NULL params). */
export function pkcs1ToPkcs8(pkcs1: Bytes): Bytes {
  const version = [0x02, 0x01, 0x00];
  const algorithm = [
    0x30,
    0x0d,
    0x06,
    0x09,
    0x2a,
    0x86,
    0x48,
    0x86,
    0xf7,
    0x0d,
    0x01,
    0x01,
    0x01,
    0x05,
    0x00,
  ];
  const octet = [0x04, ...derLength(pkcs1.length)];
  const innerLength = version.length + algorithm.length + octet.length + pkcs1.length;
  const head = [0x30, ...derLength(innerLength), ...version, ...algorithm, ...octet];
  const out = new Uint8Array(head.length + pkcs1.length);
  out.set(head);
  out.set(pkcs1, head.length);
  return out;
}

/** The RSA-OAEP private key from WA_FLOWS_PRIVATE_KEY (see the header). */
export async function importFlowsPrivateKey(pemText: string): Promise<CryptoKey> {
  const pem = pemText.replace(/\\n/g, "\n");
  if (/ENCRYPTED/.test(pem)) {
    throw new EnvError(
      ["WA_FLOWS_PRIVATE_KEY"],
      "is encrypted; store it decrypted (openssl pkcs8 -topk8 -nocrypt -in private.pem)",
    );
  }
  const pkcs8 = pemBody(pem, "PRIVATE KEY");
  const pkcs1 = pkcs8 ? null : pemBody(pem, "RSA PRIVATE KEY");
  const der = pkcs8 ?? (pkcs1 ? pkcs1ToPkcs8(pkcs1) : null);
  if (!der) throw new EnvError(["WA_FLOWS_PRIVATE_KEY"], "is not a PEM private key");
  return await crypto.subtle.importKey("pkcs8", der, RSA, false, ["decrypt"]);
}

export function flipIv(iv: Bytes): Bytes {
  return iv.map((b) => b ^ 0xff) as Bytes;
}

export interface DecryptedFlow {
  body: unknown;
  aesKey: Bytes;
  iv: Bytes;
}

/** Steps 1–2. Any failure is a FlowDecryptError (→ 421). */
export async function decryptFlowRequest(
  envelope: FlowEnvelope,
  privateKey: CryptoKey,
): Promise<DecryptedFlow> {
  try {
    const aesKey = new Uint8Array(
      await crypto.subtle.decrypt(RSA, privateKey, fromBase64(envelope.encrypted_aes_key)),
    );
    const iv = fromBase64(envelope.initial_vector);
    const key = await crypto.subtle.importKey("raw", aesKey, "AES-GCM", false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, tagLength: 128 },
      key,
      fromBase64(envelope.encrypted_flow_data),
    );
    return { body: JSON.parse(new TextDecoder().decode(plain)), aesKey, iv };
  } catch (err) {
    throw new FlowDecryptError(err);
  }
}

async function aesGcm(mode: "encrypt" | "decrypt", key: Bytes, iv: Bytes, data: Bytes) {
  const k = await crypto.subtle.importKey("raw", key, "AES-GCM", false, [mode]);
  return new Uint8Array(
    await crypto.subtle[mode]({ name: "AES-GCM", iv, tagLength: 128 }, k, data),
  );
}

/** Step 3: the response body, base64 (send as text/plain). */
export async function encryptFlowResponse(
  body: unknown,
  aesKey: Bytes,
  iv: Bytes,
): Promise<string> {
  const plain = new TextEncoder().encode(JSON.stringify(body));
  return toBase64(await aesGcm("encrypt", aesKey, flipIv(iv), plain));
}

// ---------------------------------------------------------------------------------------------
// Meta's side (tests, local tools)
// ---------------------------------------------------------------------------------------------

/** Encrypts a request as Meta does, with a fresh 128-bit key and 16-byte IV. */
export async function encryptFlowRequest(
  body: unknown,
  publicKey: CryptoKey,
): Promise<{ envelope: FlowEnvelope; aesKey: Bytes; iv: Bytes }> {
  const aesKey = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const data = await aesGcm("encrypt", aesKey, iv, new TextEncoder().encode(JSON.stringify(body)));
  const wrapped = new Uint8Array(await crypto.subtle.encrypt(RSA, publicKey, aesKey));
  return {
    envelope: {
      encrypted_flow_data: toBase64(data),
      encrypted_aes_key: toBase64(wrapped),
      initial_vector: toBase64(iv),
    },
    aesKey,
    iv,
  };
}

/** Decrypts our response as Meta does (flipped IV). */
export async function decryptFlowResponse(b64: string, aesKey: Bytes, iv: Bytes): Promise<unknown> {
  const plain = await aesGcm("decrypt", aesKey, flipIv(iv), fromBase64(b64));
  return JSON.parse(new TextDecoder().decode(plain));
}
