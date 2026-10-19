# AI product strategy: feature portfolio and risk-score AI/ML design

Specialist input for the PRD · Author: AI product strategist · 18 Oct 2026 · Status: draft for senior PM

**How to read this.**
- Prices were checked on vendor pages on **18 Oct 2026** ([S1]–[S12] at the end). Recheck before budgeting. Two price rises are already announced: Gemini 4 Argon doubles on 1 Dec 2026 and Gemini 3.8 Flash doubles on 1 Jan 2027 [S1].
- FX is ₹92 per US$, as in the Phase-1 notes.
- **[J]** marks my own judgement or estimate. Research notes are cited as:
  - [RN-AI] ai_opportunities
  - [RN-VAL] valuation_and_data
  - [RN-DATA] ncr_risk_data_sources
  - [RN-DELAY] delay_drivers_and_failure_signals
  - [RN-UX] legal_risk_and_score_ux
  - [RN-ADD] additional_buyer_risk_scores
  - [RN-REG] regulatory_legal_tax

  Their primary sources are inside those notes.
- Unit costs are machine cost per use. They exclude people, GST, and telephony unless stated.

---

## 1. Summary

1. **One grounded "brain", many surfaces.**
   - A verified data layer holds RERA, DTCP, MCA, orders, risk cards, AVM ranges and documents.
   - One tool-using agent on top powers search, the Home Advisor, comparison, alerts and WhatsApp.
   - The moat is source-linked data, not the model. Text AI costs about ₹0.2–3 per turn [J].
2. **The Delivery Risk score is ML. LLMs work only at the edges.**
   - LLMs extract facts from about 17.9k HARERA orders and rating rationales, resolve entities, and phrase reason codes.
   - The champion model is an interpretable scorecard with hard-fact overrides. A monotonic GBM or survival model is the challenger.
   - No LLM ever sets a score.
3. **Labels and data size.**
   - The label is OC/CC date minus the *original* RERA date, after adding regulator-wide blanket extensions. Project-specific Section 6 extensions are not netted off.
   - Expect only about 1,500–2,500 matured project-phases. That means shrinkage, few features and out-of-time validation [J].
4. **Staging that is safe to show.**
   - Nano Banana 2.1 costs ₹3–5 per image and about ₹55–100 per staged listing.
   - Required safeguards: a structure guard, dimension-aware furniture, a burned-in label plus C2PA metadata, and the original photo first.
   - Under-construction units get only labelled "artist's impression" renders.
5. **The due-diligence (DD) reader is the most valuable and the most liable buyer AI.**
   - Machine cost is about ₹55–90 per 40-page pack.
   - It shows red flags with page citations and never says "clear title". A "Verified" badge needs a paid lawyer review.
6. **Developer AI pays for itself.**
   - WhatsApp qualification costs ₹2–5 per lead. Hindi voice costs ₹4–6 per minute plus telephony.
   - TRAI's 18 Sep 2026 amendment has two consequences for AI calls [S12]:
     - AI and robo (A2P) calls must be declared to the telecom operator in advance.
     - Inquiry-based calls are allowed only within 7 days of a verifiable written or digital inquiry.
   - So voice is P1 and consent-first.
7. **Brokers get a copilot, not a competitor.** It handles intake from WhatsApp forwards, matching, follow-ups, documents and co-broking. The broker keeps the client and the commission.
8. **Trust and safety is P0.** It covers:
   - duplicate and stale listings;
   - brokers posing as owners;
   - image forensics;
   - scam chats;
   - an SGI-label service for the IT Rules 2026.
9. **A lean architecture for a solo founder.**
   - Components: a model gateway (routing, budgets, fallbacks), "tools-first" RAG with a claim verifier, golden-set evals, batch tiers, and four human-in-the-loop queues.
   - AI COGS at 20k MAU is about ₹5–6 lakh a month, about 20% of it re-billable to developers [J].
10. **The P0 AI scope is 16 items (§5).**
    - Foundations: the data layer, the gateway and the evals.
    - Buyer features: Delivery Risk v1, alerts, search, the advisor, staging, DD reader v1, and the cost explainer.
    - Seller features: price range and video listing.
    - Supply side: broker intake and developer WhatsApp qualification.
    - Platform safety: trust and safety, and SGI labels.

---

## 2. AI feature catalogue by actor

Every feature passes through one guardrail stack (§4):
- grounded facts only;
- a source and an "as of" date on every number;
- AI disclosure;
- minimal personal data, in line with DPDP;
- a human queue where liability is high.

Priority: **P0** = MVP, **P1** = next, **P2** = later.

### 2.1 Buyers

