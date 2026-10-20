// _shared/wa/graph: interactive limits, the fixture test block, mock and live sends. No network.
import { Secret } from "../core/env.ts";
import type { PlinthEnv } from "../core/env.ts";
import { HttpError } from "../core/errors.ts";
import {
  assert,
  assertEquals,
  assertRejects,
  assertThrows,
  fakeFetch,
  jsonResponse,
  noNetwork,
} from "../testing/mod.ts";
import type { OutboundRecord } from "./graph.ts";
import {
  assertWithinLimits,
  createGraphClient,
  ctaUrl,
  isTestBlockNumber,
  limitProblems,
  listMessage,
  replyButtons,
  TestNumberRefused,
  textMessage,
  WaLimitError,
} from "./graph.ts";
import { sequentialIds } from "./mock.ts";

const buttons = (...titles: string[]) =>
  replyButtons({
    body: "Aurelia Heights, Phase 2",
    buttons: titles.map((t, i) => ({ id: `b${i}`, title: t })),
  });

Deno.test("the whatsapp.md limits audit controls all pass", () => {
  for (
    const msg of [
      buttons("Why this band", "Follow project", "Ask"),
      buttons("Yes, alert me", "Not now"),
      ctaUrl({
        body: "Every source we used.",
        label: "See all sources",
        url: "https://plinth.in/x",
      }),
      buttons("Yes, that one", "No, another one", "Talk to a person"),
      listMessage({
        body: "Cost sheet",
        button: "See each line",
        sections: [{
          rows: [
            "Base price",
            "Stamp duty, registration",
            "GST",
            "PLC",
            "Parking",
            "Club",
            "Maintenance",
          ].map((title, i) => ({ id: `r${i}`, title })),
        }],
      }),
      ctaUrl({ body: "Band changed.", label: "Open full card", url: "https://plinth.in/c" }),
      buttons("Directions", "Cancel visit"),
    ]
  ) {
    assertEquals(limitProblems(msg), []);
  }
});

Deno.test("≤ 3 reply buttons of ≤ 20 characters", () => {
  assertWithinLimits(buttons("12345678901234567890", "b", "c"));
  assertThrows(
    () => assertWithinLimits(buttons("a", "b", "c", "d")),
    WaLimitError,
    "4 reply buttons",
  );
  assertThrows(
    () => assertWithinLimits(buttons("123456789012345678901")),
    WaLimitError,
    "21 chars",
  );
  assertThrows(() => assertWithinLimits(buttons()), WaLimitError, "0 reply buttons");
  assertThrows(() => assertWithinLimits(buttons("Same", "Same")), WaLimitError, "titles repeat");
  // Characters, not bytes: "₹" counts once.
  assertWithinLimits(buttons("₹".repeat(20)));
});

Deno.test("one CTA URL button ≤ 20 characters; lists ≤ 10 rows with titles ≤ 24", () => {
  assertThrows(
    () =>
      assertWithinLimits(
        ctaUrl({ body: "x", label: "Open the full risk card", url: "https://plinth.in" }),
      ),
    WaLimitError,
  );
  assertThrows(
    () => assertWithinLimits(ctaUrl({ body: "x", label: "Open", url: "http://plinth.in" })),
    WaLimitError,
    "https",
  );
  const rows = (n: number, title = "Row") =>
    Array.from({ length: n }, (_, i) => ({ id: `r${i}`, title: `${title} ${i}`.slice(0, 30) }));
  assertWithinLimits(
    listMessage({ body: "x", button: "See each line", sections: [{ rows: rows(10) }] }),
  );
  assertThrows(
    () =>
      assertWithinLimits(listMessage({ body: "x", button: "See", sections: [{ rows: rows(11) }] })),
    WaLimitError,
    "11 list rows",
  );
  assertThrows(
    () =>
      assertWithinLimits(listMessage({
        body: "x",
        button: "See",
        sections: [{ rows: [{ id: "a", title: "Stamp duty, registration!" }] }],
      })),
    WaLimitError,
    "25 chars",
  );
});

