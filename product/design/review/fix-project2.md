# Fix pass 2: project and risk surfaces (buyer)

19 Oct 2026. This pass closes the remaining buyer gaps on the project and risk surfaces from `product/evaluation/consumer.md`: G-08, G-14, G-15, G-16, G-17, G-18, G-23, G-27, G-33, G-35, G-40 and G-41. It also covers the coordinator's follow-ups:
- the "From the developer · not verified by Plinth" label;
- an app version of the hard states;
- stale and re-scoring states;
- AppRisk;
- a facts-only state;
- the claim-status line;
- the complaint rate;
- the "Talk to our team" relabel;
- the R1 loan copy.

All work is in `canvas/project/`. canvas.json was not touched.

| File | Status | Size (w × h) | Interactive |
|---|---|---|---|
| `WebProject.dc.html` | edited | 1280 × **9,100** (was 11,560) | yes |
| `AppProject.dc.html` | edited | 390 × **9,800** (was 7,500) | yes |
| `AppRisk.dc.html` | edited | 390 × **5,300** (canvas entry says 3,940) | yes |
| `WebProjectStates.dc.html` | edited | 1280 × **3,960** (was 3,760) | yes |
| `AppProjectStates.dc.html` | **new** phone screen | 390 × **4,700** | yes |

**The lead needs to update these canvas entries:** WebProject h 9,100 · AppProject h 9,800 · AppRisk h 5,300 · WebProjectStates h 3,960 · new AppProjectStates (`page: android`, w 390, h 4,700, `is_interactive: true`).

**How the work was checked.** No browser was opened and nothing was rendered. Each file passed these checks:
- tags balanced and no stray self-closing tags;
- every attribute quoted;
- exactly one `support.js` line;
- `data-props` parses as JSON;
- every `sc-if` and `sc-for` has its hint;
- no emoji, no banned words, no glass and no glow.

The logic then ran in node across Day and Night, every `band`, `state`, `view` and `claim` tweak, and the open states (expanders, sheets, tower picked, read-aloud running). Every `{{hole}}`, nested loops included, resolved to a value, and every handler was called and the page rendered again.

Heights are worked out from the layout, not measured. WebProject comes to about 9,050 px with every expander closed, so its frame is 9,100. The first render should confirm it.

---

## 1. Where each gap is closed