| ID | Feature and user value | UX sketch | Models / vendors (build or buy) | Unit cost | Quality bar and guardrails | Pri |
|---|---|---|---|---|---|---|
| B-01 | **Hinglish/Hindi conversational search.** Ask the way you talk. | "Golf Course Ext pe 3BHK, 2.5 cr tak, OC wala, metro ke paas" turns into editable filter chips. Voice notes on WhatsApp. | **Build.** Gemini 3.5 Flash-Lite calls the search API. Sarvam Saaras v3 STT (code-mix) handles voice. Sarvam 105B is the fallback. | About ₹0.2 per turn; voice +₹0.5/min | Slot F1 ≥0.92 on 500 Hinglish queries. Results come only from the DB. Religion, caste and community filters are blocked. | P0 |
| B-02 | **AI Home Advisor:** grounded Q&A and next steps (deep dive below). | Chat on project and listing pages and on WhatsApp. Source chips on every answer. A human is one tap away. | **Build.** Gemini 3.8 Flash *or* Claude Sonnet 5.5 (bake-off decides). Flash-Lite routes and verifies. | ₹1–3 per turn | ≥98% of claims grounded; zero invented numbers. No legal, tax or investment advice beyond explainers. | P0 |
| B-03 | **Virtual staging** (Nano Banana) (deep dive below). | Swipe presets. A before/after slider is on by default. Badge: "AI-furnished · virtual". | **Build** a thin layer. Models: `gemini-nano-banana-2.1` (default), `gemini-3-pro-image` (hero), `gemini-3.1-flash-lite-image` (previews). Fallbacks: FLUX Kontext, Qwen-Image-Edit, gpt-image-2.5. | ₹3.1 (1K) or ₹4.6 (2K) per image; batch halves it | ≥95% pass the structure guard. The original photo is always shown first. | P0 |
| B-04 | **Floor plan → 3D.** Read the layout and the real usable space. | Open the plan. A 3D "dollhouse" shows room sizes and a carpet-area check. Optional render labelled "artist's impression". | **Build.** Gemini 3.8 Flash parses plan images into room JSON; a three.js extruder builds the 3D view; Nano Banana renders it. **Buy** walkthroughs (getfloorplan $25–69 [RN-AI]). | ₹2–5 per parse; ₹3–12 per render | Room dimensions ≥95% exact on 200 NCR plans. Flag if the rooms' total differs from RERA carpet area by more than 10%. | P1 |
| B-05 | **Due-diligence reader** (deep dive below). | Upload or photograph documents. In about 2 minutes: flags with severity, page, meaning, questions to ask, and an option to book a lawyer. | **Hybrid.** Sarvam Vision OCR; Claude Sonnet 5.5 or Gemini 4 Argon, each cross-checking the other on severe flags; a rules engine; a lawyer panel. | ₹55–90 per 40-page pack (machine) | Critical fields ≥97% accurate. Flag recall ≥90%, precision ≥70%. Never says "clear" or "safe". | P0 (RERA cert, BBA, allotment, cost sheet, OC); P1 (deed chain, EC, NOCs) |
| B-06 | **Total-cost and EMI explainer.** No surprises. | Upload a cost sheet. See an all-in waterfall (GST, stamp duty, PLC, parking, IFMS), EMI and income stress test, and "what's negotiable". | **Build** deterministic calculators on a versioned rate table. The LLM only parses and explains. | About ₹0.5 | The LLM never does money arithmetic. Shows old and new Income-tax Act section numbers [RN-REG]. | P0 |
| B-07 | **Future value, resale and rental estimator.** | A 5-year band (base, delayed-infra, downside), gross and net yield, a liquidity flag, and the method. | **Build.** Quantile GBM AVM with society effects plus a repeat-sales index [RN-VAL]. A probability-weighted infrastructure event table. | About ₹0.5; data licence is the real cost | Publish back-tested error. Refuse thin stock. "Not investment advice". | P1 |
| B-08 | **Comparison agent.** | 2–4 options side by side: all-in cost, **risk-adjusted possession date (P50/P80)**, risk reasons, price vs range, commute, carpet efficiency. | B-02 runtime plus a `compare()` tool. | ₹3–6 | Every cell is sourced. No overall "winner" (conflict-of-interest guardrail). | P1 |
| B-09 | **Site-visit copilot and snagging photo AI.** | Before: a checklist from the risk reasons ("ask for Q2 QPR, CA certificate"). During: guided photos. After: a snag-list PDF for possession. | **Build** on Gemini 3.8 Flash vision (cracks, seepage, tiles, paint, fittings). | About ₹0.2 per photo | Snag recall ≥80% on 1,000 labelled photos. Each flag shows an image crop. "Visual screening, not a structural assessment." | P1 |
| B-10 | **Construction-progress tracker** for booked units. | Monthly WhatsApp digest: tower % vs plan, escrow movement, satellite activity, divergence alerts. | **Build** a QPR parser plus the Sentinel activity index (§3.7). Flash-Lite writes the digest. | About ₹2 per project per month | Facts only, with quarter and source. An alert needs two independent signals. | P1 |
| B-11 | **Risk-score change alerts.** | WhatsApp: "Band changed Moderate → Elevated: 2 QPRs missed; new NCLT petition" with links. | Event-driven from the score service; fixed templates. | ₹0.115 per message + ₹0.3 | The developer is notified the same day. A move into the bottom band needs human sign-off unless a hard fact triggered it [RN-UX]. | P0 |

#### Deep dive B-02: the Home Advisor

**Tools, not memory.** The agent can call these tools. Every result carries `source_url`, `as_of` and `confidence`.

| Tool | Returns |
|---|---|
| `search_listings` | Matching listings |
| `get_project` | Project facts |
| `get_risk_card` | Risk band and reasons |
| `get_price_range` | AVM range |
| `get_cost_breakdown`, `compute_emi` | All-in cost and EMI |
| `get_neighbourhood` | Neighbourhood facts |
| `search_docs` | Orders, QPR text, methodology, lawyer-reviewed guides |
| `compare` | Side-by-side comparison |
| `schedule_visit` | A booked site visit |
| `handoff_human` | Hand-off to a human |

**Answer policy.**
- A Flash-Lite verifier checks every number and entity against the tool outputs before the answer is sent.
- If something cannot be verified, the agent says so and offers a human.
- It may explain law and process (for example RERA s.13 or TDS). It never recommends a purchase or gives a legal or tax opinion.

**Language.**
- Reply in the user's script: Roman Hinglish, Devanagari or English.
- Keep the terms people actually use ("OC", "registry", "BBA") and gloss them in Hindi [J].
- Voice runs through Saaras v3 and Bulbul v3.

**WhatsApp policy.** Meta's AI-provider pricing targets *general-purpose* assistants, not businesses using AI for their own service [S7]. Keep the bot property-scoped and decline off-topic chat [J].

**Targets.**

| Metric | Target |
|---|---|
| Groundedness (judge calibrated to human audit, kappa ≥0.7) | ≥98% |
| Task success on 300 scripted journeys | ≥85% |
| First token, p50 on 4G | under 2.5 s |

#### Deep dive B-03: staging that won't mislead

**Inputs and presets.**
- Inputs: a photo of the empty room, the room type, its dimensions (from B-04, the seller, or a LiDAR scan), a preset and a budget tier.
- Indian presets:

  | Preset | Furnishing budget |
  |---|---|
  | Modern Indian | ₹4–6 L |
  | Premium contemporary | ₹12–20 L |
  | Rental-ready minimal | ₹2–3 L |
  | Young family | — |
  | Work-from-home | — |
  | Traditional wood-and-brass | — |

- Optional items: puja unit, shoe cabinet, diwan, split AC.
- "Vastu-inspired" is a style label only, never a claim [J].
- Each budget tier maps to a SKU catalogue with real dimensions. Up to 10 items can be passed as object references [S2].

**Scale check.** Estimate scale from the door height (about 2.1 m). Reject furniture more than 15% off its real size [J]. This targets the "sofa 20% too large" failure [RN-AI].

**Structure guard.** Segment walls, windows, doors and floor in the before and after images. Reject the output if any of these hold:
- the mask IoU is below 0.97;
- the number of openings has changed;
- the floor material has changed;
- the view or the exposure has been altered.

**Labels (IT Rules SGI).**
- A burned-in badge.
- C2PA and IPTC metadata.
- SynthID [S2].
- The gallery opens on the original, and a link to the unedited photo is always available.
- The label cannot be removed through any download.

