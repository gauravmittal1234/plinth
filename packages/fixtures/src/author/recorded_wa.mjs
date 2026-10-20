// Recorded WhatsApp Cloud API webhook bodies (owner: T03b), for T44's router and the T46a/T46b
// handler tests (API_CONTRACTS §5.1). Each file is exactly the JSON body Meta POSTs to
// /functions/v1/wa-webhook; tests sign the raw bytes with their own test app secret. The index
// (_index.json) says who sent each one, what it is, and where the router must send it.
// Senders use the fixture test numbers of canonical/people.json; business ids are fixture zeros.
import { uuid5 } from "./lib.mjs";

const NOW = "2026-10-18T12:00:00+05:30";
const WABA_ID = "100000000000000";
const BUSINESS = { display_phone_number: "910000000000", phone_number_id: "100000000000001" };
const epoch = (iso) => String(Math.floor(Date.parse(iso) / 1000));
const wamid = (key) => `wamid.fixture.${uuid5("wa_message", key)}`;
const mediaId = (key) =>
  String(BigInt(`0x${uuid5("wa_media", key).slice(0, 13).replace("-", "")}`));
const sha = (key) => uuid5("wa_media_sha", key).replace(/-/g, "");

function envelope(value) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: WABA_ID,
        changes: [
          {
            value: { messaging_product: "whatsapp", metadata: BUSINESS, ...value },
            field: "messages",
          },
        ],
      },
    ],
  };
}

