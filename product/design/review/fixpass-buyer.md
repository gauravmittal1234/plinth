# Fix pass: buyer project experience

18 Oct 2026. This pass fixes the Critical and High buyer gaps in `product/evaluation/consumer.md` that sit on the project page and the money moments. It covers PRD §20 F-94, F-95, F-96 and F-97. The work is in the canvas working folder (`canvas/project/`); canvas.json was not touched.

| File | Status | Size (w × h) | Interactive |
|---|---|---|---|
| `WebProject.dc.html` | edited | 1280 × 11,560 (was 8,320) | yes |
| `AppProject.dc.html` | edited | 390 × 7,500 (was 4,200) | yes |
| `WebBeforePay.dc.html` | new web page | 1280 × 6,520 | yes |
| `WebProjectStates.dc.html` | new web page | 1280 × 3,760 | yes |
| `AppBeforePay.dc.html` | new phone screen | 390 × 844 | yes |

**How the work was checked.** No browser was opened. Each file passed these checks:
- tags balanced and no stray self-closing tags;
- every attribute quoted;
- exactly one `support.js` line;
- `data-props` parses as JSON;
- no emoji and no banned words (safe, avoid, fraud, risky, guarantee…);
- no glass and no glow.

The logic then ran in node in Day and Night and in 4–7 UI states per file. Every `{{hole}}`, nested loops included, resolved to a value, and every handler was called once and the page rendered again.

Heights were estimated by adding up the sections. The web roots use `min-height` with a `flex: 1` footer to soak up any slack. The canvas entries for WebProject (h 8,320 → 11,560) and AppProject (h 4,200 → 7,500) need updating by the lead.

---

## 1. WebProject (edited)

Story order is now:
1. Hero.
2. Will it be delivered on time?
3. How much is built?
4. **What are the homes like?** (new)
5. What will I really pay?
6. **Can we afford the wait?** (new)
7. Picture yourself here.
8. What do the records show?
9. Ask anything.

Bands still alternate `bg` / `track`. The cost section moved to `track`, and its EMI panel, tags, chips and All-in row were re-toned to match. In-page nav: Delivery risk · Built · Homes · Cost · Ask (5 links). Records stays reachable from every source chip.

