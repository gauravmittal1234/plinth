// Copy for the two client components in this folder (stall-instrument,
// withheld-notice), split from copy.ts to keep the project page's JS small.

export const STALL_COPY = {
  heading: "Is it still being built?",
  pill: "Stall flag",
  barHeading: "Built, by quarterly report",
  overdueLabel: "of the promised time used",
  changeHeading: "What would lift the flag",
  changeLine: "A QPR that shows construction moving again. We read each one the day it appears.",
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