export function buildRecordedWa(B) {
  const person = (key) => B.people.people.find((p) => p.key === key);
  const inbound = (key, who, at, message) => {
    const p = person(who);
    return envelope({
      contacts: [{ profile: { name: p.display_name }, wa_id: p.wa_id }],
      messages: [{ from: p.wa_id, id: wamid(key), timestamp: epoch(at), ...message }],
    });
  };
  const fromBusiness = (key) => ({ from: BUSINESS.display_phone_number, id: wamid(key) });
  const card = B.people.share_cards[0];
  const files = [];
  const add = (name, body, meta) => files.push({ name, body, meta });

  add(
    "text-aurelia",
    inbound("text-aurelia", "rohan", NOW, { type: "text", text: { body: "aurelia" } }),
    {
      from: "rohan",
      kind: "text",
      route: "risk_card",
      expect: { slug: "aurelia-heights-phase-2" },
      description: "A project name, lower case.",
      source: 'WORK_BREAKDOWN T03b, T44 ("aurelia" routes to risk_card); WaRisk artboard',
    },
  );
  add(
    "text-rera-number",
    inbound("text-rera-number", "rohan", NOW, {
      type: "text",
      text: { body: "GGM/673/405/2022/117" },
    }),
    {
      from: "rohan",
      kind: "text",
      route: "risk_card",
      expect: { slug: "aurelia-heights-phase-2" },
      description: "A RERA number (DESIGN §5b: Aurelia Heights Ph 2).",
      source: "WORK_BREAKDOWN T03b; API_CONTRACTS §5.1 intent router",
    },
  );
  add(
    "text-join-ah2-7kq",
    inbound("text-join-ah2-7kq", "meera-father", NOW, {
      type: "text",
      text: { body: "JOIN AH2-7KQ" },
    }),
    {
      from: "meera-father",
      kind: "text",
      route: "family_join",
      expect: { code: "AH2-7KQ", circle_owner: "rohan", scope: ["aurelia-heights-phase-2"] },
      description:
        "The relative's own opt-in: his first message to Plinth, from the /j/ page's wa.me link.",
      source:
        "DESIGN §5b · Following, digest and family (JOIN AH2-7KQ is the opt-in); WORK_BREAKDOWN T44, T46b",
    },
  );
  add("text-stop", inbound("text-stop", "rohan", NOW, { type: "text", text: { body: "STOP" } }), {
    from: "rohan",
    kind: "text",
    route: "prefs",
    expect: { action: "stop_all" },
    description: "STOP ends alerts.",
    source: 'WORK_BREAKDOWN T44 ("STOP" routes to prefs); API_CONTRACTS §5.1',
  });
  add(
    "button-stop-weekly",
    inbound("button-stop-weekly", "rohan", NOW, {
      context: fromBusiness("outbound/weekly_digest/2026-10-18"),
      type: "button",
      button: { payload: "stop_weekly", text: "Stop weekly" },
    }),
    {
      from: "rohan",
      kind: "button",
      route: "prefs",
      expect: { action: "stop_weekly", band_change_alerts: "still_on" },
      description: "The weekly digest template's quick reply. Band changes still come.",
      source:
        'API_CONTRACTS §5.2 (weekly_digest buttons); WORK_BREAKDOWN T46b ("Stop weekly" keeps band-change alerts on)',
    },
  );
  add(
    "button-see-changes",
    inbound("button-see-changes", "rohan", NOW, {
      context: fromBusiness("outbound/weekly_digest/2026-10-18"),
      type: "button",
      button: { payload: "see_changes", text: "See changes" },
    }),
    {
      from: "rohan",
      kind: "button",
      route: "digest",
      expect: { changes: 5 },
      description: "The weekly digest template's quick reply: lists the 5 changes.",
      source:
        'API_CONTRACTS §5.2 (weekly_digest buttons); WORK_BREAKDOWN T46b ("See changes" lists the 5 changes)',
    },
  );
  add(
    "interactive-why-this-band",
    inbound("interactive-why-this-band", "rohan", NOW, {
      context: fromBusiness("outbound/risk_card/aurelia-heights-phase-2"),
      type: "interactive",
      interactive: {
        type: "button_reply",
        button_reply: { id: "why_this_band", title: "Why this band" },
      },
    }),
    {
      from: "rohan",
      kind: "interactive.button_reply",
      route: "risk_card",
      expect: { slug: "aurelia-heights-phase-2", action: "why_this_band" },
      description: "Reply button under the Aurelia risk card.",
      source: 'WORK_BREAKDOWN T46a (replies "Why this band" · "Follow project" · "Ask")',
    },
  );
  add(
    "interactive-follow-project",
    inbound("interactive-follow-project", "rohan", NOW, {
      context: fromBusiness("outbound/risk_card/aurelia-heights-phase-2"),
      type: "interactive",
      interactive: {
        type: "button_reply",
        button_reply: { id: "follow_project", title: "Follow project" },
      },
    }),
    {
      from: "rohan",
      kind: "interactive.button_reply",
      route: "risk_card",
      expect: { slug: "aurelia-heights-phase-2", action: "follow_project" },
      description: "Reply button under the Aurelia risk card: opens the follow opt-in.",
      source: "WORK_BREAKDOWN T46a",
    },
  );
  add(
    "image-old-card",
    inbound("image-old-card", "rohan", NOW, {
      context: { forwarded: true },
      type: "image",
      image: { mime_type: "image/png", sha256: sha("old-card"), id: mediaId("old-card") },
    }),
    {
      from: "rohan",
      kind: "image",
      route: "card_changed",
      expect: { share_card: card.short_code, changed: true },
      description:
        "A forwarded old Plinth risk card (data as of 30 Sep 2026, v1.1, Moderate). Matched by perceptual hash to core.share_cards.",
      source:
        "DESIGN §5b · Following, digest and family (old card example); WaDigest artboard; WORK_BREAKDOWN T46a",
    },
  );
  add(
    "image-flyer",
    inbound("image-flyer", "rohan", NOW, {
      type: "image",
      image: { mime_type: "image/jpeg", sha256: sha("flyer"), id: mediaId("flyer") },
    }),
    {
      from: "rohan",
      kind: "image",
      route: "claims",
      expect: { doc_check: "flyer", milestone: "M3" },
      description: "A photo of the sample broker flyer: 7 claims, 4 differ.",
      source: "DESIGN §5b · Claims vs records example; API_CONTRACTS §5.1 (image → claims, M3)",
    },
  );
  add(
    "audio-voice-note",
    inbound("audio-voice-note", "rohan", "2026-10-24T14:04:00+05:30", {
      type: "audio",
      audio: {
        mime_type: "audio/ogg; codecs=opus",
        sha256: sha("voice-note"),
        id: mediaId("voice-note"),
        voice: true,
      },
    }),
    {
      from: "rohan",
      kind: "audio",
      route: "visit_recap",
      expect: { doc_check: "visit-recap", milestone: "M5" },
      description:
        "Rohan's WhatsApp voice note after the Aurelia visit (illustrative frame, Sat 24 Oct 2026, 2:04 pm).",
      source:
        "DESIGN §5b · Site-visit co-pilot (WhatsApp voice note 2:04 pm); API_CONTRACTS §5.1 (audio)",
    },
  );
  add(
    "document-demand-letter",
    inbound("document-demand-letter", "kavya-nair", NOW, {
      type: "document",
      document: {
        filename: "NE-AH2-A-1104-12.pdf",
        mime_type: "application/pdf",
        sha256: sha("demand-letter"),
        id: mediaId("demand-letter"),
      },
    }),
    {
      from: "kavya-nair",
      kind: "document",
      route: "pay_as_built",
      expect: { doc_check: "demand-letter", milestone: "M3" },
      description:
        "Kavya's demand letter NE/AH2/A-1104/12 (10 Oct 2026, Tower A slab 12) as a PDF.",
      source:
        "DESIGN §5b · Site-visit co-pilot and Pay-as-built (the demand letter); file name derived from its ref",
    },
  );
  files.push({
    name: "status-delivered",
    body: envelope({
      statuses: [
        {
          id: wamid("outbound/weekly_digest/2026-10-18"),
          status: "delivered",
          timestamp: epoch(NOW),
          recipient_id: person("rohan").wa_id,
          conversation: {
            id: uuid5("wa_conversation", "rohan/utility").replace(/-/g, ""),
            origin: { type: "utility" },
          },
          pricing: { billable: true, pricing_model: "PMP", category: "utility" },
        },
      ],
    }),
    meta: {
      from: null,
      kind: "status",
      route: "status",
      expect: { status: "delivered", outbox_status: "delivered" },
      description: "A delivery status for an outbound utility message to Rohan.",
      source: "API_CONTRACTS §5.1 (statuses update comms.outbox and comms.wa_messages)",
    },
  });

  const out = {};
  for (const f of files) out[`recorded/wa/${f.name}.json`] = f.body;
  out["recorded/wa/_index.json"] = {
    schema: "plinth.fixtures.recorded_wa/1",
    note: "Recorded WhatsApp Cloud API webhook bodies (API_CONTRACTS §5.1). Each file is the raw JSON body; sign it in tests with a test app secret. Senders are fixture test numbers (canonical/people.json). Owner: T03b. Generated; edit src/author/recorded_wa.mjs.",
    business: { waba_id: WABA_ID, ...BUSINESS },
    payloads: files.map((f) => ({
      file: `${f.name}.json`,
      wa_message_id:
        f.body.entry[0].changes[0].value.messages?.[0]?.id ??
        f.body.entry[0].changes[0].value.statuses[0].id,
      ...f.meta,
    })),
  };
  return out;
}
