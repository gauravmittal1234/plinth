// Layout copy for /j/[code] (T52; AppFamily.dc.html "the relative (phone)"
// screen; API_CONTRACTS §4.11). The invite's own facts — inviter, scope, the
// RERA number, "what you'll get" and the number line — come from
// api.family_invite_preview's payload; this file only holds the framing text
// around them, and the one honest state shown when a code doesn't resolve.
export const FAMILY_JOIN_COPY = {
  whatsGetHeading: "What you’ll get",
  channelHeading: "Where should the alerts go?",
  trustLine:
    "Utility updates about this project only, never marketing. Plinth works for buyers. No developer pays us. Ever.",
  whatsappCta: (code: string) => `Send “JOIN ${code}” on WhatsApp`,
  appCta: "Continue in the Plinth app",
  notNow: "Not now",
  // True regardless of what happens next: nothing on this page ever shares a
  // number or tells the inviter anything (rule 9, "no confirmation without a
  // record" — there is no decline RPC, so this never claims one ran).
  declined: (inviterFirstName: string) =>
    `We don’t have your number, and ${inviterFirstName} won’t be told.`,
  // One honest state for every code that doesn't resolve. The backend treats
  // an expired, already-used and unknown code alike (API_CONTRACTS §4.11,
  // "a neutral reply"), so this page can't claim to know which happened —
  // it says so plainly instead of guessing.
  unavailableHeading: "This invite link isn’t active",
  unavailableBody:
    "Links like this work for one person, for 7 days. This one has expired, was already used, or doesn’t exist. Ask whoever sent it for a new one.",
} as const;
