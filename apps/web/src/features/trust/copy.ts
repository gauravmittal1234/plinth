// Shared copy for this feature's client components that is not itself
// `api.*`/fixture content (DESIGN §5b facts stay in the payload; this is
// honesty copy about the product's own missing plumbing).
export const TRUST_COPY = {
  // Shown by NotifyToggle after a click. Handoff: needs an
  // api.waitlist_join (area, WhatsApp consent) RPC; until then nothing is
  // recorded, so this never claims the reader is "on the waitlist".
  waitlistNotSaved:
    "Waitlists aren’t open yet, so nothing was saved. We’ll publish the opening date on this page.",
} as const;
