// _shared/wa/verify: Meta signature, handshake, payload parsing and the tap token.
import { fromBase64 } from "../core/crypto.ts";
import { Secret } from "../core/env.ts";
import { HttpError } from "../core/errors.ts";
import { assert, assertEquals, assertRejects, assertThrows, fakeRequest } from "../testing/mod.ts";
import type { InboundMessage } from "./verify.ts";
import {
  decodeJwtPayload,
  isTap,
  metaSignature,
  mintTapToken,
  normalizeMessage,
  parseWebhook,
  readRawBody,
  redactMessage,
  TAP_MAX_AGE_MS,
  tapClaims,
  verifyHandshake,
  verifyMetaSignature,
} from "./verify.ts";

const SECRET = new Secret(`app-${crypto.randomUUID()}`);
const enc = (s: string) => new TextEncoder().encode(s);
const RECORDED = new URL("../../../../packages/fixtures/recorded/wa/", import.meta.url);
const recorded = async (file: string) => await Deno.readTextFile(new URL(file, RECORDED));

Deno.test("verifyMetaSignature accepts Meta's sha256= HMAC of the exact bytes only", async () => {
  const body = await recorded("text-aurelia.json");
  const sig = await metaSignature(SECRET.reveal(), body);
  await verifyMetaSignature(enc(body), sig, SECRET);
  await verifyMetaSignature(enc(body), sig.toUpperCase().replace("SHA256=", "sha256="), SECRET);
  const flipped = sig.slice(0, -1) + (sig.endsWith("0") ? "1" : "0");
  for (const bad of [null, "", "sha1=abc", sig.slice(0, -1), flipped]) {
    await assertRejects(() => verifyMetaSignature(enc(body), bad, SECRET), HttpError);
  }
  await assertRejects(() => verifyMetaSignature(enc(`${body} `), sig, SECRET), HttpError);
  await assertRejects(() => verifyMetaSignature(enc(body), sig, null), Error, "WA_APP_SECRET");
});

Deno.test("readRawBody keeps the exact bytes and refuses oversized bodies", async () => {
  const body = '{"a":"\\u20b9 ₹"}';
  const bytes = await readRawBody(fakeRequest("x", { body }));
  assertEquals(new TextDecoder().decode(bytes), body);
  await assertRejects(() => readRawBody(fakeRequest("x", { body: "x".repeat(20) }), 10), HttpError);
});

Deno.test("verifyHandshake echoes the challenge for subscribe + the right token", async () => {
  const token = new Secret("verify-token-for-tests");
  const p = (mode: string, t: string, c = "1158201444") =>
    new URLSearchParams({ "hub.mode": mode, "hub.verify_token": t, "hub.challenge": c });
  assertEquals(
    await verifyHandshake(p("subscribe", "verify-token-for-tests"), token),
    "1158201444",
  );
  await assertRejects(() => verifyHandshake(p("subscribe", "nope"), token), HttpError);
  await assertRejects(
    () => verifyHandshake(p("other", "verify-token-for-tests"), token),
    HttpError,
  );
  await assertRejects(
    () => verifyHandshake(p("subscribe", "verify-token-for-tests", "<x>"), token),
    HttpError,
  );
  await assertRejects(() => verifyHandshake(p("subscribe", "x"), null), Error, "WA_VERIFY_TOKEN");
});

Deno.test("parseWebhook normalises every recorded kind and drops profile names", async () => {
  const kinds: Record<string, Partial<InboundMessage>> = {
    "text-join-ah2-7kq.json": { type: "text", text: "JOIN AH2-7KQ" },
    "button-stop-weekly.json": { type: "button", replyId: "stop_weekly", text: "Stop weekly" },
    "interactive-why-this-band.json": {
      type: "interactive",
      interactiveType: "button_reply",
      replyId: "why_this_band",
    },
    "image-old-card.json": { type: "image" },
    "audio-voice-note.json": { type: "audio" },
    "document-demand-letter.json": { type: "document" },
  };
  for (const [file, want] of Object.entries(kinds)) {
    const { messages, statuses } = parseWebhook(await recorded(file));
    assertEquals(statuses.length, 0, file);
    assertEquals(messages.length, 1, file);
    const m = messages[0]!;
    for (const [k, v] of Object.entries(want)) {
      assertEquals(m[k as keyof InboundMessage], v, `${file} ${k}`);
    }
    assert(m.timestamp instanceof Date, `${file} timestamp`);
    if (m.type === "image" || m.type === "audio" || m.type === "document") assert(m.mediaId, file);
  }
  const status = parseWebhook(await recorded("status-delivered.json"));
  assertEquals(status.messages.length, 0);
  assertEquals(status.statuses.map((s) => [s.status, s.waMessageId]), [[
    "delivered",
    "wamid.fixture.4511eca3-adb4-5497-b864-34d6edde159f",
  ]]);
  assertEquals(parseWebhook('{"object":"page","entry":[]}'), { messages: [], statuses: [] });
  assertThrows(() => parseWebhook("not json"), HttpError);
});

