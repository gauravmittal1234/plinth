# Consumer evaluation: Plinth R1 design, from the buyer's side

| | |
|---|---|
| **Date** | 18 Oct 2026 |
| **Reviewer** | Senior UX researcher and service designer |
| **Scope** | The 24 R1 artboards (11 web, 10 Android, 3 WhatsApp), PRD §1–§8, §11–§12, §15, §17–§18, DESIGN.md §0 and §5, `customer_journeys.md`, and the six design reviews |
| **Method** | I walked three personas through 13 stages. Screen copy was read with `scripts/artboard_text.py`, and I opened the raw HTML only to confirm conflicting values. Nothing was rendered and no buyers were interviewed, so every severity rating is my judgement. Judgements are marked **[J]**, and all data is the fictional set in DESIGN.md §5 |
| **Personas** | **R&M**: Rohan (34) and Meera (32), buying an under-construction 3 BHK for ₹2.2–3 Cr on Dwarka Expressway with a 75–80% loan. **N**: Neeraj (46), a second-time buyer who waited 8+ years on a 2010-era project. **A**: Amit (39), an NRI in Dubai buying for his parents, with his brother holding the POA |

---

## 1. Verdict in five lines

1. **Rohan and Meera would use Plinth to shortlist and to check the cost sheet, but they would still need a broker or portal for floor plans and units, and a bank for the loan.** Their biggest unmet need: *"Can we pay rent and pre-EMI if this project is 1–2 years late?"* No screen answers that. [J]
2. **Neeraj is the most likely to adopt Plinth and to pay for Pro.** He will test Plinth on his old developer and on how fresh its data is. Today he would find no pre-RERA history and a developer claim that Plinth's own records contradict. His biggest unmet need: proof that Plinth is accurate and up to date. [J]
3. **Amit would use the WhatsApp risk card to check the shortlist his brother or a CP sends him.** He can't give his brother scoped access, see what his brother saw on site, or find any NRI guidance (and his phone is probably an iPhone). His biggest unmet need: controlled visibility from a distance. [J]
4. **Plinth answers "Is this builder risky?" better than anything in the market.** It stops short of "So what do we do, and can we afford the wait?". It also goes silent at the money moments: EOI, booking, payment plan and loan.
5. **Fix before coding:** the before-you-pay check, the missing facts about the homes themselves, the data that contradicts itself across screens, the affordability of the wait, the undesigned hard states (Severe, Limited history, pending changes), sign-in continuity and the free/Pro line.

---

## 2. Journey scorecard

Severity is the worst gap at that stage, for the persona most affected.

