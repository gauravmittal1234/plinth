# Site-visit co-pilot (F-91) and Pay-as-built guard (F-92): design notes

**Screens (new):** `AppVisitPass`, `WaVisitPass`, `WebPayAsBuilt`, `AppPayAsBuilt` and `WaBeforePay`, in `scratchpad/canvas/project/`.
**Package:** B3 (gap G-10, plus the R1 10x picks #1 and #4). **Designer:** principal product design. **Date:** 18 Oct 2026.
**Rules applied:** DESIGN.md §0 taste pass first, then §2–§4c, §5b (canonical timeline), §6 copy and §7 format. Also PRD §20 (D13, F-91, F-92, F-94), and `fix-claims.md`, whose pipeline, row component and four verdict words these screens reuse.
**Checks run on every file:**
- an HTML tag-balance and attribute-quoting parse;
- one `support.js` tag, a doctype, and a Day/Night `theme` tweak defaulting to Day;
- every new image slot is an empty `<div>`;
- no `<form>`;
- a banned-pattern scan: glass, glow, banned fonts, emoji, all caps, stock phrases, "safe/guaranteed/fraud/scam/misleading", and "don't pay / do not pay / withhold";
- a Node run of `renderVals()` for every tweak combination. The run fires every handler, drains every timer, and resolves every `{{hole}}`, including inside nested loops.

All five files are clean. No browser was opened, so page heights and line wraps are estimated from type metrics.

## Summary

| Screen | Size | Tweaks | Signature live thing |
|---|---|---|---|
| **WebPayAsBuilt** | 1280 × 6300, `expand: fill` (Result). Add the letter and Reading: `min-height` 2100 | theme · step (Result, Add the letter, Reading) · case (Slab 12 letter, Stage not readable) | **Stage vs filing tower.** Tower A's 20 floors build bottom-up to the filed slab (ink, 45 ms stagger). The floors between the filing and the demanded stage hatch in on the claim tone. Two markers sit on the right: "Filed: slab 9" (ink pill) and "This letter: slab 12" (claim pill). A "3 slabs not on record" label sits on the gap. The Tower A/B/C switch and the − / + stage stepper move the markers live and rewrite the answer sentence |
| **AppPayAsBuilt** | 390 × 844 | theme · screen (Result, Add the letter, Reading, Write to Northfield) | The same tower in compact form (20 × 15 px floors), building on arrival |
| **AppVisitPass** | 390 × 844 | theme · screen (Visit pass, At the site, Recording your recap, Recap checked) · place (At the site, Not there yet) | **The recap check.** The buyer's own words stream in as a live transcript. On stop, each "They said / Records show" row lands with its verdict pill, and a 5-segment strip fills in verdict tones |
| **WaVisitPass** | 390 × 1340 | theme · stage (Visit pass, Reminders and check-in, After the visit), with an in-frame switcher too | The checked recap card (an image). Its strip fills one verdict at a time when the card arrives; Replay reruns listening, then checking, then the card |
| **WaBeforePay** | 390 × 1260 | theme · message (Payment request, Booking form, Demand letter) | The payee card ("0 of 3 match the account registered with HARERA"), or for a demand letter, the stage card with a mini tower |

**Suggested `canvas.json` entries.** I did not edit canvas.json. Other groups are still adding boards, so check x first. The right edges as I read them were web 32560, android 7440 and whatsapp 4220.
- `WebPayAsBuilt.dc.html`: page `web`, x 32640, y 0, w 1280, h 6300, `expand: fill`, title "Pay-as-built check", `is_interactive: true`.
- `AppVisitPass.dc.html`: page `android`, x 7520, y 0, w 390, h 844, title "Site-visit co-pilot", `is_interactive: true`.
- `AppPayAsBuilt.dc.html`: page `android`, x 7990, y 0, w 390, h 844, title "Pay-as-built check", `is_interactive: true`.
- `WaVisitPass.dc.html`: page `whatsapp`, x 4300, y 0, w 390, h 1340, title "WhatsApp · visit pass and recap", `is_interactive: true`.
- `WaBeforePay.dc.html`: page `whatsapp`, x 4770, y 0, w 390, h 1260, title "WhatsApp · before you pay", `is_interactive: true`.

**Image (generated 19 Oct 2026).** `demandLetter` (3:4, `/_blob/57870dcfd92321e78ef9ea1863f06a9e`), requested in `product/design/assets/requests_visitpay.json`. It is now an `<img data-slot>` in three places:
- **WebPayAsBuilt hero:** the full sheet.
- **AppPayAsBuilt Add and Reading:** a crop, 580 × 773 at −92, −224, showing the subject line to the due line.
- **WaBeforePay demand-letter case:** a first-page PDF preview.

The overlays were measured from the image pixels (896 × 1200; the sheet runs 83–816 × 77–1112 px):
- each sits on a paper-tone box sampled from the photo (rgb 231, 235, 239; table bands 223, 227, 231);
- a coverage check confirms every grey bar except the four body lines (left greeked on purpose) sits under a box;
- all overlay text is 13 px or larger.

The table's right column is narrow (126 px of 896), so the rows now read:
- Stage: casting of Tower A, slab 12 · 7.5%
- Instalment (₹) · 12,54,000
- GST at 5% (₹) · 62,700
- Total due (₹) · 13,16,700

The web hero figure widened slightly (flex basis 480, text column 540/600) so 13,16,700 fits its cell.

**Reused photos:** heroAurelia (pass), hoardingQrPanel, siteProgress, roomBare, costSheetDesk and receiptDesk (photo-checklist thumbnails), qprDesk (lag band), receiptDesk (ledger) and siteProgress (footer). That makes 4 pictures on the web page with demandLetter.

---

## 1. Flows

### F-91 Site-visit co-pilot: book → prepare → arrive → recap → checked

1. **Book.** The WaAlerts Flow is unchanged: date, time, visitors, consent, and B1's "Working with an agent on this project?" step. The pass shows the agent outcome: Rohan has "No agent of record", with "Add an agent" (links back to B1's step).
2. **Pass with questions.** The pass carries:
   - date, slot, visitors and the code **4821**;
   - "You don't have to give your number at the gate" (G-10);
   - 5 questions drawn from the records. Each pairs the record line with a question to say aloud, plus its source.
