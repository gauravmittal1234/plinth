# Plinth 10x shortlist: 105 ideas down to 15

| | |
|---|---|
| **Status** | Draft for founder decision before code starts |
| **Date** | 18 Oct 2026 |
| **Author** | Principal product designer (Claude) |
| **Inputs** | Six design reviews in `product/design/review/` (24 screens); PRD v1.0 §1, §6, §8, §12, §13, §15; regulatory register §1 and §3 ("register") |
| **Data** | All projects, developers and figures are fictional, from the design set (Aurelia Heights, Kestrel Park, Northfield Estates and others) |

**[J]** marks my judgement; every score is one. **[U]** marks a regulatory point I could not verify here.

---

## 0. The answer on one screen

- **105 raw ideas** merge into **47 distinct ideas plus 1 risky variant** (§2).
- **Bring five into R1** [J]. They are the top five by score, and each reuses a pipeline R1 already builds:
  1. **Site-visit co-pilot** (88)
  2. **Since you last looked** (87)
  3. **Claims vs records: forward anything** (81)
  4. **Pay-as-built guard**, present-tense only (81)
  5. **Watch the condition** (79)
- **Next five, for R2–R3:**
  - Search by your keys deadline
  - Promise ledger
  - "Were we right?"
  - Delay priced in your rupees
  - Proof pack
- **Drop:**
  - live listening to salespeople;
  - registering Plinth as a DPDP Consent Manager;
  - the open dataset;
  - AR walk-throughs;
  - the sound-and-air snapshot.
- **Defer:** anonymised price spreads, the verified allottee network, the leak detector and Hindi/Hinglish voice.
- **Conflicts:** 12 conflicts with PRD §12 or the founder decisions touch 20 ideas. Only two of those ideas have no compliant form (§6).

---

## 1. Method

**Extraction and merging.** I extracted all 105 ideas: web-core 14, web-tools 20, web-trust 16, app-core 22, app-ai 21 and WhatsApp 12.
- **When I merged:** two ideas became one when they do the same buyer job on the same data join, whatever the surface (camera, WhatsApp or web). The merged idea keeps the strongest framing and credits every source screen.
- **Variants:** a version of an idea with a materially different legal risk, such as listening to the salesperson, gets its own row.
- **Planned features:** every idea was checked against PRD §8. If it is already planned, the row says "builds on F-xx", and only the delta is scored.

**Criteria (1–5):**

| Criterion | 5 | 3 | 1 |
|---|---|---|---|
| **I · Buyer impact** | Changes a ₹-lakh decision, or prevents a loss at the moment it happens | Saves time or adds confidence | Nice to have |
| **M · Uniqueness and moat** | Needs our dated filings archive or the score; compounds; structurally impossible for developer-paid portals (99acres, Housing/Aurum, Square Yards) | Needs our data, but a funded rival could rebuild it in a quarter | Any team ships it in a sprint |
| **F · Feasibility for a tiny team** | S; reuses R1 pipelines | M; one new extractor or model, with human review | L; new licensed data or a vision model, or user volume Gurugram won't supply in year 1 |
| **B · Brand idea and D1** | Literally "filings become floors" or "Records show vs Developer says" | Adjacent | Off-brand, or conflicts with a founder decision |
| **L · Legal and privacy (5 = low risk)** | Facts we already publish | Advice-adjacent or user documents, mitigated by copy rules and review | Third-party data without consent, or likely defamation or regulatory exposure |

**Weights.** Total = 20 × (0.30 I + 0.25 M + 0.20 F + 0.10 B + 0.15 L), out of 100.

| Criterion | Weight | Why |
|---|---|---|
| Impact | 30% | "10x for the buyer" is the brief |
| Moat | 25% | D1 cuts base-case M24 revenue from about ₹64 L to ₹45–50 L a month (§13.1), and §16 rates Aurum copying our AI features as high likelihood. A tiny team should only build what rivals structurally can't copy |
| Feasibility | 20% | R1 is 16 weeks on three surfaces, with an assumed 3–4 engineers [J]. But this is a shortlist, not a sprint plan |
| Legal | 15% | An injunction that stands for more than 60 days forces "facts-only" mode (§14). Most risk can be managed with copy rules, though, and outright rule breaks are treated as gates (§6), not points |
| Brand | 10% | Nearly every idea scores 4–5, so a heavier weight would add noise. D1 breaches are gates anyway |

