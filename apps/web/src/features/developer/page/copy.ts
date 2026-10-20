// Layout copy for WebDeveloper (T23; WORK_BREAKDOWN §4 T23; AGENTS.md "layout
// copy comes from the artboard"). Every string here is chrome the artboard
// itself writes (labels, button names, headings): it is never a risk number,
// a band name, a count or a rate, which always come from the DeveloperPage
// payload instead. See docs/engineering/briefs/T23.md's artboard copy
// (extracted from product/design/artboards/WebDeveloper.dc.html) for wording;
// a handful of headings the dump didn't carry follow the same house style
// ("Headings are buyer questions", AGENTS.md §5).

export const BREADCRUMB = { region: "Gurugram", section: "Developers" };

export const HERO_COPY = {
  imageCaption: "Illustrative image",
  ask: (name: string) => `Ask Plinth about ${name}`,
  share: "Share the live page",
  shareCopied: "Link copied",
  howFactsOnlyWorks: "How facts-only works",
};

export const CLAIM_COPY = {
  heading: (name: string) => `Who answers for ${name} here?`,
  explainerFallback:
    "Claiming lets a developer correct facts, reply next to the records and hear from buyers who ask. It never changes a band.",
  cta: (name: string) => `Are you ${name}? Claim this page, free`,
};

export const FACTS_ONLY_COPY = {
  anchor: "facts-only",
  heading: "Why is there no band on this page?",
};

export const TRACK_RECORD_COPY = {
  heading: (name: string) => `Does ${name} deliver on time?`,
  promisedLabel: "Original RERA date",
  ocLabel: "OC",
};

export const ONGOING_COPY = {
  heading: (name: string) => `What is ${name} building now?`,
  openProject: "Open project",
};

export const COMPLAINTS_COPY = {
  heading: "What has HARERA decided on complaints?",
  chartCaption: "HARERA complaints decided, by half-year",
  modeCount: "Count",
  modePer100: "Per 100 units",
};

export const PRE_RERA_COPY = {
  toggle: "Before RERA · from court orders and news",
};

export const REPLY_COPY = {
  heading: (name: string) => `What does ${name} say?`,
  recordsShow: "Records show",
  noReply: (name: string) =>
    `No reply published yet. Any reply from ${name} will appear here unedited, next to the records it answers.`,
};

export const FIND_COPY = {
  heading: (name: string) => `How do buyers find ${name}'s projects?`,
};

export const DISCLAIMER_LINKS = [
  { label: "Report an error", href: "#track-record" },
  { label: "How we make money", href: "/about#money" },
];