3. **Send ahead (optional, per question).** Two questions need papers: the Jul–Sep QPR receipt and which charges are optional. The buyer can send those to the sales gallery so the team can bring them.
   - Only the question goes, with the code. Never the number.
   - These are the two questions WebDevInbox already shows on Rohan's record.
   - In the app, each question has a "Send ahead" switch. On WhatsApp, two reply buttons: "Send those 2" / "Keep them private".
4. **Reminders.**
   - Fri 23 Oct, 6 pm: utility template, "Tomorrow, 11 am…".
   - Sat 24 Oct, 9 am: "Open directions" CTA.
   - If a filing appears before the visit, the questions update and the reminder says so.
5. **Arrive: "Where am I?" check-in.**
   - App: one-shot location matched against the project's RERA site boundary. It shows "You're at Aurelia Heights, Phase 2 · inside its RERA site boundary · checked in 10:52 am" and keeps only the time.
   - WhatsApp: the buyer shares a location pin, and Plinth replies with the same check-in.
   - The site office's own check-in by code (WebDevInbox) is independent of this.
6. **At the site.** Two tabs:
   - **Photos:** the RERA board on the hoarding; Tower A from the gate ("the last filing shows slab 9"); the sample flat; the cost sheet handed over; the bank details on the booking form. The last two can flow into Claims vs records and Before you pay.
   - **Questions:** an "asked" checklist.
   - The mic stays off: "Plinth never records the sales team."
7. **Recap.** After leaving ("I've left: record my recap"), or on the 2 pm WhatsApp follow-up, the buyer records their **own** recap.
   - The copy asks twice: "Only your own voice, please. Don't record the sales team."
   - A live transcript shows; type-instead is available.
