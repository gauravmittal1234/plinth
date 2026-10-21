// _shared/wa/templates: every M2 renderer against packages/contracts/catalogues/wa_templates.json
// (the one source of truth; comms.templates mirrors the same rows) and a fixed snapshot of its
// Graph API message. No network: the catalogue is read from disk once, as _shared/otp/otp.test.ts
// already does for login_code.
import { assertEquals } from "../../testing/mod.ts";
import { WA_LIMITS } from "../graph.ts";
import { renderBandChangeAlert } from "./band_change_alert.ts";
import { renderDailyDigest } from "./daily_digest.ts";
import { renderExportReady } from "./export_ready.ts";
import { renderFamilyRemoved } from "./family_removed.ts";
import { renderFilingAlert } from "./filing_alert.ts";
import { renderLoginCode } from "./login_code.ts";
import { TEMPLATE_MIRRORS, TEMPLATE_REPLY_IDS } from "./mod.ts";
import { renderWeeklyDigest } from "./weekly_digest.ts";

interface CatalogueButton {
  type: "quick_reply" | "copy_code" | "cta_url";
  text: string | null;
}
interface CatalogueRow {
  code: string;
  meta_name: string;
  category: string;
  language: string;
  variables: string[];
  buttons: CatalogueButton[];
}
const CATALOGUE = JSON.parse(
  await Deno.readTextFile(
    new URL(
      "../../../../../packages/contracts/catalogues/wa_templates.json",
      import.meta.url,
    ),
  ),
) as { templates: CatalogueRow[] };

function catalogueRow(code: string): CatalogueRow {
  const row = CATALOGUE.templates.find((t) => t.code === code);
  if (!row) throw new Error(`no catalogue row for ${code}`);
  return row;
}

Deno.test("every M2 template mirror matches packages/contracts/catalogues/wa_templates.json", () => {
  for (const [code, mirror] of Object.entries(TEMPLATE_MIRRORS)) {
    const row = catalogueRow(code);
    assertEquals(mirror.metaName, row.meta_name, code);
    assertEquals(mirror.category, row.category, code);
    assertEquals(mirror.language, row.language, code);
    assertEquals(mirror.variables, row.variables, code);
    assertEquals(mirror.buttons, row.buttons, code);
  }
});

Deno.test("TEMPLATE_REPLY_IDS: one router reply id per quick-reply button, for every template", () => {
  for (const [code, mirror] of Object.entries(TEMPLATE_MIRRORS)) {
    const quickReplies = mirror.buttons.filter((b) => b.type === "quick_reply").length;
    assertEquals(TEMPLATE_REPLY_IDS[code]?.length ?? 0, quickReplies, code);
  }
  assertEquals(TEMPLATE_REPLY_IDS.band_change_alert, ["open_full_card", "stop_alerts"]);
});

Deno.test("every UTILITY template's buttons are ≤ 20 chars; AUTHENTICATION's copy-code too", () => {
  for (const mirror of Object.values(TEMPLATE_MIRRORS)) {
    for (const b of mirror.buttons) {
      if (b.text === null) continue; // a CTA URL button's text is set only in Meta's approval UI
      const max = b.type === "cta_url" ? WA_LIMITS.ctaLabel : WA_LIMITS.buttonTitle;
      if (b.text.length > max) throw new Error(`${mirror.code}: "${b.text}" is over ${max} chars`);
    }
    assertEquals(
      mirror.category === "UTILITY" || mirror.category === "AUTHENTICATION",
      true,
      mirror.code,
    );
  }
});

Deno.test("renderLoginCode: body and copy-code button carry the code, nothing else", () => {
  assertEquals(renderLoginCode({ code: "482193" }), {
    type: "template",
    template: {
      name: "login_code",
      language: { code: "en" },
      components: [
        { type: "body", parameters: [{ type: "text", text: "482193" }] },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: "482193" }],
        },
      ],
    },
  });
});

