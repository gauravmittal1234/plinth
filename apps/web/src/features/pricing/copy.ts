// Layout copy for WebPricing (T26; WORK_BREAKDOWN T26; product/design/artboards/WebPricing.dc.html,
// extracted by scripts/artboard_text.py). Every string here is chrome the
// artboard itself writes (feature descriptions, policy lines, button names):
// it is never a price, a band name or a risk number, which always come from
// the About/RiskSummary payload instead (@/src/data via data.ts).
export const HERO_COPY = {
  heading: "What's free, and what's Pro?",
  lead: "Everything that tells you whether to trust a project is free, for everyone, for good.",
  proLead:
    "Pro is a deeper report on one project, for when you're close to booking. It never hides a band, a reason or a source.",
  tryTheSample: "Try the sample page",
};

export const FREE_GROUPS = [
  {
    title: "On every project",
    items: [
      "Its delivery risk band, with every reason and every source",
      "What would move the band, and the developer's reply",
      "Its filings, orders and extensions, each one dated",
    ],
  },
  {
    title: "Every tool",
    items: [
      "Alerts when a band, filing or order changes",
      "Compare up to 4 projects side by side",
      "The all-in cost check for any cost sheet",
      "Claims vs records, Pay-as-built guard and Before you pay",
      "Ask Plinth, with sources and a person on call",
    ],
  },
  {
    title: "Every protection",
    items: [
      "Site visits booked with a masked number",
      "Who has my number, with one-tap revoke",
      "Download or delete your data at any time",
    ],
  },
] as const;

export const PRO_ITEMS = [
  {
    title: "A deep report",
    text: "Every filing, order and certificate we hold on the project, in one PDF. Each page names its source, the date we read it, and a fingerprint that shows it wasn't altered.",
  },
  {
    title: "A comparison report",
    text: "This project against up to 3 others, factor by factor, ready to send to your family or your bank. The live compare stays free.",
  },
  {
    title: "12 months of written updates",
    text: "A short note each month on what changed in the filings, and a check of each demand letter you forward. Band, filing and order alerts stay free for everyone.",
  },
] as const;

export const NEVERS = [
  "A blurred band, reason or source",
  "A countdown, or an offer that “ends tonight”",
  "A box ticked for you",
  "Auto-renewal, or a hard way to cancel",
  "A struck-out “original” price",
  "A charge added at the last step",
] as const;

export const PROMISES = [
  { k: "The price is the price", v: "No fee is added at checkout." },
  { k: "Nothing renews", v: "One payment covers one project for 12 months. Then it simply ends." },
  { k: "Nothing is ticked for you", v: "Every box starts empty, including WhatsApp updates." },
  { k: "No clocks", v: "No countdowns, no “only today”, no stock warnings." },
] as const;

export const SAMPLE_COPY = {
  heading: "What does the paywall hide?",
  lead: "Nothing you need to judge a project. Switch this sample page to Pro and watch what changes.",
  sampleTag: "Sample · nothing is charged here",
  sameTag: "Same in Free and Pro",
  freeTab: "Free view",
  proTab: "Pro view",
  diffLeadFree: "This is what everyone sees, free.",
  diffTextFree: "Switch to Pro: only the panel on the right will change.",
  diffLeadPro: "One block changed: the report.",
  diffTextPro: "The band, reasons and sources on the left did not move.",
  proForThisProject: "Pro for this project",
  whatsAppLabel: "Also send my monthly update on WhatsApp",
  buyLabel: "Buy Pro for this project, ₹999",
  refundLine: "Full refund within 7 days, for any reason. Nothing renews.",
  notNowLabel: "Not now, keep reading free",
  yourProReport: "Your Pro report (sample)",
  backToFree: "Back to the free view",
  // From the artboard's buy()/notNow() handlers (WebPricing.dc.html raw source).
  buyToast: "Sample only: nothing was charged. This is the page a Pro buyer sees.",
  notNowToast: "Nothing changes. The band, reasons and sources stay open to you.",
  paywallOnToast: "Checkout isn't set up yet. No payment partner is connected.",
};

export const NEVER_SECTION_COPY = {
  heading: "Never on a Plinth paywall",
};

export const REFUND_COPY = {
  heading: "What if Pro wasn't worth it?",
  lead: "Full refund within 7 days of buying, for any reason.",
  how: "Tap Refund in Your account, or reply “refund” to your receipt on WhatsApp. The money goes back to how you paid, within 5 working days.",
  payments: "Payments handled by [PAYMENT PARTNER] · we never see your card.",
};
