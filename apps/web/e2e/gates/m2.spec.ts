// T59 · M2 exit gate, web side (BUILD_PLAN §3 "M2: Accounts, follow, alerts";
// WORK_BREAKDOWN T59). It checks the M2 items the web owns and points at the
// tests that already prove the rest, so nothing is asserted twice:
//   - each M2 page's content: sign-in, following, privacy and family specs;
//   - card renderers at 1080×1350 and 1080×570: test/cards/*.test.ts;
//   - the database side of every M2 item: supabase/tests/gates/m2.sql (its
//     header maps each item to the test that proves it).
//
// Three groups:
//   @smoke @gate  fixture mode, every PR (ci-web): the M2 screens are built
//                 (no stub left), and the card URLs the WhatsApp replies hand
//                 out are served at the size the templates were approved at.
//   @live         only in ci-gate-m2, skipped elsewhere:
//                 - PLINTH_GATE_M2_WEB=1, against a PLINTH_DATA=supabase build
//                   on CI's seeded stack: Rohan signs in with the test OTP
//                   (Supabase Auth's fixed code, read from supabase/config.toml)
//                   and Following shows his 5 changes.
//                 - PLINTH_GATE_M2_TAP=<file>: the TAP output of
//                   supabase/tests/gates/m2.sql on that stack. Its `m2:` diag
//                   lines carry the outbox row the 25 Oct publish queued and
//                   Rohan's export payload; the edge's own code (outbox-dispatch,
//                   export-data, run with Deno) turns them into the mock
//                   WhatsApp body and the ZIP, which are checked here.
import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { SCREENS } from "../../src/shell/screens";
import { pngDimensions } from "../../test/cards/png-inspect";

const ROOT = join(__dirname, "../../../..");
const EXPECTED = join(ROOT, "packages/fixtures/expected");
const FUNCTIONS = join(ROOT, "supabase/functions");

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;
const expected = <T>(fn: string, key: string): T => readJson<T>(join(EXPECTED, fn, `${key}.json`));

type Person = { key: string; test_phone_e164: string | null };
/** A fixture person's test number (packages/fixtures/canonical/people.json), never a real one. */
function testPhone(key: string): string {
  const people = readJson<{ people: Person[] }>(
    join(ROOT, "packages/fixtures/canonical/people.json"),
  );
  const phone = people.people.find((p) => p.key === key)?.test_phone_e164;
  if (!phone) throw new Error(`people.json has no test phone for ${key}`);
  return phone;
}