| Gap | Closed in | How |
|---|---|---|
| **G-08** "So what do we do?" | WebProject § **So what do we do now?** (new, `#next`); AppProject § same (new); AppRisk § same (new) | It opens with "We never say buy or don't buy. At Elevated, these steps keep less of your money at stake." Then come 2–4 steps per band, driven by the `band` tweak. Elevated has four: <br>• **Ask for it in writing:** the slab schedule for your tower and the CA escrow certificate. <br>• **Prefer a plan that pays as it's built:** Tower A is at slab 9, yet slab 12 was demanded on 10 Oct 2026. <br>• **Keep a rent buffer:** ₹24.1 L for 12 months late. <br>• **Watch the next QPR:** 25 Oct 2026. <br>Each web step links to its proof (Ask, the plans explainer, the wait section, the pending fact). Two context lines follow: <br>• the **base rate**: about 36 of 100 Gurugram projects were more than 12 months late, and Elevated sits around that; <br>• **lower band nearby**, by a published rule: Kestrel Park (Low, ₹2.44 Cr) and Sapphire Grove Ph 1 (Moderate, ₹2.27 Cr). Nobody pays to appear. |
| **G-14** Payment plans and subvention | WebProject § **What else before booking?** (new, `#book`) → "Which payment plan?"; AppProject, same section | Aurelia's plan: construction-linked, 11 stages (the 11 rows of §5b; slabs 15, 18 and 20 are one row). Then: <br>• construction-linked vs down payment vs subvention, each with its risk; <br>• "Before a subvention booking, get the lender's confirmation in writing…"; <br>• slab stages follow your tower: 52.5% / 45% / 37.5% due by registration in Towers A / B / C. <br>The full stage list stays in "From the developer". |
| **G-15** Loans in R1 | Same section → "Home loans" (web and app) | Uses the §5b rule "Loan checks arrive in 2027", with a "Tell me when loan checks open" toggle. It covers: <br>• **check now:** ask *your* bank, in writing, whether it approved the project; <br>• a Developer-says tone field, "Approved by major banks" (no lender named, per "Loans are R2"); <br>• how a 75–80% loan pays out stage by stage, with pre-EMI until the last payout and a delay that extends pre-EMI and rent; <br>• the bank's engineer can hold a payout, so ask about late-payment interest; <br>• banks don't lend for stamp duty or registration. |
| **G-16** Pre-RERA history | WebProject § Records → `#pre-rera` (expander); AppRisk § Why → expander; the WebProject risk detail links to it | "The track record counts RERA-era projects only, registered 2017 or later." The expander is tagged **"Before RERA · from court orders and news"**: <br>• Northfield Greens, 27 months late (consumer commission order, Aug 2015; news, Feb 2013); <br>• Alder Court, on time (DTCP OC; news); <br>• Larch Enclave: nothing found, "not proof of anything". <br>Coverage limit: "Before May 2017 there was no public register of promised dates, so this list may be incomplete. None of it counts in the band." |
| **G-17** NRI path | WebProject and AppProject → "Buying from abroad (NRI)" | Covers: <br>• NRE, FCNR(B) or NRO payment, with no foreign-currency notes (FEMA); <br>• NRI loans; <br>• 1% TDS under s.194-IA, and a PAN; <br>• a specific POA, attested abroad and stamped in India within 3 months; <br>• keeping a record of which account paid (it decides repatriation later); <br>• alerts on an international WhatsApp number, with family joining by link (F-98). <br>The panel carries `data-review="legal"`. |
| **G-18** Information overload | WebProject | **Sticky "On this page" chapter rail** under the top bar. It has 10 anchors and the current chapter gets an ink bar from the existing scroll-spy. The old 5-link header nav moved into it. <br>**Collapsed by default:** the 4 reasons; towers, amenities and getting around; From the developer; the licence and insolvency rows; pre-RERA; the four before-booking explainers; "How we worked this out". <br>**One "Illustrative image" caption per page:** the hero reads "Images on this page are illustrative" and the other three captions are gone. The AI-preview labels stay, as the spec requires. <br>**Disclaimer** once by the band and once in the footer. The repeat in the risk detail is gone, and the second "Arithmetic, not advice" in the wait section is gone. <br>**Height** 11,560 → about 9,050 px with everything closed. The section gap is now 144 px (within §0's 120–200 px); the hero is 520 px; the Picture, Records and Ask sections became two-column; the extra cameraSite figure was dropped (4+ pictures remain). <br>The guided-story order is unchanged. The two new decision sections sit right after the band. |
| **G-23** Confidence labels | WebProject, AppProject, AppRisk, WebProjectStates, AppProjectStates | **No "low confidence" next to any band name.** A separate line follows the frequency sentence, with ●○ dots: "**We're less certain about this one.** Northfield has only 6 finished RERA projects to learn from, so we show a range, not one number." <br>The hatch legend reads "Hatched: the 15 of 100 we're less certain about". Limited history reads "**Not enough history to score** · no penalty" in the chip, the tag and the summary. "Too early to score" appears nowhere. |
| **G-27** Simple view | WebProject (header toggle + `view` tweak); AppProject (top-bar "Simple view" button + `view` tweak) | Large type: 24 px body on web, 21 px on phone. It shows: <br>• the band with a big meter, and one sentence ("step 3 of our five, from Low to Severe"); <br>• **keys range**: "Promised: Dec 2027. Out of every 100 similar projects, 30 to 45 got the OC after Apr 2029"; <br>• the less-certain line, which is also the **text alternative to the hatching**; <br>• 3 reasons with plain sources; <br>• **Read this aloud**: it steps through the 6 blocks, highlights the one being read, says "English", and stops on a tap; <br>• **"Earlier report / Later report" buttons** in place of the replay drag; <br>• 3 next steps, Follow, and "Back to the full page". <br>The full page also gained **arrow step buttons** on the replay stage (web and app), so no instrument needs a drag. |
| **G-33** Tower-level progress | WebProject § How much is built? (stage); AppProject § Built | A **Tower: All · A · B · C** picker. Pick a tower and the 3D tower draws that tower's slabs, the first tile reads "Tower A, slab 9 of 20", and a live note follows the replay quarter. <br>QPRs before Oct–Dec 2024 say "This QPR reports Phase 2 as a whole, not by tower." <br>Tower A at Jun 2026 adds "A demand for slab 12 went out on 10 Oct 2026." The intro, records, towers list, From the developer and the plans explainer all say A slab 9, B slab 7, C slab 5. |
| **G-35** Flooding | WebProject § Homes (under the plan, visible); AppProject § Homes (visible) | "Reported waterlogging near Sector 37D" with two dated chips: **News report · 28 Jul 2026** and **News report · 21 Aug 2025**. Each opens a "Reported · not verified" evidence record on web. Then: "Reported, not verified by Plinth. No report names the Aurelia site itself." |
| **G-40** Selling before possession | WebProject and AppProject → "Selling before possession" | Covers: <br>• transfer = endorsement plus the builder's NOC; <br>• a From-the-developer tone field: ₹150/sq ft super = ₹3.0 L on the 3 BHK, all dues first, no transfer before the registered agreement; <br>• RERA s.2(d): the new buyer inherits your rights, including delay interest; <br>• ask a CA (capital gains) and a lawyer (stamp duty); <br>• transfer checks arrive in R2 (Apr–Jun 2027). |
| **G-41** Possession expectations | WebProject § risk (next to "The OC is not the keys"); AppProject § risk | "At possession, we'll help you check the OC, the final demand and delay interest (planned for Jul–Sep 2027)." See open question 1 for the date. |

## 2. The other asks

| Ask | Where | Result |
|---|---|---|
| (a) "From the developer · not verified by Plinth" | WebProject (expander button and block header); AppProject (expander button and panel line); also in the transfer-policy tone fields | Done on every project page. "Developer says · not yet verified" claim fields are a separate lane and keep their own label. |
| (b) AppProjectStates | new, 390 × 4,700 | `state` tweak with **Severe · Stalled · Limited history · Not scored · Stale data · Re-scoring · Facts-only**, mirroring WebProjectStates. Each state has: <br>• a photo hero with the borderless chip, flag pill, title, summary, price, claim line and "Already booked here?"; <br>• the risk answer with its instrument (scale + rule field, 4 slabs + overdue bar, what-to-check list, data-age bars, the 72-hour re-score steps, or the facts list); <br>• "If you've already booked here", with the I've-booked toggle; <br>• a Follow / Ask bottom bar. <br>`claim` tweak too. |
| (c) Stale and re-scoring states | WebProjectStates (and the app) | **Stale data**, Coral Towers (High): <br>• a "Stale data" pill and the tag "progress 187 days old"; <br>• the newest QPR on HARERA is Jan–Mar 2026, filed 14 Apr 2026; the Apr–Jun and Jul–Sep QPRs are missing; <br>• a **"How old is each record?"** instrument: age bars against a 120-day line, hatched and labelled "Stale" for the QPR, "Fresh" for extensions, orders and insolvency checks; <br>• "What would clear the flag: a new QPR". <br>**Re-scoring**, Sapphire Grove Ph 1 (Moderate): <br>• a "Re-scoring" pill; <br>• the Jul–Sep 2026 QPR was filed 15 Oct, appeared 16 Oct and was fetched 16 Oct at 7:40 pm, with the update due by 19 Oct 2026, 7:40 pm; <br>• a **"Reading the new filing"** step track: Filed ✓, Fetched ✓, Two extractors (now), Person check, Band updated or confirmed; <br>• "We show no figures from the new filing until two extractors agree and a person has checked them." <br>Both have their own booked panels. |
| (d) AppRisk | AppRisk | G-23 line and hatch legend; the Apr 2029 late line; **So what do we do now?** (G-08), with steps per band, base rate and lower band nearby; the pre-RERA expander (G-16). <br>Corrected to §5b: <br>• the late-QPR evidence now reads Jul–Sep 2024 12 days, Jan–Mar 2025 41 days, Oct–Dec 2025 38 days (it said Apr–Jun 2024 41); <br>• the pending line now names 25 Oct 2026; <br>• the Developer-says block notes "the latest QPR, Apr–Jun 2026, shows Tower B at slab 7". <br>It has one illustrative caption, and the footer moved to `bg` so bands alternate. |
| Facts-only state (fix-dev2 G08) | WebProjectStates and AppProjectStates `state = Facts-only` | Aurelia with a neutral **"Band withheld · facts only"** chip (outline meter, no risk colour). <br>Summary: "Band withheld pending review, from 18 Oct 2026". Lead: "We're not showing a band for this project while a court considers an application about our bands for the Northfield Estates group. Every fact below is from public records." <br>What's withheld, "Not a finding", and a **"The records, as they stand"** list of 6 sourced rows. The copy follows WebDeveloper. |
| Claim-status line (fix-dev2 G20) | WebProject hero ("… by Northfield Estates · claimed developer page, replies here"); AppProject hero; both states artboards (claim line under the hero) | As on record: Elmstone and Vantage show "**invited 24 Nov 2025 · not yet claimed**"; the others read claimed. A `claim = Not claimed` tweak forces the invited line on any state, as WebDeveloper does. |
| "14 complaints · 2.8 per 100 units" | WebProject (reason 3, records row, evidence, AI answer, Simple view); AppProject (AI answer, Simple view); AppRisk (reason 3, evidence); the states facts-only list | "Median 3" is now labelled "median count". |
| "Talk to our team" relabel | AppProject Ask sheet; WebProject Ask | Both now read "Talk to a Plinth adviser · paid by you, never by developers". |
| Loans are R2 | WebProject and AppProject loans explainers; §5b | Uses "Loan checks arrive in 2027". No lender is named, no referral appears and no fee is shown. |

Also fixed to match §5b:
- "More than 12 months late" on WebProject and AppProject said "after **Dec 2028**". It now says "after **Apr 2029**, with the 4-month blanket extension of Jul 2026".
- The replay notes and story chapter said Apr–Jun 2024 was 41 days late. They now give Jul–Sep 2024 (12 days) and Jan–Mar 2025 (41 days).
- The QPR register extract and the records row are corrected the same way.

## 3. Facts added to DESIGN.md §5b

All are in one block, "Project pages, round 2", at the end of §5b:
- Aurelia slabs by tower per QPR (reported from Oct–Dec 2024; Apr–Jun 2026: A 9, B 7, C 5, of 20 floors each). Due-by-registration share by tower: 52.5%, 45% and 37.5%.
- The late line is Apr 2029 everywhere; "after Dec 2028" is wrong.
- The confidence copy rule ("We're less certain about this one…"; "Not enough history to score").
- The Gurugram base rate: 76 of 212, about 36 of 100, taken from WebAbout's illustrative backtest.
- The lower-band-nearby rule and its result for Aurelia.
- Reported waterlogging in Sector 37D: news reports of 28 Jul 2026 and 21 Aug 2025.
- Northfield before RERA: three projects, their sources, and the coverage limit.
- Lenders: "approved by major banks" (Developer says), with no lender named in R1.
- The transfer policy: ₹150/sq ft super, ₹3.0 L, dues first, no transfer before the agreement.
- Later-feature dates as buyers see them: "Loan checks arrive in 2027"; transfer checks Apr–Jun 2027; possession help Jul–Sep 2027.
- The Sapphire re-scoring timeline and the Coral stale-data facts.
- Claim status for every developer (S1 invitation 24 Nov 2025; claimed or not yet claimed).
- The facts-only example, marked as a design state, not a current fact.
- The complaint-rate rule.

## 4. Needs legal review (`data-review="legal"` on the panels)

- **Payment plans:**
  - the subvention description ("you are still the borrower…");
  - "the law still caps you at 10%" before a registered agreement (RERA s.13).
- **Loans:**
  - stage-wise payouts and pre-EMI;
  - "the bank can hold its payout";
  - "banks usually don't lend for stamp duty or registration".
- **NRI:**
  - FEMA payment routes (NRE, FCNR(B) or NRO; no notes or traveller's cheques);
  - s.194-IA TDS at 1% for NRI buyers, and the PAN;
  - POA attestation or apostille, then stamping within 3 months (Indian Stamp Act s.18);
  - repatriation linked to the paying account.
- **Selling before possession:**
  - RERA s.2(d), under which the transferee is the allottee and inherits delay interest;
  - the stamp duty and capital-gains pointers.
- **Coral (stale) booked panel:** "ask a lawyer how the extensions affect a claim under RERA s.18".
- **Facts-only wording**, carried over from fix-dev2: whether a page should disclose that litigation exists.

## 5. Needs founder review (`data-review="founder"` where it applies)

- **Lower band nearby.** It informs, but it could read as steering a buyer to other projects. It is chosen by a published rule (same corridor, lower band, all-in within 20%) and says "nobody pays to appear". Keep it, or drop it?
- **Pre-RERA history.** It names older projects from court orders and news, and none of it counts in the band. Is the coverage line enough?
- **International WhatsApp numbers for alerts** and family joining by link: stated as product behaviour in the NRI panel (G-17 recommends them).
- **"From the developer"** stays a claim-tone block in Homes, labelled "not verified by Plinth".
- **The two new decision sections sit before "How much is built?"** This keeps the bands alternating and puts the "what to do" right after the band, as G-08 asks. If you'd rather the before-booking explainers come after the wait section, the bands need re-toning from there down.

## 6. Open questions

1. **G-41 date.** The brief said "coming Jun 2027". WebAbout already says possession help is "R3 · planned for Jul–Sep 2027", so I used Jul–Sep 2027 to avoid a new contradiction. Confirm the date.
2. **Tower-level QPR data.** I assumed Northfield's QPRs give slabs by tower from Oct–Dec 2024. The data team should confirm the HARERA QPR format supports this; if not, the picker shows the phase only.
3. **New example facts other screens don't show yet.** The Sapphire re-scoring timeline (Jul–Sep QPR arrived 16 Oct) and Coral's missing QPRs are new in §5b. WebFollowing and AppFollowing don't show them yet, which isn't a contradiction but is a gap.
4. **AppProject is 9,800 px.** It is a long capture now that it carries the decision sections and the explainers, all collapsed. A later app pass could move "What else before booking?" into a sheet.
5. **WebProject height.** About 9,050 px by arithmetic, against a ≤ 9,000 target. A render may come in a little over or under.

## 7. Images

No new image requests: `product/design/assets/requests_project2.json` is an empty list.
- heroHeron, now generated, is used in both states artboards.
- Reused: heroAurelia, heroLaurel, heroJuniper, heroCoral, heroSapphire, siteProgress, roomBare and the staged rooms, qprDesk and ordersDesk.
- cameraSite is no longer on WebProject (dropped to save height); 4+ pictures remain.
