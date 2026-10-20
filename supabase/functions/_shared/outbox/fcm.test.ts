// FCM adapter. Run: npx --yes deno@2 task test (in supabase/functions). No real network: every
// test injects a fake fetch (_shared/testing/fetch.ts), matching deno task test --allow-net=false.
import { assertEquals, fakeFetch, noNetwork } from "../testing/mod.ts";
import { fcmSender, parseServiceAccount } from "./fcm.ts";

Deno.test("parseServiceAccount: null/blank/garbage/incomplete JSON are all unconfigured", () => {
  assertEquals(parseServiceAccount(null), null);
  assertEquals(parseServiceAccount(undefined), null);
  assertEquals(parseServiceAccount(""), null);
  assertEquals(parseServiceAccount("not json"), null);
  assertEquals(parseServiceAccount(JSON.stringify({ project_id: "p" })), null);
});

Deno.test("parseServiceAccount: a complete service account parses", () => {
  const sa = parseServiceAccount(
    JSON.stringify({
      project_id: "plinth-dev",
      client_email: "a@b.iam.gserviceaccount.com",
      private_key: "pem",
    }),
  );
  assertEquals(sa?.project_id, "plinth-dev");
});

Deno.test("fcmSender: unconfigured never calls fetch, and answers not_configured", async () => {
  const net = fakeFetch(noNetwork);
  const send = fcmSender(null, { fetch: net.fetch });
  const outcome = await send("device-token", { data: { deep_link: "https://plinth.in/p/x" } });
  assertEquals(outcome, "not_configured");
  assertEquals(net.calls.length, 0);
});

// No PEM header on purpose (AGENTS.md §6: never shape test fixtures like real credentials) —
// `not-a-real-key` fails base64 decoding, which is all this test needs: the JWT signing step
// throws before any network call, the same as a dead network or a bad FCM_SERVICE_ACCOUNT would.
const SERVICE_ACCOUNT = JSON.stringify({
  project_id: "plinth-dev",
  client_email: "edge@plinth-dev.iam.gserviceaccount.com",
  private_key: "not-a-real-key",
});

Deno.test("fcmSender: a signing failure (or anything else unexpected) answers error, never rejects", async () => {
  const net = fakeFetch(noNetwork); // the signing step throws first; fetch should never be reached
  const send = fcmSender(SERVICE_ACCOUNT, { fetch: net.fetch });
  const outcome = await send("device-token", { data: { deep_link: "https://plinth.in/p/x" } });
  assertEquals(outcome, "error");
  assertEquals(net.calls.length, 0);
});
