# Fix pass: trust, sign-in and scope (G-09, G-11, G-12, G-20)

**Date:** 18 Oct 2026. **Owner:** principal product design.
**Screens (all new):** `WebAbout`, `WebSignIn`, `WebPricing` and `AppOnboarding`, in `scratchpad/canvas/project/`. No existing artboard, `canvas.json` or `DESIGN.md` was edited.
**Rules applied:** DESIGN.md §0 (taste pass), §3–§4c, §5b (canonical facts; "never shared without your tap") and §7 (format). PRD §2, §6.2, §12, §13.2, §14, §15, §17 and §20.
**Vocabulary:** taken from `WebMethodology` and `AppYou`. That covers:
- the plain sticky header with one action, and the slab footer that closes on a full-width "Plinth";
- the borderless risk chip, tone fields (`claimBg`, `track`) and filled source chips;
- the `rise` / `rv` / `drift` motion, with everything off under reduced motion;
- bottom sheets and toasts, which are the only things that cast a shadow.

---

## 1. What each gap needed, and where it is now

| Gap | What was missing | Where it's closed |
|---|---|---|
| **G-09** Nobody says who Plinth is or whether it has been right | Company, founder, address, funding, holdings, insurance, grievance officer, dispute response times, calibration | **WebAbout**, top to bottom: "Who runs Plinth?" (identity register, founder block), "Were we right?" (calibration table, signature), "How do we make money?", "Do we hold any stake?" (holdings register), "How fast do we answer?" (response-time board, grievance officer, insurance, legal notices) |
| **G-11** No sign-in, onboarding or account linking | Web sign-in with a WhatsApp code; app first run; one account across web, app and WhatsApp | **WebSignIn**: phone → code → "We found your WhatsApp follows" → "One account, three places". **AppOnboarding**: welcome card → what you're buying → where (location just in time) → sign in → code → follow your first project → alerts (utility only) → done |
| **G-12** The free/Pro line is undefined and contradicts the screens | A public line between free and Pro, and a paywall that never gates evidence | **WebPricing**: "What's free, for good?", "What does Pro add?", a live Free/Pro sample page (signature), "Never on a Plinth paywall", refunds and pricing promises. Pro is redefined so it no longer contradicts free alerts and compare (see §4) |
| **G-20** R1 scope isn't stated, and screens imply partners that don't exist yet | "What Plinth does today / next", with dates and notify-me | **WebAbout** "What do we cover today?" (R1 list, then "Not yet, and when" with planned dates and a notify toggle for each item). Also in the money ledger ("From R2, planned for 2027"), WebPricing "What costs money later?", and the app's "A ready flat" option |

**Also touched along the way:**
- **G-08:** the base-rate line. The calibration footer gives "All bands: 36 of 100" as the Gurugram base rate.
- **G-15:** says plainly that loans arrive in R2, Jan–Mar 2027.
- **G-17:** international country codes at sign-in.
- **G-21:** all-in price first in the app's follow list.
- **G-23:** "less certain" sits after the sentence on the Pricing sample.
- **G-30:** Golf Course Ext Rd is "planned for Dec 2026".
- **G-38:** no prototype levers inside the UI. State is driven by the `step` / `view` tweaks.
- **Missing-screens items:**
  - **6:** sign-in, first run and linking: done.
  - **8:** free/Pro page and paywall: done.
  - **10:** "Who we are": done.
  - **21:** consent history and data download: only partly done (see Q20).

---

## 2. The four artboards

### WebAbout: "Who is Plinth?" (web page, 1280 × ~10,000)