**Ties, sensitivity and limits:**
- **Ties** are broken by impact, then by convergence (how many screens proposed the idea), then [J].
- **Equal weights** leave the top two unchanged (88 each). Places 3–7 then tie at 80: Claims vs records, Pay-as-built, Watch the condition, Keys deadline and "Were we right?". The R1 cut among the last three therefore rests on data dependency (§5a).
- **Limits:** there is one rater and no user research (§18), so treat a gap of 1–2 points as noise.

---

## 2. Full deduplicated list with scores

Each screen is named with the number of its idea, so "WebHome 1" is the first idea on WebHome.

| ID | Idea | Proposed on | Builds on | I | M | F | B | L | **Total** | Rank |
|---|---|---|---|---|---|---|---|---|---|---|
| **A** | **Claims vs records** | | | | | | | | | |
| A1 | **Claims vs records: forward anything.** A brochure, flyer, voice note, screenshot or hoarding photo comes back as "Brochure says / Records show" | WebHome 1, WaRisk 1, AppExplore 1 and 4, AppVoice 4 | F-08, F-10, F-30 | 5 | 4 | 3 | 5 | 3 | **81** | 3 |
| A2 | **Quote X-ray.** The cost sheet against the filed price list, your previous quote and the model agreement | AppScan 2, WaCost 4 | F-10, F-46 | 4 | 3 | 3 | 4 | 3 | 68 | 24 |
| A3 | **Promise ledger.** Every completion date the developer ever stated, "said vs did" | WebDeveloper 1 | F-03 | 4 | 5 | 3 | 5 | 2 | **77** | 7 |
| A4 | **Sample-flat truth check, then possession-day diff** | WebVisualise 1, AppVisualiseCapture 1, AppVisualiseResult 1 | F-24, F-29, F-53 | 4 | 4 | 2 | 4 | 3 | 69 | 20 |
| A5 | **Site-visit co-pilot.** Questions drawn from the records, then the buyer's own recap checked against them | WaAlerts 2, WebProject 3, AppVoice 1, AppProject 1 | F-44, F-01 | 5 | 4 | 4 | 5 | 4 | **88** | 1 |
| A6 | *Variant of A5:* **live "pitch check"**, where the phone listens to the salesperson | AppProject 1, AppVoice 1 | — | 5 | 4 | 2 | 4 | 1 | 69 | 19 |
| A7 | **Ask the developer, on the record**, plus an allottee bloc | WebDeveloper 4, AppProject 4, WebProject 5 | F-63, F-46 | 3 | 4 | 3 | 4 | 2 | 64 | 32 |
| **B** | **Your money vs their build** | | | | | | | | | |
| B1 | **Pay-as-built guard.** The payment plan and demand letters over the filed slab progress | WebProject 1, WaCost 1, AppFollowing 1, AppProject 2, WebCostSheet 3 | F-41, F-16, F-53 | 5 | 4 | 3 | 5 | 3 | **81** | 4 |
| B2 | **Delay priced in your rupees.** Rent plus pre-EMI over the delay spread; "the price of this track record" | WebHome 3, WebCompare 1, WebFollowing 2, WebDeveloper 5 | F-12, §6.2 v2 | 4 | 4 | 3 | 4 | 3 | **73** | 10 |
| B3 | **Remedies priced from HARERA orders**, plus an s.18 exit card | WebProject 4, AppFollowing 4 | F-46, F-53 | 4 | 4 | 3 | 4 | 2 | 70 | 18 |
| B4 | **Escrow cash-flow X-ray** | WebProject 2 | F-01 | 3 | 4 | 2 | 4 | 3 | 63 | 34 |
| B5 | **Move-in number** (all-in plus furnishing and moving) | WebCostSheet 5, WebVisualise 4, AppVisualiseResult 2 | F-11, F-24 | 3 | 2 | 5 | 3 | 4 | 66 | 28 |
| B6 | **Negotiation kit:** draft my ask, or rehearse it | WebCostSheet 2, WaCost 3, AppVoice 2 | F-10 | 4 | 2 | 4 | 3 | 3 | 65 | 29 |
| B7 | **What others in this tower were quoted** | WebCostSheet 1 | — | 5 | 5 | 1 | 3 | 2 | **71** | 14 |
| B8 | **"Who will own it?"** stamp-duty choice | WaCost 2 | F-11 | 3 | 1 | 5 | 2 | 4 | 59 | 41 |
| B9 | **Rule-change watch** | WebCostSheet 4 | F-11 | 2 | 2 | 4 | 3 | 4 | 56 | 43 |
| B10 | **Group stress map** (MCA charges) | WebDeveloper 2 | F-03 | 3 | 4 | 1 | 4 | 2 | 56 | 42 |
| B11 | **Safer twin / risk-for-money frontier** | WebSearch 2, WebHome 2 | F-04, F-32 | 4 | 4 | 3 | 4 | 3 | **73** | 11 |
| **C** | **Time machine** | | | | | | | | | |
| C1 | **Since you last looked.** A portfolio diff, a weekly filings newsroom and a card that knows it is stale | WebFollowing 1, WebHome 5, WaRisk 4 | F-50, F-05 | 4 | 5 | 4 | 5 | 4 | **87** | 2 |
| C2 | **Watch the condition.** "What would change this" as live checkpoints | AppRisk 1, WebMethodology 3, WebCompare 3, WebDevPortal 3 | F-02 | 4 | 4 | 4 | 5 | 3 | **79** | 5 |
| C3 | **Filing day, live.** The extract in the notification, and the tower grows in the alert | AppFollowing 2, AppRisk 4, WaAlerts 1, WebDeveloper 3 | F-50 | 3 | 3 | 3 | 5 | 4 | 67 | 25 |
| C4 | **Saved searches that watch records** | WebSearch 3, AppMap 3 | F-32, F-50 | 3 | 3 | 4 | 4 | 4 | 69 | 22 |
| C5 | **Risk weather:** a sector layer with replay | AppMap 1, WebSearch 4 | — | 3 | 4 | 3 | 4 | 3 | 67 | 26 |
| C6 | **Search by your keys deadline** | WebSearch 1, AppMap 2 | F-31, §6.2 v2 | 4 | 4 | 3 | 5 | 4 | **78** | 6 |
| C7 | **Home-screen widgets** | AppExplore 3, AppYou 5 | — | 2 | 2 | 4 | 4 | 5 | 61 | 37 |
| **D** | **On site: camera and voice** | | | | | | | | | |
| D1 | **On-site tower lens.** Which tower, its filing and the slabs you can see | AppScan 1, AppMap 4 | F-08 | 4 | 5 | 2 | 5 | 3 | **76** | 9 |
| D2 | **Buyers' progress ledger** | AppScan 3, AppProject 3, WebProject 3 | F-52 | 4 | 5 | 2 | 4 | 2 | **71** | 15 |
| D3 | **Location-verified site capture** (developers) | WebDevPortal 1 | F-63 | 3 | 4 | 3 | 4 | 3 | 67 | 27 |
| D4 | **Instant identify:** Quick Settings tile, hoarding-to-column | AppScan 4, WebCompare 5 | F-08 | 2 | 2 | 5 | 4 | 5 | 65 | 31 |
| D5 | **Drive-by risk radar** | AppExplore 2 | — | 3 | 3 | 3 | 4 | 3 | 62 | 36 |
| D6 | **Furniture fit at scale** | WebVisualise 2, AppVisualiseCapture 3 | F-24, F-29 | 3 | 3 | 2 | 3 | 4 | 59 | 40 |
| D7 | **Orientation, sun and view facts** | WebVisualise 3, AppVisualiseCapture 2, AppVisualiseResult 4 | F-24 | 3 | 3 | 3 | 3 | 3 | 60 | 38 |
| D8 | **Sound and air snapshot** | AppVisualiseCapture 4 | — | 2 | 2 | 4 | 2 | 4 | 54 | 45 |
| D9 | **AR at scale** | AppProject 5, AppVisualiseResult 3 | F-24 | 2 | 2 | 2 | 3 | 3 | 45 | 48 |
| D10 | **Voice answers and briefings in Hindi/Hinglish** | WaRisk 3, WebFollowing 4, AppVoice 3, AppRisk 3, AppExplore 4, WebDeveloper 3 | F-30, F-31 | 4 | 2 | 3 | 2* | 3 | 59 | 39 |
| **E** | **Proving we're right** | | | | | | | | | |
| E1 | **"Were we right?"** A calibration scoreboard plus Plinth's own SLA board | WebMethodology 1, WebDevPortal 4 | F-07, §6.2 | 3 | 5 | 3 | 5 | 4 | **77** | 8 |
| E2 | **Glass-box replay: "Score it yourself"** | WebMethodology 2 | F-07 | 3 | 4 | 4 | 5 | 3 | **73** | 13 |
| E3 | **Open methodology kit** (dataset) | WebMethodology 4 | F-07 | 2 | 2 | 3 | 4 | 2 | 48 | 47 |
| E4 | **Proof pack** for your bank and lawyer | AppRisk 2 | F-06 | 3 | 4 | 4 | 5 | 3 | **73** | 12 |
| E5 | **Fix at the source:** the notice is withdrawn automatically | WebDevPortal 2 | F-63 | 2 | 3 | 4 | 4 | 4 | 63 | 35 |
| E6 | **Verified allottee network** | WebFollowing 3, WebHome 4 | F-51, F-27 | 4 | 5 | 2 | 4 | 2 | 71 | 16 |
| **F** | **Privacy you can see** | | | | | | | | | |
| F1 | **Leak detector** | WebPrivacy 1, AppYou 2 | F-80 | 4 | 5 | 2 | 4 | 2 | 71 | 17 |
| F2 | **Consent receipts / Plinth as Consent Manager** | WebPrivacy 2, AppYou 3 | F-81, F-88 | 3 | 4 | 2 | 4 | 3 | 63 | 33 |
| F3 | **Reach controls:** per-party log, expiry, call windows, go dark | WebPrivacy 3 and 4, AppYou 1 | F-80 | 3 | 3 | 4 | 4 | 4 | 69 | 21 |
| F4 | **The buying brief stays on the phone** | AppYou 4 | — | 3 | 3 | 3 | 4 | 4 | 65 | 30 |
| **G** | **Deciding together** | | | | | | | | | |
| G1 | **Family circle:** relatives opt in themselves, get the same alerts and vote | WebCompare 2, AppExplore 5, AppFollowing 3, WaRisk 2, WaAlerts 3, WebVisualise 5 | F-05, F-51 | 4 | 3 | 3 | 4 | 3 | 68 | 23 |
| G2 | **Your-life rows** (commute) | WebCompare 4, WebSearch 1 | — | 3 | 1 | 3 | 2 | 5 | 54 | 44 |
| G3 | **No-typing WhatsApp login** | WaAlerts 4 | — | 2 | 1 | 5 | 2 | 4 | 53 | 46 |