| Change | Gap |
|---|---|
| **The risk answer now gives a keys-relevant date.** It reads: "Original completion Dec 2027. Between 30 and 45 of 100 similar Gurugram projects got their OC more than 12 months late, which here means after Dec 2028." The icon-array sentence becomes "…within 12 months of the date: some on time, some up to a year late." | G-06 |
| **OC ≠ keys.** One line under the band: "The OC is not the keys. Possession comes after it: the developer offers it, you pay the last 5% and register the sale deed." It links to the wait section. Repeated in Records → OC/CC and in the wait assumptions | G-06, G-41 |
| **Pending public fact, next to the answer.** "The Jul–Sep 2026 QPR is not on HARERA yet. It was due 15 Oct 2026…" plus a neutral marker: "If it is still missing on 25 Oct 2026, this band may change; followers hear first." The developer's claim ("filed on 12 Oct 2026") sits in a Developer-says tone field. The new band itself is not shown (7-day notice, PRD §6.2). The live strip now reads "latest QPR on file: Apr–Jun 2026", not "next QPR due 15 Jan 2027" | G-07, G-03 |
| **What are the homes like?** A 3 BHK / 4 BHK selector drives an SVG floor plan drawn by us. The plan has walls, door swings, windows, a sliding balcony door, room names and sizes in feet, and a north arrow; it is plainly a plan, not a photo. Four facts per layout, each in its evidence lane: carpet area (Records show, HARERA), super area (Developer says, cost sheet), base price (Developer says, price list) and all-in (Our estimate). For the 4 BHK it says plainly that there is no cost sheet, so no all-in yet. Then three short lists: towers and homes (Records show), amenities (Developer says, brochure) and getting around (Our estimate) | G-02, G-22 |
| **"From the developer" block (expander).** A claim-tone field, labelled as coming from Northfield's free workspace and never moving the band. It holds the price list dated 2 Oct 2026 (with ₹/sq ft carpet), the four price lists on file (bars for the 3 BHK, figures for both) and the construction-linked plan. Each stage is marked on record or not, and slab 12 is flagged: "Northfield sent buyers a demand for this on 10 Oct 2026. The latest QPR shows slab 9" (the F-92 example). It closes with a link to the before-you-pay check | G-02, G-14 (partly), F-63+ |
| **Can we afford the wait?** Live. Inputs are household take-home pay and rent (defaults ₹4,50,000 and ₹55,000). It reuses the down payment and rate from the EMI sliders above. Outputs, all recomputed as you type: <br>• a plain answer sentence, rent + pre-EMI ₹1,18,077 now rising to ₹2,00,563 by Dec 2027 (26% → 45% of take-home); <br>• a 12/24-month toggle and the cost of the delay in rupees (₹24.1 L / ₹48.1 L); <br>• the band's frequency line; <br>• a month-by-month stacked column chart (pre-EMI and rent, hatched in the band colour for the delay months, a half-of-take-home reference line, and a hover readout); <br>• Now / By Dec 2027 / After keys figures. <br>The "How we worked this out" expander lists the assumptions (payout in step with the plan; delay after finishing; s.18 interest left out) and a table view. Framed as "Arithmetic, not advice"; inputs stay on the device | G-04 |
| **Link to Before you pay** from the wait section (ink pill "Check before you pay anything") and from the payment plan | G-01 |
| **Fixed to match §5b:** <br>• replay "band then" shows Moderate for every quarter, and the last stop reads "Elevated since 2 Oct 2026"; <br>• the story's Today chapter says when and how the band moved; <br>• the cost-sheet evidence is dated 2 Oct 2026, not Sep 2026, and lists PLC ₹2.9 L, club ₹1.5 L, parking ₹3.5 L and IFMS ₹1.3 L; <br>• "Negotiable" becomes "Partly negotiable", with the PLC + club ₹4.4 L note; <br>• the orders evidence now runs to 9 Oct 2026; <br>• the all-in is labelled as one park-facing unit, cost sheet of 2 Oct 2026 | G-03, G-22 |

The page's signature is still the replay tower. The plan, the selector and the wait chart are quiet: they change on tap or input, with no idle motion.

## 2. AppProject (edited)

Order:
1. Hero.
2. Risk.
3. Built.
4. **Homes** (new, `bg`).
5. Pay (now `track`).
6. **Afford the wait** (new, `bg`).
7. Furnish.
8. Footer.

| Change | Gap |
|---|---|
| The same risk sentence with the Dec 2028 OC line; the OC ≠ keys line; the pending-QPR fact with the Developer-says tone field and the 25 Oct marker. The live strip is fixed | G-06, G-07, G-03 |
| **Homes**, built for the phone. A 3 BHK / 4 BHK segmented control. A 358-px plan with its own scale (labels never under 13 px; "Master" for the master bedroom, "WC" where a toilet is under 40 px wide; the 4 BHK utility is labelled only in the alt text). Four facts with lane lines. "Amenities and getting around" and "From the developer: prices and plan" sit in expanders; the second flags the slab 12 demand | G-02 |
| **Afford the wait.** Take-home and rent inputs, a 12/24-month toggle, the delay cost, the band's frequency line, a mini chart, Now / By Dec 2027 / After keys, the assumptions in one paragraph and "Check before you pay anything". The app has no EMI sliders, so it states its loan: 20% down, 8.50%, 20 years. Its figures match the web defaults exactly | G-04, G-01 |
| **Consistent with §5b:** <br>• no Elevated before 2 Oct 2026 (all eight replay quarters are Moderate "band then", and the Jun 2026 note explains the 2 Oct move); <br>• the cost lines now read base ₹2.35 Cr, PLC ₹2.9 L, club ₹1.5 L, parking ₹3.5 L, IFMS ₹1.3 L, charges ₹9.2 L, GST ₹12.2 L, stamp duty and registration ₹17.6 L, all-in ₹2.74 Cr; <br>• "EDC/IDC" is removed; <br>• the cost sheet is dated 2 Oct 2026, with the park-facing unit and the ₹4.4 L negotiable note | G-03, G-21/G-22 (copy) |