**Sections, in order:**
1. **Hero.** H1 "Who is Plinth?" with the new `aboutTable` slot. The primary action is "See if we were right".
2. **Who runs Plinth?** The founder block sits on the left: a real-photo placeholder, never AI, plus a quote placeholder. On the right is a register: company, CIN, office, GSTIN, founder, team, funding, method committee and HARERA agent status.
3. **Were we right?** (signature, below).
4. **How do we make money?** salesGallery bleeds in from the left. The ledger has three parts: **Today** (Pro ₹999); **From R2** (loan ~0.35% Jan–Mar 2027, Verified Flat Check ₹6,999 and resale 1% + GST, both Apr–Jun 2027); **Never** (a claim tone field).
5. **Do we hold any stake?** A holdings register (real table), with deedKeys beside it. "A booked flat counts as a stake."
6. **How fast do we answer?** A response-time board (real table) covering error reports, developer disputes, clerical fixes, grievances and data requests. Each row shows our promise, a typical-time bar against that promise, on-time count, open count, and a "Latest cases" expander that pulls from the public log (D-127, D-118, D-104, CL-201). One miss is shown on purpose (E-0412, 2 days late). The grievance officer, insurance and legal notices sit below the board.
7. **What do we cover today?** A full-bleed corridorAerial band, then "Today, in R1" and "Not yet, and when": Golf Course Ext Rd Dec 2026; loans R2 Jan–Mar 2027; resale, Verified Flat Check and the iPhone app R2 Apr–Jun 2027; Noida/GNW and possession help R3 Jul–Sep 2027. Each has a Notify me toggle.
8. **Slab footer.**

**Signature live thing: the calibration table.**
- Each band row has a dot-and-range plot. The hatched band-ink range is what we said; the ink dot is what happened. The dots slide in on scroll (scroll-driven, transform only).
- Picking a band fills an icon array of that band's actual projects, one dot per project, with the late ones in band ink. It comes with a verdict sentence, plus "How we score the whole table" (Brier 0.19 against 0.23 for always saying "36 of 100").
- A visible claim-tone pill reads **"Illustrative numbers. They show the method; the published table replaces them."**
- Moderate is shown on purpose as a miss: 31 against a range of 15–30. That shows we would publish a miss.
- Below the table: **"Our own record starts now"**. The table is hindsight. The first live bands went out on 15 Jul 2026, and the first forward check is due in Jul 2027 "even when it is bad news". There's a 4-step timeline and the header action, "Follow our record".

**Tweaks:** `theme` (Day/Night) and `band` (the calibration row selected first; default Elevated).

### WebSignIn: "Sign in to follow Sapphire Grove" (web, 1280 × 900, fluid)

**Value before the ask.**
- The Sapphire Grove, Phase 1 risk card stays fully open on the left: band, frequency, 3 sourced reasons and the all-in price.
- It says: "You're reading this without an account. Bands, reasons and sources never need one. Signing in only lets us alert you."
- "Not now, keep reading" is always there.

**The four states, set by the `step` tweak or by the buttons:**
1. **Phone.**
   - Mobile number with a country code (+91, +971, +1, +44, +65), so NRIs can sign in.
   - "Send the code by WhatsApp | SMS", validation ("Enter a 10-digit mobile number, starting with 6, 7, 8 or 9."), then "Send code on WhatsApp".
   - Consent in plain words: "We use your number to sign you in, and for alerts you switch on. It is never shared without your tap. Privacy notice".
2. **Code.**
   - 6 cells over one real `one-time-code` input. "It works for 10 minutes."
   - A resend countdown ("New code in 0:24" → "Send a new code"), "Send by SMS instead" and "Change number".
   - **How to spot the real message:** the WhatsApp authentication template text (the same as WaAlerts), plus "Plinth never calls to ask for this code."
3. **Bring follows.**
   - "We found your WhatsApp follows": Aurelia Heights Ph 2 (followed since 14 Sep 2026), Kestrel Park (since 9 Oct 2026) and the Aurelia 3 BHK cost sheet of 2 Oct 2026.
   - "Bring them here?", with "Bring them here" and "Not now". Nothing is pre-ticked, nothing is merged without a tap, and "Nothing changes on WhatsApp".
   - One optional box, unticked: "Also send Sapphire Grove alerts on WhatsApp". Utility only; reply STOP to end.
4. **Done: "One account, three places".**
   - **Signature move: the merge.** The two WhatsApp follows slide into the web Following list beside the new one.
   - A three-row summary: Web, Android app ("sign in with the same number") and WhatsApp (masked number, which alerts go there).
   - "Open Following" and "Who has my number".

