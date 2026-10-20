// Layout copy for WebPricing (T26; WORK_BREAKDOWN T26). Free at launch (founder,
// 20 Oct 2026): rewritten as a short "Plinth is free" page with no sample, no
// buy flow and no refund policy. Every string here is chrome; a price, a band
// name or a risk number always comes from the About payload instead
// (@/src/data via data.ts).
export const HERO_COPY = {
  heading: "What does Plinth cost?",
  lead: "Nothing. Plinth is free while we launch.",
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

export const NEVERS = [
  "A blurred band, reason or source",
  "A countdown, or an offer that “ends tonight”",
  "A box ticked for you",
  "Auto-renewal, or a hard way to cancel",
  "A struck-out “original” price",
  "A charge added at the last step",
] as const;

export const PROMISES = [
  { k: "Nothing is ticked for you", v: "Every box starts empty, including WhatsApp updates." },
  { k: "No clocks", v: "No countdowns, no “only today”, no stock warnings." },
] as const;

export const NEVER_SECTION_COPY = {
  heading: "Never on a Plinth paywall",
};

export const WHO_PAYS_COPY = {
  heading: "Who pays us?",
  extra: "No lender or agent pays us at launch either.",
};

export const CLOSING_LINE =
  "If we ever charge for something, this page will list it before it starts. The band, its reasons and sources, and alerts stay free.";