| Stage | What works | Gaps (IDs) | Severity |
|---|---|---|---|
| **1. Trigger and budget** | Search reads "budget" as the all-in price (WebSearch hint). Cost sheet: "Cash before the loan starts", EMI, and 20-year total paid | No income-based affordability. No pre-EMI and rent overlap during construction. No "what if it's late" cost. The footer link "EMI stress test" goes nowhere (G-04) | Critical |
| **2. Discovery** | Natural-language search as editable tiles; the corridor list; the price/risk map toggle; QR and "Where am I?" scan; "No paid placement" | No floor plans, sizes per BHK, amenities, location or brochure (G-02). Golf Course Ext Rd isn't live and there's no request flow (G-30). The app shows the quoted price where the web shows all-in (G-21) | Critical |
| **3. Shortlist** | Compare with "highlight differences"; the app compare tray; Follow; family share link | Compare has no carpet, loading, configuration or commute rows (G-29). Spouses can't share one shortlist (G-13) | High |
| **4. Understanding the risk score** | Band name and meter, natural frequencies, 4 sourced reasons, "What would change this", the developer's reply, the evidence drawer, methodology | The band isn't translated into a keys date (G-06). No "what do we do now" (G-08). Pending facts and freshness are hidden (G-07). Hard states have no designs (G-05). Jargon (G-18). Confidence wording (G-23) | High |
| **5. True cost and affordability** | Cost-sheet normaliser (web, WhatsApp); loading explained; stamp duty by owner; negotiable items; TDS explained | Affordability of the wait (G-04). The headline all-in belongs to one unit with a park-facing PLC (G-22). Possession-time costs are excluded (G-31). No upload in the app (G-28) | Critical |
| **6. Site visit** | WhatsApp Flow booking with masked number, a visit code and a visit pass; hoarding QR check; the AI's "What should I ask the developer?" | Booking exists only on WhatsApp. The visit pass has no questions to ask, although F-44 requires them. What the site office receives is undefined. Visualise assumes a bare room, which UC buyers rarely see (G-10, G-34) | High |
| **7. Negotiation and decision** | PLC and club flagged as negotiable, with "get it in writing" | No "CP pass-back vs going direct" explanation, no EDC/IDC escalation warning, no decision checklist (G-25). No decision support (G-08) | High |
| **8. Booking and payment** | The 10% rule appears inside one AI answer | **No before-you-pay check (F-41 is in R1 scope)**: payee account, the 10% cap, EOI refund terms, receipts (G-01). No payment-plan or subvention explainer (G-14) | Critical |
| **9. Loan** | The EMI instrument and "Arithmetic, not advice" | Nothing in R1: no lender-approved project list, no "loans arrive in R2" message. Meanwhile the privacy pages show lender parties (G-15, G-20) | High |
| **10. Agreement and registration** | (Out of R1 scope by design) | No "what happens next" checklist after booking (G-19) | Medium |
| **11. The 3–5 year wait** | Follow; band-change alerts on all three surfaces; the "what changed" reveal; quiet hours | Follow can't tell a browser from a booked buyer. The alert doesn't say what triggered the change. Alerts carry contradictory dates (G-19, G-03) | High |
| **12. Possession** | (R3) | Expectations are not set. OC isn't explained as distinct from keys (G-06, G-41) | Medium |
| **13. Resale later** | (R2+) | Transfer charges for selling before possession aren't mentioned (G-40) | Low |

### Cross-cutting checks

| Check | Verdict | Gaps |
|---|---|---|
| **Does a first-time visitor understand why to trust Plinth?** | Mostly. WebHome's "₹0 paid to us by developers", the methodology and "Developer says" are strong. Missing: *who* Plinth is, and any record of being right ("Ranges are provisional", WebMethodology) | G-09 |
| **Does a first-time visitor understand what the band means?** | They understand the name and the frequency. They don't understand when they will get keys, what "within 12 months" covers, or what to do next | G-06, G-08, G-23 |
| **Information overload** | Yes on web. WebProject is about 8,320 px with 4 instruments, WebMethodology about 10,500 px, and the disclaimers and "Illustrative image" captions repeat on every section. The app and WhatsApp are well judged | G-18, G-27 |
| **Continuity across web, app and WhatsApp** | The band chip and risk card are consistent. Facts, identity, visit booking, cost upload and the displayed price are not | G-03, G-11, G-10, G-21, G-28 |
| **Empty, unknown and low-confidence states** | Designed: chips, 0 results, "Not in our records yet", corridor not live, scan no-match. Missing: project pages for Severe, Limited history, Not scored and Stall; stale data; pending notice; AI "I don't know" | G-05, G-07, G-24 |
| **Family co-decision** | Three different "share" mechanisms (live compare table, cost summary, PNG card). No shared shortlist and no delegate role | G-13, G-17 |
| **Accessibility and older parents** | Good bones (reduced-motion fallbacks, slider alternatives, big type). Weak for parents: drag-only instruments, abstract hatching, English-only read-aloud | G-27 |
| **Hindi-only family members** | The AI understands Hindi but replies in English, and every shareable artefact is in English. Only the privacy notice has Hindi | G-26 |
| **R1 scope limits** | Not communicated. The Home money section and both privacy pages imply loans and brokers exist | G-20 |

---

## 3. Ranked gap list

**Count: 41 gaps. 4 Critical · 14 High · 17 Medium · 6 Low.** IDs are in rank order.

### Critical