**Tweaks:** `theme` and `step` (Phone / Code / Bring follows / Done).

### AppOnboarding: first run (Android, 390 × 844)

**Steps** (set by the `step` tweak, or tap through with Back, Skip and the bottom action):
1. **Welcome: "Know before you book."** The value comes first. **Signature: the card that builds.** Pick Aurelia, Kestrel or Coral, and the risk card assembles in sequence:
   - the 5-segment meter fills segment by segment;
   - then the band name, the frequency sentence and the built bar (accent, `scaleX`);
   - then the all-in price and the source chip.
   "Explore without an account" is offered on the first screen.
2. **What are you buying?** Three radio rows, none preselected:
   - A flat being built: "what Plinth rates today";
   - A ready flat: "Full checks arrive in R2, planned Apr–Jun 2027";
   - Just checking: "…or one you have already booked".
   "Your answer stays on this phone."
3. **Where are you looking?** Corridor chips (Golf Course Ext Rd shown as "from Dec 2026"). **Location is asked just in time:** "Use my location", then "Only while the app is open… Never stored with your number. Android asks you next." This leads to an on state with "Turn location off". No OS dialog is drawn.
4. **Sign in to follow projects.** "Reading never needs an account." Then the number, WhatsApp or SMS, and the consent line.
5. **Enter the code.**
   - "Code arrived on WhatsApp · Tap to fill it in": WhatsApp one-tap autofill on Android.
   - Six cells, resend countdown, SMS fallback, "Plinth never calls to ask for this code."
6. **Follow your first project.**
   - A search field, and 4 suggestions "listed by distance from your corridor. Nobody can pay to appear here."
   - All-in price first; Juniper shows "all-in not yet known" and a Limited history chip. Follow toggles; a no-match state.
7. **Turn on alerts?**
   - "Utility alerts only. No offers, no ads, and nothing from developers."
   - "What one looks like" uses the first project you followed, with its trigger named (G-03). For Aurelia: "Moved from Moderate to Elevated. Trigger: the Apr–Jun 2026 QPR and new complaint orders."
   - Quiet hours switch; WhatsApp box unticked; "Turn on alerts" or "Not now".
8. **You're set.** A summary of every choice, including "Account: +91 99••• ••318 · the same on the web and WhatsApp", the Plinth close and "No developer pays us. Ever."

**Persona:** a new user (Meera-like); the masked number is fictional. There is no theme toggle in the app UI, per G-38; Night comes from the `theme` tweak.

**Tweaks:** `theme` and `step` (Welcome / Buying / Location / Sign in / Code / Follow / Alerts / Done).

### WebPricing: "What's free, and what's Pro?" (web page, 1280 × ~7,500)

**Sections, in order:**
1. **Hero.** A two-line H1 and the `evidencePack` slot. "Everything that tells you whether to trust a project is free, for everyone, for good." Primary action: "Try the sample page".
2. **What's free, for good?**
   - Three groups: On every project / Every tool / Every protection.
   - The statement **"If it's free today, it stays free. We never move it behind Pro."**
   - "No account is needed to read any of it."
3. **What does Pro add?** filingsStack bleeds in from the left, with **₹999** "for one project. GST included. One payment, never renewed." Pro is three things:
   - **a deep report** (every filing, order and certificate in one PDF, with source, read date and a fingerprint on each page);
   - **a comparison report** (the live compare stays free);
   - **12 months of written updates** (a monthly note plus demand-letter checks; band, filing and order alerts stay free).
   "Pro never changes a band. Pro buyers see the same score as everyone else, on the same day."
4. **What does the paywall hide?** (signature, below).
5. **What costs money later?** Verified Flat Check (₹6,999, planned) and home-loan help (free to you; the lender pays ~0.35%, disclosed). Both are R2 with planned dates and Notify me. deedKeys sits beside them.
6. **What if Pro wasn't worth it?**
   - "Full refund within 7 days of buying, for any reason."
   - How to ask: the Refund button in Your account, or reply "refund" on WhatsApp. Money back within 5 working days.
   - Four promises: the price is the price (GST included, nothing added at checkout); nothing renews; nothing is ticked for you; no clocks.
