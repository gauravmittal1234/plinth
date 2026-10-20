// Layout copy for WebProjectStates (T20c; WORK_BREAKDOWN §4 T20c;
// WebProjectStates.dc.html, extracted via scripts/artboard_text.py; also
// fixpass-buyer.md §4 and fix-project2.md §2(b)(c)). Headings and labels here
// are the artboard's own chrome; every number, date, name and band word is
// read from RiskSummary/ProjectPage at render time (project-states-section.tsx,
// watch.ts) — never hard-coded here by project slug (AGENTS.md §5: "risk copy
// ... comes from the server or the fixture JSON, never composed in a
// client"; AGENTS.md §1: "Never invent a fact in code").
import type { Slug } from "@plinth/contracts";

export const STALL_COPY = {
  heading: "Is it still being built?",
  pill: "Stall flag",
  barHeading: "Built, by quarterly report",
  overdueLabel: "of the promised time used",
  changeHeading: "What would lift the flag",
  changeLine: "A QPR that shows construction moving again. We read each one the day it appears.",
};

export const CHECKLIST_COPY = {
  heading: "What to check instead",
};

/** Shaped like `NextStep` (`@plinth/contracts`): Limited history and Not
 * scored read their checklist straight off `ProjectPage.next_steps.steps` —
 * the same records-to-read list "So what do we do now?" shows further down
 * the page, just with a source chip per line (project-states-section.tsx).
 * No per-project body text lives here. */
export type ChecklistItem = { heading?: string; body: string; chip?: string | null };

export const AGE_BARS_COPY = {
  heading: "How old is each record?",
  note: "The line marks 120 days. Past it, a record is stale and we say so on the band. The bar runs to 200 days.",
  staleLabel: "Stale",
  freshLabel: "Fresh",
  staleLineDays: 120,
  scaleMaxDays: 200,
  clearLabel: "What would clear the flag",
  clearLine: "A new QPR.",
};

export const RESCORING_COPY = {
  heading: "Reading the new filing",
  note: "We show no figures from the new filing until two extractors agree and a person has checked them.",
  steps: [
    { label: "Filed" },
    { label: "Fetched" },
    { label: "Read by two extractors" },
    { label: "Checked by a person" },
    { label: "Band updated or confirmed" },
  ],
  /** The step (0-based) the page is always at while `pending` carries a rescore_due fact. */
  currentStep: 2,
};

export const WITHHELD_COPY = {
  recordsHeading: "The records, as they stand",
  explainerLinkLabel: "How facts-only works",
  stillHereLine:
    "Still here: dates, progress reports, complaints, orders and company links, each with its source.",
  withheldLine: "Withheld: the band, its reasons and the “of 100 similar projects” figure.",
  notAFindingLine: (developerName: string) =>
    `Not a finding: this says nothing about ${developerName}, and no record has changed.`,
};

export const BOOKED_PANEL_COPY = {
  heading: "If you've already booked here",
  toggleLabel: "I've booked here",
  beforePayPrompt: "Haven't paid yet? Run the before-you-pay check",
  beforePayHref: "/check/before-you-pay",
  bookedNote:
    "As a booked buyer, your alerts also cover demand letters against stages on record and the next QPR, on top of the rights below.",
  footerNote: "Hard news gets the same care as good news.",
  complain: {
    heading: "Where to complain",
    body:
      "HARERA Gurugram hears buyers' complaints. File online in Form CRA with your agreement, receipts and demand letters. Claims for compensation go to its adjudicating officer, in Form CAO.",
    chip: "HARERA Gurugram · complaints",
  },
  refund: {
    heading: "Your money back, or interest",
    body:
      "RERA s.18: when possession is late against your agreement, you can withdraw and get your money back with interest, or stay and get interest for every month of delay. In Haryana the rate is SBI's highest MCLR plus 2%.",
    chip: "RERA Act 2016 · s.18",
  },
  /** Not-scored projects add the s.13 10% rule before the agreement (fixpass-buyer.md §4). */
  refundNotScoredAddendum:
    " Before the agreement for sale, RERA s.13 caps what a developer can collect at 10% of the cost.",
  associations: {
    heading: "Buyers acting together",
    body: "RERA s.31 lets an association of allottees file a complaint.",
    chip: "RERA Act 2016 · s.31",
  },
  /** Red-flag rule RF1_GROUP_CIRP only (fixpass-buyer.md §4): insolvency admitted → homebuyers
   * claim as financial creditors. `dateLine` is the NCLT order's own date (`risk.reasons`,
   * factor "legal"), formatted by the caller — never a fixed date here, so this reads correctly
   * for any project the rule fires on, not only Laurel. */
  associationsInsolvencyAddendum: (dateLine: string) =>
    ` The NCLT order of ${dateLine} is against a group company. If a case is ever admitted against this project's promoter, homebuyers file claims with the resolution professional as financial creditors.`,
};

/** `bk.intro` per state (WebProjectStates.dc.html), by phase slug. */
export const BOOKED_INTRO: Readonly<Record<Slug, string>> = {
  "laurel-residency":
    "Booking here doesn't leave you without routes. These are the rights every allottee has, and the records we would keep watching.",
  "juniper-enclave":
    "Nothing here is a reason for concern by itself. These are the rights every allottee has, and what to watch while the record is short.",
  "heron-point-phase-2":
    "A project with no band yet isn't a reason for concern by itself. These are the rights every allottee has, and what to watch before the first QPRs arrive.",
  "coral-towers":
    "Old data is a reason to ask, not to panic. These are the rights every allottee has, and what to watch until the reports catch up.",
  "sapphire-grove-phase-1":
    "A filing under review doesn't change your rights. These are the rights every allottee has, and what to watch until the re-score is done.",
  "aurelia-heights-phase-2":
    "Facts-only mode changes nothing about your rights. These are the rights every allottee has, and the records we keep watching.",
};

export const BOOKED_INTRO_DEFAULT =
  "These are the rights every allottee has, and the records we keep watching.";