**G-01 · No "before you pay" check (F-41, in R1 scope)**
- **Category:** missing feature
- **Evidence:** no screen. The only trace is one AI answer on WebProject and AppProject ("Get the answers in writing before you pay more than 10%"). A search for "payee" or "collection account" across all 24 screens finds nothing.
- **Why it matters:** the EOI or booking cheque is where Gurugram buyers lose money. For every persona it is the most expensive five minutes of the journey. [J]
- **Fix:** a "Before you pay anything" flow on web, app and WhatsApp. The buyer enters payee, account, amount and stage (EOI, booking, allotment). Plinth checks the payee against the RERA collection account, shows the 10% cap before a registered agreement, flags cash, and gives EOI-refund and receipt checklists.
- **Priority:** fix before coding (design). Ships in R1.

**G-02 · Project pages don't describe the homes**
- **Category:** missing info
- **Evidence:** WebProject and AppProject have no floor plans, sizes per configuration, towers, amenities, location or brochure; a search for "floor plan", "amenit", "school" and "metro" across all 24 screens finds nothing. AppProject says "3 and 4 BHK · 1,450–2,100 sq ft carpet" but prices only the 3 BHK. F-32 (P0, R1) requires plans with dimensions, amenities, an ungated brochure and a price trend.
- **Why it matters:** this is the first thing R&M ask on a weekend. Without it they open 99acres or call a CP, and the CP re-frames the risk card. [J]
- **Fix:** a "Homes here" section. Each configuration shows carpet and super area, a plan with dimensions, towers, and a price where known. Amenities and location facts go in the "Developer says" and "Records show" lanes, with a brochure link. Keep it below the risk answer.
- **Priority:** fix before coding.

**G-03 · Facts contradict each other across surfaces**
- **Category:** trust and continuity
- **Why it matters:** an evidence brand gets one public contradiction before buyers stop believing it. Neeraj reads closely enough to catch these. [J] They also show there is no canonical fixture behind the designs.

| Fact | Says one thing | Says another |
|---|---|---|
| When Aurelia moved to Elevated | 2 Oct 2026 (WebFollowing, AppFollowing, AppProject, AppRisk, AppExplore) | 14 Oct 2026 (WaAlerts image and body) |
| Apr–Jun 2026 QPR filing | "Filed 15 Jul 2026, on time" (WebProject, AppRisk) | "Filed 38 days late… filed 22 Aug 2026" (WebFollowing feed) |
| Latest QPR | "Next QPR due 15 Jan 2027" (live strip on every page). Developer says Jul–Sep was "filed on 12 October" | WebDevPortal: "the QPR for Jul–Sep 2026 is not on HARERA… due 15 Oct 2026" |
| Why the band moved on 2 Oct | The reveal cites a QPR filed in Jul or Aug, outside the 72-hour recompute promise | Methodology v1.2 was "published 14 Oct 2026", yet the 2 Oct change is labelled v1.2 |
| PLC and negotiable total | ₹2.5 L (₹125/sq ft × 2,000); PLC plus club ₹4.0 L (WebCostSheet) | ₹2.9 L; "₹4.4 L together" (WaCost) |
| Cost sheet date | 2 Oct (WebCostSheet), "Sep 2026" (WebProject evidence), 14 Oct (AppVoice) | 18 Oct (WaCost card) |
| Complaint order date | 7 Oct 2026 (AppFollowing) | 9 Oct 2026 (WebFollowing) |
| Who has my number | Larkspur Realty (broker), Tamarind Home Finance, developer enquiries (WebPrivacy) | Orbis Land site office, "Plinth's home-loan adviser", unmasked "Your number" (AppYou). WebFollowing: "no developer or broker does" |

- **Fix:**
  - add a canonical event timeline for Aurelia to DESIGN.md §5 (filings, orders, band changes, method version, cost sheet, consent parties) and re-point every artboard to it;
  - every band-change alert must name its trigger: a new record, or a method change.
- **Priority:** fix before coding.

**G-04 · "Can we afford the wait?" is not answered (F-12, in R1 scope)**
- **Category:** missing feature
- **Evidence:** WebCostSheet and WebProject show EMI, a +1% stress and "cash before the loan starts", but take no income, rent or delay input. The Home footer link "EMI stress test" has no screen.
- **Why it matters:** "paying EMI plus rent on a stalled project" is the A1 persona's top fear (`customer_journeys.md` §2.1), and the band is exactly the input it needs.
- **Fix:** an "Afford the wait" planner. Inputs: income, savings, rent, loan share, plan type. Outputs: cash needed and when; rent plus pre-EMI each month during construction; EMI-to-income; +100 and +200 bps; the cost of 12 and 24 months' delay, tied to the band's frequency. "Arithmetic, not advice"; inputs stay on the device.
- **Priority:** fix before coding (design). Ships in R1.