7. **Slab footer.** Payment partner placeholder: "we never see your card".

**Signature live thing: the Free/Pro switch on a sample Aurelia page.**
- The left half is the free page, and it never changes: photo, band chip, natural frequency, "less certain" after the sentence, the 4 canonical reasons with 5 source chips, "What would change this" and the disclaimer.
- On each switch, a "Same in Free and Pro" tag pulses, and a live line reports: "One block changed: the report. The band, 4 reasons and 5 sources on the left did not move."
- The right half swaps:
  - **Free view:** Pro inclusions, ₹999, an unticked WhatsApp box, "Buy Pro for this project, ₹999" (ink, not accent), "Full refund within 7 days… Nothing renews" and "Not now, keep reading free".
  - **Pro view:** PDF download, comparison picker, update schedule and refund window to 25 Oct 2026.
- Buying in the sample shows a toast: "Sample only: nothing was charged."

**Never on a Plinth paywall** (CCPA dark-pattern list): no blurred band, reason or source; no countdown; no pre-ticked box; no auto-renewal or hard cancel; no struck-out "original" price; no charge added at the last step.

**Tweaks:** `theme` and `view` (Free/Pro).

---

## 3. Image requests (`product/design/assets/requests_trust.json`, new file)

| Slot | Aspect | Where | Subject |
|---|---|---|---|
| `aboutTable` | 4:5 | WebAbout hero | A work table in a small Gurugram office: QPRs and orders in piles, one hand (no face) checking a printed row with a pencil. No legible text, logos or emblems |
| `evidencePack` | 1:1 | WebPricing hero | A spiral-bound, tabbed printed report on a dining table beside a face-down phone, a pen and chai. No legible text, logos or emblems |

**Reused, with their `src`:** heroAurelia, heroSapphire, heroKestrel, heroCoral, heroJuniper, corridorAerial, salesGallery, deedKeys and filingsStack.

**The founder photo is deliberately not an image slot.** It is a plain placeholder that reads "A real photo, supplied by the founder. Never AI-generated". An AI face presented as our founder would break §0 and our own honesty rules.

---

## 4. Conflicts these pages expose in existing screens (not edited here; for the lead)

1. **Loans: R1 or R2?** DESIGN §5b "Who has my number" lists **Tamarind Home Finance, "Lender · pays us a referral fee only if you take the loan", 15 Oct 2026**, and AppYou and WebPrivacy repeat it. That means a live R1 loan referral. PRD §15 puts F-13 loans in R2, and this brief says the same. WebAbout and WebPricing say "Home-loan help: R2, planned Jan–Mar 2027. Until then, no lender pays us anything." **One of the two must change.** My recommendation: replace Tamarind in §5b with an R1-only party, or drop it so the count becomes 2.
2. **The WebHome money ledger** still says "Risk Report Pro: deep dive, compare, 12 months of alerts" and shows the loan referral as live. It should read: "Risk Report Pro: a deep report, a comparison report and 12 months of written updates. Bands, reasons, sources and alerts stay free." It should also label the loan referral "from R2, Jan–Mar 2027". PRD §13.2 needs the same wording change ("12 months of alerts" → "12 months of written updates").
3. **WebMethodology** says "Ranges are provisional until our first calibration backtest is published." It should link to `WebAbout#right`. When the real table ships, drop "provisional" and keep the link.
4. **Header nav.** My three web pages use the WebMethodology set: Projects · Compare · Developers · How scores work · Ask. "Who we are" and "Free and Pro" are reached from the footer. WebHome uses a different set, so the global nav still needs one decision.
5. **WebHome footer links** to "EMI stress test" and "RERA status check" are unrelated to this pass. Its "How we make money" anchor should point to `WebAbout#money`, and a "Free and Pro" link should be added.

---

## 5. Facts these screens introduce (please add to DESIGN §5b, or replace)

