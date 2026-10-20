// Layout copy for WebFollowing (T49; WORK_BREAKDOWN §4 T49, OWNERSHIP.md).
// Every string here is chrome the artboard itself writes (headings, button
// names, lane captions): it is never a risk number, a band name, a change
// line or a reason, which always come from the FollowingFeed/AlertPrefs/
// FamilyInvite payload instead. See
// `product/design/artboards/WebFollowing.dc.html` and
// `product/design/review/fix-since-family.md` §2 for the source wording.

export const HERO_COPY = {
  markSeen: "Mark these as seen",
  seen: "Seen",
  unread: (n: number) => `${n} unread`,
  openRecord: "Open the full record",
  replayHeading: "Replay from any date",
  replayCaption: "Each mark is one change on record. Drag back to see everything since that day.",
  replaySince: (date: string) => `Showing changes since ${date}`,
  earlier: "Earlier day",
  later: "Later day",
};

export const RECORD_COPY = {
  heading: (date: string) => `What happened before ${date}?`,
  empty: "No earlier changes on record. Drag the date back to see them.",
};

export const PROJECTS_COPY = {
  heading: "Are they keeping pace?",
};

export const BOOKED_COPY = {
  heading: "Have you booked any of these?",
  subheading:
    "Tell us, and we add the alerts a booked buyer needs: payments, demand letters and possession. Only you get them.",
  watchingTitle: "Just watching",
  watchingSub: "Alerts on band changes, filings, extensions and orders.",
  bookedTitle: "I've booked here",
  bookedSub: "Adds payment-stage alerts, demand-letter checks and possession alerts.",
  privateLine: "Payment and demand-letter alerts go only to you.",
  familyLine: "Your family circle doesn't see your follow type.",
  checkDemandLetter: "Check a demand letter",
  whatABookedBuyerCanDo: "What a booked buyer can do",
  whatABookedBuyerCanDoItems: [
    "Payment-stage alerts, slab by slab, as each quarterly report is filed.",
    "Demand letters checked against what's actually on HARERA record.",
    "Possession alerts: occupation certificate filings, offers of possession and delay-interest orders.",
  ],
};

export const FAMILY_COPY = {
  heading: "Who's deciding with you?",
  subheading:
    "Invite family by link. Each person taps it to get the same alerts on their own phone. Their number stays theirs.",
  inviteThisProject: "Invite to this project",
  inviteAllProjects: "Invite to all projects",
  shareOnWhatsApp: "Share invite on WhatsApp",
  copyLink: "Copy link",
  linkCopied: "Link copied",
  canSeeHeading: "They can see",
  canSee: [
    "The projects you invite them to",
    "The same alerts, on their own phone",
    "Your shared shortlist and notes",
  ],
  cannotChangeHeading: "They can't change",
  cannotChange: ["Your follows or follow type", "Your alert settings", "Who is in this circle"],
  privateLine: "Stays private to you: cost sheets, visit passes, payment alerts and who has your number.",
  shortlistHeading: "Your shared shortlist",
  shortlistSub: "Notes you add here are visible to everyone in your circle.",
  noteLabel: "Add a note to",
  addNote: "Add note",
};

export const SAVED_SEARCHES_COPY = {
  heading: "What are you watching for?",
  subheading: "Your saved searches. We tell you when a new project matches.",
  runSearch: "Search projects",
  gapLine: "Saving a search from here needs a change elsewhere; search and save it from Projects.",
};

export const DIGEST_COPY = {
  heading: "What lands every Sunday?",
  subheading:
    "This week in filings: one message at 9 am with what changed on HARERA for your projects. Band changes still reach you at once.",
  weekHeading: "This week in your projects",
  weekCount: (n: number) => (n === 1 ? "1 change" : `${n} changes`),
  utilityLine: "Weekly digest you chose · reply STOP to end all alerts",
};

export const ALERTS_COPY = {
  heading: "How should we tell you?",
  subheading:
    "Risk changes go out at once. Filings, orders and prices come together in a digest, as often as you choose.",
  cadenceLabel: "Digest of filings, orders and prices",
  cadences: {
    daily_8am: { name: "Daily 8 am", sub: "One message every morning with the day's filings, orders and prices." },
    weekly_sun_9am: { name: "Weekly Sunday 9 am", sub: "One message every Sunday at 9 am." },
    off: { name: "Off", sub: "No digest. Risk changes still reach you at once." },
  },
  whoHasMyNumber: "Who has my number",
};
