// Layout copy for WebProject (T20a; WORK_BREAKDOWN §4 T20a; INTEGRATION_NOTES
// "layout copy comes from the artboard"). Every string here is chrome the
// artboard itself writes (labels, button names, lane captions): it is never a
// risk number, a band name or a reason, which always come from the
// RiskSummary/ProjectPage payload instead. See
// `product/design/artboards/WebProject.dc.html` (extracted by
// scripts/artboard_text.py) for the source wording.
import type { Lane } from "@plinth/contracts";

/** The ten "On this page" anchors, in guided-story order (fix-project2.md §1 G-18). */
export const PAGE_ANCHORS = [
  { id: "risk", label: "Delivery risk" },
  { id: "next", label: "What to do" },
  { id: "book", label: "Before booking" },
  { id: "built", label: "Built" },
  { id: "homes", label: "Homes" },
  { id: "cost", label: "Cost" },
  { id: "wait", label: "Afford the wait" },
  { id: "picture", label: "Picture yourself here" },
  { id: "records", label: "Records" },
  { id: "ask", label: "Ask" },
] as const;

export const ON_THIS_PAGE_LABEL = "On this page";

export const HERO_COPY = {
  imageCaption: "Images on this page are illustrative",
  srDeliveryRisk: "Delivery risk: ",
  follow: "Follow",
  ask: "Ask Plinth",
  share: "Share the live page",
  shareCopied: "Link copied",
  alertsLine: "Alerts on: band changes, QPR filings, extensions and orders.",
  simpleView: "Simple view",
};

export const RISK_COPY = {
  heading: "Will it be delivered on time?",
  ocNotKeysMoreLabel: "What a delay would cost you",
  dialToggle: { dial: "Dial", table: "100 projects" },
  calibrationHeading: "Calibration rows behind this band",
  calibrationLink: "Calibration rows behind this band",
  whyHeading: "Why",
  whyNote: "Up to 4 reasons, ranked by how much each one adds.",
  whatWouldChangeHeading: "What would change this",
  scaleLabel: "Delivery risk scale",
  preReraHeading: "Before RERA · from court orders and news",
  trackRecordLink: "How this is calculated",
  reportError: "Report an error",
};

export const NEXT_COPY = {
  heading: "So what do we do now?",
  nearbyHeading: "For scale",
};

export const BUILT_COPY = {
  heading: "How much is built?",
  towerLabel: "Tower",
  towerAll: "All",
  replayPrefix: "Quarter on record: ",
  earlier: "Earlier report",
  later: "Later report",
  today: "Today",
  builtTile: "Built",
  soldTile: "Sold",
  timeUsedTile: "Time used",
};

export const RECORDS_COPY = {
  heading: "What do the records show?",
  atAGlance: "At a glance",
  listHeading: "Every record on file",
  preReraToggle: "Before RERA · from court orders and news",
};

/** EvidenceDrawerLabels (`@plinth/web-ui`), words the artboard uses for the drawer's fields. */
export const EVIDENCE_LABELS = {
  close: "Close evidence",
  lanes: {
    records_show: "Records show",
    developer_says: "Developer says · not yet verified",
    from_developer: "From the developer · not verified by Plinth",
    our_estimate: "Our estimate",
    reported_unverified: "Reported · not verified",
    buyer_upload: "Upload",
  } satisfies Record<Lane, string>,
  document: "Document",
  page: "Page",
  snapshot: "Snapshot hash",
  read: "How we read it:",
  usedIn: "Used in:",
  newTab: "(opens in a new tab)",
};

export const DISCLAIMER_LINKS = [
  { label: "Report an error", href: "#records" },
  { label: "How we make money", href: "/about#money" },
];