**Under-construction units.** Stage only sample-flat photos or B-04 views, labelled "Artist's impression, not the actual unit".

**Measurement.** A/B test staged vs unstaged resale listings on saves, enquiries and visits. Keep the complaint rate below 0.5% [J].

#### Deep dive B-05: the due-diligence reader

**Pipeline.**
1. Classify each document.
2. Run OCR: Sarvam Vision at ₹0.5–1 per page [S4], with Gemini as fallback for stamps and handwriting.
3. Mask Aadhaar, PAN and phone numbers.
4. Extract into a typed schema for each document type.
5. Run deterministic checks against verified data.
6. Run LLM clause analysis.
7. Re-check severe flags with a second model.
8. Produce the report.

**v1 checks.**
- RERA number matches the project.
- BBA possession date vs the RERA date.
- Carpet area vs the RERA disclosure.
- More than 10% taken before the registered agreement (RERA s.13).
- The delay-compensation clause vs the statutory rate.
- How broad the force-majeure clause is.
- Forfeiture percentage and unilateral cancellation.
- Arbitration and jurisdiction.
- PLC, parking and IFMS vs the cost sheet.
- Subvention or tripartite agreements [RN-DELAY].
- OC issuer, date, and presence in Gurugram's self-certified-OC audit [RN-ADD].
- Noida registry or dues status.

**Report wording.** "N red flags found in the pages provided — not a legal opinion." Each flag gives:
- severity;
- page;
- a short quote;
- its meaning in Hindi or English;
- "ask this".

**Data handling.**
- Uploaded documents are treated as data (injection defence).
- Storage is encrypted, with retention set by the user.
- "Verified by lawyer" comes only from the human tier.

**Evaluation set.** 150 lawyer-labelled Gurugram and Noida packs, refreshed quarterly.

### 2.2 Individual sellers

| ID | Feature and user value | UX sketch | Models / vendors | Unit cost | Quality bar and guardrails | Pri |
|---|---|---|---|---|---|---|
| S-01 | **Instant price range.** | Enter society, tower and floor. See a range, a confidence grade, comparables, and "what moves the price". | B-07 AVM plus comparables; the LLM explains. | About ₹0.5 | Publish median error and the share within ±10%. Too few recent comparables → "low confidence" or no estimate [RN-VAL]. | P0 |
| S-02 | **Listing from a phone video walkthrough.** | Record a guided 2–4 min video in the app (geotagged, timestamped). AI picks frames, writes English and Hindi copy, tags rooms, and draws a schematic plan. | **Build.** Gemini 3.8 Flash video understanding plus ffmpeg. Enhancement via S-03. The SVG sketch is labelled "approximate, not to scale". | ₹60–150 [J, token estimate] | Area, floor and OC are never inferred; the seller confirms them. Capture doubles as presence proof (P-02). | P0 (Android) |
| S-03 | **Photo enhancement and staging.** | Auto straighten, exposure and HDR. "Stage this room" uses B-03. | Deterministic enhancement (not SGI under the IT Rules carve-out [RN-AI]). Nano Banana only for staging. | Under ₹1; staging at B-03 rates | No generative "enhance". No sky or view swaps. | P0 |
| S-04 | **Buyer pre-qualification agent.** | A WhatsApp agent asks enquirers about budget, loan, timeline and slots. The seller gets a 1-line summary and a tier. | B-02 runtime; optional voice via the D-01 vendor. | ₹2–5 per enquiry | Disclosed as asking on the seller's behalf. No protected-attribute questions. Buyer consents to sharing. | P1 |
| S-05 | **Showing scheduler.** | Proposes slots, confirms both sides, sends reminders and a route link. | Build; WhatsApp utility templates. | ₹1–2 per visit | Location shared only with consent. | P1 |
| S-06 | **Offer and negotiation assistant.** | Comparable-based offer bands, net proceeds, and drafted counter-offers. | Sonnet 5.5 or Gemini 3.8 Flash plus the AVM. | ₹5–10 per session | Drafts only, never autonomous. When we serve both sides, one side's reservation price is never used for the other (hard data partition). | P2 |
| S-07 | **Paperwork copilot.** | A situational checklist (loan, Noida lease, NRI). Drafts loan-closure and NOC letters. Capital-gains estimate with both pre-23-Jul-2024 options. TDS under s.393(1) (old 194-IA). | Deterministic tax engine plus the B-05 stack plus LLM drafting. | ₹10–40 | Labelled "estimate, confirm with a CA". NRI cases go to a CA [RN-REG]. | P1 |

### 2.3 Developers

**Firewall: developer-paid tools never touch the risk score.** They run as separate services with separate data permissions, and this is audited [RN-UX].

| ID | Feature and user value | UX sketch | Models / vendors | Unit cost | Quality bar and guardrails | Pri |
|---|---|---|---|---|---|---|
| D-01 | **Lead qualification on WhatsApp and Hindi voice.** | WhatsApp reply within 60 s. Qualifies budget, configuration, timeline and loan, books a visit, and sends sales a summary. Voice only with a recorded inquiry or consent. | **Buy voice:** Bolna (6.0¢/min PAYG, 4.2–4.6¢ on Pilot; telephony and platform fees extra [S5]) or Sarvam Voice Agents (from ₹3/min [S11]). Pilot both. **Build** WhatsApp. Later, our own stack on Gemini 3.8 Live (about $0.023/min of audio [S1]). | Chat ₹2–5 per lead; voice ₹15–25 per 3-min call | AI disclosed in the first line. A2P declared to the operator. Inquiry calls within 7 days, otherwise registered consent [S12]. Instant opt-out. Fields ≥90% accurate vs audit. | P0 chat / P1 voice |
| D-02 | **Lead scoring.** | A 0–100 propensity score with 3 reasons. | GBM on engagement and qualification features. | Negligible | AUC ≥0.70 after 3 months. No protected attributes or proxies [J]. | P1 |
| D-03 | **Instant follow-up and nurture.** | Triggered WhatsApp updates on price list, QPR and visit reminders. | Rules plus LLM personalisation inside approved templates. | ₹0.115 utility / ₹0.86 marketing [RN-AI] | Frequency caps. Marketing only with opt-in. | P0 |
| D-04 | **Personalised brochures and videos.** | A one-page brochure for this buyer's unit, cost and commute. A 30-s template video with Hindi voice-over. | Template engine plus LLM and Bulbul v3. Veo 3.1 Lite only for labelled mood clips. | ₹2–10; Veo Lite 8-s clip about ₹59 [S1] | RERA number, QR code and site printed on every asset [RN-REG]. Veo never shows the unit. | P2 |
| D-05 | **Inventory pricing insights.** | Unit-level demand by tower, floor and facing; absorption vs the micro-market; price-ladder tests. | Analytics plus a GBM demand model. | ₹50–200 per project per month | Aggregated data only. Never shares one developer's data with another (competition-law hygiene) [J]. | P2 |
| D-06 | **RERA-ad compliance checker.** | Upload a creative. Checklist: RERA number, QR code (UP), HARERA site and DTCP licence (HR), "artist's impression", SGI label, no "assured returns". | Gemini 3.8 Flash vision plus our rules. | ₹1–3 per creative | Recall ≥95% on mandatory fields. Says "issues found", never "compliant". | P1 (free wedge) |
| D-07 | **Construction-update auto-generation.** | Upload site photos. AI drafts a buyer update reconciled with the QPR. | Gemini vision, QPR data, EXIF and geo checks. | ₹10–30 | Claims that diverge from the QPR or satellite data are blocked. Shows "developer-supplied" vs "independently observed". | P2 |
| D-08 | **Buyer communication assistant.** | Triages possession, payment and complaint threads and drafts grounded replies. | B-02 runtime with developer-scoped RAG. | ₹1–3 per thread | A human sends every reply. | P2 |
| D-09 | **Transparency trust page.** | Our QPR history, extensions, orders, risk band and reasons, plus the developer's right of reply. | Order summaries from §3.4. | Negligible | The developer can reply but cannot edit our facts. "Not paid placement." | P1 |