Deno.test("redactMessage removes the sender's number (and the context sender)", async () => {
  const [m] = parseWebhook(await recorded("interactive-why-this-band.json")).messages;
  const stored = redactMessage(m!.raw);
  assertEquals("from" in stored, false);
  assertEquals((stored.context as Record<string, unknown>).from, undefined);
  assertEquals(normalizeMessage(stored, m!.from)?.replyId, "why_this_band");
});

// ---------------------------------------------------------------------------------------------
// Tap token
// ---------------------------------------------------------------------------------------------

const USER = "bff1ee72-9910-5980-a875-96a9a00b24cf";
const JWT = new Secret(`jwt-${crypto.randomUUID()}`);

async function message(file: string): Promise<InboundMessage> {
  return parseWebhook(await recorded(file)).messages[0]!;
}

Deno.test("only button and interactive replies are taps", async () => {
  assert(isTap(await message("interactive-follow-project.json")));
  assert(isTap(await message("button-stop-weekly.json")));
  assert(!isTap(await message("text-aurelia.json")));
  assert(!isTap(await message("image-old-card.json")));
});

Deno.test("mintTapToken signs ≤ 60 s claims for the verified tap", async () => {
  const tap = await message("interactive-follow-project.json");
  const now = tap.timestamp!;
  const token = await mintTapToken({ secret: JWT, userId: USER, message: tap, now });
  const claims = decodeJwtPayload(token);
  assertEquals(claims, {
    iss: "plinth/wa-webhook",
    aud: "authenticated",
    role: "authenticated",
    sub: USER,
    iat: 1792305000,
    exp: 1792305060,
    amr: [{ method: "whatsapp_tap", timestamp: 1792305000 }],
    wa_message_id: tap.waMessageId,
    is_anonymous: false,
    aal: "aal1",
  });
  const header = JSON.parse(new TextDecoder().decode(fromBase64(token.split(".")[0]!)));
  assertEquals(header, { alg: "HS256", typ: "JWT" });
  assertEquals(
    tapClaims({ secret: JWT, userId: USER, message: tap, now, ttlSeconds: 30 }).exp,
    1792305030,
  );
});

Deno.test("mintTapToken refuses: no secret, unlinked, not a tap, stale tap, TTL over 60 s", async () => {
  const tap = await message("interactive-follow-project.json");
  const now = tap.timestamp!;
  await assertRejects(
    () => mintTapToken({ secret: null, userId: USER, message: tap, now }),
    Error,
    "PLINTH_JWT_SECRET",
  );
  const code = async (p: Promise<unknown>) => {
    try {
      await p;
    } catch (e) {
      return e instanceof HttpError ? e.code : (e as Error).name;
    }
    return "ok";
  };
  assertEquals(
    await code(mintTapToken({ secret: JWT, userId: null, message: tap, now })),
    "auth_required",
  );
  assertEquals(
    await code(
      mintTapToken({ secret: JWT, userId: USER, message: await message("text-aurelia.json"), now }),
    ),
    "forbidden",
  );
  const late = new Date(now.getTime() + TAP_MAX_AGE_MS + 1000);
  assertEquals(
    await code(mintTapToken({ secret: JWT, userId: USER, message: tap, now: late })),
    "forbidden",
  );
  assertEquals(
    await code(mintTapToken({ secret: JWT, userId: USER, message: tap, now, ttlSeconds: 61 })),
    "RangeError",
  );
});