### High

**G-05 · Hard states have no designs**
- **Category:** missing states
- **Evidence:** only Aurelia (Elevated) has a full project page. Laurel Residency (Severe), Juniper Enclave (Limited history), Heron Point Ph 2 (Not scored) and the Stall flag exist only as chips, rows or a methodology demo.
- **Why it matters:** Laurel is the cheapest 3 BHK in the set (₹1.48 Cr), so price-led buyers will land there. These pages also carry the most legal risk.
- **Fix:** design the project page in four states plus a stale variant. Each says what the state means and what to check instead (for Limited history: promoter background, licence, escrow filings, first QPR). Add an "If you've already booked here" block: RERA s.18 rights, delay-interest orders, allottee associations.
- **Priority:** fix before coding.

**G-06 · The band isn't translated into "when do we get keys?"**
- **Category:** missing info and copy
- **Evidence:** "The rest… finished within 12 months" (AppRisk, WebProject) reads as "on time" but includes projects 11 months late. "This describes a pattern, not a forecast for this project" (AppRisk) undercuts the card's own question. Nothing says that OC is not keys.
- **Why it matters:** R&M plan around a school year; Neeraj thinks in years lost. [J]
- **Fix:** one line under every band: "Original date Dec 2027. Between 30 and 45 of 100 similar projects got their OC after Dec 2028." Explain once that keys follow the OC. P50/P80 dates stay in R3.
- **Priority:** fix before coding (copy templates).
- **Decision:** within D4 (five bands kept).

**G-07 · Pending facts and data age are hidden from buyers**
- **Category:** trust
- **Evidence:** WebDevPortal holds a notice ("may move from Elevated to High… takes effect 25 Oct") because the Jul–Sep QPR is missing. Buyer pages show the developer's claim that it was "filed on 12 October" and "synced 2 hours ago", with no word that it's missing.
- **Why it matters:** a buyer who pays a booking amount on 20 Oct does so on a band Plinth already expects to change. "Buyer's side, provably" fails here. [J]
- **Fix:** show the public fact at once ("Jul–Sep 2026 QPR: not on HARERA as of 17 Oct; due 15 Oct") with a neutral marker ("New records under review; this band may change by 25 Oct"). Keep the new band under the 7-day notice. Add a "new filing received, reading by [date]" state and a stale flag on the chip.
- **Priority:** fix before coding (state model).
- **Decision:** touches PRD §6.2 due process. It doesn't conflict, because only the public fact is shown, not the new band.

**G-08 · No "so what do we do?" after the band**
- **Category:** missing info
- **Evidence:** AppRisk and WebProject end at "What would change this". The AI says "I don't give… investment advice" and has no designed alternative answer. No screen gives a base rate, so buyers can't tell whether Elevated is above or below the Gurugram typical.
- **Fix:** a "Before you decide" block that informs without advising: steps that reduce exposure (construction-linked plan, at most 10% before the agreement, the CA escrow certificate, a rent buffer); the AI's "questions to ask"; nearby projects with a lower band at a similar all-in, chosen by a published rule; and a base-rate line, "Across Gurugram, about [X] of 100 projects were this late" [J: value from the calibration table].
- **Priority:** R1.

**G-09 · Nothing says who Plinth is or whether it has been right**
- **Category:** trust
- **Evidence:** no About page, company identity, address or funding, and no staff holdings declaration (PRD §6.2 requires one). WebMethodology: "Ranges are provisional until our first calibration backtest is published."
- **Why it matters:** Neeraj and the family WhatsApp group will ask a new brand that rates developers "who are you?" first. [J]
- **Fix:** a "Who we are and how we're held to account" page: company, founder, address, insurance, holdings declaration, the dispute SLA board, and the calibration rows behind each band (they already exist for the 212-project reference class).
- **Priority:** R1, before public beta.
- **Decision:** touches PRD §18 (backtest gate dropped). Publishing existing rows reinstates no gate.