### 2.4 Brokers and channel partners

**Principle.** Brokers control much of NCR supply. Our AI should save them 2–3 hours a day on intake, chasing and paperwork [J], and never resell their clients the way incumbents do [RN-AI]. Client ownership is logged, and co-broking splits are explicit.

| ID | Feature and user value | UX sketch | Models / vendors | Unit cost | Quality bar and guardrails | Pri |
|---|---|---|---|---|---|---|
| C-01 | **Listing intake copilot.** | Forward a WhatsApp text, photos or voice note. AI drafts a structured listing, asks only for missing fields, and dedupes it. | Flash-Lite, Saaras v3, Gemini Embedding 2. | ₹2–5 | ≥95% field accuracy. The broker confirms before publishing. RERA agent number verified. | P0 |
| C-02 | **Client matching.** | A daily per-client digest: "3 new listings match Mr Sharma" with reasons. | Filters plus embeddings. | About ₹0.1 | Only the broker's own inventory or co-broke-enabled stock. | P1 |
| C-03 | **Follow-ups.** | Nudges and drafted messages for stale or post-visit clients. | LLM drafts. | ₹0.5–1 | The broker sends. | P1 |
| C-04 | **Deal pipeline (auto-CRM).** | Stages updated from chats the broker chooses to share. | Flash-Lite extraction. | About ₹1 per day | Opt-in per thread; consumer notice. | P1 |
| C-05 | **Document collection.** | One client link: checklist, uploads, OCR, completeness check, B-05 flags. | B-05 stack. | ₹1 per page | Same personal-data rules as B-05. | P1 |
| C-06 | **Co-broking.** | "Broker X has a matching buyer." Split terms come from a template. | Matching plus templates. | ₹2–5 | Both parties accept the terms. Our role depends on RERA-agent status [RN-REG]. | P2 |

### 2.5 Platform: trust, safety, multilingual

| ID | Capability | How it works | Models / vendors | Unit cost | Bar and guardrails | Pri |
|---|---|---|---|---|---|---|
| P-01 | **Fake, duplicate and stale listings** | pHash, image embeddings, text near-duplicates, geo and price clusters. Out-of-AVM-band price → review. A WhatsApp availability ping every 14 days; silent listings expire. | Build; Embedding 2 ($0.00012 per image [S1]) | ₹0.1–0.5 per listing | Auto-merge at ≥95% precision only; otherwise human review. | P0 |
| P-02 | **Broker posing as owner** | Phone and device graph across "owner" listings; response behaviour; KYC name vs sale-deed name; in-app capture proof. | Build plus a KYC vendor (not priced [RN-AI]) | ₹5–30 per KYC [J] | The listing is **reclassified as a broker listing**, not banned. Appeals allowed. | P0 |
| P-03 | **Image forensics** | EXIF, C2PA and SynthID checks; matches against our corpus and brochures; synthetic-image and unlabelled-staging detectors. | Build plus open-source detectors | About ₹0.2 per image | Auto-label plus warning; repeat → takedown. | P0 |
| P-04 | **Moderation and scam detection** | Detects advance-token scams, off-platform payment links, fake RERA numbers, abuse and discriminatory terms. A 3-hour takedown queue [RN-AI]. | Gemini 2.5 Flash-Lite ($0.10/$0.40 per 1M tokens [S1]) | About ₹0.02 per message | Inline warning, then human review. | P0 |
| P-05 | **Multilingual layer** | LLM-native Hinglish and Hindi. Sarvam Mayura for long documents. A lawyer-reviewed legal glossary. | Sarvam [S4], Gemini | ₹1.5–2 per 1K characters | UI strings are human-translated. | P0 |
| P-06 | **SGI-label and provenance service** | Stamps every generated asset (badge, C2PA, ID, link to original) and keeps an audit log. | Build | Negligible | Labels cannot be removed through the UI or API. | P0 |

---

## 3. Risk-score AI/ML design (Delivery Risk)

### 3.1 What we predict

| Output | Definition | Shown as |
|---|---|---|
| **P(Late12)** (primary) | Chance that OC/CC for the registered phase arrives more than 12 months after the *original* RERA date plus blanket extensions | Band (5 levels) plus a natural frequency: "about 35–40 of 100 similar projects were over 12 months late" |
| **Expected delay** | Survival-model P50 and P80 months late | "Likely possession Mar 2028; 1 in 5 chance after Dec 2028" |
| **P(Stall)** | Lapsed or revoked registration, CIRP, de-registration or abeyance, or no progress for 4 or more quarters | A separate red flag that is never averaged away |
| **Rescue modifier** | Chance of possession after a stall, based on progress, buyer association, land dues and whether a resolution applicant exists [RN-DELAY] | Text only in v1 |

### 3.2 Labels

**Delay label.**

`delay_months = OC/CC date − (original RERA completion date + blanket extensions)`

**Blanket extensions** are regulator-wide. Two are known:
- COVID-era extensions. The months per authority are still to be verified.
- The MoHUA West Asia advisory of 31 Jul 2026: 4 months for completion dates on or after 28 Feb 2026 [RN-DELAY].