- **Methodology v1.0 first public bands:** 15 Jul 2026. This is already in WebMethodology's changelog.
- **Phases scored to date:** 268. **First forward calibration check:** Jul 2027, then every quarter.
- **Calibration (illustrative, 212 Gurugram phases registered 2017–2021):**

  | Band | Range | Projects | Late | Per 100 |
  |---|---|---|---|---|
  | Low | 5–15 | 46 | 4 | 9 |
  | Moderate | 15–30 | 61 | 19 | 31 (just above) |
  | Elevated | 30–45 | 52 | 20 | 38 |
  | High | 45–65 | 34 | 19 | 56 |
  | Severe | 65–80 | 19 | 14 | 74 |
  | **All** | | **212** | **76** | **36** (base rate) |

  Brier score 0.19, against 0.23 for always saying 36 of 100.
- **Response-time board** (90 days to 18 Oct 2026; all fictional):

  | Request | Promise | Typical time | On time | Open |
  |---|---|---|---|---|
  | Error reports | 15 working days | 6 working days | 22 of 23 (E-0412 was 2 days late) | 2 |
  | Developer disputes | 15 working days | 11 working days | 8 of 8 | 1 (D-127, due 30 Oct 2026) |
  | Clerical fixes | 2 working days | 1 working day | 14 of 14 | — |
  | Grievances | 7 days | 3 days | 6 of 6 | — |
  | Data erasures | 30 days | 12 days | 11 of 11 | 1 |

  Case refs used: E-0431, E-0412, E-0398, CL-196, G-0019 and G-0016. D-118 took 14 working days and D-104 took 11.
- **Planned dates:**
  - Golf Course Ext Rd: Dec 2026.
  - R2: loans Jan–Mar 2027; resale, Verified Flat Check and iOS Apr–Jun 2027.
  - R3: Noida/GNW and possession help Jul–Sep 2027.
  - Next commercial-data audit: Jan 2027.
- **Rohan's WhatsApp history:**
  - follows Aurelia Heights Ph 2 since 14 Sep 2026;
  - follows Kestrel Park since 9 Oct 2026;
  - saved the Aurelia 3 BHK cost sheet of 2 Oct 2026.
- **Pro sample:**
  - deep report: 46 pages, 8.2 MB;
  - bought 18 Oct 2026, refund window to 25 Oct 2026;
  - monthly updates on the 15th, 15 Nov 2026 to 15 Oct 2027.
- **OTP rules:**
  - The code lasts 10 minutes; resend after 30 seconds.
  - WhatsApp template text as in WaAlerts; SMS sender "PLINTH".
  - App persona number: +91 99••• ••318.
- **Sapphire Grove Ph 1 has no RERA number in §5b**, so the sign-in card leaves it out. Add one, and the card should show it, per PRD §12.1 rule 4.

---

## 6. Open questions for the founder

**Identity (WebAbout placeholders; none were invented)**
1. The legal company name, CIN, registered office address with PIN, and GSTIN.
2. The founder's name, a real photo, a public profile link and a quote of 40 words or fewer: why Plinth exists and who it answers to.
3. Team size, the methodology lead's name, and the external member of the methodology committee.
4. Funding: is it self-funded, or who are the investors? Does any lender or broker hold equity? The page promises that no developer ever will.
5. Holdings declarations (founder, methodology lead, external member, staff, investors) and the date they were made. Does a booked flat count as a stake? I wrote that it does.
6. Insurance: the insurer, policy number and validity date for media-liability and cyber cover. The PRD makes this a gate before public beta.
7. The grievance officer's name, email and phone, and the legal-notices email.
8. HARERA agent registration. I wrote: "None yet. We don't broker any sale. We register before our resale desk opens in R2." Please confirm with the lawyer (PRD §12.3 Q1) that selling Pro reports alone doesn't need it.

**Scope and money**