\* B = 2 because Hindi/Hinglish output breaks English-first (§2 principle 5; §11).

**What the scores hide** [J]:
- The two ideas proposed most often, D10 and G1 (six screens each), both missed the top 15:
  - D10 is blocked by English-first. An English-only version would score about 63.
  - G1 has a low moat.
- G1 still earns its **S-sized slice in R1**: a link the relative taps to opt in to the same alerts. Ship it inside F-05 "Share with family". It is the cheapest growth loop on the list.

---

## 3. Themes

The brand idea is that a project's own filings become the floors of its building. The top 15 fall into five themes, and each one reads that building differently.

1. **Claims vs records:** the marketing is the facade; the filings are the floors. These ideas put the developer's words beside its records at the moment the buyer meets them. *Ideas #3, #7.*
2. **Your money vs their build:** the buyer's rupees become a second line on the tower: money paid against floors cast, and what a delay costs in their own rent. *Ideas #4, #10, #11, #14.*
3. **Time machine:** every floor is dated, so the building has a history (what changed since you looked) and a next floor (which filing would move the band). *Ideas #2, #5, #6.*
4. **On site: camera and voice:** the filed floors meet the concrete, in the sales gallery and in front of the tower. *Ideas #1, #9, #15.*
5. **Proving we're right:** Plinth's own building, the score, is open to inspection: its hit rate, its arithmetic and its evidence. *Ideas #8, #12, #13.*