Deno.test("renderBandChangeAlert: image header, 5 body variables in order, 2 quick replies", () => {
  assertEquals(
    renderBandChangeAlert({
      headerImageUrl: "https://plinth.test/cards/risk/aurelia-heights-phase-2.png",
      project: "Aurelia Heights, Phase 2",
      fromBand: "Moderate",
      toBand: "Elevated",
      trigger: "new QPR and complaint orders",
      date: "2 Oct 2026",
    }),
    {
      type: "template",
      template: {
        name: "band_change_alert",
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [{
              type: "image",
              image: { link: "https://plinth.test/cards/risk/aurelia-heights-phase-2.png" },
            }],
          },
          {
            type: "body",
            parameters: [
              { type: "text", text: "Aurelia Heights, Phase 2" },
              { type: "text", text: "Moderate" },
              { type: "text", text: "Elevated" },
              { type: "text", text: "new QPR and complaint orders" },
              { type: "text", text: "2 Oct 2026" },
            ],
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: "0",
            parameters: [{ type: "payload", payload: "open_full_card" }],
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: "1",
            parameters: [{ type: "payload", payload: "stop_alerts" }],
          },
        ],
      },
    },
  );
});

Deno.test("renderFilingAlert: no header, 3 body variables, 2 quick replies", () => {
  const msg = renderFilingAlert({
    project: "Kestrel Park",
    eventLine: "Jul-Sep 2026 QPR filed on time",
    date: "12 Oct 2026",
  });
  assertEquals(msg.type, "template");
  if (msg.type !== "template") throw new Error("unreachable");
  assertEquals(msg.template.components[0], {
    type: "body",
    parameters: [
      { type: "text", text: "Kestrel Park" },
      { type: "text", text: "Jul-Sep 2026 QPR filed on time" },
      { type: "text", text: "12 Oct 2026" },
    ],
  });
  assertEquals(msg.template.components.length, 3);
});

Deno.test("renderWeeklyDigest / renderDailyDigest: See changes + Stop weekly|daily, payloads router.ts expects", () => {
  const weekly = renderWeeklyDigest({
    headerImageUrl: "https://plinth.test/cards/digest/rohan.png",
    weekRange: "12-18 Oct 2026",
    changeCount: "5",
    bandMovingFact: "Aurelia Heights Ph 2's Jul-Sep QPR is not on HARERA yet",
  });
  const daily = renderDailyDigest({ date: "18 Oct 2026", changeCount: "2" });
  if (weekly.type !== "template" || daily.type !== "template") throw new Error("unreachable");
  assertEquals(
    weekly.template.components.filter((c) => c.type === "button"),
    [
      {
        type: "button",
        sub_type: "quick_reply",
        index: "0",
        parameters: [{ type: "payload", payload: "see_changes" }],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: "1",
        parameters: [{ type: "payload", payload: "stop_weekly" }],
      },
    ],
  );
  assertEquals(
    daily.template.components.filter((c) => c.type === "button"),
    [
      {
        type: "button",
        sub_type: "quick_reply",
        index: "0",
        parameters: [{ type: "payload", payload: "see_changes" }],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: "1",
        parameters: [{ type: "payload", payload: "stop_daily" }],
      },
    ],
  );
});

Deno.test("renderFamilyRemoved: no header, no buttons", () => {
  const msg = renderFamilyRemoved({
    inviterFirstName: "Rohan",
    project: "Aurelia Heights, Phase 2",
  });
  if (msg.type !== "template") throw new Error("unreachable");
  assertEquals(msg.template.components, [
    {
      type: "body",
      parameters: [
        { type: "text", text: "Rohan" },
        { type: "text", text: "Aurelia Heights, Phase 2" },
      ],
    },
  ]);
});

Deno.test("renderExportReady: one CTA-URL button with the dynamic suffix", () => {
  const msg = renderExportReady({ expiryDate: "25 Oct 2026", urlSuffix: "exp/9f21" });
  if (msg.type !== "template") throw new Error("unreachable");
  assertEquals(msg.template.components[1], {
    type: "button",
    sub_type: "url",
    index: "0",
    parameters: [{ type: "text", text: "exp/9f21" }],
  });
});