9. **Loans in R1 or R2?** This is the Tamarind conflict in §4.1.
10. Are these planned dates right? Golf Course Ext Rd Dec 2026; loans Jan–Mar 2027; resale, Verified Flat Check and iOS Apr–Jun 2027; Noida/GNW and possession help Jul–Sep 2027. They are shown as plans with Notify me, but they are public promises.
11. **Is Pro on sale now?** The page assumes yes, at ₹999. Who is the payment partner (footer placeholder)?
12. **Price testing (PRD §18: ₹499 / ₹999 / ₹1,999).** Showing different prices to different visitors at the same time clashes with "The price is the price". I recommend testing one price per period, not one per visitor.
13. Do you approve the **public commitment** "If it's free today, it stays free"? And the Pro redefinition, with "12 months of written updates" replacing "12 months of alerts"?
14. **Refunds:** is a 7-day, any-reason refund with money back within 5 working days right? And should Verified Flat Check show ₹6,999 before R2 ("planned"), or show no price until launch?

**Calibration and response times**

15. Publish the real 212-phase backtest counts per band and the Brier score. Commit to the first forward check in Jul 2027.
16. Do you approve publishing our own response times, including misses? Which ticketing system feeds the board?

**Sign-in and onboarding**

17. Register the SMS fallback with TRAI DLT (sender header and template), and get the WhatsApp authentication template approved. Set rate limits per number and per IP.
18. Accept international numbers at R1 (+971, +1, +44, +65) for NRIs (G-17)? WhatsApp works the same; SMS costs more.
19. **Account merge rule:** one verified number makes one account, and WhatsApp history merges only after a tap. What happens if someone later changes their number?
20. Item 21 in the consumer evaluation: AppYou's "Consent history" and "Download my data" still lead nowhere in the app. WebPrivacy has the web destinations. Should the app deep-link to them, or do we design an app screen?
21. Location: approximate for "Near me" and precise only when "Where am I?" is used at a site? I recommend that split.

---

## 7. Checks run (no browser opened; nothing published)

**Per file** (`scratchpad/trust_check.py`):
- HTML tag balance and a scan for unquoted attributes.
- The exact `support.js` line, a valid `data-props` JSON, and the `theme` tweak with Day as the default.
- Every `data-slot` div is empty.
- A banned-word and emoji scan.
- A Node run of `renderVals()` in Day and Night across the key states, with every handler called once. Every `{{hole}}`, including loop items, resolves with no `undefined` or `NaN`.

**End to end** (`scratchpad/flow_sim.js`):
- the app goes Welcome → Done, including phone validation, autofill, follow, alerts and the summary;
- the web sign-in goes Phone → Code → Bring → Done.

**Results:**
- All four files pass.
- No heading should run past two lines, by character-count arithmetic at each heading's real column width. Two headings were cut down to meet that.
- Neighbouring sections never share a composition. WebAbout's founder block moved to the left so it doesn't repeat the hero.

**`$preview` heights are estimates** (nothing was rendered): WebAbout 10,000, WebPricing 7,500, WebSignIn 900, AppOnboarding 844. On the canvas, suggested entries are:

| File | Title | w × h | Page | Notes |
|---|---|---|---|---|
| WebAbout | "Who is Plinth" | 1280 × 10000 | web | `expand: fill` |
| WebPricing | "What's free and what's Pro" | 1280 × 7500 | web | `expand: fill` |
| WebSignIn | "Sign in with a WhatsApp code" | 1280 × 900 | web | `expand: fill` |
| AppOnboarding | "First run and sign-in" | 390 × 844 | android | |

All four are `is_interactive: true`.

## 8. Critique gate (§8; 1–5 each)

| Screen | Q | Ev | Hi | Rd | A11y | Trust | India | Cons | States | Delight | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| WebAbout | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | **42** |
| WebSignIn | 5 | 4 | 4 | 5 | 4 | 5 | 4 | 4 | 4 | 4 | **43** |
| AppOnboarding | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 5 | 4 | **43** |
| WebPricing | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | **42** |

**Why Evidence is 4, not 5:** it is capped by the placeholders and the illustrative calibration. It becomes a 5 once the founder supplies the real facts.

**Known weaknesses:**
- WebAbout is long, at about 10,000 px. Each section answers a different question someone will ask, but it could be split into "Who we are" and "Our record" if it reads heavy on the canvas.
- Type sizes on the public pages exceed the five-size ideal, at the same level as WebMethodology.