---

## 4. Top 15

| # | Idea | Theme | Score | Why it's here | When [J] |
|---|---|---|---|---|---|
| 1 | Site-visit co-pilot | On site | 88 | Reaches the most expensive five minutes of the purchase with near-zero legal risk, because the buyer records only their own recollection | **R1** |
| 2 | Since you last looked | Time machine | 87 | The thesis ("a memory of every promise"), running on snapshots we already keep | **R1** |
| 3 | Claims vs records: forward anything | Claims vs records | 81 | The buyer's real input is a broker forward; this is also the acquisition loop | **R1** |
| 4 | Pay-as-built guard | Your money | 81 | Covers the biggest avoidable loss and makes Plinth a 3–5 year companion | **R1** (present tense) |
| 5 | Watch the condition | Time machine | 79 | Turns a verdict into a falsifiable forecast; the engine is deterministic and cheap | **R1** (with S2) |
| 6 | Search by your keys deadline | Time machine | 78 | Buyers have real deadlines; portals filter on the promised date | R3 |
| 7 | Promise ledger | Claims vs records | 77 | A compounding archive that no developer-paid portal will build | R2 |
| 8 | "Were we right?" | Proving | 77 | No rating body in Indian real estate publishes its hit rate | R2, then live |
| 9 | On-site tower lens | On site | 76 | The brand idea made physical | R3 |
| 10 | Delay priced in your rupees | Your money | 73 | Delay in rupees beats delay in months | R2 / R3 |
| 11 | Safer twin | Your money | 73 | "₹30 L less, lower band" turns a list into a decision | R2–R3 |
| 12 | Proof pack | Proving | 73 | The evidence becomes a working document in the deal; the natural Pro deliverable | With Pro (~M2) |
| 13 | Glass-box replay | Proving | 73 | An auditable score, once redesigned to respect D4 | R2 |
| 14 | What others were quoted | Your money | 71 | The most valuable number at the sales desk | Defer |
| 15 | Buyers' progress ledger | On site | 71 | Covers the 90 days between filings | R3 (= F-52) |