These live in a versioned table.

**Section 6 extensions.** Project-specific Section 6 extensions are *not* added back to the promised date. They are the delay we are trying to predict. Their count is also used as a feature.

**Label sources.**
- Gurugram: the HARERA corrigendum JSON (OC, CC, PCC, extensions), cross-checked against DTCP BR-VII/LC-IX [RN-DATA].
- Noida, Greater Noida and Ghaziabad: authority CC data (the 2023 PIMS snapshot plus manual work or RTI requests). This set is thin.

**Censoring.**
- The survival model treats undelivered projects as right-censored.
- The classifier trains only on *matured* phases: those where promised date + blanket extensions + 12 months falls before the snapshot date.

**Label noise.** Gurugram's self-certified-OC audit found 14 of 22 inspected OC buildings still under construction [RN-ADD]. OCs issued in the audit window get an `oc_integrity` flag and a lower training weight.

**Expected size.**
- HARERA Gurugram has about 1,083 registrations, and UP NCR has about 1,453 projects [RN-DATA].
- That should give about 1,500–2,500 matured residential phases [J].

### 3.3 Feature families

All features are **point-in-time**. A training row only uses data that was public at its snapshot date, so no leakage.

| Family | Example features (risk direction) | Source | Refresh |
|---|---|---|---|
| Cash vs progress (Tier 1) | % sold minus % built (↑); collections vs escrow withdrawals; CA-certified "non-project withdrawals" (↑); cost incurred vs estimate | HARERA QPR (structured HTML); UP RERA QPR (v1.5) | Quarterly |
| Filing discipline | QPRs missed in the last 4 quarters; "Default on QPR"; impossible QPR values (data quality as a signal) | RERA lists | Monthly |
| Timeline | Time elapsed vs % complete; count of Section 6 extensions; lapsed registration | Form A-H, corrigenda | Weekly |
| Regulatory and legal | Complaints per 100 units (24 months); orders against the developer; execution cases; unexecuted RCs; sale bans | Judgments index plus §3.4 extraction | Weekly |
| Track record (slow decay) | Share of the group's past projects that were Late12; revocations; delayed live projects | Derived; Form A-H Part G | Monthly |
| Financial distress (Tier 1) | Rating BB or below, "issuer not cooperating" or recently downgraded; CIRP or s.7/9 petitions in the group; new charges; auditor qualifications | CRA rationales (LLM), IBBI, eCourtsIndia, MCA via Tofler | Weekly to annual |
| Land and authority | Authority dues; Kant-package compliance; expired DTCP licence | DTCP; notices (manual) | Monthly |
| Structure | Units and towers; 2010–14 launch cohort; segment; concurrent group launches | RERA, DTCP | Static |
| Environment | Stalled-project density within 5 km; GRAP days | Derived | Quarterly |
| Imagery | Months with no activity while the QPR claims progress (§3.7) | Sentinel-1/2 | Monthly |

### 3.4 LLM extraction and entity resolution

**Corpus.** About 17,938 HARERA Gurugram orders, CRA rationales and IBBI announcements [RN-DATA]. We never bypass CAPTCHAs. UP data that sits behind CAPTCHAs comes only through licensed aggregators or with permission.

**Schema per order.**
- Case, date and parties.
- `project_id` and `promoter_cin`.
- Order type: refund, interest, possession, penalty, revocation or execution.
- Amounts.
- Findings: delay months, diversion, escrow breach, observed status, prior non-compliance.
- Deadline.
- A 2-line summary.

**Models.**
- Primary extractor: Gemini 3.5 Flash-Lite in batch ($0.15/$1.25 per 1M tokens).
- Independent second extractor on every critical field: Claude Haiku 5.5 [S1, S3].
- Disagreements go first to Sonnet 5.5, then to a human.
- Scanned orders are read with Sarvam Vision.

**Cost [J].**
- About $0.0025 per order per extractor.
- About **₹4–10k for the full backfill**, plus up to about ₹1 lakh if every order needs OCR.
- About ₹2–5k a month incremental.

**Quality gate.**
- Field F1 ≥0.97 on dates, amounts and entity matches, and ≥0.90 on findings, measured on 400 gold orders.
- 2% of extractions get a human QA check each week.
- Nothing reaches the score until both extractors agree or a human has approved it.

**Entity resolution.**
1. Match on CIN.
2. Fuzzy-match normalised names ("EMAAR MGF LAND LTD." = "…LIMITED").
3. Link groups through shared DINs and addresses.
4. An LLM decides ambiguous pairs.
5. A human confirms any merge that touches live developers.

### 3.5 Model choice

1. **Hard-fact overrides.** These rules are published. CIRP admitted, a revoked or de-registered project, a sale ban, or abeyance means the project is "Severe", whatever the model says. These go live immediately, with source links.
2. **Champion: a scorecard.**
   - Method: WoE binning, then logistic regression, then points (300–900 internally; bands shown publicly) [RN-UX].
   - Why: small N, defensible in disputes, stable reason codes, and publishable factor-group weights.
3. **Challengers.**
   - LightGBM with **monotonic constraints** on Tier-1 features and depth of 3 or less.
   - A discrete-time survival model with a quarterly hazard, for the P50/P80 dates.
   - A challenger replaces the champion only if it gains at least 0.03 out-of-time AUC, is calibrated at least as well, and gives stable reason codes.
4. **Two sub-scores, both shown.** "Developer: Moderate · Project: Elevated".
5. **Reason codes.**
   - Show the top 3–4 contributions relative to well-scored peers, using the Reg B method (scorecard points or monotone SHAP).
   - Each code maps to a sourced fact template, for example: "QPR shows 41% built vs 78% of time elapsed (HARERA QPR Q2 2026)".
   - The LLM may translate the template. A template-diff check stops it adding facts.
6. **Sparse data.**
   - Shrink estimates through a hierarchy: project, then developer group, then micro-market, then the NCR base rate.
   - A missing QPR counts as a risk signal and is not imputed.
   - Every score carries one of three states: **Scored-high**, **Scored-low** (shown with a wider range) or **Not scored**, for example "new developer, no completed RERA projects" [RN-UX].

### 3.6 Calibration and validation

**Splits.** Out-of-time: for example, train on phases registered 2017–19 and validate on 2020–21 [J]. Grouped by developer, so one group's SPVs never sit on both sides of the split.

**Discrimination.**
- Targets [J]: AUC ≥0.75 (Gini ≥0.50) for Late12, and a C-index ≥0.70 for the survival model.
- Report bootstrap confidence intervals. With about 400 test rows, expect about ±0.05.