8. **Checked.** The transcript goes through the F-90 extractor, and rules compare each item. The result is "They said / Records show" rows with the four verdict words.
   - The headline is "1 of 5 things they told you differ from the records." The lead row is "They said possession in Dec 2026 / Records show original completion Dec 2027, with 41% built."
   - The recap is filed privately as **Developer says · sales office · unverified · 24 Oct 2026**. It never publishes and never moves the band.
   - The audio is deleted after transcription.
   - Actions: Share with family (summary only), Ask about it, and Fix what I heard.
9. **Share my number (D13).** The pass says the buyer may tap to share their number with the site office after the visit, and that Plinth never asks on the office's behalf. The control itself sits in "Who has my number" (not drawn here).

### F-92 Pay-as-built guard: add → read → confirm → compare → act

1. **Add.** Web: drop a file, choose a file, take a photo, or try the sample. App: photograph, choose a PDF, or forward on WhatsApp. WhatsApp: forward the PDF.
2. **Read.** The demand-letter fields appear one by one: unit, stage, amount, due date and payee. Bank details are cut to the last 4 digits at ingest.
3. **Confirm (mandatory, as in F-90).** "Is this your home: A-1104 at Aurelia Heights, Phase 2?" Nothing is compared before the tap.
4. **Compare (present tense only).** The answer comes first: **"The latest filing shows slab 9. This letter asks for the slab 12 instalment."** Then the tower and the ledger:

   | Line | Letter says | Records show | Check |
   |---|---|---|---|
   | Stage | On casting of Tower A slab 12 | Slab 9 at the latest filing (as of 30 Jun 2026); nothing newer on HARERA | **Can't check yet** |
   | Plan | 7.5% at this stage | Your plan: 7.5% at slabs 3, 6, 9, 12, 15, 18, 20 | **Matches** |
   | Amount | ₹12,54,000 + GST ₹62,700 = ₹13,16,700 | 7.5% of ₹1,67,20,000; GST 5% | **Matches** |
   | Pay to | RERA Collection Account, ending 4417 | The HARERA-registered account | **Matches** |

   The stage uses **Can't check yet**, not "Differs". A QPR dated 30 Jun can never disprove a slab cast in Oct. This matches WebClaims's "Structure up to 12th floor" row. The gap is shown as a fact ("3 slabs above the filing"), never as an accusation.
5. **Act.**
   - **Ask for the certificate:** the architect's or engineer's certificate that slab 12 is cast, with the date.
   - **Write to Northfield:** a draft the buyer edits, copies and sends from their own email. Plinth never sends it.
   - **Pay on time if the stage is reached:** pay by 30 Oct 2026 into the account ending 4417. RERA s.19(6) makes paying on time the buyer's duty; s.19(7) adds interest for delay. A link leads to the payee check.
   - **See it yourself:** book a visit and count the floors.
   - "Tell me when it's filed": when the Jul–Sep QPR appears, the letter is re-checked and the buyer is told (feeds F-93).
6. **Never** "don't pay", "withhold", "illegal demand" or "the developer is wrong". "Whether and when to pay stays your decision."

### F-94 Before you pay, on WhatsApp

- **Payment request (default).** A forwarded message asks for the EOI of ₹11,00,000 to Northfield Realty Services LLP, A/c …8082, IFSC MRGL0000912, Marigold Bank. Plinth confirms the project, then sends the payee card: **0 of 3 match**. The card sets Payee, Account and Bank side by side: "Message says" against "HARERA shows".
  - Copy (from WebBeforePay): "This account doesn't match the one Northfield registered with HARERA for Phase 2. Pause before you pay. Ask Northfield to confirm the account in writing, on its letterhead. Call the number listed on HARERA, not one from a message."
  - Plus: "₹11,00,000 is within the ₹24.4 L…"
  - Replies: Draft a message · See HARERA account · Talk to a person.