/** Supabase Auth's fixed test code for a number ([auth.sms.test_otp] in supabase/config.toml). */
function testOtp(phoneE164: string): string {
  const toml = readFileSync(join(ROOT, "supabase/config.toml"), "utf8");
  const section = toml.split(/^\[auth\.sms\.test_otp\]\s*$/m)[1]?.split(/^\[/m)[0] ?? "";
  const digits = phoneE164.replace(/\D/g, "");
  const code = section.match(new RegExp(`^${digits}\\s*=\\s*"(\\d{6})"`, "m"))?.[1];
  if (!code)
    throw new Error(
      `supabase/config.toml has no test OTP for the number ending ${digits.slice(-3)}`,
    );
  return code;
}

// BUILD_PLAN §3 M2 (web): sign-in, Following, Who has my number, the family opt-in page.
const M2_WEB = ["WebSignIn", "WebFollowing", "WebPrivacy", "Family opt-in"];

test.describe(
  "M2 gate: the web screens and the cards they hand out",
  { tag: ["@smoke", "@gate"] },
  () => {
    const m2 = SCREENS.filter((s) => s.milestone === "M2");

    test("the M2 screen list is BUILD_PLAN §3's", () => {
      expect(m2.map((s) => s.name).sort()).toEqual([...M2_WEB].sort());
    });

    for (const { name, routes } of m2) {
      for (const { sample } of routes) {
        test(`${name} is built: ${sample}`, async ({ page }) => {
          const res = await page.goto(sample);
          expect(res?.status()).toBe(200);
          // A stub carries [data-screen] (src/shell/placeholder); no M2 screen may.
          await expect(page.locator("[data-screen]")).toHaveCount(0);
          await expect(page.getByRole("main")).toHaveCount(1);
          await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
        });
      }
    }

    test("WaRisk's card: the RiskSummary's card_url is served at 1080×1350", async ({
      request,
    }) => {
      const risk = expected<{ share: { card_url: string } }>(
        "risk_summary",
        "aurelia-heights-phase-2",
      );
      const url = new URL(risk.share.card_url);
      const res = await request.get(url.pathname + url.search);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("image/png");
      expect(pngDimensions(await res.body())).toEqual({ width: 1080, height: 1350 });
    });

    test("a returned old card: the changed card is served at 1080×1350", async ({ request }) => {
      const req = readJson<{ requests: Record<string, { p_code: string }> }>(
        join(EXPECTED, "share_card", "_requests.json"),
      );
      const code = Object.values(req.requests)[0]!.p_code;
      const res = await request.get(`/cards/changed/${code}.png`);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("image/png");
      expect(pngDimensions(await res.body())).toEqual({ width: 1080, height: 1350 });
    });

    test("WaDigest's header: the weekly digest card is served at 1080×570", async ({ request }) => {
      test.fixme(
        true,
        "Gate gap: weekly_digest's template has an image header (comms.templates: 1080x570) and " +
          "src/features/cards/digest-card.tsx renders it, but app/cards/[...card]/route.ts serves no " +
          "digest kind (404) and ops.enqueue_digests puts no image URL in the row.",
      );
      const res = await request.get("/cards/digest/rohan.png");
      expect(res.status()).toBe(200);
      expect(pngDimensions(await res.body())).toEqual({ width: 1080, height: 570 });
    });
  },
);

test.describe("M2 gate: phone login on a local stack", { tag: ["@smoke", "@gate"] }, () => {
  test("supabase/config.toml names an SMS provider, so the CLI keeps phone login on", () => {
    test.fixme(
      true,
      "Gate gap: no [auth.sms.<provider>] is enabled (the Send-SMS hook is off too), so `supabase " +
        'start` warns "no SMS provider is enabled. Disabling phone login" and Auth answers every ' +
        'phone OTP, the test numbers included, with 400 "Unsupported phone provider". The hook ' +
        "alone does not count as a provider. ci-gate-m2 names a placeholder provider on its runner.",
    );
    const toml = readFileSync(join(ROOT, "supabase/config.toml"), "utf8");
    const providers = ["twilio", "twilio_verify", "messagebird", "textlocal", "vonage"].filter(
      (p) => new RegExp(`^\\[auth\\.sms\\.${p}\\]\\s*\\nenabled = true`, "m").test(toml),
    );
    expect(providers.length).toBeGreaterThan(0);
  });
});

test.describe("M2 gate: live mode against CI's seeded stack", { tag: "@live" }, () => {
  test.describe("Phone OTP sign-in, then Following", () => {
    test.skip(!process.env.PLINTH_GATE_M2_WEB, "ci-gate-m2 only: set PLINTH_GATE_M2_WEB=1");

    function supabaseEnv() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and _PUBLISHABLE_KEY are needed");
      return { url, key };
    }

    test("Rohan signs in with the test OTP, and Following shows his 5 changes", async ({
      page,
      context,
      baseURL,
    }) => {
      const { url, key } = supabaseEnv();
      const phone = testPhone("rohan");

      // Supabase Auth's phone OTP, through @supabase/ssr, which writes the session
      // cookies exactly as the web's own server client reads them.
      const jar = new Map<string, string>();
      const auth = createServerClient(url, key, {
        cookies: {
          getAll: () => [...jar].map(([name, value]) => ({ name, value })),
          setAll: (list) => {
            for (const { name, value } of list) jar.set(name, value);
          },
        },
      });
      const sent = await auth.auth.signInWithOtp({ phone });
      expect(sent.error, "POST /auth/v1/otp for the test number").toBeNull();
      const verified = await auth.auth.verifyOtp({ phone, token: testOtp(phone), type: "sms" });
      expect(verified.error, "POST /auth/v1/verify with the test code").toBeNull();
      const session = verified.data.session!;
      expect(session.user.phone).toBe(phone.replace(/^\+/, ""));

      // What the server sends Rohan: his own following_feed, with his own JWT.
      const res = await fetch(`${url}/rest/v1/rpc/following_feed`, {
        method: "POST",
        headers: {
          apikey: key,
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
          "content-profile": "api",
        },
        body: "{}",
      });
      expect(res.status, "api.following_feed as Rohan").toBe(200);
      const feed = (await res.json()) as { heading: string; changes: unknown[] };
      expect(feed.changes).toHaveLength(5);

      await context.addCookies(
        [...jar]
          .filter(([, value]) => value)
          .map(([name, value]) => ({ name, value, url: baseURL! })),
      );
      const page200 = await page.goto("/following");
      expect(page200?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(feed.heading);
      await expect(page.getByTestId("unread-badge")).toHaveText(`${feed.changes.length} unread`);
    });

    test("WebSignIn's own form signs Rohan in with the test OTP", async ({ page }) => {
      test.fixme(
        true,
        "Gate gap: src/features/auth never calls Supabase Auth in any mode (sending and verifying " +
          "a code are UI-only, T47 was fixture-mode only), so the live web has no sign-in path.",
      );
      const phone = testPhone("rohan");
      await page.goto("/sign-in?next=/following");
      await page.getByLabel("Mobile number").fill(phone.replace(/^\+91/, ""));
      await page.getByRole("button", { name: "Send code on WhatsApp" }).click();
      await page.getByLabel("6-digit code").fill(testOtp(phone));
      await page.getByRole("button", { name: /^Verify and (follow|continue)/ }).click();
      await page.goto("/following");
      await expect(page.getByTestId("unread-badge")).toHaveText("5 unread");
    });
  });

  test.describe("The edge's own code over the live database's rows", () => {
    const tapFile = process.env.PLINTH_GATE_M2_TAP;
    test.skip(
      !tapFile,
      "ci-gate-m2 only: set PLINTH_GATE_M2_TAP to the TAP output of gates/m2.sql",
    );

    type Rendered = {
      wa: { channel: string; refused: boolean; body: unknown; session: unknown };
      export: {
        files: string[];
        request_id: string;
        json: { schema: string; request_id: string; consent_history: { items: { ref: string }[] } };
        pdf_text: string[];
      };
    };

    // Runs with Deno, as the functions do: outbox-dispatch's request builder over the
    // claimed row, and export-data's ZIP builder over the payload.
    const RENDER = `
const FN = Deno.args[0];
const tap = await Deno.readTextFile(Deno.args[1]);
const diag = (key) => {
  const line = tap.split("\\n").find((l) => l.startsWith("# m2:" + key + " "));
  if (!line) throw new Error("no m2:" + key + " diag line in the TAP output");
  return JSON.parse(line.slice(("# m2:" + key + " ").length));
};
const dispatch = await import(FN + "/outbox-dispatch/logic.ts");
const render = await import(FN + "/export-data/render.ts");
const zip = await import(FN + "/export-data/zip.ts");
const pdf = await import(FN + "/export-data/pdf.ts");
const wa = diag("wa_claim");
const channel = dispatch.chooseWhatsAppChannel(wa.contact.last_inbound_at, new Date(wa.now));
const body = dispatch.buildWhatsAppRequest(wa.contact.wa_id_e164, channel, wa.row.template, wa.row.payload);
const session = dispatch.buildWhatsAppRequest(wa.contact.wa_id_e164, "whatsapp_session", wa.row.template, wa.row.payload);
const payload = diag("export_payload");
const built = await render.buildExportZip(render.parseExportPayload(payload, payload.request_id));
const files = zip.readZip(built.bytes);
console.log(JSON.stringify({
  wa: { channel, refused: dispatch.isTestBlockNumber(wa.contact.wa_id_e164), body, session },
  export: {
    files: [...files.keys()].sort(),
    request_id: payload.request_id,
    json: JSON.parse(new TextDecoder().decode(files.get("plinth-my-data.json"))),
    pdf_text: pdf.pdfText(files.get("plinth-my-data.pdf")),
  },
}));
`;

    // One Deno run for the four checks below: same worker, in order.
    test.describe.configure({ mode: "default" });
    let rendered: Rendered;
    test.beforeAll(({}, testInfo) => {
      testInfo.setTimeout(240_000);
      const dir = mkdtempSync(join(tmpdir(), "t59-m2-"));
      const script = join(dir, "render.js");
      writeFileSync(script, RENDER);
      const out = execFileSync(
        "npx",
        [
          "--yes",
          "deno@2",
          "run",
          "--config",
          "deno.json",
          "--allow-read",
          script,
          pathToFileURL(FUNCTIONS).href,
          tapFile!,
        ],
        { cwd: FUNCTIONS, encoding: "utf8", timeout: 220_000, maxBuffer: 16 * 1024 * 1024 },
      );
      rendered = JSON.parse(out) as Rendered;
    });

    test("mock WhatsApp body for the 25 Oct band change (outbox-dispatch over the claimed row)", () => {
      const to = testPhone("rohan");
      // Rohan has never written in, so the 24-hour window is shut: an approved template.
      expect(rendered.wa.channel).toBe("whatsapp_template");
      expect(rendered.wa.body).toEqual({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: "band_change_alert",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: "Aurelia Heights, Phase 2" },
                { type: "text", text: "Elevated" },
                { type: "text", text: "High" },
                { type: "text", text: "new HARERA records" },
                { type: "text", text: "25 Oct 2026" },
              ],
            },
          ],
        },
      });
      // Every fixture number is in the +91 99000 003NN block, which the dispatcher refuses in
      // every mode: this body is what it builds, never a send.
      expect(rendered.wa.refused).toBe(true);
    });

    test("the template body carries its image header and quick-reply payloads", () => {
      test.fixme(
        true,
        "Gate gap: buildWhatsAppRequest sends body parameters only; band_change_alert's approved " +
          "template has an image header and two quick replies (_shared/wa/templates/" +
          "band_change_alert.ts renders them, but the dispatcher never uses it, and the row has no image URL).",
      );
      const components = (rendered.wa.body as { template: { components: { type: string }[] } })
        .template.components;
      expect(components.map((c) => c.type)).toEqual(["header", "body", "button", "button"]);
    });

    test("inside the 24-hour window, the session alert names the change and routes its buttons", () => {
      test.fixme(
        true,
        "Gate gap: for band_changed, ops.alert_event_line has no case, so session_text is " +
          '"Something changed"; and the dispatcher\'s session buttons carry ids "0"/"1", which ' +
          "wa-webhook/router.ts never matches (it expects open_full_card / stop_alerts).",
      );
      const session = rendered.wa.session as {
        interactive: { body: { text: string }; action: { buttons: { reply: { id: string } }[] } };
      };
      expect(session.interactive.body.text).toContain("Aurelia Heights, Phase 2");
      expect(session.interactive.body.text).toContain("High");
      expect(session.interactive.action.buttons.map((b) => b.reply.id)).toEqual([
        "open_full_card",
        "stop_alerts",
      ]);
    });

    test("Download my data: the live payload builds a ZIP with the PDF and the JSON", () => {
      const ex = rendered.export;
      expect(ex.files).toEqual(["plinth-my-data.json", "plinth-my-data.pdf"]);
      expect(ex.json.schema).toBe("plinth.data_export/1");
      expect(ex.json.request_id).toBe(ex.request_id);
      const refs = ex.json.consent_history.items.map((i) => i.ref);
      expect(refs).toHaveLength(5);
      for (const ref of refs) expect(ref).toMatch(/^C-\d{4}-\d{2}$/);
      const text = ex.pdf_text.join("\n");
      for (const ref of refs) expect(text).toContain(ref);
    });
  });
});