**Calibration.**
- Isotonic calibration on out-of-time data.
- A per-band reliability table, where predicted and realised rates should agree within ±5 pp, plus the Brier score.
- Bands are set on calibrated probability [J]:

  | Band | Calibrated P(Late12) |
  |---|---|
  | 1 | below 10% |
  | 2 | 10–25% |
  | 3 | 25–45% |
  | 4 | 45–65% |
  | 5 | above 65% |

**Known-failure backtest.** Use point-in-time features, at developer level for pre-RERA cases.
- Failures to test: Supertech, Jaypee, Ansal API, Raheja (Revanta and Shilas), Vatika, 3C/Granite Gate, Earth, Mahira and Ocean Seven.
- Target: at least 7 of the 9 sit in the bottom two bands at least 12 months before their first insolvency, revocation or stall event.
- Measure false alarms on Mahagun (which settled) and on on-time deliverers such as Signature Global's affordable projects [RN-DELAY].

**External benchmark.** Compare our bands with CRA ratings. Disagreements go to an analyst; they are never auto-corrected.

### 3.7 Imagery component

**Method.**
- Build monthly Sentinel-2 L2A composites plus Sentinel-1 SAR change over each project polygon.
- Geocodes come from UP RERA latitude/longitude and the DTCP licence maps.
- The output is an activity index.

**Flag rule.** Raise a flag when there has been **no activity for 6 or more months while the QPRs claim at least 10 pp of progress**.

**Limits and checks.**
- Sub-metre imagery ($15–200 per image [RN-DATA]) is bought only to check flagged or disputed projects.
- At 10 m resolution we cannot count floors.
- Imagery is corroborating evidence only. It is never the sole reason for a downgrade.
- Validate on 30 projects whose progress is known.
- Google Earth is excluded by its terms [RN-DATA].

### 3.8 Monitoring, drift and human review

| Monitor | Threshold [J] | Action |
|---|---|---|
| Ingestion health (row counts, schema hash per portal page) | Any schema change, or rows down more than 5% | Freeze the affected features; show "data delayed" |
| Feature drift (PSI on the top 15 features) | PSI above 0.2 | Analyst review before the next publish |
| Band migration after a refresh | More than 5% of projects move 2 or more bands | Treat as a bug; hold the publish |
| Calibration (quarterly) | Any band off by more than 10 pp | Recalibrate and log it in the changelog |
| Extraction QA | F1 below the gate | Pause the extractor |
| Staleness | Score older than 45 days | Grey it out and mark it "stale" [RN-UX] |
| Developer dispute | Any | 10 working days; the outcome feeds the challenge log |

**Human sign-off is required for:**
- any model-driven move into the bottom two bands, with a reply window for the developer before publication;
- any new methodology version;
- entity merges for live developers;
- placing a project "on watch".

A methodology committee, with an external statistician every quarter, signs off each version. Every score displays "Delivery Risk Model vX.Y · data as of DATE".

### 3.9 AI behind the other scores [RN-ADD]

| Score | AI role | Non-AI core |
|---|---|---|
| Ownership and paperwork | B-05 extraction; parsing of authority notices | OC/CC, registry and audit-list rules |
| Flood and waterlogging | LLM classification and geocoding of incident reports; resident-report triage | Terrain and drainage; evidence-first bands |
| Society health | Maintenance-bill OCR; themes from resident reviews | Maintenance trajectory; RWA status |
| Fair price | Quantile GBM AVM | Licensed deeds plus a matched listing panel |

---

## 4. AI architecture and operations (solo founder / small team)

```
Channels: Web (Next.js) · Android/iOS · WhatsApp (BSP/Cloud API) · Voice (Bolna/Sarvam)
            │
Agent runtime: intent router → tool-using agent → claim verifier → policy filter
            │                                   │
Model gateway (LiteLLM-type):                   Deterministic, versioned services:
 routing · fallbacks · budgets · PII redaction ·  search · risk score · AVM · cost/EMI/tax ·
 caching · logging · version pinning              staging pipeline · DD pipeline · scheduler · CRM
            │                                   │
Gemini · Claude · Sarvam · OpenAI (fallback)    Verified data layer: Postgres + PostGIS + pgvector,
                                                India-region object store, ingestion jobs, provenance
Ops: traces + evals (Langfuse-type) · golden sets · HITL admin · cost dashboard
```

### 4.1 Model routing (list prices on 18 Oct 2026, per 1M input/output tokens)

| Task | Primary | Fallback | Rationale |
|---|---|---|---|
| Intent, slots, moderation, verifier | Gemini 3.5 Flash-Lite ($0.30/$2.50) or 2.5 Flash-Lite ($0.10/$0.40) | gpt-6-luna ($0.10/$0.50); Sarvam 105B (₹15/₹60) | High volume |
| Advisor, comparison | Gemini 3.8 Flash ($0.75/$3.75, rising to $1.50/$7.50 from 1 Jan 2027) **vs** Claude Sonnet 5.5 ($2/$10) | The other one | Bake-off on tool use and Hinglish |
| Legal clause analysis | Sonnet 5.5 or Gemini 4 Argon ($2/$10, rising to $4/$20 from 1 Dec 2026) | Opus 5.5 ($4/$20) | Long context; second-model cross-check |
| Bulk extraction | Flash-Lite batch; Haiku 5.5 batch | gpt-5.4-nano | 50% batch discount [S1, S3, S6] |
| Staging | Nano Banana 2.1; Pro for hero shots | FLUX Kontext, Qwen-Image-Edit, gpt-image-2.5 | `gemini-3.1-flash-image` deprecated 6 Oct 2026 [S8] |
| Indic STT/TTS | Saaras v3 (₹0.41–0.49/min), Bulbul v3 | Gemini 3.5 Transcribe ($0.003/min); ElevenLabs [S9] | Code-mix; INR billing [S4] |
| Embeddings | Gemini Embedding 2 | text-embedding-3-small | Multimodal dedupe |

**Gateway rules.**
- Pin model versions.
- Keep a deprecation calendar: Google changed image models 5 times in 14 months [RN-AI, S8].
- Re-run evals before any model swap.
- Set per-feature budgets with hard caps and a kill switch.
- Redact PII before every call.
- Log prompts, tool calls and output hashes.

### 4.2 RAG over verified data: tools first, retrieval second

**Facts vs documents.**
- Facts come from typed-table tools: project, unit, risk card, AVM and cost rules.
- Vector search is used only for documents: orders, QPR text, methodology and guides. Each chunk carries `doc_id`, page and `as_of`.