**G-10 · The site visit is not a service yet**
- **Category:** missing feature and continuity
- **Evidence:** booking exists only in the WaAlerts Flow; WebProject and AppProject have no "Book a visit". The visit pass lacks the "questions to ask this builder" that F-44 and PRD §7.1 require. Unanswered: what Northfield's site office receives, whether it honours code "4821", and what happens when the gate register asks for a phone number.
- **Fix:** write a visit service blueprint (who contacts the site office, SLA, no-show path). Add "Book a visit" on web and app. Put 3–5 record-based questions on the pass, plus "You don't have to give your number at the gate". Add a post-visit "What did they tell you?" note, filed as unverified "Developer says".
- **Priority:** fix before coding (blueprint). Ships in R1.

**G-11 · No sign-in, onboarding or account linking**
- **Category:** continuity and friction
- **Evidence:** web has a "Sign in" link but no screen; the app has no first run, verification or permission priming. WaCost says "stays in your Plinth account… plinth.in/you", but linking WhatsApp to web and app is undefined beyond an OTP template (WaAlerts).
- **Fix:** design web sign-in through WhatsApp OTP, the app first run (what Plinth is, the promise, verify the number, notification priming) and account merge (a WhatsApp number becomes an account; saved sheets and follows appear on web and app).
- **Priority:** fix before coding.

**G-12 · The free/Pro line is undefined and already contradicts the screens**
- **Category:** trust and copy
- **Evidence:** WebHome's money section says "Risk Report Pro: deep dive, compare, 12 months of alerts". Compare and alerts are free on every screen, and there is no Pro screen or paywall. The PRD puts Pro at M2.
- **Why it matters:** if Pro later gates evidence that is free today, it reads as bait. If it gates nothing, nobody pays. [J]
- **Fix:** before coding, decide what is free forever (band, reasons, sources, alerts, cost sheet) and what Pro adds (for example a downloadable evidence pack, payment-plan arithmetic, a demand-letter check). Design one honest "What's free / what's Pro" page and fix the Home copy.
- **Priority:** fix before coding.

**G-13 · Families can't decide together**
- **Category:** missing feature
- **Evidence:** each surface shares differently (a live link on WebCompare, a summary on WebCostSheet, a PNG on AppRisk and WhatsApp). No shared shortlist, co-follow or member roles.
- **Why it matters:** Meera and Rohan research at night on separate phones; parents receive forwards. [J]
- **Fix:** a lightweight "household": invite a spouse, parent or delegate by link (each opts in); one shortlist and shared follows; a "who can see this" list with revoke; cost sheets private unless shared.
- **Priority:** R1 (light). Voting and weights later.

**G-14 · No payment-plan or subvention explainer before booking**
- **Category:** missing info
- **Evidence:** no screen. `customer_journeys.md` rates the subvention trap severity 5 (MoT 3). The simulator (F-16) is in R3.
- **Fix:** a static explainer (construction-linked vs down payment vs subvention) with "Get lender confirmation in writing before a subvention booking", linked from the cost page and answerable by the AI.
- **Priority:** R1.

**G-15 · Nothing about loans in R1, at a 75–80% loan**
- **Category:** missing info
- **Evidence:** no lender-approved project information anywhere, yet WebHome lists a "Home-loan referral" and WebPrivacy and AppYou show a lender holding the number (loans are R2).
- **Fix:** an info-only "Loans" card per project: lenders that approved it (labelled "Developer says" or "Records show"), what lenders check for under-construction homes, and "Loan help arrives in [month]: notify me". No referral in R1.
- **Priority:** R1 (info); R2 (referral).

**G-16 · Pre-RERA delivery history is invisible**
- **Category:** trust and missing info
- **Evidence:** WebDeveloper: "2 of 6 finished RERA projects". Nothing says that projects before 2017 are out of scope.
- **Why it matters:** Neeraj's 2010-era loss would not appear on the page. He will read the omission as a whitewash. [J]
- **Fix:** say it plainly: "Counts RERA-era projects (registered 2017 or later). Older projects aren't in this record yet." In R2, add documented pre-RERA delays from court and NCDRC orders as "Records show".
- **Priority:** R1 (copy); R2 (data).