Deno.test("the fixture test block is +91 99000 003NN in any spelling", () => {
  for (
    const n of [
      "919900000318",
      "+919900000318",
      "+91 99000 00318",
      "0091 99000 00399",
      "919900000300",
    ]
  ) {
    assert(isTestBlockNumber(n), n);
  }
  for (const n of ["919900000418", "+919900003180", "+14155550100", "9900000318"]) {
    assert(!isTestBlockNumber(n), n);
  }
});

Deno.test("mock mode records the request body as mock_sent and never fetches", async () => {
  const records: OutboundRecord[] = [];
  const net = fakeFetch(noNetwork);
  const graph = createGraphClient({
    mode: "mock",
    plinthEnv: "fixture",
    record: (r) => Promise.resolve(void records.push(r)),
    fetch: net.fetch,
    mockId: sequentialIds(),
  });
  const res = await graph.send({
    to: "919900000318",
    contactId: "c-1",
    message: textMessage("Hello"),
  });
  assertEquals(res, { waMessageId: "wamid.mock.0001", status: "mock_sent" });
  assertEquals(records, [{
    contactId: "c-1",
    waMessageId: "wamid.mock.0001",
    type: "text",
    payload: { type: "text", text: { body: "Hello" } },
    status: "mock_sent",
    templateCode: null,
  }]);
  assertEquals(net.calls.length, 0);
  await assertRejects(
    () => graph.send({ to: "1", message: buttons("a", "b", "c", "d") }),
    WaLimitError,
  );
  assertEquals(records.length, 1);
});

Deno.test("live sends refuse the test block in every environment, before any network call", async () => {
  const envs: PlinthEnv[] = ["local", "test", "fixture", "dev", "staging", "prod"];
  for (const plinthEnv of envs) {
    const net = fakeFetch(noNetwork);
    const graph = createGraphClient({
      mode: "live",
      plinthEnv,
      phoneNumberId: "100000000000001",
      accessToken: new Secret("test-access-token"),
      fetch: net.fetch,
    });
    await assertRejects(
      () => graph.send({ to: "+91 99000 00318", message: textMessage("x") }),
      TestNumberRefused,
      undefined,
      plinthEnv,
    );
    assertEquals(net.calls.length, 0, plinthEnv);
  }
});

Deno.test("live mode sends only in prod (C-31) and records status sent", async () => {
  const net = fakeFetch(() =>
    jsonResponse({ messaging_product: "whatsapp", messages: [{ id: "wamid.live-1" }] })
  );
  const records: OutboundRecord[] = [];
  const opts = {
    mode: "live" as const,
    phoneNumberId: "100000000000001",
    accessToken: new Secret("test-access-token"),
    fetch: net.fetch,
    record: (r: OutboundRecord) => Promise.resolve(void records.push(r)),
  };
  await assertRejects(
    () =>
      createGraphClient({ ...opts, plinthEnv: "dev" }).send({
        to: "14155550100",
        message: textMessage("x"),
      }),
    Error,
    "META_MODE",
  );
  assertEquals(net.calls.length, 0);

  const res = await createGraphClient({ ...opts, plinthEnv: "prod" }).send({
    to: "+1 415 555 0100",
    message: textMessage("x"),
  });
  assertEquals(res, { waMessageId: "wamid.live-1", status: "sent" });
  const call = net.calls[0]!;
  assertEquals(call.url.pathname, "/v23.0/100000000000001/messages");
  assertEquals(call.headers.get("authorization"), "Bearer test-access-token");
  assertEquals(JSON.parse(call.body!), {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: "14155550100",
    type: "text",
    text: { body: "x" },
  });
  assertEquals(records.map((r) => [r.waMessageId, r.status]), [["wamid.live-1", "sent"]]);
  assert(!JSON.stringify(records).includes("14155550100"), "records carry no number");

  const failing = fakeFetch(() =>
    jsonResponse({ error: { code: 131047, message: "window" } }, 400)
  );
  await assertRejects(
    () =>
      createGraphClient({ ...opts, plinthEnv: "prod", fetch: failing.fetch }).send({
        to: "14155550100",
        message: textMessage("x"),
      }),
    HttpError,
    "did not accept",
  );
});