## 3. WebBeforePay (new, F-94)

Sections:
1. Hero: "Before you pay anything", with the sales-gallery photo and "Plinth never takes, holds or moves your money. We check; you pay, from your own account."
2. **Who are you paying?** (signature).
3. **How much can they ask for now?**
4. **Will the EOI come back?**
5. **Keep the receipt**.
6. Footer close with the keys-on-deed photo.

The hero lists the four checks as links, each with its live status ("Doesn't match", "Within the limit", "3 of 5 in writing", "After you pay").

- **Signature live thing: the payee check.**
  - The buyer types the payee name, account number and IFSC. Each is compared with the collection account registered with HARERA (Aurelia Heights Ph 2 RERA Collection Account, Northfield Estates Pvt Ltd, Peepal Bank, ending 4417, IFSC PEPL0000418).
  - Each row reads Matches, Differs, Check (last digits only, or a short name) or Not entered.
  - A three-part meter fills as fields match. The verdict panel changes tone: mint "Matches…", ink "Doesn't match the account registered with HARERA" (pause; ask for written confirmation on letterhead; call the number on HARERA, not one from a message), or neutral "Fill in all three".
  - Rows stagger in on load.
  - A `payee` tweak switches between the WhatsApp-message example (mismatch, the default) and the booking-form example (match). Both are typed values, so editing them re-runs the check live.
- **10% cap.** ₹24.4 L = 10% of ₹2.44 Cr (base + charges, cost sheet of 2 Oct 2026), RERA s.13.
  - Inputs for "about to pay" and "paid already", and a stage switch (before or after the registered agreement).
  - A bar with the limit notch; anything over the limit is hatched.
  - Live result copy. After registration it points to Pay-as-built for the slab 12 demand.
  - A payment-method switch. Cash is answered with "Pay by bank transfer or cheque instead…"