**G-17 · No path for an NRI**
- **Category:** missing feature
- **Evidence:** zero NRI content; numbers are shown as "+91"; the only delegation is generic sharing. The R1 "Is this broker registered?" check (F-08) is missing too, although the Home footer links to a "RERA status check".
- **Fix:** an R1-lite NRI kit: international numbers on WhatsApp and web; a **delegate role** so the brother books visits and adds site notes that Amit sees; a one-page primer (NRE/NRO payments, POA scope checklist, hand-off hours); the F-08 broker check, so Amit can vet the CP; and a PWA that covers the risk card, follow and cost upload.
- **Priority:** R1 lite; concierge in R3.
- **Decision:** touches D3 (Android first). NRIs skew to iOS [J], so PWA quality matters.

**G-18 · Too much jargon and too much page**
- **Category:** copy and accessibility
- **Evidence:** undefined jargon (QPR, OC, CC, CIRP, NCLT, EDC/IDC, IFMS, PLC, Late12, "reference class", "model v1.2"). WebProject has 7 sections and 4 instruments. The disclaimer repeats 2–3 times a page, plus the live strip and "Illustrative image" on every picture.
- **Fix:** tap-to-define glossary; a 4-line summary atop the project page (band, keys date, all-in, next step); the disclaimer once by the band and once in the footer.
- **Priority:** R1.

### Medium

| ID | Gap | Evidence | Category | Recommendation | Priority | Decision flag |
|---|---|---|---|---|---|---|
| G-19 | Follow can't tell a browser from a booked buyer | AppFollowing, WebFollowing | Missing feature | Add an "I've booked here" toggle: it changes alert wording, shows the "If you've booked" block and seeds Project Watch | R1 | — |
| G-20 | The R1 scope isn't stated; screens imply partners that don't exist yet | WebHome ("Home-loan referral"); WebPrivacy and AppYou show a broker and a lender | Copy, continuity | A "What Plinth does today / next" panel with notify-me. Privacy mock-ups use R1 parties only | R1 | — |
| G-21 | The app shows the quoted price; the web shows all-in | AppExplore "3 BHK ₹2.35 Cr"; AppMap pins; WebSearch | Continuity | All-in first everywhere, including the pins | Fix before coding | — |
| G-22 | The headline all-in is one unit's price, not the project's | WebProject all-in includes a ₹2.5 L park-facing PLC; source "Developer cost sheet · Sep 2026"; 4 BHK unpriced | Missing info, trust | Label the example unit and its source; "4 BHK: send a cost sheet" | R1 | — |
| G-23 | Confidence and state labels are ambiguous | "Elevated · low confidence" can be skim-read as low risk [J]; Explore calls a Limited history chip "too early to score" | Copy | Use "less certain" after the sentence; use Limited history and Not scored consistently | R1 | Within D4 |
| G-24 | No designed AI answers for edge questions | AppVoice and WebProject Ask: no "Should I buy?", unknown project, Noida, HARERA-down or offline states | Missing states | Refuse and redirect ("here's how to decide"); request-a-project; outside-coverage; offline | R1 | — |
| G-25 | Thin negotiation context | WebCostSheet covers PLC and club only | Missing info | "Before you negotiate": CPs sometimes pass back commission and Plinth can't; EDC/IDC escalation; what to get in writing | R1 | D1: going direct may forgo a CP pass-back |
| G-26 | Hindi-only parents can't read forwards | All cards and replies in English; only the privacy notice has Hindi | Accessibility | Keep the UI in English. Add a Hindi caption and a templated 30-second Hindi voice summary to the shareable WhatsApp cards | R2 test | Touches English-first (PRD §2 P5, §11); UI unchanged |
| G-27 | Older parents struggle with the instruments | Drag-only replay and compare, abstract hatching, English-only read-aloud | Accessibility | A large-type "Simple view" with read-aloud; text for the hatching | R1 | — |
| G-28 | No cost-sheet upload in the app, although the PRD puts it in the R1 app | AppProject | Continuity | A camera upload flow reusing the Visualise capture guidance | R1 | — |
| G-29 | Compare covers half the decision | WebCompare has no size, loading, configuration or commute rows | Missing info | Add carpet, loading and configurations; a distance row later | R1 / R2 | — |
| G-30 | No way to request an uncovered project | AppExplore "we'll check it" (no SLA); Golf Course Ext Rd not live | Missing feature | Request flow with an expected date; Noida waitlist | R1 | D2 |
| G-31 | The all-in leaves out costs paid at possession | WebCostSheet: "Maintenance advance… not in this total" | Missing info | A separate, estimated "move-in number" | R2 | — |
| G-32 | WaCost gives two retention promises in one chat | "Keep this file for 30 days" vs "stays… until you delete it" | Trust, copy | One rule | Fix before coding | — |
| G-33 | Progress is per phase, but buyers pick a tower | WebProject "Tower A slab 9"; Tower B claim | Missing info | Tower-level progress where the QPR reports it | R2 | — |
| G-34 | Visualise assumes a bare room UC buyers rarely see | WebVisualise, AppVisualiseCapture; PRD F-24 says UC gets only an artist's impression | Feature fit | For UC, start from the floor plan or the sample flat; keep bare-room staging for resale | R1 (reposition) | — |
| G-35 | Flooding, a stated New Gurugram fear, is invisible | No screen; waterlogging is R2/R3 | Missing info | Dated "Reported" incident chips per sector meanwhile | R2 | — |

