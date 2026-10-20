// WhatsApp send adapter. Run: npx --yes deno@2 task test (in supabase/functions).
import { fakeFetch, jsonResponse, noNetwork } from "../testing/mod.ts";
import { assertEquals, assertStringIncludes } from "../testing/mod.ts";
import { Secret } from "../core/env.ts";
import { whatsAppSender } from "./whatsapp.ts";

Deno.test("mock mode never calls Meta and fabricates a provider message id", async () => {
  const net = fakeFetch(noNetwork);
  const send = whatsAppSender("mock", null, null, { fetch: net.fetch });
  const result = await send({ messaging_product: "whatsapp", to: "919900000101", type: "text" });
  assertEquals(result.ok, true);
  assertEquals(result.mock, true);
  assertStringIncludes(result.providerMessageId, "mock_");
  assertEquals(net.calls.length, 0);
});

Deno.test("live mode without WA_PHONE_NUMBER_ID / WA_ACCESS_TOKEN fails without calling fetch", async () => {
  const net = fakeFetch(noNetwork);
  const send = whatsAppSender("live", null, null, { fetch: net.fetch });
  const result = await send({ messaging_product: "whatsapp" });
  assertEquals(result.ok, false);
  assertEquals(net.calls.length, 0);
});

Deno.test("live mode posts to the Graph API and returns Meta's message id", async () => {
  const net = fakeFetch(() => jsonResponse({ messages: [{ id: "wamid.ABC" }] }));
  const send = whatsAppSender("live", "123456", new Secret("token-abc"), { fetch: net.fetch });
  const result = await send({ messaging_product: "whatsapp", to: "919900000101", type: "text" });
  assertEquals(result, { ok: true, providerMessageId: "wamid.ABC", mock: false });
  assertEquals(net.calls.length, 1);
  const call = net.calls[0]!;
  assertEquals(
    `${call.url.origin}${call.url.pathname}`,
    "https://graph.facebook.com/v21.0/123456/messages",
  );
  assertEquals(call.headers.get("authorization"), "Bearer token-abc");
});

Deno.test("live mode surfaces a Graph error without the token leaking into it", async () => {
  const net = fakeFetch(() => new Response("rate limited", { status: 429 }));
  const send = whatsAppSender("live", "123456", new Secret("super-secret-token"), {
    fetch: net.fetch,
  });
  const result = await send({ messaging_product: "whatsapp" });
  assertEquals(result.ok, false);
  assertStringIncludes(result.error ?? "", "429");
  assertEquals((result.error ?? "").includes("super-secret-token"), false);
});