- **EOI terms.** "Registered with HARERA" is pre-checked from records, and it cites RERA s.3. Five terms each take Yes / No / Not stated. The summary is live ("3 of 5 terms are in writing…"). It cites the HARERA Gurugram 2018 earnest-money regulations (10% cap on forfeiture).
- **Receipt.** "Add the receipt" (the page's one accent action) shows a receipt card with three checks: paid into the registered account, within the limit, and a unit number missing. Kept until you delete it; only you see it.

Gaps: G-01 (the whole flow), missing screen #1. It also lands quick win 9 ("We don't book units, negotiate or take payments").

## 4. WebProjectStates (new, F-96)

A `state` tweak selects Severe · Limited history · Not scored · Stalled. Each state shows:
- the page top: header chip, photo hero, title, one plain summary line, the quoted price and how all-in is handled, and Follow / Ask / "Already booked here?";
- the risk answer;
- an **"If you've already booked here"** panel.

| State | Project | Risk answer | Instrument |
|---|---|---|---|
| Severe | Laurel Residency | Severe, "set by red-flag rule 1, not our model". The NCLT order of 12 Mar 2023 is against a group company. Original date Jun 2026 has passed with 34% built; keys come after the OC. A Stall flag sits beside the band. What would change it: the case closing or being set aside | The band scale at Severe, plus a rule tone field (no frequency is shown when a rule sets the band) with NCLT / IBBI chips |
| Stalled | Laurel Residency (same page top) | "Is it still being built?" No progress in its last 4 QPRs, 34% in each from Jul–Sep 2025 to Apr–Jun 2026. The flag is never averaged in; what would lift it | Four equal slabs at 34% plus a promised-time bar running past 100% (hatched) to "Today, 106%" |
| Limited history | Juniper Enclave | "New developer · no penalty". We score a group after 3 finished projects. Dec 2029, 9% built, 31% of time used | "What to check instead": directors (MCA), DTCP licence, escrow CA certificates, progress against time, each with a source chip |
| Not scored | Heron Point, Phase 2 (Heronstone Projects, a Northfield company; registered Apr 2026) | Less than 6 months registered; its group has a record (2 of 6 late) | What to check: the group's record and its ongoing phases, registration documents, escrow, the first QPRs |

On Laurel's live page, the Severe answer and the stall answer stack, Severe first. The tweak shows each component on its own.

**If you've already booked here** (calm, factual; no "avoid" and no "fraud"):
- **Where to complain:** HARERA Gurugram, Form CRA; compensation goes to the adjudicating officer, Form CAO.
- **Refund rights:** RERA s.18 gives a refund with interest or monthly delay interest, at SBI's highest MCLR + 2% in Haryana. Not-scored projects add the s.13 10% rule before the agreement.
- **Homebuyer associations:** RERA s.31 lets an association of allottees file. For Laurel only: if insolvency is ever admitted against this project's promoter, homebuyers claim as financial creditors through the resolution professional.
- **What to watch:** the next QPRs, demand letters against stages (Pay-as-built), NCLT/IBBI lists, new orders.

An **"I've booked here"** toggle switches alerts to allottee wording. It links to Before you pay.

Gaps: G-05, G-19 (toggle), G-23 (Limited history is "no penalty"; Not scored says why), missing screens #4 and #9. Not built here: the stale-data variant and the "new filing received, reading by [date]" state from G-07 / missing screen #5.

## 5. AppBeforePay (new, F-94, 390 × 844)

The same check as the web page, one step per screen:
- a 4-part progress bar, with the step announced to screen readers only (no visible numbers);
- the step's content in a scroll area;
- a bottom bar with Back and "Next: how much / the EOI / the receipt" (the accent action), then Done.

The steps:
- **Payee.** Each field carries an inline status pill and its registered value underneath. Then come the verdict, the meter and the registered-account note.
- **Amount.** The ₹24.4 L cap, the stage switch, two inputs, the bar, the result and the payment method.
- **EOI.** The live summary sits at the top, followed by the registered row and the five Yes / No / Not stated terms.
- **Receipt.** "Photograph the receipt" (camera only on tap), or a PDF, then the receipt card with its checks.

Tweaks: `step`, `payee`, `receipt`, `theme`.

## Facts added to DESIGN.md §5b

The rule is "if a screen needs a fact that is not here, add it here first", so I added:
- **Aurelia:** room sizes for both layouts, amenities, getting-around estimates, the price list and its history, the payment stages (52.5% due at registration today) and the RERA collection account. Also the WhatsApp mismatch example, the 10% cap and receipt examples, and the afford-the-wait defaults with their outputs.
- **Laurel:** QPR quarters, 106% of time used and the quoted price.
- **Juniper:** facts collected in one place.
- **Heron Point Ph 2:** the Not-scored example (taken from WebDeveloper).

## Image requests (`product/design/assets/requests_fix-buyer.json`)

- `heroHeron` (16:9): a levelled, fenced plot with a blank site hoarding, before construction. It is the WebProjectStates hero for Not scored; the slot is an empty div until generated.
- `receiptDesk` (4:5): a stamped receipt and a cheque counterfoil on a teak table. It is the WebBeforePay "Keep the receipt" picture; empty slot.

Reused: heroAurelia, siteProgress, roomBare and the staged rooms, cameraSite, heroLaurel, heroJuniper, ordersDesk, salesGallery, costSheetDesk and deedKeys.

## For the lawyer list (PRD §12.3)

The copy states these as law, so each needs a lawyer to confirm:
- RERA s.13 (10% before a registered agreement), s.3 (no booking before registration), s.18 (refund or delay interest), s.31 (association complaints);
- Haryana rule 15 (SBI highest MCLR + 2%);
- HARERA Gurugram Forms CRA / CAO;
- the HARERA Gurugram 2018 earnest-money regulations (10% forfeiture cap);
- IBC treatment of homebuyers as financial creditors.

## Still open

- Before you pay on **WhatsApp** (G-01 asks for all three surfaces).
- The **stale** and "new filing received" states (G-07).
- An app version of the hard states. F-96 lists App, but this pass built only the web artboard.
- A loans card (G-15) and a full payment-plans explainer (G-14); the plan is shown, not explained.
- Rendering check: the heights above are estimates. The first render should confirm WebProject ≈ 11,560 px and AppProject ≈ 7,500 px, then the canvas entries should be updated.
