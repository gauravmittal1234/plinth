// wa-flows: Flows crypto round-trip with a test keypair made per run (no key in the repo), and the
// endpoint skeleton. Run: npx --yes deno@2 task test (in supabase/functions).
import { fromBase64, toBase64 } from "../_shared/core/crypto.ts";
import type { Bytes } from "../_shared/core/crypto.ts";
import { Secret } from "../_shared/core/env.ts";
import { flagsReader } from "../_shared/core/flags.ts";
import {
  assertApiError,
  assertEquals,
  assertRejects,
  captureLogs,
  fakeRequest,
  testEnv,
} from "../_shared/testing/mod.ts";
import { metaSignature } from "../_shared/wa/verify.ts";
import {
  decryptFlowRequest,
  decryptFlowResponse,
  encryptFlowRequest,
  encryptFlowResponse,
  FlowDecryptError,
  importFlowsPrivateKey,
  pkcs1ToPkcs8,
} from "./crypto.ts";
import type { FlowHandler } from "./logic.ts";
import { makeWaFlows, NOT_OPEN_MESSAGE } from "./logic.ts";

const RSA = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

async function testKeypair() {
  const pair = await crypto.subtle.generateKey(RSA, true, ["encrypt", "decrypt"]) as CryptoKeyPair;
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  return { publicKey: pair.publicKey, pkcs8 };
}

const pem = (label: string, der: Bytes) =>
  `-----BEGIN ${label}-----\n${
    toBase64(der).replace(/(.{64})/g, "$1\n")
  }\n-----END ${label}-----\n`;

/** The PKCS#1 key inside a PKCS#8 PrivateKeyInfo (skips SEQUENCE, version, algorithm, OCTET hdr). */
function pkcs1Of(pkcs8: Bytes): Bytes {
  const skipLen = (at: number) => (pkcs8[at]! < 0x80 ? 1 : 1 + (pkcs8[at]! & 0x7f));
  let at = 1 + skipLen(1); // outer SEQUENCE
  at += 3 + 15; // version INTEGER 0, AlgorithmIdentifier
  at += 1 + skipLen(at + 1); // OCTET STRING header
  return pkcs8.slice(at);
}

const KEYS = await testKeypair();
const PRIVATE_PEM = pem("PRIVATE KEY", KEYS.pkcs8);
const PRIVATE = await importFlowsPrivateKey(PRIVATE_PEM);

const REQUEST = {
  version: "3.0",
  action: "data_exchange",
  screen: "SLOT",
  data: { slot: "2026-10-24T11:00" },
  flow_token: "visit_booking.t44-test",
};

Deno.test("the Flows crypto round-trips: Meta's request in, our response out with the flipped IV", async () => {
  const { envelope, aesKey, iv } = await encryptFlowRequest(REQUEST, KEYS.publicKey);
  const decrypted = await decryptFlowRequest(envelope, PRIVATE);
  assertEquals(decrypted.body, REQUEST);
  assertEquals(decrypted.aesKey, aesKey);
  assertEquals(decrypted.iv, iv);

  const answer = { screen: "VISITORS", data: { slots_left: 3 } };
  const sealed = await encryptFlowResponse(answer, decrypted.aesKey, decrypted.iv);
  assertEquals(await decryptFlowResponse(sealed, aesKey, iv), answer);
  // The response is under the flipped IV, not the request's.
  const k = await crypto.subtle.importKey("raw", aesKey, "AES-GCM", false, ["decrypt"]);
  await assertRejects(() => crypto.subtle.decrypt({ name: "AES-GCM", iv }, k, fromBase64(sealed)));
});

Deno.test("a request for another key, or a tampered one, fails to decrypt (FlowDecryptError)", async () => {
  const other = await testKeypair();
  const forOther = await encryptFlowRequest(REQUEST, other.publicKey);
  await assertRejects(() => decryptFlowRequest(forOther.envelope, PRIVATE), FlowDecryptError);
  const ok = await encryptFlowRequest(REQUEST, KEYS.publicKey);
  const data = fromBase64(ok.envelope.encrypted_flow_data);
  data[0] = data[0]! ^ 1;
  await assertRejects(
    () => decryptFlowRequest({ ...ok.envelope, encrypted_flow_data: toBase64(data) }, PRIVATE),
    FlowDecryptError,
  );
});

