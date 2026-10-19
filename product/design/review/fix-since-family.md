# Fix pass: "Since you last looked" (F-93) and Family circle (F-98)

**Date:** 18 Oct 2026. **Owner:** principal product designer.
**Sources:** PRD §20 (F-93, F-98, D11), PRD §12.1 and F-50 (utility templates only for alerts). `product/evaluation/10x_shortlist.md` §2 C1 and G1 and §5a pick 2. `product/evaluation/consumer.md` G-13 and G-19. DESIGN.md §0, §3–§4c, §5b (including the 18 Oct updates: loans are R2, the Sapphire re-score, Coral's stale data, the confidence copy) and §7.
**Artboards:** WebFollowing and AppFollowing (edited in place; backups in the scratchpad at `since-backup/`), plus the new WaDigest and AppFamily. No other artboard, `canvas.json` or DESIGN.md was edited.

## 1. What each item became

| Item | Need | Where it is now |
|---|---|---|
| **F-93 Since you last looked** | What changed on followed projects since the last visit | **WebFollowing hero**: "What changed since 14 Oct?" A summary sentence ("5 changes across your 4 projects: 1 extension, 1 filing on time, 2 missing filings and 1 price change. No band moved."), then one plain sentence per change, each with a before/after pill and a source chip, plus "Nothing new for Kestrel Park since 14 Oct." **AppFollowing**: the same block at the top of the Updates tab, which is now the tab the screen opens on |
| | "Replay to any date" (the brief) | One date slider from 1 Jul 2026 (the day Rohan followed) to today. Each change on record is a mark on the track, and the band change is marked in the Elevated ink. There are jump chips for "Your last look · 14 Oct", "1 Oct", "1 Sep" and "When you followed · 1 Jul". The heading, summary, list and marks all recompute together. This is the page's signature (`data-signature="replay-since"`) |
| | The record below must not repeat the hero | The feed becomes **"What happened before 14 Oct?"**: the record splits at the replay date, so each change appears once. When the 2 Oct band change moves into the hero, its before/after reveal moves with it |
| | Weekly "this week in filings" digest | **WebFollowing "What lands every Sunday?"**: a preview of the WhatsApp message, with a week picker (12–18 Oct, 5–11 Oct, 28 Sep–4 Oct) driven by the same event list. **Alerts** gains a digest setting: Daily at 8 am / Weekly on Sunday at 9 am / Off. **WaDigest**: the message itself |
| | Shared cards say what changed since they were issued | **WaDigest**: Rohan forwards back an old card from 26 Jun 2026 (Moderate, v1.1). Plinth replies with a forwardable card headed "Changed since this card was sent", showing ~~Moderate~~ → **Elevated**, the meter stepping to 3, "Band changed 2 Oct 2026, on new HARERA records", the promise, the date and a live QR. The caption reads: "Changed since this card was sent: band Moderate → Elevated (2 Oct)." **WebFollowing** explains the feature: "Old cards answer for themselves…" |
| **F-98 Family circle (slice)** | A relative taps a link to opt in to the same alerts | **AppFamily**: <ul><li>Rohan's sheet, "Who follows with you?", lists the members, has "Invite on WhatsApp" and "Copy link", and lets him choose the scope (Aurelia Heights Ph 2 or all 4 projects).</li><li>The relative's link page ("Rohan invited you / to follow Aurelia Heights Ph 2. You'll get the same alerts. Your number stays yours.") lets him choose WhatsApp or the app. On WhatsApp the page opens his own chat with "JOIN AH2-7KQ" ready to send, so his number reaches Plinth only when he sends it himself.</li><li>Joined, left and "Not now" states.</li></ul>**WaDigest**: "Invite family" returns a forward-ready invite message. **WebFollowing**: the same circle, with an invite link and WhatsApp share |
| **G-13 Families can't decide together** | Household, invite, roles, revoke, shared shortlist, private cost sheets | **WebFollowing "Who's deciding with you?"**: <ul><li>Members with status: Meera joined 6 Oct; Meera's father invited today, "Nothing is sent to him until he taps the link."</li><li>"They can see" / "They can't change" lists.</li><li>"Stays private to you: cost sheets, visit passes, payment alerts and who has your number."</li><li>Remove and Cancel invite with an inline confirm and Undo.</li><li>**A shared shortlist with dated notes from Rohan and Meera, plus a note composer.**</li></ul>**AppFamily**: the same roles, plus a revoke sheet that states its consequences ("He gets one last message…"). **AppFollowing**: family faces on every project row, and a "With Meera · her father is invited" entry under the title |
| **G-19 Follow can't tell a browser from a booked buyer** | An "I've booked here" toggle that changes alerts and links to the right help | **WebFollowing "Have you booked any of these?"**: pick a project, then choose Just watching or I've booked here. Booked adds payment-stage alerts slab by slab, demand letters checked against filed slabs, and possession (OC, offers, delay interest). It shows the latest filed progress for that project, "Check a demand letter" (Pay-as-built) and "What a booked buyer can do". Each project row shows its type. **AppFollowing**: a follow-type pill on every row opens a sheet with the same choice. Both say "Payment and demand-letter alerts go only to you" and "Your family circle doesn't see your follow type" |

## 2. Changes by file

### WebFollowing (edited; 1280 × 6,950 → **1280 × 12,100**, `$preview` updated)

| # | Change | Why |
|---|---|---|
| 1 | Hero "How are your projects doing?" becomes **"What changed since 14 Oct?"**: summary, "Mark these as seen", "Last looked 14 Oct 2026, 8:40 am · 5 unread…", the replay instrument and the change list. The Aurelia photo becomes a sticky column, and its caption keeps Moderate → Elevated, 2 Oct 2026 | F-93 |
| 2 | Three new dated events from the updated §5b: <ul><li>Sapphire's Jul–Sep QPR, filed on time 15 Oct and on HARERA 16 Oct, with the re-score due by 19 Oct, 7:40 pm.</li><li>Coral's Jul–Sep QPR not on HARERA (15 Oct).</li><li>Coral's Apr–Jun QPR missing since 15 Jul.</li></ul>Sapphire's late Apr–Jun QPR (27 Jul) is added to the record | §5b; G-07 pending and stale states |
| 3 | Project rows: a follow-type pill, family faces with "Meera follows too · her father is invited", and a freshness line under each bar ("From the Jan–Mar 2026 QPR · 187 days old" for Coral, "…the new one is being read" for Sapphire). Sapphire's row reads "New QPR in · re-score due by 19 Oct" | G-19, F-98, §5b |
| 4 | New section "Have you booked any of these?" | G-19 |
| 5 | New section "Who's deciding with you?" with a new image slot `familyShortlist` | F-98, G-13 |
| 6 | Feed becomes "What happened before 14 Oct?", follows the replay date, and has 11 events. The unread count counts only the items shown | F-93; no duplication |
| 7 | **Canonical fix:** "Earlier late filings: Apr–Jun 2024 (41 days)…" becomes "Jul–Sep 2024 (12 days), Jan–Mar 2025 (41 days) and Oct–Dec 2025 (38 days)" | §5b correction of 18 Oct |
| 8 | New section "What lands every Sunday?" (digest preview and week picker) | F-93 |
| 9 | Alerts: a digest choice (Daily / Weekly / Off) and new copy. Saved searches report "in your digest". Number line: "3 parties can reach you now. Family in your circle never see it." | F-93; D13 |
| 10 | Section order and tones: hero, pace, follow type, family, record, saved searches, digest, alerts. They alternate bg and track, and neighbouring sections differ in composition. The alerts panel moves from track to bgSolid because its section now sits on track | §0, §4a |
| 11 | No lender party appears: Rohan's Kestrel note now asks Larkspur for the cost sheet | Coordinator update; §5b "Loans are R2" |

### AppFollowing (edited; 390 × 844 unchanged)

| # | Change | Why |
|---|---|---|
| 1 | Opens on **Updates**. "What changed since 14 Oct?" sits at the top with the summary, "Last looked 14 Oct, 8:40 am", "Mark these as seen", the replay slider with event marks, jump chips, and five dated change items. Each item has a sentence, a before/after pill and a source chip; the Aurelia item adds the Developer says field, and the band item shows Moderate → Elevated chips | F-93 |
| 2 | The old hand-written five-row list becomes a data-driven "What happened before 14 Oct?" with 11 events, the same row design and a new Prices filter | F-93; consistency with web |
| 3 | Project rows are reordered newest change first: Sapphire, Coral, Aurelia, Kestrel. Each row gains a follow-type pill (opening the new "Have you booked here?" sheet) and family faces ("Meera too", "Meera too · her father invited") | G-19, F-98 |
| 4 | Row copy follows §5b: Kestrel reads "QPR filed on time · no band change" (it said "No change since you followed", which its 12 Oct QPR contradicts). Coral reads "Extended again on 14 Oct · 2 QPRs missing". Aurelia adds "Jul–Sep QPR not on HARERA yet" | §5b |
| 5 | Unread is now 5, matching the web and the 5 changes since the last look | Continuity |
| 6 | The chip's screen-reader text drops "low confidence" in favour of "We are less certain about this one" | §5b confidence copy |
| 7 | The compare sheet's Coral "built" cell names its stale QPR | §5b |

### WaDigest (new; 390 × 1280)

- **The weekly utility template.**
  - The image header is 1080×570, drawn at 288×152 (the 1.91:1 template-header ratio WaAlerts uses). It reads "This week in your projects · 12–18 Oct 2026 · 5 changes on record", with **one floor per followed project**. The floors settle in from the ground up, once; this is the board's signature.
  - The body is one paragraph and names the one fact that may move a band.
  - The footer reads "You chose a weekly digest · reply STOP to end alerts".
  - Two quick replies: **See changes** and **Stop weekly**.
- **The returned card** follows (see §1), with session replies **Why it changed** and **Invite family**.
- **Replies are real.**
  - "See changes" lists all 5 changes plus the price list, with sources and an "Open Following" CTA.
  - "Stop weekly" confirms that band changes still come, and offers "Turn weekly on".
  - "Why it changed" names the trigger and sources.
  - "Invite family" explains the opt-in and returns the forwardable invite.
  - "Start over" resets.

### AppFamily (new; 390 × 844; tweaks `theme` and `screen`)

- **`screen` = Your circle** (Rohan's phone). The sheet shows:
  - the members: Rohan; Meera (Remove); Meera's father (Cancel invite);
  - Invite someone: the scope and "Invite on WhatsApp" (the one accent action), plus Copy link, with a status line;
  - They can see / They can't change, and "Stays private to you…";
  - What they'll get: the exact alert bubble for the chosen scope;
  - "See the page he opens from the link", which opens the relative's page in preview mode with "Back to your circle".
- **`screen` = Relative opt-in** (Meera's father's phone, from the WhatsApp link).
  - The page shows the Aurelia photo, the invitation sentence, the RERA number and "What you'll get" (alerts; a Sunday round-up and quiet hours; "Rohan sees that you joined, never your number. No developer or agent gets it."; STOP anytime).
  - He chooses WhatsApp or the Plinth app, then taps "Get these alerts on WhatsApp". WhatsApp opens with "JOIN AH2-7KQ" ready, the page waits, and then confirms he has joined. He can leave, or tap "Not now" ("We don't have your number, and Rohan won't be told").
- **`screen` = Revoke.** Meera's father has joined, and the confirm sheet "Remove Meera's father?" lists three consequences. "Remove him" leads to a toast with Undo, and the member row reads "Removed today · his alerts through your circle stopped".

## 3. Decisions and deviations the lead should know

1. **The card shows 5 changes on 4 floors, not "3 changes".** Since the brief, §5b gained Sapphire's Jul–Sep QPR (on HARERA 16 Oct) and Coral's missing Jul–Sep QPR (15 Oct). The week of 12–18 Oct therefore has 5 changes on record across all 4 followed projects. The header gives each project one floor, so it always fits the 1.91:1 header, and quiet weeks read "Nothing new" (the 5–11 Oct and 28 Sep–4 Oct previews on the web).
2. **"Since 14 Oct" lists 5 changes, not the 3 the brief implied**, for the same reason. Kestrel's on-time QPR of 12 Oct falls before the last look, so it sits in the record and in the weekly digest.
3. **The replay control is in R1 design, but the shortlist put the date scrubber in R2.** It reuses the nightly diff and the dated snapshots. If R1 is tight, ship the jump chips (last look / 1 Oct / followed) and add the slider in R2.
4. **The WebFollowing page is long: about 12,100 px against 6,950 before.** It now carries six jobs. If the critique gate asks for less, move "Who's deciding with you?" to its own web page (`/following/family`), which mirrors the app sheet and saves about 1,650 px.
5. **The weekly digest is a utility template** because it reports only on projects the user follows and chose to hear about weekly. It carries no promise line in the header image (the WaAlerts rule), no offers and no new-project suggestions. Saved-search matches stay out of it, because the 10x conflict table, row 12, puts launch matches under a marketing opt-in.
6. **Family opt-in follows the WhatsApp and DPDP rules.**
   - Plinth never receives a relative's number from the buyer.
   - The relative's own message ("JOIN AH2-7KQ") is the opt-in, and alerts are English only (10x conflict table, row 2).
   - Family members can't reach the buyer through Plinth, so they are not "parties" under the F-80 cap.
   - Payment and demand-letter alerts, cost sheets, visit passes and "who has my number" never go to the circle.
7. **Follow type is private by default.** The circle never sees "Booked here".

## 4. Facts used that §5b does not hold yet (proposed additions; DESIGN.md not edited)

| Fact | Used in |
|---|---|
| Rohan has followed his 4 projects since 1 Jul 2026. His last look was 14 Oct 2026 at 8:40 am, so 5 changes are unread | WebFollowing, AppFollowing |
| Sapphire Grove Ph 1 price list of 16 Oct 2026: 3 BHK ₹1.89 Cr → ₹1.95 Cr; all-in about ₹2.27 Cr. This was already on WebFollowing before this pass | All three Following surfaces, WaDigest |
| Kestrel's Jul–Sep QPR: built 59% → 63%. Aurelia complaints 13 → 14 | Web and app |
| **Family circle:** Meera joined 6 Oct 2026 (same alerts, 4 projects, can add notes). Meera's father was invited 18 Oct 2026 to Aurelia Heights Ph 2. Invite links are `plinth.in/j/AH2-7KQ` (Aurelia) and `plinth.in/j/RC4-2MW` (all 4); each works for one person for 7 days (to 25 Oct) and carries no phone number | WebFollowing, AppFollowing, AppFamily, WaDigest |
| **Weekly digest:** Sundays at 9 am. Rohan chose weekly; the next one is Sun 25 Oct | WebFollowing, WaDigest |
| **Old card example:** a risk card with data as of 26 Jun 2026, model v1.1, showing Moderate | WaDigest |
| **Shared shortlist:** Kestrel Park, Sapphire Grove Ph 1 and Aurelia Heights Ph 2, with dated notes (12–17 Oct) | WebFollowing |

## 5. Open issues for other owners

- **AppYou** shows Rohan with WhatsApp alerts and the weekly digest switched off. WebFollowing and WaDigest show both on. One of them should change; I'd suggest AppYou's defaults.
- **WebPrivacy and AppYou** could add one line under "Who has my number": "Family in your circle can't see your number and aren't counted here."
- **WaRisk** footers say "Data as of 14 Oct 2026". The returned-card flow treats that date as the card's issue date. Consider "Issued 18 Oct 2026 · data as of 14 Oct" if the lead wants the two dates kept separate.
- **canvas.json** (not edited):

  | Board | Change |
  |---|---|
  | WebFollowing | h 6950 → **12100**. Suggested new title "Following · since you last looked" |
  | WaDigest | add "WhatsApp · weekly digest and stale card", 390×1280, page `whatsapp`, interactive |
  | AppFamily | add "Family circle · invite, opt-in, revoke", 390×844, page `android`, interactive |

## 6. Checks run

A script in the scratchpad (`since_check.py`) ran these checks on each file:
- tag balance and attribute quoting;
- no block elements inside phrasing elements, and no interactive elements nested inside links or buttons;
- `<script src="./support.js"></script>` appears exactly once;
- `data-props` parses, with `theme` defaulting to Day;
- new `data-slot` divs are empty;
- no banned words, emoji, glass or radial glow;
- `node --check` passes;
- `renderVals()` runs in Day and Night (and in all three `screen` values for AppFamily). Every top-level and loop `{{hole}}` resolves after every handler and every list-item handler has been fired.

**Result: 0 problems in all four files.** Flows were probed by script:
- replay to 1 Oct, 1 Jul and today (empty state);
- the band reveal following the band event between the hero and the record;
- booked and watching;
- remove, cancel invite and undo;
- adding a note;
- the week picker and the digest choice;
- WhatsApp Stop weekly, Turn weekly on and Invite family;
- the opt-in from waiting to joined to left.

Nothing was rendered in a browser, so the page heights are arithmetic estimates. Please confirm WebFollowing's 12,100 and WaDigest's 1,280 on the canvas.

## 7. Critique gate (DESIGN §8, my scores)

| Board | Question | Evidence | Hierarchy | Readability | Access. | Trust | India | Consistency | States | Delight | **Total** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| WebFollowing | 5 | 5 | 3 | 4 | 4 | 5 | 4 | 5 | 5 | 4 | **44** |
| AppFollowing | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 4 | **44** |
| WaDigest | 4 | 4 | 4 | 4 | 4 | 5 | 5 | 5 | 4 | 4 | **43** |
| AppFamily | 5 | 4 | 4 | 4 | 4 | 5 | 5 | 4 | 5 | 4 | **44** |

WebFollowing's hierarchy is held at 3 by the page length (see §3, item 4).

**Image request (1):** `familyShortlist` (2:1), appended to `product/design/assets/requests_since.json`.