### Low

| ID | Gap | Evidence | Category | Recommendation | Priority |
|---|---|---|---|---|---|
| G-36 | Search quietly widens "low delivery risk" to Low or Moderate | WebSearch hint text | Copy | Show it as two tiles, "Low" and "Moderate", each removable | R1 |
| G-37 | The AI has four names | "Home Advisor", "Ask", "Ask Plinth", "Plinth's AI assistant" | Copy | Use "Ask Plinth" everywhere | R1 |
| G-38 | Prototype controls sit inside the product UI | AppScan "Simulate match" and "Prototype: next scan finds no match"; AppVisualiseResult "show generating"; the theme toggle on the Explore hero | Friction | Remove them before handing off to code | Fix before coding |
| G-39 | The 0-results state gives no guidance | WebSearch ("No projects match") | Copy | "Drop *Low–Moderate* to see Aurelia Heights" | R1 |
| G-40 | Nothing about selling before possession | No screen | Missing info | Explain transfer and endorsement charges and builder NOC on the project page | R2 |
| G-41 | Possession expectations aren't set | No screen (R3) | Copy | One line on the project page: "At possession we'll help check the OC, final demand and delay interest (coming [month])" | R1 (copy) |

---

## 4. Missing screens and flows to design

| # | Screen or flow | One-line spec | Gaps | Priority |
|---|---|---|---|---|
| 1 | **Before you pay** | Payee, account, amount and stage checked against the RERA collection account, the 10% cap and cash; EOI-refund and receipt checklists | G-01 | Fix before coding |
| 2 | **Homes here** (project section) | Configurations, carpet and super area, plans with dimensions, towers, amenities and location in the two evidence lanes, brochure | G-02 | Fix before coding |
| 3 | **Afford the wait** | Income, savings, rent, loan and plan type give cash timing, rent plus pre-EMI, rate shocks and the cost of 12 or 24 months' delay | G-04 | Fix before coding |
| 4 | **Hard-state project pages** | Severe, Limited history, Not scored, Stall and stale, each with "what it means, what to check instead" | G-05 | Fix before coding |
| 5 | **Pending and fresh states** | "New filing received, reading by [date]"; "Records under review, may change by [date]"; a stale chip | G-07 | Fix before coding |
| 6 | **Sign-in, first run, account linking** | WhatsApp OTP sign-in on web; app first run; a WhatsApp number merges into one account | G-11 | Fix before coding |
| 7 | **Site visit hub and blueprint** | Book on any surface; a pass with record-based questions; post-visit notes; the site-office SLA | G-10 | Fix before coding |
| 8 | **What's free / what's Pro** | One page and a paywall that never gates the band, reasons or sources | G-12 | Fix before coding |
| 9 | **"If you've booked here" and the I've-booked toggle** | RERA s.18 rights, delay-interest orders, allottee groups, demand-letter basics | G-05, G-19 | R1 |
| 10 | **Who we are** | Company, founder, address, insurance, holdings, dispute SLA board, calibration rows | G-09 | R1 |
| 11 | **Household and delegate** | Invite a spouse, parent or POA holder; opt in; shared shortlist; roles; revoke | G-13, G-17 | R1 (light) |
| 12 | **Before you decide** | Exposure-reducing steps, questions to ask, lower-band projects nearby, base rate | G-08 | R1 |
| 13 | **Payment plans explained** | Construction-linked vs down payment vs subvention, with a lender-confirmation warning | G-14 | R1 |
| 14 | **Loans card** (info only) | Lenders that approved the project, what lenders check, notify-me | G-15 | R1 |
| 15 | **Glossary sheet** | Tap-to-define for every acronym on the risk and cost pages | G-18 | R1 |
| 16 | **AI edge states** | "Should I buy?", unknown project, outside Gurugram, HARERA unreachable, offline | G-24 | R1 |
| 17 | **Request a project and coverage waitlist** | RERA number or name, an expected date, notify-me; Noida/GNW waitlist | G-30 | R1 |
| 18 | **NRI primer and broker check** | International numbers, delegate site notes, NRE/NRO and POA scope checklist; "Is this broker registered?" (F-08) | G-17 | R1 lite |
| 19 | **App cost-sheet capture** | Camera flow, reading state and result card, shared with web and WhatsApp | G-28 | R1 |
| 20 | **Simple view** | A large-type summary card with read-aloud and tap-only controls | G-27 | R1 |
| 21 | **Consent history and data download** | Destinations for the two links on AppYou that lead nowhere today | G-11 | R1 |

