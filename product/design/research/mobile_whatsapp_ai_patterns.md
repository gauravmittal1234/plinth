# Mobile, WhatsApp and AI interaction patterns: R1 spec

| | |
|---|---|
| **Status** | Research input for Phase 3 (UI). v1.0, 18 Oct 2026 |
| **Scope** | R1: Android app (Expo/React Native), responsive web, WhatsApp. PRD §2, §5, §7.1, §8, §11 |
| **Companion** | `design_rulebook.md` (tokens, ₹ and date formats, writing rules, no-dark-pattern list). This spec follows it |
| **Conventions** | `[Rn]` = source in §8 (all accessed 18 Oct 2026). **[J]** = design judgement. Project names, RERA IDs and numbers are fictional and illustrative. "[Brand]" = name TBD |

## 0. Decisions

1. **Four tabs: Explore · Following · Ask · You.** The alerts inbox is Following › Updates. The fifth slot is held for the R2 Deal Room [J].
2. **Target API 36 from day one** [R14]. That means edge-to-edge with no opt-out, predictive back on by default, and no orientation locks at ≥600dp [R13].
3. **Results are a map under one standard bottom sheet** with three detents. Searches run only when the user taps "Search this area" [R58].
4. **Pins show price by default.** A "Risk" toggle shows band names. It appears only once S2 bands are live.
5. **Visualise opens on the original photo.** The staged image has a label burned into the pixels plus a UI chip the user can't dismiss. If the structure-lock check fails, nothing is shown [R30, R34].
6. **The concierge writes prose with inline source chips and tool cards.** Each sentence is released only after the claim verifier passes it.
7. **WhatsApp uses:** reply buttons and lists inside the 24-hour window, utility templates for alerts, one Flow for visits, and authentication templates for OTP. The bot stays property-specific [R39–R57].

---

## 1. Android navigation and structure

### 1.1 Platform rules that bind us

| Rule | Implication |
|---|---|
| Play: new apps and updates must target API 36 from 31 Aug 2026 [R14] | Build on API 36 |
| API 36: the edge-to-edge opt-out is "deprecated and disabled" [R13]. 3-button navigation gets a translucent scrim [R12] | Map, camera and galleries draw under the system bars. Handle bar, cutout and IME insets everywhere |
| API 36: predictive back is on and `onBackPressed` isn't called. `enableOnBackInvokedCallback="false"` is a temporary opt-out [R13, R15] | react-native-screens lacked support as of Sep 2026, and some API 36 apps exit instead of popping the stack [R16]. Use the opt-out only if QA finds broken stacks [J] |
| API 36 ignores orientation locks at ≥600dp [R13] | Every screen, including the camera, works in landscape and at ≥600dp |
| Navigation bar: 3–5 destinations. The M3 Expressive flexible bar is **64dp** (was 80dp), with a 56×32dp indicator and 24dp icons [R1, R2] | Use it at <600dp |
| Navigation rail at ≥600dp: 80dp in M3, 96dp in M3E. The expanded rail replaces the drawer [R3, R4] | Rail at ≥600dp. No drawer |

### 1.2 How reference apps structure their tabs

| App | Pattern | Takeaway |
|---|---|---|
| Google Maps (2024) | Cut from 5 tabs to 3: Explore · You · Contribute. Saved and Updates folded into "You"; a bell for notifications [R22] | Fewer, broader tabs; map + sheet is home |
| Airbnb (2025) | Explore · Wishlists · Trips · Messages · Profile; Explore mixes homes, experiences and services [R23] | One discovery tab |
| Zillow | Search-led tabs plus an Inbox [R24]. "Ask Zillow" is a chat box at the bottom of results, not a tab [R25] | AI also lives in context |
| Redfin | Conversational search starts in the search bar [R26] | Natural language in, filters out |
| Rightmove | Ask Rightmove is a toggle in search with a Sources button [R27, R28] | Sources on every AI answer |

### 1.3 Recommended tab bar [J]

| Tab | Contains | Badge |
|---|---|---|
| **Explore** | Home, search, map/list, project, risk card, compare, cost tools, Visualise entry | none |
| **Following** | Segmented: **Updates** (alerts inbox) · **Projects** (select 2–4 to compare) · **Searches** | unread count |
| **Ask** | Home Advisor threads | none |
| **You** | Verify number, Privacy centre, notification settings, methodology, "How we make money", help, grievance officer | dot when consent action is needed |

Visualise is a beta used mostly during site visits, so it doesn't get a tab. It launches from:
- Explore;
- the project page;
- Ask (attach a photo);
- a launcher shortcut, "Visualise a room".

**"Follow" is the only save action.** It bookmarks the project and turns on alerts on the channels the user picks, so there is no separate shortlist concept.

**Navigation behaviour:**
- Each tab keeps its own stack. Re-tapping a tab scrolls to the top, then pops to the root.
- Back from a tab root goes to Explore, then leaves the app.
- Detail screens hide the navigation bar and show a sticky bottom action bar.
- Motion: container transform from a card to its detail; shared axis X for flow steps; fade through between tabs.
- At ≥600dp: navigation rail plus two panes (400dp list beside the map; or project beside its risk card).

