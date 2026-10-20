// Layout copy for WebProjectStates (T20c; WORK_BREAKDOWN §4 T20c;
// WebProjectStates.dc.html, extracted via scripts/artboard_text.py; also
// fixpass-buyer.md §4 and fix-project2.md §2(b)(c)). Headings and labels here
// are the artboard's own chrome; every number, date and band word still comes
// from RiskSummary/ProjectPage. The handful of per-project checklist and
// "what to watch" bullets below are facts from DESIGN.md §5b that have no
// field of their own in the contract yet (AGENTS.md §1 "Facts": DESIGN.md
// §5b and fixtures, not only fixtures).
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

export type ChecklistItem = { heading?: string; body: string; chip: string };

/** Juniper Enclave (Limited history): directors, DTCP licence, escrow, progress (fixpass-buyer.md §4). */
export const LIMITED_HISTORY_CHECKLIST: readonly ChecklistItem[] = [
  { body: "Halcyon Homes' directors, and their other companies, in MCA filings.", chip: "MCA company records" },
  { body: "The DTCP licence for the Sector 102 site, and that it is in force.", chip: "DTCP licence register" },
  {
    heading: "The escrow account",
    body: "A CA certificate with each QPR on money taken out of the project account.",
    chip: "HARERA Form 3 · with each QPR",
  },
  {
    heading: "Progress against time",
    body: "", // filled from risk.progress.line in the component
    chip: "HARERA QPR · latest",
  },
];

/** Heron Point, Phase 2 (Not scored): the group's record, registration, first QPRs (fixpass-buyer.md §4). */
export const NOT_SCORED_CHECKLIST: readonly ChecklistItem[] = [
  {
    body:
      "The Northfield Estates group's record: 2 of 6 finished RERA projects got OC more than 12 months late. Its ongoing phases: Aurelia Heights, Phase 2 (Elevated) and Cedar Walk, Phase 2 (Moderate).",
    chip: "HARERA + DTCP OC records",
  },
  {
    body: "The approved plans, the DTCP licence and the promised date, all filed with HARERA.",
    chip: "HARERA registration · Apr 2026",
  },
  {
    body: "The first QPRs, due 15 days after each quarter ends. They show whether building starts on time.",
    chip: "HARERA QPR register",
  },
];

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
  /** For Laurel only (fixpass-buyer.md §4): insolvency admitted → homebuyers claim as financial creditors. */
  associationsInsolvencyAddendum:
    " The NCLT order of 12 Mar 2023 is against a group company. If a case is ever admitted against this project's promoter, homebuyers file claims with the resolution professional as financial creditors.",
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

/** `{{wi}}` "What to watch" bullets per state (WebProjectStates.dc.html). */
export const BOOKED_WATCH: Readonly<Partial<Record<Slug, readonly string[]>>> = {
  "laurel-residency": [
    "Each QPR: does the built share move from 34%?",
    "Any demand letter: it should match work on record. Check it with Pay-as-built first.",
    "NCLT and IBBI lists for Elmstone Developers and its group.",
    "New HARERA orders on this project.",
  ],
  "juniper-enclave": [
    "The CA certificate on escrow withdrawals with each QPR.",
    "Demand letters against stages on record, with Pay-as-built.",
    "Halcyon Homes' first finished project, when it comes.",
  ],
  "heron-point-phase-2": [
    "Its first QPR, once filed.",
    "The group's ongoing phases: Aurelia Heights, Phase 2 (Elevated) and Cedar Walk, Phase 2 (Moderate).",
    "New HARERA orders on this project or Heronstone Projects.",
  ],
  "coral-towers": [
    "The Apr–Jun 2026 and Jul–Sep 2026 QPRs, both overdue.",
    "Whether a third extension follows Extension 2 (to Aug 2029).",
    "Demand letters against stages on record, with Pay-as-built.",
  ],
  "sapphire-grove-phase-1": [
    "The re-score, due by 19 Oct 2026, 7:40 pm.",
    "Whether the new filing moves the band — followers hear first, with what changed and why.",
    "Demand letters against stages on record, with Pay-as-built.",
  ],
  "aurelia-heights-phase-2": [
    "The Jul–Sep 2026 QPR: due 15 Oct 2026, not on HARERA yet.",
    "Demand letters against stages on record. Tower A slab 12 was demanded on 10 Oct 2026; the latest QPR shows slab 9.",
    "This page: we note the day the review ends.",
  ],
};