## 5. Quick wins (copy or small UI)

1. **Reconcile the facts** in the G-03 table against one canonical Aurelia timeline in DESIGN.md §5. *(Fix before coding)*
2. **Translate the band into a date:** "Original date Dec 2027. Between 30 and 45 of 100 similar projects got their OC after Dec 2028." Add "Keys usually follow the OC."
3. **Rewrite "The rest finished within 12 months"** as "…within 12 months of the date (some on time, some up to a year late)". Replace "a pattern, not a forecast" with "how often projects like this one were late".
4. **"Low confidence" becomes "less certain"**, placed after the sentence, not beside the band name. "Too early to score" becomes "Limited history: new developer, no penalty".
5. **All-in first** in the app list and on map pins: "₹2.74 Cr all-in · quoted ₹2.35 Cr". Label the example unit: "3 BHK, park-facing, cost sheet of [date]".
6. **Show the missing QPR as a fact on the card** ("Jul–Sep 2026 QPR: not on HARERA as of 17 Oct"), and make the live strip's "next QPR due" match.
7. **Developer page:** "Counts RERA-era projects (registered 2017 or later). Older projects aren't in this record yet."
8. **Visit pass:** three questions from the reasons, and "You don't have to give your number at the gate."
9. **"Talk to a person":** say the scope ("We explain records. We don't book units, negotiate or take payments.").
10. **Scope honesty:** fix the Home Pro copy (compare and alerts are free); add "What Plinth does today / next" with a notify-me; remove R2 parties from the privacy mock-ups; make WaCost's retention promise one rule.
11. **Primary actions by stage:** after Follow, offer "Check my cost sheet" and "Book a visit" on the project page. [J]
12. **Hygiene:** one AI name ("Ask Plinth"); remove the prototype levers and the Explore theme toggle; split "low delivery risk" into Low and Moderate tiles; add guidance to 0 results; show the disclaimer once by the band and once in the footer.

---

*Limits.* This review reads code and copy, not renders. Severity is my judgement, with no user testing (PRD §18 dropped interviews). The three personas are composites from `customer_journeys.md`. The first prototype sessions should test G-04, G-06, G-08 and G-23 with 5–8 Gurugram couples and 2–3 NRIs. [J]