### 1.4 Key detail screens

**Project (S06), top to bottom:**
1. 16:9 gallery.
2. Name, developer, sector.
3. **RERA number, authority URL and QR in bold, top right** (Haryana rule, PRD §12.1).
4. "No developer pays us. Ever." linking to "How we make money".
5. Truth panel (F-01).
6. Delivery Risk summary.
7. Price and all-in cost, with the cost-sheet entry.
8. Floor plans with dimensions.
9. Amenities.
10. Ungated brochure.

The sticky 80dp bar holds **[Follow project]** (filled) and **[Ask about this]** (tonal), both 48dp high. The overflow menu holds Share card, Add to compare, Visualise a room and Book a site visit (opens WhatsApp).

The top app bar is transparent over the gallery and lifts into a small app bar on scroll [R8]. No FAB: a FAB carries a screen's primary action [R9], and here that action already sits in the bottom bar.

**Risk card (S07) follows PRD §6.4:**
- band name and a five-step meter glyph;
- confidence badge;
- "Data as of 14 Oct 2026 · v1.2";
- natural frequency with a 10×10 icon array (10dp cells);
- up to 4 reasons, each with a **source chip** that opens the Evidence drawer (a modal sheet showing publisher, document, date, snapshot and "Open original");
- "What would change this";
- the developer's response, labelled "Developer says";
- "How this is calculated" (custom tab);
- "Not a credit rating. Not issued by any RERA.";
- Share card, via the Android Sharesheet: an image plus a deep link (F-05).

| State | Display |
|---|---|
| S1 facts only | No band: "Rating not published yet. Here's what the records show." |
| Low confidence | Band plus "Low confidence: limited filings", with the range shown wider |
| Limited history / Not scored | Neutral glyph and a one-line reason; no penalty wording |
| Severe by override | The rule and its source above the reasons |
| Stale (>120 days) | "Some data is over 4 months old" |
| Disputed | "The developer has disputed 1 fact. Decision due 3 Nov 2026." |
| Offline | The cached card with "Saved 2 h ago". **Never show a band without its reasons and date** [J] |

**Compare (S10).**
- Holds 2–4 projects. At <600dp, two columns are visible at a time; swipe to see the next pair.
- Project names stay pinned at the top and attribute labels at the left (112dp).
- Rows: band, frequency, all-in cost per carpet sq ft, original vs current possession, % built vs time elapsed, top reason.
- Switch: "Show differences only".

**Privacy centre (S19–S21).**
- **Who has my number:** each party with purpose, date and channel (masked or direct), plus **[Revoke]**. Revoke opens a confirm sheet: "Stop sharing your number with Northstar Developers' site office? They won't be able to call or message you." Buttons: [Stop sharing] / [Keep sharing].
- A contact-cap meter: "1 of 3 contacts used in the last 30 days" (F-80).
- Consent history, Download my data, Delete account (F-81).

---

## 2. Map and list search

**Pattern.** A full-bleed map under a floating search bar and filter chips. The results list sits in **one standard (non-modal) bottom sheet**, as in Google Maps, so the map context stays visible [R6].
- Back steps the sheet down one detent.
- Filters open as a full-screen dialog, never as a stacked sheet [R6].

**Anatomy (compact):**
- **Search bar:** 56dp, 16dp margins, below the status-bar inset. Opens the full-screen search view: recents; suggestions by project, developer, corridor or RERA ID; "Ask in plain English" [R7].
- **Filter chips:** 32dp, 8dp gaps, horizontal scroll: All filters (count) · Budget · BHK · Possession · Risk · RERA.
- **Parsed-query row (F-31)** after a natural-language query: "Understood as: [3 BHK ×] [≤ ₹2.5 Cr ×] [Dwarka Expressway ×] [Possession by 2028 ×] [Risk: Low–Moderate ×]". Unused terms are named: "Not used: 'near good schools'. We don't rate schools yet." This mirrors Redfin and Zillow [R25, R26].
- **"Search this area":** a 40dp tonal pill, 12dp under the chips. It appears after the map moves more than 30% of the viewport. "Search as map moves" is in the overflow and off by default, to save data on 4G [R58].
- **"My location":** a 40dp small FAB, 16dp above the sheet. It asks for location permission only when tapped.
- **Sheet:** handle 32×4dp visual, 48dp touch [R5].

| Detent | Height | Content |
|---|---|---|
| Peek | 112dp above the nav bar | "214 projects · Sorted by relevance", Sort, List view |
| Half | 0.5 ratio [R5] | About 1.5 cards; map still usable |
| Full | Up to the search bar | List, plus a [Map] extended FAB at the bottom centre |

**Result card:**
- 16:9 image (328×184dp at 360dp width) with a blurred placeholder while it loads;
- name; developer · sector;
- "₹1.8–3.1 Cr"; BHK range;
- "Possession Dec 2027 (originally Jun 2026)";
- band chip (name plus glyph);
- RERA number as a caption;
- a 48dp Follow button.

Sort options: Relevance · Price · Possession · Lowest risk. A "How results are ranked" link notes that ranking never uses commercial data.