---

## 5. Recommendations

### 5a. Bring into R1 now

#6 and #8 are left out of R1 on purpose [J]. #6 needs a delay distribution in months, but Delivery Risk v1 predicts only Late12, and P50/P80 dates arrive with the v2 model in R3 (§6.2, §15). #8 is honest only with out-of-time cohorts; an in-sample backtest presented as "were we right" would overstate accuracy.

**1. Site-visit co-pilot (#1).** *User story:* "I'm visiting Aurelia Heights, Phase 2 on Saturday. I want to walk in knowing the questions the records raise, and walk out with what I was told checked against those records, before anyone asks for a booking cheque." *Screens:* the WaAlerts visit pass gains "5 questions from the records", for example "Why was the Oct–Dec 2025 QPR filed 38 days late?". A utility follow-up two hours after the slot asks "What did they tell you?". WebProject and AppProject get a "Before you visit" block, and app Visit mode is a checklist, not a microphone. The buyer records a voice recap in AppVoice, which is saved privately in Following as "Developer says (sales office, unverified, 24 Oct 2026)". *Data and AI:* about 10 deterministic question templates fed by truth-panel facts (late QPRs, extensions, sold vs built, OC status, orders). The recap goes through speech-to-text behind the model gateway, and its claims are extracted with pick 3's schema and compared with the records. Audio is deleted after transcription, and nothing about the salesperson is captured. *Effort:* S–M, about 2–3 engineer-weeks plus 1 design-week [J]. It depends on F-44 and on pick 3.

**2. Since you last looked (#2).** *User story:* "I follow four projects for months. Show me only what changed since I last looked, and when an old card resurfaces in the family group, it should say what changed since it was issued." *Screens:* WebFollowing and AppFollowing open on "Since 4 Oct: 1 band change, 1 extension, 2 filings", each shown as a before/after on the existing instrument; the date scrubber follows in R2. WebHome gets "This week in filings" per corridor, for example "Coral Towers: second extension granted". In WaRisk and WaAlerts, every card carries an issue date and QR code, and a scanned QR or a returned image answers "Issued 14 Oct 2026. Since then: QPR Jul–Sep 2026 filed; band unchanged." *Data and AI:* no new data, because facts are already snapshotted with a timestamp and hash, and scores are immutable versioned runs. The build is a nightly diff, about 12 change types with one template sentence each, per-user last-seen stamps, permanent card URLs and a perceptual hash for returned cards. Method changes are labelled separately from record changes, and no AI touches the numbers. *Effort:* M, about 3–4 engineer-weeks [J]. The newsroom ships with S1 (around week 6), and band diffs ship with S2.

**3. Claims vs records: forward anything (#3).** *User story:* "My broker sent a 'NEW LAUNCH, possession 2026' flyer. I forward it and get each checkable claim back beside what the records show." *Screens:* in WaRisk, the forward leads to a match-confirm list, then a claims card plus the risk card. WebHome gets "Drop a brochure" as the hero's second action. WebProject gets a "Brochure says / Records show" block. AppScan gains a photo mode for brochures and hoardings (OCR only, with AR deferred), and the Android share sheet offers "Ask Plinth" by explicit share. *Data and AI:* OCR plus an LLM extractor (`extract.marketing_claims@1`) into six claim types: possession date, price/all-in, super vs carpet area, RERA number and status, OC/"ready to move", and the banned phrases in register row 5. Matching uses the RERA number, otherwise name plus sector, with a mandatory "Is this Aurelia Heights, Phase 2?" step. Claims are compared with the truth panel and the F-11 cost rules. It is concierge-first (§18): a human reviews low-confidence reads for the first ~500 forwards. Third-party numbers are stripped, the brochure is never republished and media is deleted after 30 days. Copy never says "false" or "misleading". *Effort:* M, about 4–5 engineer-weeks [J], reusing F-10's OCR and the WhatsApp media webhook. **Build it first**, because picks 1 and 4 reuse it.

**4. Pay-as-built guard, present tense (#4).** *User story:* "Before I book, show me how much of my money the plan takes against what is built. After I book, let me forward each demand letter and see whether it runs ahead of the filings." *Screens:* WebCostSheet and WaCost add "If you book today, the plan asks for 45% (₹1.23 Cr) within 60 days. Latest QPR: 41% built (Apr–Jun 2026)." WebProject and AppProject draw a "your money" line on the tower. In WaCost, a forwarded demand letter returns "Your plan bills 10% at slab 12. QPR shows 9 of 20 slabs. Ask for the architect's certificate before paying." Receipts import and exposure on the Following bars wait for R2 (F-51). *Data and AI:* payment milestones parsed from the cost sheet (an F-10 extension) are mapped to tower-level QPR progress and the s.13 rule (F-41). Demand letters become a new document type in pick 3's pipeline, with bank details redacted at ingest. There is no pace forecast in R1, and a human reviews every demand check in the first months. *Data risk:* confirm that HARERA QPRs report slab counts per tower; otherwise show % built. *Effort:* M, about 3–4 engineer-weeks [J].

**5. Watch the condition (#5).** *User story:* "Aurelia is Elevated. Tell me which future filing would change that, and tick it off when it lands." *Screens:* on AppRisk and the WebProject card, "What would change this" becomes stateful checkpoints, for example "Two consecutive quarters with construction ahead of sales: 0 of 2 met · next QPR due 15 Jan 2027". Following lists them and alerts when one ticks. WebMethodology explains them, and WebDevPortal's "Path back" shows the identical public text. *Data and AI:* a deterministic search over the v1 scorecard (WoE bins and band thresholds) finds the smallest change a filing could plausibly make that crosses a band edge. The checks read physical progress plus the CA certificate, not filing dates alone, and every checkpoint is labelled "on method v1.2". An LLM may smooth the wording only behind the diff check. *Effort:* S–M, about 1–2 engineer-weeks [J], shipping with S2.

**Capacity** [J]:
- **Cost:** about **13–18 engineer-weeks plus 4 design-weeks**, on top of a full R1.
- **Order:**
  - pick 3 in weeks 1–6;
  - pick 2's newsroom with S1;
  - pick 1 once F-44 is live;
  - picks 4 and 5 with S2.
- **If it doesn't fit:**
  - ship the Visualise beta (F-24a) web-only, or move it to R2. None of the 13 Visualise ideas made the top 15; the best ranked 20th.
  - Pick 5 can also slip to R2 without hurting the others.

### 5b. Next five, for R2–R3

1. **Search by your keys deadline (#6), R3,** on the v2 P50/P80 model. Design the WebSearch deadline tile now.
2. **Promise ledger (#7), R2.** Start with RERA dates (F-03) plus the brochure dates pick 3 already harvests. Add documented sales messages in R3, after moderation rules and a media-liability review.
3. **"Were we right?" (#8), R2.** Design the Methodology slot in R1. The first edition is a labelled out-of-time backtest (registrations from 2017–2021, scored as of their date). Live cohorts start about 12 months after S2. The dispute SLA board ships in R2.
4. **Delay priced in your rupees (#10).**
   - **R2, backward-looking**, inside F-51: for example "this extension has cost you about ₹1.8 L so far", with the HARERA interest rule cited.
   - **R3, forward-looking**, built with #6.
5. **Proof pack (#12), with Risk Report Pro (~M2) or R2,** as Pro's core deliverable, with the safeguards in §6 row 4.

**After these:**
- **#9 On-site tower lens, R3:** the tower picker first; slab counting only after an on-device vision evaluation.
- **#11 Safer twin:** once all-in coverage exists, which depends on D5 price data.
- **#13 Glass-box replay, R2:** in a D4-safe form.

### 5c. Drop or defer

| Idea | Decision | Reason |
|---|---|---|
| A6 Live "pitch check" | **Drop** | Processes a third party's voice without consent (register row 23; lawyer Q12 open; DPDP). Play scrutinises covert recording, and galleries would ban phones [J]. Pick 1 delivers most of the value |
| F2 Plinth as Consent Manager | **Drop the CM part**; move receipts and "withdraw everywhere" into F-88 (R3) | Consent managers must be independent of data fiduciaries [U], and Plinth earns from the lenders and brokers who receive the data. The registration and net-worth burden [U] is too heavy |
| E3 Open dataset | **Drop**; keep the published spec (F-07) | Government data terms and IT Act s.43 (lawyer Q3, Q8). Redistributes promoter and director data. Hands rivals the facts |
| D9 AR at scale | **Drop** | Gimmick risk, SGI labels on every frame, high compute cost |
| D8 Sound and air snapshot | **Drop** | One phone-mic reading isn't evidence; off-brand |
| B7 What others were quoted | **Defer** (after R3, with a legal review) | Needs at least 5 sheets per tower, BHK and quarter, which Gurugram-only volume won't supply (D2). Also raises DPDP secondary use, re-identification in small towers, confidentiality clauses and poisoned uploads |
| D10 Voice in Hindi/Hinglish | **Defer** | Breaks English-first. Audio about a Haryana project must also say the RERA number aloud and carry an AI voice label |
| E6 Verified allottee network | **Defer to R3** (with F-27, F-52); signals only | Defamation and astroturfing; the register gates the reviews module "Later"; allotment letters are sensitive |
| F1 Leak detector | **Defer to R2**, when brokers and lenders are partners | In R1 the only parties are site offices. Attribution is weak, and published "leak records" risk defaming partners |
| A7 Ask the developer on record | **Defer to R3** (with F-46) | Intermediary duties and moderation; complaint drafting is close to legal services |
| B10 Group stress map | **Defer** (Later) | Paid MCA data; reads like a credit assessment (register row 12) |
| D5 Drive-by radar, G2 Your-life rows | **Defer** | Background-location policy and site polygons (D5); maps cost and not a records fact (G2) |
| G3 No-typing login | **Move to the platform backlog** | Useful, but not a 10x idea |
| Sub-features | **Cut** | <ul><li>The furnishing "top-up loan": breaks register rows 31–32 and the "$" gate.</li><li>Screen capture in "Ask about anything": use explicit share only.</li><li>AR anchoring in the hoarding X-ray: OCR first.</li><li>Meta Groups API family groups: unproven in India.</li><li>Relighting the buyer's photo, and claims about a neighbour's tower blocking the view.</li></ul> |

---

## 6. Conflicts with PRD §12 and the founder decisions

| # | Idea | Rule | Conflict as proposed | Compliant form |
|---|---|---|---|---|
| 1 | A6 Live pitch check | Register row 23, lawyer Q12; §2 principle 3 | A salesperson's speech is processed without consent | **None: drop** |
| 2 | D10; family alerts "in their language" (G1) | English-first (§2 principle 5; §11) | Hindi/Hinglish output | English voice only; Hindi *input* still understood |
| 3 | E2 Glass-box replay | **D4** (no public number); register row 12 (no "credit score") | The factor-points waterfall exposes the internal score; the copy says "a credit score you can audit" | Relative contribution bars that move a needle across the five bands, with no totals; drop the wording |
| 4 | E4 Proof pack | §6.2: developers use the score only through a live link | A static PDF of a good band can become developer marketing | "As of" on every page plus a live-band verify link; buyer-only export; never a band-only page |
| 5 | C2 "Path back", E5 Fix at the source | §12.1 rule 1 (no preview, no influence); D1 spirit | Developer-only guidance looks like a service to developers | Identical public text for everyone, free and publicly logged |
| 6 | B1, B3 | §12.1 rules 2 and 3; register row 22 (no legal advice) | "Pay / don't pay" or "you are entitled to" reads as advice | "Records show / your plan says"; human and advocate handoff; counsel reviews the s.18 templates |
| 7 | B5 top-up loan | Register rows 31–32; §12.2 "$" gate | Loan marketing before DSA agreements | Remove; arithmetic only |
| 8 | A7, G1, F1 | F-80 caps (≤3 parties in 30 days; one partner per property) | Could reveal the buyer to developers or partners | Anonymous by default; revealing identity counts as a party under the cap |
| 9 | C3 tower MP4, D10 voice | §12.1 rule 4 (RERA number bold, top right, spoken aloud in Haryana); rule 5 (AI labels) | Project video and audio need the RERA number on screen and aloud | Add both to the templates; label animations "Illustration from filings" |
| 10 | D1, D2, D3, E6 | §6.2: no LLM sets a score; satellite data corroborates only | Photos could be read as moving a band | Never a band input; separate "Buyers report" and "Captured on site" lanes |
| 11 | F2 | DPDP consent-manager rules [U] | Conflict of interest with fee-earning partners | **Drop the CM**; keep receipts in F-88 |
| 12 | B7, C4 | DPDP purpose limitation (register rows 26–27); WhatsApp categories (row 25) | Uploads reused for aggregates; launch matches may count as marketing | Separate opt-in with k ≥ 5; a weekly digest under a marketing opt-in |

**The founder decisions:**
- **D1:** none of the 105 ideas takes developer money. E5, D3 and C2's "Path back" stay D1-safe only if they are free, identical for everyone and logged publicly.
- **D2:** nothing breaks Gurugram-only. But crowd and k-anonymity ideas (B7, D2, E6, F1) are weaker on one city's volume, which is the main reason they are deferred.
- **D3:** the Android-only ideas (widgets, Quick Settings tile, call screening, geofencing) fit R1. PWA and iOS users won't get them until R2.
- **D4:** only E2 conflicts (row 3).