Deno.test("WA_FLOWS_PRIVATE_KEY: PKCS#8, PKCS#1 and escaped newlines import; encrypted is refused", async () => {
  const pkcs1 = pkcs1Of(KEYS.pkcs8);
  assertEquals(pkcs1ToPkcs8(pkcs1), KEYS.pkcs8);
  const { envelope } = await encryptFlowRequest(REQUEST, KEYS.publicKey);
  for (const text of [pem("RSA PRIVATE KEY", pkcs1), PRIVATE_PEM.replace(/\n/g, "\\n")]) {
    const key = await importFlowsPrivateKey(text);
    assertEquals((await decryptFlowRequest(envelope, key)).body, REQUEST);
  }
  await assertRejects(
    () => importFlowsPrivateKey(pem("ENCRYPTED PRIVATE KEY", KEYS.pkcs8)),
    Error,
    "openssl pkcs8",
  );
  await assertRejects(() => importFlowsPrivateKey("not a key"), Error, "WA_FLOWS_PRIVATE_KEY");
});

// ---------------------------------------------------------------------------------------------
// Endpoint
// ---------------------------------------------------------------------------------------------

const APP_SECRET = `app-${crypto.randomUUID()}`;

function endpoint(opts: { inbound?: boolean; flows?: Record<string, FlowHandler> } = {}) {
  return makeWaFlows({
    env: testEnv(),
    sink: captureLogs().sink,
    vars: { appSecret: new Secret(APP_SECRET), privateKeyPem: null },
    privateKey: () => Promise.resolve(PRIVATE),
    flags: flagsReader(() =>
      Promise.resolve({ schema: "plinth.flags/1", flags: { wa_inbound: opts.inbound ?? true } })
    ),
    flows: opts.flows,
  });
}

async function call(fn: (r: Request) => Promise<Response>, body: unknown, sign = true) {
  const { envelope, aesKey, iv } = await encryptFlowRequest(body, KEYS.publicKey);
  const raw = JSON.stringify(envelope);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (sign) headers["x-hub-signature-256"] = await metaSignature(APP_SECRET, raw);
  const res = await fn(fakeRequest("wa-flows", { method: "POST", body: raw, headers }));
  return { res, open: async () => await decryptFlowResponse(await res.text(), aesKey, iv) };
}

Deno.test("ping answers active (Meta's health check), encrypted", async () => {
  const { res, open } = await call(endpoint(), { version: "3.0", action: "ping" });
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "text/plain; charset=utf-8");
  assertEquals(await open(), { data: { status: "active" } });
});

Deno.test("no Flow is open yet: the screen gets an error message; error notices are acknowledged", async () => {
  const fn = endpoint();
  const a = await call(fn, REQUEST);
  assertEquals(await a.open(), { screen: "SLOT", data: { error_message: NOT_OPEN_MESSAGE } });
  const b = await call(fn, { ...REQUEST, data: { error: "invalid-screen", error_message: "x" } });
  assertEquals(await b.open(), { data: { acknowledged: true } });
});

Deno.test("a registered Flow answers by its flow_token prefix", async () => {
  const fn = endpoint({
    flows: {
      visit_booking: (req) => Promise.resolve({ screen: "VISITORS", data: { echo: req.data } }),
    },
  });
  const { open } = await call(fn, REQUEST);
  assertEquals(await open(), { screen: "VISITORS", data: { echo: REQUEST.data } });
});

Deno.test("bad signature 403, kill switch 503, bad envelope 422, wrong key 421", async () => {
  await assertApiError((await call(endpoint(), REQUEST, false)).res, "forbidden");
  await assertApiError((await call(endpoint({ inbound: false }), REQUEST)).res, "flag_off");

  const raw = JSON.stringify({ encrypted_flow_data: "x" });
  const bad = await endpoint()(fakeRequest("wa-flows", {
    method: "POST",
    body: raw,
    headers: { "x-hub-signature-256": await metaSignature(APP_SECRET, raw) },
  }));
  await assertApiError(bad, "invalid_input");

  const other = await testKeypair();
  const { envelope } = await encryptFlowRequest(REQUEST, other.publicKey);
  const wrongRaw = JSON.stringify(envelope);
  const wrong = await endpoint()(fakeRequest("wa-flows", {
    method: "POST",
    body: wrongRaw,
    headers: { "x-hub-signature-256": await metaSignature(APP_SECRET, wrongRaw) },
  }));
  assertEquals(wrong.status, 421);
  await wrong.body?.cancel();
});