**Pins [J]:**
- **Price mode (default):** a 28dp pill with a 12sp label, e.g. "₹2.4 Cr", the lowest price in the project. Hit area ≥48dp [R17].
- **Risk mode:** glyph plus band name ("Elevated"). Colour supports the meaning but never carries it alone. Limited history and Not scored pins are neutral outlines.
- **Selected:** scaled 1.15× and inverted; the sheet goes to half and scrolls to that card. Visited pins are muted.
- **Clusters:** 40dp circles showing the count only. A tap zooms to the cluster bounds. Clusters never show a "worst" or "average" band, because that would mislead. Clustering is distance-based [R59].

**States:**
- **First load:** map tiles plus 3 skeleton cards.
- **Tiles fail:** the sheet goes full with "Map didn't load. Showing the list."
- **No results:** "No projects match all 5 filters." with chips [Remove Possession] [Widen budget to ₹3 Cr].
- **Outside coverage:** "We cover Gurugram for now."
- **Offline:** followed projects only, from the cache.

**Expo notes [J]:**
- `@gorhom/bottom-sheet` v5 for snap points and FlashList [R61].
- react-native-maps with supercluster; expo-maps documents no clustering [R60].
- Pins as pre-rasterised bitmaps, not React views, for low-end phones.

---

## 3. Visualise camera flow (F-24a, beta)

**References:**
- Zillow Virtual Staging: tap a room photo, pick a style, slide between original and staged [R29]. Its 2026 redecorate tool leads with the original; shoppers "should be able to see the original alongside the altered version." Early versions hallucinated windows and walls [R30].
- IKEA Kreativ scans, erases and places to scale [R31]. Google Lens opens straight to the viewfinder with gallery import by the shutter [R32]. Pinterest Lens puts dots on detected objects [R33].
- India's IT Rules 2026 (in force 20 Feb 2026) require a prominent label and provenance that can't be stripped. The draft's 10%-of-area rule was dropped [R34].