**Contract.** Every fact needs a source chip. A verifier checks the numbers and entities against the tool outputs. If there is no source, the agent uses "not verified" wording or refuses.

**Freshness.** Show the oldest `as_of` date used. Add a caveat if any data is more than 45 days old.

**Injection defence.** Documents, listings and web text are treated as data. Actions with side effects need explicit confirmation from the user, never an instruction found in content.

### 4.3 Evaluation harness

| Feature | Golden set | Offline gate | Online metric |
|---|---|---|---|
| Search / advisor | 500 queries; 300 journeys | Slot F1 ≥0.92; groundedness ≥98%; 0 invented numbers | Helpfulness, handoff and enquiry rates |
| Staging | 300 NCR rooms | Guard pass ≥95%; realism ≥4/5 | Saves and enquiries vs control; complaints |
| DD reader | 150 lawyer-labelled packs | Fields ≥97%; flag recall ≥90% | Lawyer override rate |
| Order extraction | 400 gold orders | Critical F1 ≥0.97 | Weekly QA error rate |
| Voice / WhatsApp | 100 scripted calls (accents, noise) | Qualification accuracy ≥90%; turn latency p50 under 1.2 s | Visits booked; opt-outs |
| Risk score | Out-of-time set plus 9 failures | §3.6 | Realised outcomes by band |

- **When evals run:** nightly on a sample, and in full before any prompt or model change.
- **Judge calibration:** recalibrate monthly against 100 human labels (kappa ≥0.7).
- **Red-team set:** discriminatory queries, legal-advice bait, injection inside documents, and attempts to pull other users' data.

### 4.4 Cost controls and indicative AI COGS [J]

**Controls.**
- A cheap-first cascade.
- Prompt caching.
- The batch tier for backfills, pre-renders and extraction.
- A semantic FAQ cache.
- Staging quotas (20 restyles per user per day), 1K previews, and 2K only on save.
- A monthly price re-benchmark.

**Indicative monthly COGS.** Assumes 20k MAU, 1k new listings a month and about 15 developer projects.

| Line | Assumption | ₹/month |
|---|---|---|
| Search and advisor | 20k × 10 turns × ₹0.2 + 6k × 16 turns × ₹1.5 | about 1.8 L |
| Staging | 1k listings × ₹80 + 5k restyles × ₹3 | about 0.95 L |
| Video → listing | 500 × ₹120 | about 0.6 L |
| DD reader | 300 × ₹90 | about 0.3 L |
| Developer chat and voice | 8k leads × ₹4 + 3k calls × 4 min × ₹6 (incl. telephony estimate) | about 1.0 L (re-billable) |
| Risk pipeline, trust and safety, evals | Incremental | about 0.5 L |
| **Total** | Before the Gemini 3.8 Flash rise on 1 Jan 2027 (+₹0.6–1 L) | **about ₹5.2 L (≈$5.7k)** |

### 4.5 Human-in-the-loop queues

| Queue | Trigger | SLA [J] | Staff |
|---|---|---|---|
| Risk review | Bottom-band moves, disputes, entity merges, extraction disagreements | 2 days (disputes 10) | Founder plus an analyst; external statistician quarterly |
| Legal | Paid DD reviews; escalated severe flags | 48 h | Panel lawyers |
| Trust and safety | Below-threshold duplicates, appeals, scams, IT-Rules takedowns | 3 h for takedowns, 24 h otherwise | 1 ops person plus founder on call |
| AI QA | 5% of staging, 2% of extraction, flagged answers | Weekly | Ops |

### 4.6 Compliance by design

- **IT Rules SGI:** handled by P-06, plus the 3-hour takedown queue.
- **DPDP:** a consent ledger and data minimisation now; full obligations from 13 May 2027 [RN-AI].
- **TRAI TCCCPR (3rd Amendment, 18 Sep 2026)** [S12]:
  - declare A2P/AI calls to the operator;
  - make inquiry-based calls only within 7 days of a verifiable inquiry;
  - use the 140xx (promotional) and 1600xx/1601xx (service) number series;
  - register consent on the operators' platform.
- **WhatsApp:** keep the bot business-specific [S7].
- **RERA advertising:** ad fields on every generated developer asset [RN-REG].
- **Data residency:** India-region storage. Send masked data to US-hosted APIs only after the founder agrees (§6) [J].

---

## 5. Product recommendations