- **Booking form.** A photo of the bank page matches **3 of 3**: "Pay by transfer or a cheque in this account's name, from your own account. Then send me a photo of the receipt." Replies: Send the receipt · Check the amount · Talk to a person.
- **Demand letter.** F-92 on WhatsApp: the stage card, with a mini tower, "Can't check yet" for the stage, and Matches for the amount and the payee. Replies: Draft the request · Tell me when filed · Talk to a person.
- **WhatsApp limits:**
  - reply buttons ≤ 3, longest "See HARERA account" (18), "Tell me when filed" (18) and "Share with family" (17);
  - CTA "Open the HARERA page" (20), "Open directions" (15), "Open your notes" (15);
  - the pass, reminders and recap prompt are **utility templates** the buyer opted into by booking;
  - the cards are session messages inside the 24-hour window.

## 2. States

| State | Where it's drawn | What the buyer sees |
|---|---|---|
| Pass, before the visit | AppVisitPass "Visit pass"; WaVisitPass "Visit pass" | Date, slot, code, "no number at the gate", agent outcome, 5 questions, send-ahead switches |
| Questions sent ahead / kept private | App switches (toast); WA "Send those 2" / "Keep them private" | "Sent to the sales gallery with code 4821. Only the question goes." / "Kept private." |
| Reminder; change or cancel | WaVisitPass "Reminders and check-in" | Day-before template; "Opens the booking form again…" |
| Locating → checked in | AppVisitPass "At the site" (1.4 s locating on arrival from the pass) | Fence drawing, dot inside, "checked in 10:52 am" |
| Not at the site yet | AppVisitPass place = "Not there yet" | "You're about 2.3 km away… the team can also check you in by code 4821." Checklist still usable |
| Photo taken / to take | AppVisitPass Photos tab | Thumbnail and time, or a camera tile. Tap to take |
| Recording idle / listening / writing | AppVisitPass "Recording your recap" (Start again → idle) | Waveform, live transcript, timer, "Recording only while the mic is on" |
| Checking → checked | AppVisitPass "Recap checked" (animated count when reached from Recording); WA Replay | "2 of 5 checked so far…", then "1 of 5 … differ" |
| Fix what I heard / Type it instead | App toast; WA "Fix what I heard" shows the transcript; WA "I'll type it" | Edit the transcript and re-check |
| Not now | WA "Not now" | "Send a voice note or type it whenever you like today" |
| Letter: add / reading / confirm | WebPayAsBuilt step; AppPayAsBuilt screen | Drop zone, then fields found one by one, then "Is this your home…?" |
| Stage ahead of the filing | Default everywhere | "The latest filing shows slab 9. This letter asks for the slab 12 instalment." |
| Stage on record | Web stepper to slab 9 or below, or Tower B or C | "Slab 6 is on record. A demand for it matches the filing; check the payee, then pay on time." |
| Stage one slab ahead / adjacent | Web stepper (e.g. Tower C, slab 6) | One combined marker: "Asked 6 · filed 5" |
| Stage not readable | WebPayAsBuilt case "Stage not readable" | Stage blurred on the letter; "Pick it with the − and + buttons"; ledger row "Couldn't read it" |
| Not my home / wrong project | Web "No, pick the project"; App "Not mine"; WA "No, another one" | Back to Add, or "Which project is it?" |
| Payee differs / matches | WaBeforePay Payment request / Booking form | 0 of 3 or 3 of 3, with the next step |
| Specified for build, not drawn | — | Filing without slabs by tower (compare by % built, then "Can't check" on the slab); a non-slab stage (brickwork, flooring), compared with QPR activity %; a letter for another phase; demand amount ≠ plan % (amount row **Differs**, with the arithmetic shown); the new QPR arrives (auto re-check plus a WA message); a recap with no checkable claims ("Nothing in your note is in a record we hold; it's saved as your notes"); two voices detected in the audio (we discard it and ask for the buyer's own recap) |

## 3. Data and AI

**Records (deterministic):**
- **HARERA registration:** original completion, extensions, the RERA collection account (holder, bank, IFSC, full number kept server-side, last 4 shown).
- **QPRs:** slabs by tower (from Oct–Dec 2024 for Northfield), % built, the as-of date and the filing date. The **QPR register** gives missing and late filings.
- **From the developer** (labelled, never "records"): price list, cost sheet and payment plan (stages and %).
- **The buyer's own documents:** the agreement price and plan (when uploaded), demand letters and receipts.
- **Project site boundary:** a polygon digitised from the HARERA site plan or DTCP licence map, with a ~150 m buffer for the gate and sales gallery.
- **The visit record:** code, slot, consent C-1018-11, agent of record and questions sent ahead.

**Question generator (rules, no AI prose).** About 10 templates fed by truth-panel facts, ranked:
1. a pending or missing filing;
2. the latest slab by tower;
3. the collection account (always);
4. completion date vs % built (always);
5. charges, when a cost sheet exists;
6. late QPRs, extensions and orders as alternates.

At most 5 questions. They refresh when a filing lands before the visit.

**AI, behind the model gateway, schema-locked, no tools:**
- **Speech-to-text** (English and Hinglish), shared with F-90 voice notes. The audio is deleted after transcription. A **PII scrubber** removes people's names and phone numbers from the transcript, so nothing about the salesperson is kept.
- **`extract.visit_recap@1`** is the F-90 claim schema plus types for:
  - possession or completion date;
  - construction stage claimed;
  - a filing claim ("QPR filed on…");
  - price;
  - an offer or waiver;
  - payment instructions.

  A second reader runs; disagreement or low confidence sends the item to a person (concierge first).
- **`extract.demand_letter@1`** returns `{letter_date, ref, unit, tower, stage_type, stage_number, percent, amount, gst, total, due_date, payee_name, account_last4, ifsc}`. Bank digits beyond the last 4 are dropped at ingest. A person reviews every demand check for the first months (shortlist).
- **Payee extraction from forwarded text and images:** a regex for account numbers and IFSC first, the extractor second.

**Comparators (rules, not AI):**
- stage vs QPR slab for the buyer's tower, always showing the filing's as-of date;
- plan % vs the payment plan;
- arithmetic vs the agreement price;
- payee vs the registered account (name tokens, every digit, IFSC);
- date vs the registration;
- price vs the price list;
- offers → Not in records.

When unsure, the verdict is **Can't check**.

**Triggers:** a new QPR fetch re-runs the open demand checks and recaps and sends a WA utility message (F-93). The reminders are utility templates.

**Measures before launch:**
- recap claim precision and recall on ~200 consented test recaps;
- the false "Differs" rate (target near zero);
- stage-check agreement with the certificates buyers later receive;
- the share of demand checks that end in a certificate request;
- time to result (WA < 1 min);
- questions sent ahead vs answered at the visit (from the developer inbox).

## 4. Legal flags: **MARKED FOR LEGAL REVIEW**

Every element listed here carries `data-review="legal"` in the markup.

1. **RERA s.19(6) / s.19(7) wording:** "paying on time is your duty under the agreement; s.19(7) adds interest for delay". Confirm the characterisation, and whether to name the Haryana rule for the interest rate. We deliberately show no rate.
2. **"Can't check yet" for a demanded stage, and the gap sentence** ("3 slabs above the filing"). Is this defamation-safe and free of any implied accusation? We never use "Differs" for a stage, because QPR timing can't disprove it.
3. **"Ask for the architect's or engineer's certificate."** Can we say such certificates exist for each stage, given s.4(2)(l)(D) withdrawal certification and the Haryana QPR certificates? The copy currently makes no claim that they exist, only the suggestion to ask.
4. **The draft letter (web, app, WhatsApp).** Is a pre-filled letter legal advice or practice of law? It is framed as a draft the buyer edits and sends, with "not legal advice". The closing line is "I want to pay each instalment on time, and these papers will help me do that". It must never read as a refusal to pay.
5. **"Whether and when to pay stays your decision"** and "Pause before you pay" (payee mismatch, inherited from WebBeforePay): confirm that these are information, not advice.
6. **Voice recap:**
   - We ask for the buyer's own voice only, but cannot stop a buyer recording a salesperson.
   - Confirm the policy: two-voice detection → discard, and the PII scrubber.
   - Filing a private note labelled "Developer says · unverified" about what a third party said: confirm under DPDP and defamation.
7. **Questions sent ahead:** do they fit the existing consent C-1018-11 ("first name and visit time for this visit"), or need a new consent reference?
8. **Location check-in:** one-shot use, keeping only the time; confirm the DPDP notice wording.
9. **Forwarded messages and letters containing third-party bank details** (the LLP account): confirm retention (we keep the result and the last 4 digits only) and that "I keep the result, not the bank details" is accurate in the pipeline.
10. **A demand letter is a private contract document:** confirm the processing basis and the 30-day deletion default.

## 5. Facts added to §5b

Added under "**Site-visit co-pilot and Pay-as-built (added 18 Oct 2026, B3…)**", just above §6:
- **Rohan's 5 questions:** the exact wording, sources and the two sent ahead. Agent of record: none.
- **Visit message times:** booked 9:15 am (as WebDevInbox); reminders Fri 23 Oct 6 pm and Sat 24 Oct 9 am; recap prompt 2 pm.
- **The visit-day assumption:** no new filing between 18 and 24 Oct, and the band still Elevated on 24 Oct. Check-in 10:52 am; app recap 12:25 pm (1 min 12 s); WA voice note 2:04 pm.
- **The 5-item recap check** with verdicts, and its headline.
- **Pay-as-built allottee:** Kavya Nair, A-1104, booked at launch, price ₹1,67,20,000, 52.5% paid. The name avoids the existing "Meera".
- **The demand letter:** ref, amounts (₹12,54,000 + ₹62,700 = ₹13,16,700), due date 30 Oct 2026, payee ending 4417, and the check result.
- **The WhatsApp payee-check example** (0 of 3; the booking form 3 of 3).

## 6. Decisions on the open questions (coordinator, 19 Oct 2026)

1. The stage keeps **"Can't check yet"**: the four-word vocabulary holds.
2. The visit-day frames keep the assumption that the Jul–Sep QPR is still missing on 24 Oct.
3. The booking time is **9:15 am** everywhere; WaAlerts has been fixed.
4. WaAlerts contains B1's "Working with an agent?" step (Flow screen 3 of 4). It has no `agent-step` id, so AppVisitPass's "Add an agent" now links to `./WaAlerts.dc.html`.
5. The demand letter stays as WaBeforePay's third case.
6. Kavya's price is confirmed (₹1,67,20,000).
7. Questions sent ahead fall under **C-1018-11**; the WebDevInbox purpose text is updated. Legal flag 7 is therefore closed.

## 7. Self-critique (not measured in a browser)

| Screen | §8 gate (/50) | Lowest scores and what to do next |
|---|---|---|
| WebPayAsBuilt | **44**: question 5, evidence 5, hierarchy 4, readability 4, accessibility 4, trust 5, India-fit 4, consistency 5, states 4, delight 4 | 1. The 6300 height is estimated; re-measure once rendered. 2. The ledger's four-column grid is tight at 1280 (the "Records show" column wraps to 4–5 lines). 3. The letter overlays are unverified until `demandLetter` is generated. 4. Count of type sizes: display, H2, 36 statement, 21/19 body, 15/13 small. That is five, with 26/28 H3s on the edge |
| AppPayAsBuilt | **43** | The result screen is long (tower plus 4 rows plus actions) and the actions sit below the fold. The bottom bar carries the main act ("Write to Northfield"). The reading crop depends on the generated bars |
| AppVisitPass | **44** | Four screens behind one tweak; internal navigation works too. The pass screen is long, and the question list starts below the fold on 844. The photo thumbnails are illustrative stand-ins |
| WaVisitPass | **42** | Stage 1 sits right at the frame height, so the top of the pass may clip by a few px. Real WhatsApp keeps reply buttons visible after a tap; we show "spent" styling on the pass and hide others, as WaClaims does |
| WaBeforePay | **42** | The demand-letter card packs a sentence, a tower and three rows into 288 × 352. Check legibility once rendered as a 1080 px PNG |