| Step | Anatomy and copy |
|---|---|
| **V1 Explainer** (once) | "See this room furnished. We add furniture with AI. Walls, windows and floors stay as they are. Every result is labelled AI-staged." Choice: "Keep photos on this phone" / "Save to my account". **[Open camera]** asks for camera permission here, in context |
| **V2 Capture** | Full-bleed viewfinder: 3×3 grid; horizon level (green within ±2°); guide "Keep the floor and two corners in frame". Live-check chip: "Too dark: turn on lights" / "Hold still" / "Step back: we need to see the floor". Bottom row: 48dp gallery button, **72dp shutter**, 0.5× lens toggle |
| **V3 Review** | Room chip "Living room · Change". Warnings: "This room has furniture. Results work best in empty rooms."; "People detected: we'll blur them." **[Use photo] [Retake]** |
| **V4 Style and budget** | Style grid: Modern Indian · Minimal · Warm contemporary · Classic · Scandinavian · Boho. Budget segmented button: Essential · Comfort · Premium, captioned "Changes the look of the furniture. Not a price quote" (no ₹ we can't source) [J]. **[Stage this room]** |
| **V5 Generating** | Determinate upload bar, then stages: "Checking walls and windows" → "Placing furniture to scale" → "Adding the AI label". "Usually 10–20 seconds" [J; re-measure]. **[Notify me when ready]** lets the user leave. Offline: "Saved. We'll stage it when you're back online." |
| **V6 Result** | **Opens on Original.** Segmented button **Original · AI-staged** plus a before/after slider (2dp divider, 48dp handle; tapping either half is the drag alternative). A persistent chip on the staged view reads "AI-staged". Burned-in label: "AI-staged · furniture added". Caption: "AI-staged: furniture added. Walls, windows and floors unchanged." An "About this image" sheet shows the model, date, structure-lock pass, C2PA and SynthID. Sample-flat photos add "Sample flat. Your unit may differ." |
| **V7 Actions** | Try another style · Save · Share (labelled image plus deep link) · Report a problem ("Walls or windows changed" / "Furniture too big" / "Other") |

| Failure | Copy / behaviour |
|---|---|
| Structure lock fails after 1 automatic retry | "We couldn't keep the walls and windows unchanged, so we haven't shown the result. Try a wider photo with the corners in frame." |
| Not a room | "This doesn't look like a room. Visualise works on photos of rooms." |
| Dark or blurred | Caught at V2–V3; never sent to the model |
| Upload drops on 4G | Resumable upload, 3 retries, then "Upload paused. We'll keep trying." |
| Takes more than 60 s | "Taking longer than usual." **[Keep waiting] [Notify me]** |
| Daily limit [J: 10] | "You've staged 10 rooms today. More tomorrow." No upsell during the beta |
| Bare under-construction unit | Staged, with the extra label "Artist's impression: unfinished unit" (F-24) |

**Android notes:**
- CameraX via expo-camera; the camera handles rotation [R13].
- Save to MediaStore with C2PA kept and EXIF location stripped [J].

---

## 4. AI concierge ("Home Advisor")

**References:**
- Perplexity: answer, then numbered inline citations, then a source list, then "Related" follow-ups [R35].
- ChatGPT search: citation pills plus a Sources sidebar [R36].
- Gemini: "Double-check" highlights statements by evidence [R37].
- Shape of AI: the Citations, Disclosure, Caveat and Stream-of-thought patterns [R38].
- Zillow AI mode: listing cards in chat, tours booked from chat, and a fair-housing classifier on questions and answers [R25].
- Rightmove: a Sources button [R27].

**Anatomy (S14):**
- **App bar:** "Home Advisor", subtitle "AI · answers cite public records". Overflow: Talk to a person · New chat · Delete chat.
- **Disclosure** opens every thread and can't be dismissed: "I'm an AI assistant. I answer from public records like HARERA and [Brand]'s data, and show sources. I can make mistakes, so check the sources. I don't give legal, tax or investment advice."
- **Messages:** the user's in right-aligned bubbles; answers as full-width prose.
- **Citations:** inline numbered chips (20dp visual, 48dp hit area) open a source sheet. A "Sources (3)" button under each answer is the accessible alternative.
- **Tool cards** (12dp radius):
  - compact risk card (band, frequency, 2 reasons, "Open full card");
  - project card;
  - cost summary;
  - compare table;
  - "14 projects match. See on map", which opens S03 with the filters applied.
- **Follow-ups:** up to 3 suggestion chips, e.g. "Why Elevated?" "Compare with 2 similar" "What will I really pay?".
- **Feedback:** thumbs up/down and "Report a wrong fact" (goes to the review queue).
- **Composer:** 56dp min, placeholder "Ask about a Gurugram project…", with mic, attach (a cost sheet triggers F-10) and send. A context chip shows when opened from a project: "About: Skyline Residences Phase 2 ×".

**Streaming [J].** Every number must come from a tool result (PRD §9). So:
1. Show tool status lines while tools run ("Checking HARERA filings…").
2. Stream the answer **one verified sentence at a time**.
3. If the verifier drops a sentence, say: "I couldn't verify one point, so I left it out."

The send button becomes "Stop" while streaming.

| State | Display |
|---|---|
| Sending | Bubble with a clock |
| Thinking | Status line plus the M3 loading indicator [R10] |
| Failed | "Didn't send. Retry" |
| Offline | "Will send when you're back online." |
| Human joined | Divider: "Priya from [Brand] (a person, not AI) joined" |

**Refusals (always offer a next step):**
- "Should I buy?" → "I can't tell you whether to buy. That's your decision, and I'm not a financial adviser. Here's what the records show: [risk card] [cost card]. Compare with 2 similar projects?"
- "Is the title clear?" → "I can't certify title. I can list points to discuss with a lawyer."
- Community filters → "I can't filter by religion, caste or community. I can filter by budget, location, possession date and delivery risk."
- "Can the builder pay to improve this?" → "No. No developer pays us, ever, and nobody can pay to change a rating."
- Off-topic → "I only help with buying homes in Gurugram."
- Hinglish input gets an English reply.

**Handoff.** "Talk to a person" is always in the overflow. It is also offered automatically:
- after 2 misunderstood turns;
- for disputes and payment worries;
- when the user types "human".

Copy: "Connecting you to our team (Mon–Sat, 10 am–7 pm IST; usually within 4 working hours [J]). We'll share this chat with them." This meets WhatsApp's escalation rule [R57].

**Android notes [J]:**
- Under edge-to-edge, the composer follows the IME inset.
- TalkBack announces each finished answer through a polite live region, not every streamed token.
- Predictive back leaves a streaming answer running and restores it when the user returns.

---

## 5. WhatsApp Business Platform

### 5.1 Constraints

| Element | Limit or rule |
|---|---|
| Service window | 24 h from the user's last message. Free-form inside it; templates only outside [R51] |
| Reply buttons | ≤3, title ≤20 chars; body ≤1024; footer ≤60; header can be an image [R39] |
| List | ≤10 rows; button ≤20; row title ≤24; description ≤72 [R40] |
| CTA URL | 1 button, ≤20 chars [R41] |
| Templates | Header ≤60, body ≤1024, footer ≤60. Button text ≤25. **Mixing quick replies with other button types, or using 4+ buttons, hides them on desktop** [R42] |
| Utility | Non-promotional and specific to the user. Any promo element makes it marketing [R43] |
| Authentication | Fixed text "{code} is your verification code." Expiry 1–90 min. Copy code, one-tap or zero-tap (Android; package name plus signing hash) [R44]. TTL 30–900 s (secondary source) [R45] |
| Flows | ≤50 components per screen; Footer ≤35; OptIn ≤120; TextInput label ≤20; endpoint timeout 10 s [R46, R48]. One task per screen, ≤10 options, under 5 minutes [R47]. CTA ≤30 [R50]. PhotoPicker: 1 per screen, ≤25 MiB per file [R49] |
| Media in | Image ≤5 MB; PDF ≤100 MB; media URLs expire in 5 min [R53] |
| Typing indicator | Clears when we reply, or after 25 s [R52] |
| Policy | Opt-in must name the business [R56]. Honour opt-outs. Provide a human escalation path [R57]. General-purpose AI bots are barred from 15 Jan 2026; businesses' own-service AI is unaffected [R55] |
| Price | Per template since 1 Jul 2025; utility was free inside the window [R54]. Secondary sources say that changed on 1 Oct 2026. Re-verify |

**Bot rules [J]:**
- One idea per message, and at most 2 bot messages in a row.
- Every result links to its web card.
- Show read status plus the typing indicator for replies over 2 s, and send a holding message before 25 s.
- STOP, "unsubscribe" and "band karo" work instantly.
- Profile description: "Independent home-buying research for Gurugram. No developer pays us. Ever."

### 5.2 Scripts

**(a) Project name → risk card**

> **User:** skyline residences sec 79
>
> **Bot (first contact only):** Hi, I'm [Brand]'s AI assistant for Gurugram home buyers. I answer from public records like HARERA, with sources. I can make mistakes. Type *human* anytime to reach our team.
>
> **Bot (reply buttons; image header = risk card PNG, 1080×1350, RERA number top right):**
> *Skyline Residences Phase 2* · Sector 79, Gurugram · RERA GGM/512/244/2023/48
> Delivery Risk: *Elevated* (low confidence). About 38 of 100 similar NCR projects finished more than 12 months late.
> Top reason: 72% of units sold, but 41% built (HARERA QPR, Apr–Jun 2026).
> Data as of 14 Oct 2026 · Full card: [brand].in/p/skyline-2
> *Footer:* Not a credit rating. Not issued by any RERA.
> **[Why this rating] [Follow project] [Check my cost]**

- **Why this rating** → the 4 reasons with sources, then "What would change this". Buttons: [Developer's reply] [Compare similar] [Share card].
- **Follow project** → "Get WhatsApp alerts when Skyline Residences Phase 2's rating changes, it gets a date extension, or it files or misses a quarterly report? At most 1 message a day. Reply STOP anytime." **[Yes, alert me] [Not now]**. Yes → the consent is logged → "Done. Manage alerts: [brand].in/you".
- **Check my cost** → "Send a photo or PDF of the developer's cost sheet. I'll work out the all-in cost."
- **Ambiguous name** → a list message "I found 3 projects matching 'skyline'." with **[Choose project]**. Each row: title "Skyline Residences Ph 2"; description "Sector 79 · Northstar Developers · GGM/512/244/2023/48".
- **Not found** → "I couldn't find 'skylin homes' in Gurugram RERA records. Check the spelling or send the RERA number. We cover Gurugram only for now."
- **Before S2 bands:** the image is the truth panel, and the copy leads with "Original completion: Jun 2026 · Current: Dec 2027 (2 extensions)".

**(b) Cost sheet → all-in summary (F-10)**

> **User:** [2 photos]
>
> **Bot (after 20 s with no new page):** Got 2 pages. Any more? **[That's all] [Add more]**
>
> **Bot (read status plus typing):** Reading your cost sheet. Usually under a minute.
>
> **Bot:**
> *All-in cost: ₹2.45 Cr* (≈₹19,770/sq ft carpet)
> 3 BHK · 1,240 sq ft carpet · 1,748 sq ft super · loading 41%
> Base price ₹2.08 Cr
> + PLC, EDC/IDC, club, parking ₹9.6 L
> + GST (5%) ₹10.9 L
> + Stamp duty and registration (est., joint owners) ₹13.6 L
> + Maintenance deposit ₹3.1 L
> *Often negotiable:* PLC, club, parking (₹6.2 L)
> TDS of 1% (₹2.2 L) comes out of what you pay the developer. It isn't extra.
> 2 lines were hard to read. Please check them. Estimate from your sheet dated 12 Oct 2026; not a quote.
> **[Check 2 items] [Stress-test EMI] [Talk to a person]**

- **Check 2 items** → a list message; each row reads "Parking charge / Read as ₹4,50,000. Tap if wrong."
- **Blurred photo** → "I couldn't read 4 lines on page 2. Send a clearer photo: flat on a table, in daylight, whole page in frame."
- **First upload** → "We keep this sheet for 30 days, then delete it. Save it in the app to keep it." [J]

**(c) Follow-a-project alerts (utility templates)**

All three share:
- category `UTILITY`, language `en`;
- header "Project alert";
- footer "You follow this project. Reply STOP to stop.";
- quick replies only, **[See details] [Stop these alerts]**, so they render on desktop [R42]. A tap reopens the service window for free-form follow-up.

They contain no promotional wording [R43].

| Template | Body |
|---|---|
| `alert_band_change_v1` | Delivery Risk for *{{1}}* changed from {{2}} to *{{3}}* on {{4}}. Main reason: {{5}}. Source: {{6}}. The developer was told at the same time and can respond publicly. |
| `alert_extension_v1` | *{{1}}* got a completion-date extension from HARERA on {{2}}. New date: {{3}} (originally {{4}}). This is extension {{5}} for this project. Source: HARERA order, {{2}}. |
| `alert_qpr_missed_v1` | *{{1}}* hasn't filed its quarterly progress report for {{2}}, due {{3}}. Missed filings feed into the Delivery Risk rating. We'll tell you when it's filed. Source: HARERA project page, checked {{4}}. |

- **Batching:** same-day events for one project go in one message [J].
- **See details** → risk card image plus [Open full card].
- **Stop these alerts** → "Stopped. You won't get alerts for Skyline Residences Phase 2." The opt-out is logged.

**(d) Site visit booking (WhatsApp Flow, F-44)**

Entry: "Book a site visit" in the app (a WhatsApp deep link) or typing "visit". The Flow message reads: "Book a visit to Skyline Residences Phase 2's site office. Takes about 1 minute." **[Book a site visit]**. Slots come from the data endpoint; on a timeout: "Couldn't load times. Try again."

| Screen | Components and copy |
|---|---|
| 1 DATE | CalendarPicker "Visit date" (tomorrow to +30 days). Footer **[Choose a time]** |
| 2 TIME | Radio "Time" (≤6 slots, e.g. "11:00 am–12:00 pm"). Radio "Visitors": 1 · 2 · 3–4. **[Continue]** |
| 3 DETAILS | TextInput "First name". Body: "The site office gets a masked number, not yours." OptIn (required, unticked): "Share my first name and visit time with Northstar Developers' site office for this visit only." OptIn (optional): "Send me questions to ask, based on this project's records." **[Review]** |
| 4 REVIEW | Summary; "Change or cancel anytime from this chat." **[Confirm booking]** |

**Completion:**

> Visit booked: Skyline Residences Phase 2, Sat 25 Oct 2026, 11:00 am. Show visit code *4821* at the site office instead of your number. We'll remind you the day before and 2 hours before.

This is followed by [Open in Maps] and "5 questions to ask", built from the risk reasons. Example: "Your last QPR shows 41% built. Which towers are behind, and why?"

**Reminder (`visit_reminder_v1`):** "Reminder: your visit to {{1}} is on {{2}} at {{3}}. Visit code: {{4}}." **[I'll be there] [Reschedule] [Cancel visit]**.

**Recap (2 h later):** "How was the visit? Want to see a room furnished? Open Visualise: [link]."

**(e) Phone/WhatsApp OTP login**

**S23 (modal sheet).**
- Title: "Verify your number".
- Explainer: "To get alerts on WhatsApp and save across devices. We never share your number without asking. See who has it in You › Privacy."
- Phone field (+91), prefilled through the Phone Number Hint API (no permission needed) [R21].
- Buttons: **[Get code on WhatsApp]** (primary), **[Send SMS instead]**.

**Codes.**
- **WhatsApp:** an authentication template with zero-tap or one-tap autofill on Android, falling back to **[Copy code]** elsewhere [R44]:
  - Body (Meta's fixed text): "482193 is your verification code. For your security, do not share this code."
  - Footer: "This code expires in 10 minutes." TTL 600 s [J].
- **SMS fallback:** a DLT Service-Implicit template that includes the brand name [R62], auto-read by the SMS Retriever using the 11-character app hash [R20]: "482193 is your [Brand] login code. Valid 10 minutes. Do not share it. [hash]".

**Code screen.** Six 48dp boxes; paste and autofill work. "Resend in 0:30". Links: "Send SMS" / "Change number".

**Errors:**
- "That code doesn't match. 2 tries left."
- "Code expired. Send a new one."
- After 5 failed tries: "Too many tries. Try again at 4:45 pm IST." [J]
- "This number isn't on WhatsApp. We've sent an SMS instead."

**Web option [J].** "Continue with WhatsApp" opens `wa.me` prefilled with "Log me in: K7Q2". The bot replies "You're logged in on Chrome, Windows. Not you? Reply NO." No template is needed.

**Consents at first verification.** Separate, unticked boxes: "WhatsApp alerts for projects I follow" and "Occasional product updates from [Brand]" [R56].

---

## 6. Alerts, onboarding, loading and offline

**Notifications.**
- **Permission:** request POST_NOTIFICATIONS on the **first Follow tap**, after a rationale sheet ("Get an alert when this project's rating changes or it misses a filing." **[Turn on alerts] [Not now]**). Never ask at launch [R18].
- **Channels** (importance can't be changed later [R19]):
  - Rating changes: default.
  - Filings and extensions: low.
  - Visit reminders: high.
  - Account: default.
  - Product news: created only after opt-in.
- **Push example:** title "Skyline Residences Ph 2: rating changed"; body "Moderate → Elevated. Main reason: second date extension (HARERA, 12 Oct 2026)."

**Inbox (Following › Updates).**
- Filter chips: All · Rating changes · Filings · Visits · Account.
- 88dp three-line items: 40dp thumbnail; a factual headline ("Rating changed: Moderate → Elevated"); "HARERA order · 12 Oct 2026"; an unread dot. Swipe or the menu marks an item read.
- **Detail screen:** before/after, sources, developer response, "What this means" (2 lines), [Ask about this].
- **Empty state:** "No updates yet. Follow a project to get alerts when its rating changes or it files or misses a QPR (quarterly progress report)."
- **Settings:**
  - a type × channel matrix (App · WhatsApp);
  - quiet hours 10 pm–8 am, on by default [J];
  - a weekly digest option.

**Onboarding without walls.** The first launch opens Explore home directly, with no carousel and no sign-up. Home contains:
- the search bar;
- chips: "Check a project's risk", Dwarka Expressway, Golf Course Ext Rd, New Gurugram/SPR;
- the strip "No developer pays us. Ever. How we make money ›";
- tools: true cost, EMI stress test, cost sheet, payment-safety check;
- a "Visualise a room (beta)" card;
- Recently viewed.

Permissions are asked only in context: location on "Near me", camera on Visualise, notifications on Follow.
- **Needs a verified number:** WhatsApp alerts, visits, sync, payment, human chat.
- **Works anonymously on the device [J]:** everything else, including push-only follows.

**Loading, offline and errors (patchy 4G).**

| Situation | Pattern |
|---|---|
| First paint | Skeletons that match the layout; no shimmer with reduced motion |
| Waits under 5 s | M3 loading indicator; determinate bars for uploads [R10] |
| Over 8 s | "Still loading: your connection is slow" plus [Use low-data mode] (low-res images, list instead of map) [J] |
| Offline | A 32dp banner: "You're offline. Showing saved data from 10:42 am." Followed projects are cached (PRD §11); actions queue with a clock icon |
| Part of a page fails | Retry inside the component ("Couldn't load complaints. Retry"), never a full-screen error |
| Feedback | One snackbar at a time, above the bottom bars [R11] |
| Integrity | Risk card, cost summary and AI answer render all or nothing [J] |

---

## 7. R1 Android screen map

```
Explore ─ S01 Home ─▶ S02 Search view ─▶ S03 Results (map + sheet) ─▶ S05 Filters (full-screen dialog)
                   │                       └─▶ S06 Project ─▶ S07 Risk card ─▶ S08 Evidence drawer (modal sheet)
                   │                                    ├─▶ S10 Compare      └─▶ Developer / Methodology (Custom Tab)
                   │                                    ├─▶ S11 Cost-sheet upload ─▶ S12 Cost result / EMI stress test
                   │                                    ├─▶ V1–V7 Visualise
                   │                                    ├─▶ S14 Ask (project context)
                   │                                    └─▶ WhatsApp visit Flow (external)
                   └─▶ S13 Payment-safety check
Following ─ S15 Updates ─▶ S16 Alert detail ─▶ S06 | S17 Projects ─▶ S10 | S18 Searches ─▶ S03
Ask ─ S14a Threads ─▶ S14 Chat ─▶ tool cards ─▶ S06 / S07 / S03 / S12
You ─ S19 Privacy centre ─▶ S20 Who has my number ─▶ Revoke sheet | S21 Consent history | S22 Notifications
Global: S23 Verify number (modal sheet, returns to caller) · S00 Deep-link router
```

| Screen | Entry | Transition | Back |
|---|---|---|---|
| S02 Search view | Tap the search bar | Search bar expands [R7] | S01 |
| S03 Results | Search, chip, saved search, NL query | Shared axis Y | Sheet down one detent, then S01 |
| S06 Project | Card, pin, alert, chat card, App Link `/gurugram/projects/{slug}` | Container transform | Origin |
| S07 Risk card | Summary, chat card, WhatsApp link | Shared axis X | S06 |
| S08 Evidence | Any source chip | Modal sheet | Closes the sheet |
| S10 / S11–S13 | Tray, Following, tools, Ask attach | Shared axis X | Origin |
| V1–V7 Visualise | Explore, project, Ask, launcher shortcut | Camera fades in; result uses container transform | Previous step; confirm before discarding a result |
| S15–S16 Updates | Tab, push, WhatsApp "See details" | Container transform | S15 |
| S23 Verify | Follow on WhatsApp, visit, sync, handoff | Modal sheet | Cancels and returns to caller |

Web, app and WhatsApp share one URL scheme; Expo Router mirrors the Next.js routes (ARCH §2.3).

---

## 8. Sources (all accessed 18 Oct 2026)

- R1 MDC-Android Navigation bar: https://github.com/material-components/material-components-android/blob/master/docs/components/BottomNavigation.md
- R2 9to5Google, M3 Expressive navigation (14 May 2025): https://9to5google.com/2025/05/14/material-3-expressive-navigation/
- R3 MDC-Android Navigation rail: https://github.com/material-components/material-components-android/blob/master/docs/components/NavigationRail.md
- R4 Window size classes: https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes
- R5 MDC-Android Bottom sheets: https://github.com/material-components/material-components-android/blob/master/docs/components/BottomSheet.md
- R6 NN/G Bottom sheets: https://www.nngroup.com/articles/bottom-sheet/
- R7 MDC-Android Search: https://github.com/material-components/material-components-android/blob/master/docs/components/Search.md
- R8 MDC-Android Top app bar: https://github.com/material-components/material-components-android/blob/master/docs/components/TopAppBar.md
- R9 MDC-Android FAB: https://github.com/material-components/material-components-android/blob/master/docs/components/FloatingActionButton.md
- R10 MDC-Android Loading indicator: https://github.com/material-components/material-components-android/blob/master/docs/components/LoadingIndicator.md
- R11 MDC-Android Snackbar: https://github.com/material-components/material-components-android/blob/master/docs/components/Snackbar.md
- R12 Edge-to-edge: https://developer.android.com/develop/ui/views/layout/edge-to-edge
- R13 Android 16 behaviour changes: https://developer.android.com/about/versions/16/behavior-changes-16
- R14 Play target API: https://support.google.com/googleplay/android-developer/answer/11926878
- R15 Predictive back: https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture
- R16 react-native-screens #2540: https://github.com/software-mansion/react-native-screens/discussions/2540
- R17 Android accessibility: https://developer.android.com/guide/topics/ui/accessibility/apps
- R18 Notification permission: https://developer.android.com/develop/ui/views/notifications/notification-permission
- R19 Notification channels: https://developer.android.com/develop/ui/views/notifications/channels
- R20 SMS Retriever: https://developer.android.com/identity/sms-retriever
- R21 Phone Number Hint: https://developer.android.com/identity/phone-number-hint
- R22 9to5Google, Maps bottom bar (16 May 2024): https://9to5google.com/2024/05/16/new-google-maps-bottom-bar/
- R23 CNBC, Airbnb redesign (13 May 2025): https://www.cnbc.com/2025/05/13/airbnb-app-redesign-services-business.html
- R24 Zillow messaging (28 Oct 2025): https://zillow.mediaroom.com/2025-10-28-Zillow-launches-messaging,-a-new-way-for-home-shoppers-to-collaborate-within-the-Zillow-app
- R25 Zillow AI mode (25 Mar 2026): https://www.prnewswire.com/news-releases/zillow-debuts-ai-mode-bringing-guided-intelligence-to-every-step-of-the-housing-journey-302724267.html
- R26 Redfin conversational search (13 Nov 2025): https://www.redfin.com/news/press-releases/redfin-debuts-conversational-search-to-reinvent-how-people-find-homes/
- R27 Ask Rightmove help: https://faq.rightmove.co.uk/support/solutions/articles/7000100087-ai-search-and-ask-rightmove-
- R28 Rightmove conversational listings: https://www.rightmove.co.uk/press-centre/rightmove-extends-conversational-search-experience-to-property-listings/
- R29 Zillow Virtual Staging (10 Sep 2025): https://zillow.mediaroom.com/2025-09-10-Zillow-brings-AI-powered-Virtual-Staging-to-Showcase-listings
- R30 Boston.com, Zillow redecorate (28 Aug 2026): https://www.boston.com/real-estate/home-buying/2026/08/28/zillow-ai-staging-redecorating-tool/
- R31 IKEA Kreativ launch: https://www.ikea.com/us/en/newsroom/corporate-news/ikea-launches-new-ai-powered-digital-experience-empowering-customers-to-create-lifelike-room-designs-pub58c94890/
- R32 9to5Google, Lens camera (14 Jan 2025): https://9to5google.com/2025/01/14/google-lens-camera-launch/
- R33 VentureBeat, Pinterest Lens: https://venturebeat.com/business/pinterest-launches-lens-visual-search-in-beta-on-android-and-ios-in-the-u-s
- R34 Rödl, India SGI rules 2026: https://www.roedl.it/en-gb/it/insights/pages/tech-data-bites/2-26/beyond-draft-indias-amended-it-rules-synthetically-generated-information.aspx
- R35 Perplexity citations teardown: https://aiuxplayground.com/teardowns/perplexity/citations/
- R36 ChatGPT search: https://openai.com/index/introducing-chatgpt-search/
- R37 Gemini double-check: https://support.google.com/gemini/answer/14143489
- R38 Shape of AI: https://www.shapeof.ai/
- R39 WA reply buttons: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/interactive-reply-buttons-messages
- R40 WA lists: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/interactive-list-messages
- R41 WA CTA URL: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/interactive-cta-url-messages
- R42 WA template components: https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components
- R43 WA template categories: https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines
- R44 WA authentication templates: https://developers.facebook.com/docs/whatsapp/business-management-api/authentication-templates
- R45 360dialog auth TTL (secondary): https://docs.360dialog.com/docs/resources/authentication-messages
- R46 WA Flows components: https://developers.facebook.com/docs/whatsapp/flows/reference/components
- R47 WA Flows best practices: https://developers.facebook.com/docs/whatsapp/flows/guides/bestpractices
- R48 WA Flow JSON: https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson
- R49 WA Flows media upload: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload
- R50 WA sending a Flow: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/sendingaflow
- R51 WA service window: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
- R52 WA typing indicators: https://developers.facebook.com/docs/whatsapp/cloud-api/typing-indicators
- R53 WA media: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media
- R54 WA pricing: https://developers.facebook.com/docs/whatsapp/pricing
- R55 WA AI Providers: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/ai-providers
- R56 WA opt-in: https://developers.facebook.com/docs/whatsapp/overview/getting-opt-in
- R57 WhatsApp Business Messaging Policy: https://whatsappbusiness.com/policy/
- R58 Map UI Patterns, Search this area: https://mapuipatterns.com/search-this-area/
- R59 Maps Android clustering: https://developers.google.com/maps/documentation/android-sdk/utility/marker-clustering
- R60 expo-maps: https://docs.expo.dev/versions/latest/sdk/maps/
- R61 Gorhom bottom sheet: https://gorhom.dev/react-native-bottom-sheet/
- R62 QuickAuth DLT guide (secondary): https://quickauth.in/blog/dlt-registration-guide-india
