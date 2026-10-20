// Static layout copy (AGENTS.md §5: "layout copy comes from the artboard").
// Every number, band name, price or "why" line a reader sees instead comes
// straight from the SearchResults payload (@/src/data), never from here.
// Source: product/design/artboards/WebSearch.dc.html and DESIGN.md §5b
// ("Discovery, cost and Ask Plinth", added 18 Oct 2026, fix-tools2).
import type { BandCode } from "@plinth/contracts";

export const SEARCH_COPY = {
  describeHeading: "Describe the home you want",
  editWords: "Edit the words",
  updateResults: "Update results",
  cancel: "Cancel",
  moreFilters: "More filters",
  noPaidPlacement: "No paid placement.",
  howRankingWorks: "How ranking works",
  rankOrderLine: "No developer pays us. Ever. Rank order is never for sale.",
  askPrompt: "Ask Plinth: “Which Dwarka Expressway projects are on track?”",
  askDisclosure:
    "Ask Plinth is an AI. It answers from public records like HARERA and shows its sources.",
  adviserLabel: "Talk to a Plinth adviser · free · developers never pay us",
  factsOnlyNote:
    "Northfield projects show their records with the band withheld. They stay in risk-filtered results, listed with Not scored projects.",
  factsOnlySeeWhy: "Facts only: see why",
  factsOnlyExplainer:
    "We’re not showing a band for this project while a court considers an application about our bands for the Northfield Estates group.",
  hareraDownLine:
    "HARERA’s website hasn’t answered since 7:10 am today. These results use our last full read, 17 Oct 2026, 11:40 pm. We retry every 30 minutes.",
  // DESIGN §5b "Request a project": 14 days, or a written reason why not.
  requested: (ref: string) => `Requested · ${ref}. We’ll add it within 14 days or tell you why not.`,
  requestFixtureMode:
    "Fixture mode doesn’t record requests yet. In the live product, we add any Gurugram project with a RERA number within 14 days, or say why not in writing.",
  requestFailed: "We couldn’t send that request. Try again in a minute.",
  requestIt: "Request it",
  joinWaitlist: "Join the Noida waitlist",
  // Shown by NoidaWaitlist after a click. Handoff: needs an
  // api.waitlist_join (area, WhatsApp consent) RPC; until then nothing is
  // recorded, so this never claims the reader is "on the waitlist".
  waitlistNotSaved:
    "Waitlists aren’t open yet, so nothing was saved. We’ll publish the opening date on this page.",
  mapPlaceholder: "Map placeholder · not to scale",
  showAll: "Show all",
  sortLabel: "Sort",
  preferPerson:
    "Prefer a person? Talk to a Plinth adviser · free · developers never pay us.",
  previewGapHeading: "This search isn’t part of the fixture preview",
  previewGapBody:
    "Fixture mode only answers the demo searches below. Try one, or clear the box to see every Gurugram project.",
  clearSearch: "Clear the search",
} as const;

export const SORT_OPTIONS = [
  { value: "lowest_risk", label: "Lowest delivery risk" },
  { value: "lowest_price", label: "Lowest all-in price" },
  { value: "most_built", label: "Most built" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

/** The band vocabulary is fixed across the product (every fixture's `chip.label` agrees). */
export const BAND_LABEL: Readonly<Record<BandCode, string>> = {
  low: "Low",
  moderate: "Moderate",
  elevated: "Elevated",
  high: "High",
  severe: "Severe",
};

/** Example searches the fixture world answers (packages/fixtures/expected/search_projects). */
export const EXAMPLE_SEARCHES = [
  { q: "3 bhk dwarka expresway under 2.5 cr low risk", label: "3 BHK, Dwarka Expressway, under ₹2.5 Cr, low risk" },
  { q: "4 bhk dwarka expressway low risk", label: "4 BHK, Dwarka Expressway, low risk" },
  { q: "3 bhk noida", label: "3 BHK in Noida" },
  { q: "Indigo Terraces", label: "Indigo Terraces (a project we don’t have yet)" },
  { q: "", label: "Every Gurugram project" },
] as const;
