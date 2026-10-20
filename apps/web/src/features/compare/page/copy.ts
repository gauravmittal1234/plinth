// Layout copy from the artboard (WebCompare.dc.html, via docs/engineering/briefs/T24.md).
// Facts (names, bands, cells, notes, the disclaimer) always come from the
// `compare()` payload; this file only holds the words around them.

export const COPY = {
  heading: (count: number) => `How do these ${count} compare?`,
  intro: (dataAsOf: string) =>
    `Your shortlist · facts side by side, each with its source and date · data as of ${dataAsOf}`,
  disclaimerPrefix: "Delivery risk is ",
  noPaidPlacement: "No paid placement.",
  illustrativeImage: "Illustrative image",
  bandRowLabel: "Delivery risk",
  factsOnlySeeWhy: "Facts only: see why",
  remove: "Remove",
  addSlotHeading: "One more?",
  addSlotHint: "Compare up to 4. Search by name or RERA number.",
  addProject: "Add a project",
  cancel: "Cancel",
  searchLabel: "Search by name or RERA number",
  searchPlaceholder: "Search by name or RERA number",
  noMatch: "No match in our records yet. Try the RERA number.",
  blankCell: "Not in our records yet",
  notAvailableHeading: "This comparison isn't ready yet",
} as const;