| ID | Recommendation | User / actor | Problem solved | Pri | Platform | Effort | Dependencies / risks |
|---|---|---|---|---|---|---|---|
| R-01 | Verified data layer (RERA, DTCP, IBBI, CRA, MCA) with provenance | All | AI is only as good as its facts | P0 | Both | L | Portal permissions; scraper fragility; no CAPTCHA bypass |
| R-02 | Model gateway, eval harness, HITL admin, cost dashboard | Platform | Model churn, cost, regressions | P0 | — | M | Keeping golden sets current |
| R-03 | LLM extraction of orders and CRA rationales; entity resolution | Platform | Turns 17.9k orders into features | P0 | — | M | Extractor agreement; UP order access |
| R-04 | Delivery Risk v1: overrides, scorecard, reason codes, confidence states, bands plus natural frequencies | Buyers | Delivery-risk blindness | P0 | Both | L | Thin UP labels; right-of-reply process |
| R-05 | Risk-change alerts with developer notice | Buyers, developers | Late discovery of distress | P0 | WhatsApp | S | Alert fatigue; sign-off queue |
| R-06 | Hinglish/Hindi conversational search with voice notes | Buyers | Rigid filters; language | P0 | Both + WhatsApp | M | Fair-housing filter policy |
| R-07 | Grounded Home Advisor with claim verifier and handoff | Buyers | Unanswered diligence and cost questions | P0 | Both + WhatsApp | M | Hallucination; Gemini vs Claude bake-off |
| R-08 | Nano Banana staging: presets, scale check, structure guard, labels, before/after | Buyers, sellers | Can't picture empty flats | P0 | Both | M | Misrepresentation; SGI; SKU catalogue |
| R-09 | DD reader v1 plus paid lawyer tier | Buyers | Hidden clause and OC risks | P0 | Both | L | Liability; lawyer panel; personal data |
| R-10 | Total-cost and EMI explainer | Buyers | Surprise charges | P0 | Both | S | Rate-table upkeep |
| R-11 | Seller price range with confidence and refusal rules | Sellers | Price guessing | P0 | Both | M | Data licence; under-declared deeds |
| R-12 | Video walkthrough → listing | Sellers | Listing effort; poor photos | P0 | App (Android first) | M | Video cost; low-end phones |
| R-13 | Broker intake copilot via WhatsApp forward | Brokers | Re-typing; duplicates | P0 | WhatsApp + web | M | Broker trust; dedupe accuracy |
| R-14 | Developer WhatsApp qualification and follow-up | Developers | Slow response; poor leads | P0 | WhatsApp | M | Template costs; score firewall |
| R-15 | Trust and safety suite (P-01 to P-04) | Platform | Fakes, duplicates, scams | P0 | Both | M | KYC vendor; appeals |
| R-16 | SGI-label and provenance service | Platform | IT Rules compliance | P0 | Both | S | C2PA tooling |
| R-17 | Hindi voice agent (inbound plus consented outbound) | Developers | Phone-first buyers | P1 | Voice | M | TRAI A2P; 7-day rule; latency |
| R-18 | Survival/GBM challenger; risk-adjusted possession date | Buyers | "When do I get keys?" | P1 | Both | M | Needs v1 labels |
| R-19 | Comparison agent | Buyers | Multi-factor choice | P1 | Both | S | No overall winner |
| R-20 | Future value, resale and rental bands | Buyers, investors | Neglected investment questions | P1 | Both | M | Data licence; advice perception |
| R-21 | Construction tracker (QPR plus Sentinel) | Buyers | No visibility after booking | P1 | App + WhatsApp | M | Geocoding; UP QPR access |
| R-22 | Site-visit copilot and snag AI | Buyers | Missed defects | P1 | App | M | False positives |
| R-23 | Floor plan → 3D plus carpet check | Buyers | Hard-to-read plans | P1 | Both | M | Plan quality varies |
| R-24 | Seller pre-qualification and scheduler | Sellers | Time-wasters | P1 | WhatsApp | M | Consent to share summaries |
| R-25 | Seller paperwork and tax copilot | Sellers | Tax and NOC confusion | P1 | Both | M | Tax-rule verification |
| R-26 | RERA-ad compliance checker | Developers | Suo motu notices | P1 | Web | S | Rule upkeep |
| R-27 | Developer trust page with right of reply | Developers, buyers | Trust deficit | P1 | Web | S | Pushback; legal review |
| R-28 | Broker matching, follow-ups, pipeline, documents | Brokers | Admin overload | P1 | WhatsApp + web | M | Opt-in data handling |
| R-29 | Developer lead scoring | Developers | Wasted sales time | P1 | Web | S | Outcome data; proxy bias |
| R-30 | Offer and negotiation assistant (drafts only) | Sellers, buyers | Anchoring without data | P2 | Both | M | Dual-agency partition |
| R-31 | Gaussian-splat walkthroughs | Buyers (NRIs) | Remote viewing | P2 | Both | L | File size on low-end Android |
| R-32 | Developer content suite (D-04, D-07, D-08) | Developers | Content and comms cost | P2 | Web | M | RERA ad rules |
| R-33 | Inventory pricing insights | Developers | Pricing by gut | P2 | Web | M | Competition-law hygiene |
| R-34 | Co-broking matchmaking | Brokers | Unmatched stock and clients | P2 | WhatsApp + web | M | RERA agent role |
| R-35 | ChatGPT/Gemini app distribution | Buyers | Discovery | P2 | Third-party | S | Zillow saw no engagement lift [RN-AI] |

---

## 6. Open questions for the founder

1. **DD liability.** Do we cap the free AI tier at "red flags" and sell lawyer-verified reviews (₹1.5–5k [J, unverified])? Which lawyers in Gurugram and Noida?
2. **Data licence.** Price ranges and future value need registered-deed data from PropEquity, Liases Foras or Square Yards. Is ₹5–15 lakh a year acceptable [J]? Otherwise S-01 launches as "low confidence".
3. **Money vs score.** If developers pay for leads or CP commission, do you accept a hard firewall? That means a published methodology, no developer access to the risk team, and no paid placement on risk pages.
4. **Portal permissions.** Can we write to HARERA and UP RERA now ([RN-DATA] Q8)?
5. **Community filters.** Proposal: decline "vegetarian society", religion and caste filters, and explain why. Agree?
6. **Outbound voice.** Should MVP be WhatsApp plus inbound voice only, with consented outbound in P1?
7. **Data residency.** May PII-masked data go to US-hosted Gemini or Claude? Or must DD documents stay India-hosted (Sarvam, or Vertex India, which is unverified)?
8. **Under-construction imagery.** Do we allow developers sample-flat staging only, with every plan-based render labelled?
9. **Score display.** Bands plus natural frequencies only, or also a 300–900 number? What band names?
10. **HITL staffing.** Is founder plus 1 ops person plus freelance lawyers enough to meet the SLAs in §4.5?
11. **Primary LLM.** Do we run a 2-week Gemini 3.8 Flash vs Sonnet 5.5 bake-off on our golden sets, keeping both live behind the gateway?

---

## Sources (accessed 18 Oct 2026)

- [S1] Gemini API pricing — https://ai.google.dev/gemini-api/docs/pricing
- [S2] Gemini image generation (model IDs, reference limits, resolutions, SynthID) — https://ai.google.dev/gemini-api/docs/image-generation
- [S3] Claude pricing (Opus/Sonnet/Haiku 5.5, Fable 5.1, batch, caching) — https://claude.com/pricing
- [S4] Sarvam API pricing — https://www.sarvam.ai/api-pricing
- [S5] Bolna pricing — https://www.bolna.ai/pricing
- [S6] OpenAI API pricing — https://developers.openai.com/api/docs/pricing
- [S7] WhatsApp AI Providers policy — https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/ai-providers ; WhatsApp pricing — https://developers.facebook.com/docs/whatsapp/pricing
- [S8] Gemini API changelog — https://ai.google.dev/gemini-api/docs/changelog
- [S9] ElevenLabs API pricing — https://elevenlabs.io/pricing/api
- [S10] TRAI press releases — https://www.trai.gov.in/notifications/press-release
- [S11] Sarvam docs (Saaras v3, Bulbul v3, Mayura, Vision, Voice Agents from ₹3/min) — https://docs.sarvam.ai
- [S12] TRAI PR 119/2026, TCCCPR (Third Amendment) 2026 — https://www.trai.gov.in/sites/default/files/2026-09/PR_No119of2026.pdf

Vendor pages were read with an automated extraction tool. Model names newer than the author's own knowledge (Gemini 4 Argon, Claude 5.5, gpt-6) are reproduced as listed. Confirm them before contracting.
