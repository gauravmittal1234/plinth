# PRD v1.0: AI-first home buying & selling platform, Delhi NCR

| | |
|---|---|
| **Status** | v1.0, approved direction. Founder decisions **D1–D4 resolved on 18 Oct 2026**: no developer money ever; Gurugram only for the first 6 months; Android app in R1; five named score bands. D5–D10 are still open (§17). Ready for Phase 3 (UI) |
| **Owner** | Senior PM (Claude), for the founder (Gaurav) |
| **Date** | 18 Oct 2026 |
| **Working name** | TBD. "the platform" in this document. Naming happens in Phase 3 |
| **Inputs** | Brief `product/BRIEF.md`. Specialist inputs in `product/inputs/`: customer journeys **[CJ]**, competitor teardown **[CT]**, AI strategy **[AI]**, regulatory **[REG]**, supply side **[SS]**, business model **[BM]**, architecture **[ARCH]**, international scout **[INT]**. Research: `reports/Delhi NCR AI real estate platform.md` **[P1]**, `reports/Developer and project risk scoring.md` **[RISK]** |

Tags used below: **[J]** marks a product judgement rather than a sourced fact. "Founder decision Dx" refers to the decisions listed in §17.

---

## 1. TL;DR

**What we're building.** The first home-buying platform in India that is on the buyer's side and can prove it. Every under-construction project in our corridors gets a **Delivery Risk** rating, a "credit score for developers and projects". The rating is built only from public records, explains its top reasons with sources, and cannot be bought. Around it we build the answers buyers can't get today:
- the true all-in cost;
- whether a flat is transferable and actually available;
- what it is fairly worth;
- what it would look like furnished, using labelled AI staging;
- a safe path from token to registry;
- a watch over the project for the 3–5 years until possession.

**Why we win.** Incumbents have identical search features. They score 1.1–1.2 on Trustpilot and sell each enquiry to 4–15 brokers [P1]. No Indian portal or developer site shows delay history, original vs revised possession dates or complaint counts [CT]. Their "verified" badge covers the posting, not the property, and their terms disclaim their own data [CT]. They cannot publish neutral developer scores, because developers pay them [BM]. HARERA already publishes the raw material: quarterly progress filings with escrow and collections, revised dates, and about 17.9k orders, all without a CAPTCHA [RISK]. Public warning signs preceded every major NCR failure by **15 months to 6+ years** [RISK].

**How we start: Gurugram only for the first 6 months (D2).**
- **Why Gurugram:** it has the richest data and 42–43% of NCR sales.
- **First release (R1):** under-construction projects, with free public risk cards that act as an SEO and WhatsApp magnet.
- **Second release (R2):** resale in Gurugram's ready societies, with OC, conveyance and transfer checks.
- **Noida and Greater Noida West:** from R3 (~month 8), led by a registry tracker for the ~75k unregistered flats [P1].
- **Platforms:** R1 launches on **web, the Android app and WhatsApp** together (D3); iOS follows in R2.
- **Money:** we **never take money from developers** (D1). Revenue comes only from buyers, sellers, lenders and brokers. That gives us the strongest possible trust claim: *"No developer pays us. Ever."*

**North star: Verified Home Decisions per month.** A qualified buyer unlocks a full verification of a specific project or flat. A "don't buy" outcome counts as a win [BM].

---

## 2. Vision, positioning and principles

**Vision.** Buying a home in India should feel as safe as buying insurance from a regulator-grade comparison site, and as delightful as an Apple product. Today it feels like a gamble against people who know more than you.

**Positioning (draft).** *"Know before you book."* We are the buyer's independent analyst, closing desk and watchdog, not another listings portal.

| Them (incumbent portals) | Us |
|---|---|
| Paid by developers and brokers | **No developer pays us. Ever.** |
| Traffic → leads sold to brokers | Evidence → decisions buyers trust |
| "Verified" = posting details | "Verified" = a published, dated, scoped standard |
| Developer copy shown as fact | "Developer says" vs "Records show", always separated |
| Price "+ charges, onwards" | All-in cost per carpet sq ft |
| Stops at the lead | Stays to registry, and to possession |
| Spam after "Contact" | Your number is masked; you choose who calls, at most 3 |

**Product principles.** These are used to settle every design argument:
1. **Evidence over adjectives.** Every claim carries a source, a date and a confidence state. No source, no claim.
2. **Buyer's side, provably.** No one can pay to change, hide or preview a score. Ranking never reads commercial data. Disclose how we make money on every page.
3. **Consent is the product.** Numbers are masked by default, consents are unticked and granular, buyers can see who has their number, and they can revoke with one tap.
4. **One screen, one decision.** Each surface answers one question ("Will this builder deliver?", "What will I really pay?", "Can this flat be registered?"). Progressive disclosure, never a wall of data.
5. **Native to India, English-first.** Our target buyers are comfortable in English, so the UI, content and AI replies are English. The AI still *understands* Hinglish or Hindi typed by a user, at no extra cost. Mobile-first and fast on patchy 4G, WhatsApp as a first-class surface, and ₹ shown in lakh and crore.
6. **AI does the work; humans sign the risk.** AI extracts, explains and drafts. A human signs off on title opinions, score disputes and anything with legal liability. We never say "clear title".
7. **Honest AI imagery.** Every AI image is labelled and carries embedded provenance. The original is one tap away, and the structure is never altered.
8. **Show value before asking.** No login walls, gated brochures, exit pop-ups or fake urgency.

---

## 3. Problem and opportunity

| Problem (buyer's words) | Evidence | Who solves it today |
|---|---|---|
| "Will this builder actually deliver?" | NCR had ~66% of India's fully stalled units. Only 74% of early post-RERA NCR launches were complete by 2023, against 86% across the top-7 cities. 98% of buyers want delivery assurance [RISK, P1] | Nobody. Portals show developer-written copy [CT] |
| "What will I really pay?" | All-in cost runs 20–35% above the quoted price. NCR loading is 41% [P1] | Nobody. Prices show "+ charges, onwards" [CT] |
| "Can this resale flat be registered or mortgaged?" | ~75k unregistered Noida/GNW flats. A ₹1.10 cr Gurugram flat was sold with a ₹35.7 L loan hidden by forged papers [P1, CJ] | Lawyers (₹20–75k), local dealers |
| "Is this listing real and available?" | Ghost and fake listings dominate reviews. On one NoBroker results page, 18 of 26 listings carried stale flags [CT] | Nobody |
| "Why is my phone ringing non-stop?" | Each lead goes to 4–15 brokers. Consent boxes come pre-ticked. MagicBricks' terms override DND [P1, CT] | Nobody |
| "Is my project on track?" (3–5 years) | 158 HARERA projects show "QPR not uploaded". Relationship managers go silent after payment [RISK, CJ] | Nobody; buyer WhatsApp groups |
| "What is it worth? Will it rent? Will it resell?" | Asking prices aren't anchored to transactions. Yields are 2.4–4.3% against home-loan rates from 7.5% [P1] | Gut feel |
| "I can't picture this empty flat" | Visualisation is the founder's insight. Labelled staging costs ₹3–5 per image [AI] | Nobody in India at scale [CT] |
| Sellers: "Zero visits, all spam" | Prepaid plans of ₹7.5–21k with refund disputes [CT] | Dealers at ~1% per side |
| Developers: "Leads are junk; brokerage is our biggest cost" | Brokerage was ~3.8% of pre-sales at Signature Global and ~2.8% at DLF in FY26 (estimated from filings) [SS] | CPs, CRMs, portals |

**Market.** NCR sells ~50–60k new homes a year worth ₹1.3–1.6 lakh crore, plus an estimated 40–50k resale deals [P1]. The headwinds are real: NCR primary sales fell 11% in Jan–Sep 2026, and the RBI raised rates on 7 Oct 2026. Those headwinds favour verifiable, ready or near-ready homes and resale, which is exactly where trust matters most.

---

## 4. Who we serve, and launch focus

| Actor | Launch persona (from [CJ]) | Launch market | Release |
|---|---|---|---|
| **Under-construction buyer** | A1 dual-income upgrader (₹2.2–3 cr, Dwarka Expressway/SPR); A3 once-burned second-timer | Gurugram (Dwarka Expressway, Golf Course Ext Road, New Gurugram/SPR) | R1 |
| **Resale buyer** | Gurugram ready-society buyer (₹1–3 cr; Sohna Road, Golf Course Ext Road, Dwarka Expressway early societies); B2 chain mover. *Noida/GNW B1 personas at R3* | Gurugram | R2 |
| **NRI buyer** | C1 Gulf return-planner | Gurugram | R1 reports usable remotely; R3 concierge |
| **Individual seller** | Gurugram owner upgrading or exiting (often an NRI or investor) | Gurugram | R2 |
| **Developer** | Not a customer (D1). Every developer gets the free Evidence & Reply portal; E2 Tier-2 developers will champion the score | Gurugram | R1 (free, forever) |
| **Broker / CP** | Gurugram resale dealers and CP firms as *partners* (co-broking, verified listings) | Gurugram | R2 (partner programme); R3 (Pro) |

**Jobs to be done** (headline jobs; full table in [CJ] §2.5):
- *UC buyer:* "Before I hand a builder ₹20–50 L for a flat I'll get in 4 years, tell me whether they'll deliver and what I'll really pay, and warn me early if it goes wrong."
- *Resale buyer:* "Prove this flat is real, available, transferable and fairly priced, then get me from token to registry without surprises."
- *Seller:* "Sell at a fair price to a real, financed buyer without my phone being flooded."
- *Developer:* "Turn marketing spend into bookings at lower cost, and look credible against NCR's legacy."
- *Broker:* "Get real clients and inventory, prove I introduced them, and get paid on time."

**Two products in one** [CJ]:
- **Under-construction buyers** have a front-loaded decision followed by a 3–5-year worry. They need **Know the builder** plus **Project Watch**.
- **Resale buyers** face 2–10 weeks of compressed risk. They need **Know the flat** plus a **Deal Room**.

---

## 5. Experience architecture: five pillars, three supply surfaces, one platform

```
DEMAND (buyers, NRIs)
 1. KNOW THE BUILDER   Delivery Risk · Developer Track Record · Project truth panel · Compare
 2. KNOW THE COST      Cost-sheet normaliser · True-cost calculator · Affordability stress test · Loan pre-check
 3. KNOW THE FLAT      Transferability · Verified-Available listings · Fair Price · Visualise (AI staging) · Society & Waterlogging
 4. CLOSE SAFELY       Deal Room (token→registry) · Document red-flag reader · Payment-safety check · Resale desk · Loans
 5. STAY PROTECTED     Follow & alerts · Project Watch · Possession assistant · RERA complaint helper

SUPPLY
 A. SELLER STUDIO      Free verified listing · Price range · Video→listing · Labelled staging · Gatekeeper inbox · Net-proceeds & tax
 B. DEVELOPER PORTAL   Claim profile · Evidence & Reply · Project facts & price list · Construction updates  (all free, forever; developers are never customers)
 C. BROKER WORKSPACE   RERA-verified onboarding · Mandate-backed listings · CRM-lite on WhatsApp · Proof-of-introduction · Commission ledger

PLATFORM
 AI concierge (web · app · WhatsApp) · Consent ledger & Privacy centre · Trust & safety · Evidence vault & provenance · Methodology & disclosures
```

---

## 6. Risk scores: the core differentiator

### 6.1 What the founder asked for, and how we translate it

The founder wants something like a bank's credit score, but for the developer and the project: a forward-looking risk rating with the factors behind it (developer, site, timeline, and so on). We build it as a **two-layer rating**:
- **Developer Track Record** at group level, with all SPVs rolled up.
- **Project Delivery Risk** for each RERA-registered phase.

Both sit on top of hard **red-flag overrides**, and every rating is explained by sourced reasons. The research is clear on three constraints [RISK, REG]:
- **Never call it a "credit rating"** and never use AAA–D symbols. Those look like SEBI-regulated products.
- Build it **only from documented public facts**, publish the method, and give developers a right of reply. Defamation is the real legal exposure, and it is manageable on that basis.
- **No developer money can touch it.** Zillow dropped its climate score after the paying side complained [BM]. **The founder has decided the platform will never take developer money at all (D1)**, which removes the "issuer pays" conflict at its root.

### 6.2 Delivery Risk v1 specification

| Element | Specification |
|---|---|
| **Primary prediction** | **Late12**: the probability that the OC/CC for the phase arrives **>12 months after the original RERA completion date**, plus regulator-wide blanket extensions (COVID; MoHUA 4 months, Jul 2026). Project-specific Section 6 extensions are *not* netted off, because they are part of the delay we predict [AI] |
| **Separate flag** | **Stall**: lapsed or revoked registration, CIRP, de-registration or abeyance, or no progress for ≥4 quarters. Never averaged away |
| **v2 additions** | Expected possession P50/P80 from a survival model, shown as "Likely Mar 2028; 1 in 5 chance after Dec 2028". A rescue outlook for stalled projects, shown as text |
| **Red-flag overrides** (published rules; force "Severe" with source links) | CIRP admitted against the promoter or a group SPV; registration revoked, de-registered or lapsed without extension; regulator stop-sale or abeyance; promoter group rated "D" or in default |
| **Developer Track Record inputs** | Share of the group's past RERA projects that were Late12; unexecuted recovery certificates; complaints and orders per 100 units (24 months); insolvency history in the group; credit-rating level, "issuer not cooperating" status and recent downgrades |
| **Project inputs** | **Cash vs progress** (% sold − % built; collections vs escrow withdrawals) is the strongest signal [RISK]. Also: QPR filing discipline (missed or impossible values); time elapsed vs % complete; count of Section 6 extensions; complaints and orders; land and authority dues (Noida/GNW: Kant-package compliance); DTCP licence validity; group concurrency (launches in flight); 2010–14 cohort; satellite activity vs QPR claims (corroborating only) |
| **Starting factor-group weights** (published; refit after backtest) [RISK] | Finances & cash vs progress **30%** · Developer track record **30%** · Timeline & filing discipline **20%** · Legal & regulatory **15%** · Site & approvals **5%** |
| **Model** | v1 is the **published overrides** plus an **interpretable scorecard** (WoE + logistic regression). A monotonic GBM and a survival model run as challengers. A challenger replaces the champion only with ≥ +0.03 out-of-time AUC, equal or better calibration and stable reasons. **No LLM ever sets a score.** LLMs only extract facts from orders and PDFs, using two independent extractors plus human review on disagreement [AI] |
| **Public display** | **Five bands: Low · Moderate · Elevated · High · Severe**, plus the states **Limited history** (neutral, no penalty) and **Not scored**. No 300–900 number in public (founder decision D4); internal points exist for the model |
| **Natural frequency** | Every band carries a backtested statement with an icon array, e.g. "About **38 of 100** similar NCR projects finished more than 12 months late." The numbers come from our calibration table, never from guesses |
| **Reasons** | Up to **4** per score, ranked by contribution against well-scored peers. Each is a sourced fact template, e.g. "QPR shows 41% built vs 78% of time elapsed (HARERA QPR, Jun 2026)". LLMs may smooth the wording; a diff check blocks any added facts |
| **"What would change this"** | One line, e.g. "Two consecutive QPRs with construction ahead of sales would move this to Moderate" |
| **Confidence** | **Scored (high confidence)**, **Scored (low confidence; wider range shown)** or **Not scored** |
| **Freshness** | Recompute within **72 h** of new filings or orders. Show a "Data as of" date and model version on every score. Add a staleness flag when key data is >120 days old |
| **Developer due process** | Free Evidence & Reply portal. Acknowledge disputes in 48 h and decide in 15 working days. **7 days' notice** before any downgrade into High or Severe (factual corrections only). The developer's response is published next to the score. Public dispute log, rate-limited per quarter [SS] |
| **Governance** | Methodology page with version and changelog. Methodology committee with 1 external member. Quarterly calibration backtest, published. Founder and staff declare any holdings. Sales staff cannot see scores before publication. Annual integrity report |
| **Developer use of the score** | Only through a live verification widget or link, never a screenshot or badge they control |

### 6.3 Rollout gates (do not skip)

| Stage | What's public | Gate to enter |
|---|---|---|
| **S1: Truth panel** (R1, weeks 1–6) | Facts only, each with a source: original vs current date, extensions, QPR % built vs time elapsed, complaints and orders, OC/CC status, insolvency, licence validity. No band | Methodology v0.9 published; media-liability insurance bound; evidence vault live; 14 days' notice to developers in scope |
| **S2: Bands, Gurugram** (R1, weeks 8–12) | Bands, natural frequencies, reasons | Right-of-reply portal live; natural-frequency table computed from the HARERA history. *Founder decision (18 Oct 2026): no external backtest gate or lawyer memo before bands go public. Model fit and calibration happen as part of normal engineering* |
| **S3: Noida / GNW** (R3, ~month 8, per D2) | Bands with low-confidence labels where outcome labels are thin | UP data quality check; authority-dues source confirmed; UP RERA permission sought |

### 6.4 Example score card (copy direction for Phase 3)

> **Delivery Risk: Elevated** · Low-confidence ○ · Data as of 14 Oct 2026 · v1.2
> About **38 of 100** similar NCR projects finished more than 12 months late. ▮▮▮▮▯▯▯▯▯▯
> **Why**
> 1. 72% of units sold, but 41% built (HARERA QPR, Jun 2026) ↗
> 2. 2 completion-date extensions (HARERA, Mar 2025; Jan 2026) ↗
> 3. 14 complaints decided against the promoter in 24 months (HARERA orders) ↗
> 4. Group company admitted to insolvency in 2023 (IBBI) ↗
> **What would change this:** two consecutive quarters with construction ahead of sales.
> *Developer's response* · *How this is calculated* · *Not a credit rating. Not issued by any RERA.*

### 6.5 The other scores and checks

The scores stay **separate and are never blended** into one composite number [RISK].

| Score / check | Question it answers | Output | v1 data | Release |
|---|---|---|---|---|
| **Transferability** | "Can this flat be legally sold, registered and mortgaged to me?" | **Ready · Needs documents · Blocked**, with a checklist. Project-level flags plus a unit-level document read. Never "clear title" | **Gurugram (R2):** OC status, including the self-certified-OC audit flag (~1,500–2,000 OCs under audit; 14 of 22 inspected buildings still under construction); conveyance deed executed or not; builder transfer NOC and endorsement charges; Haryana property ID and municipal no-dues (needed for registration since Nov 2025); mutation backlog; DTCP licence; CERSAI and lender payoff. **Noida/GNW (R3):** registry and authority dues, Kant package, NHRF partnership | Gurugram project-level + unit-level R2 (lawyer sign-off); Noida R3 |
| **Waterlogging exposure** | "Does this society or basement flood?" | **None reported · Some · Frequent**, with dated incidents first and modelled exposure second | News, ground reports (e.g. Golf Course Road basements, Sep 2025), resident uploads; GMDA drainage plans | Launch-society panel R2 (Gurugram); full R3 |
| **Society Health** | "What will living here cost, and is it well run?" | Indicators (maintenance trend, RWA handover, water and power reliability, lift and fire compliance, structural-audit flags), not a single grade | Resident contributions, notices, news | R3 |
| **Fair Price** | "Am I over- or under-paying?" | A range with confidence. **Declines to estimate** when data is thin. Asking vs registered prices | Licensed registry data (PropEquity / Liases Foras / Square Yards) plus our own closings | R2 in Gurugram if data is licensed (founder decision D5), else R3 |
| **Affordability stress test** | "Can *I* afford this, including after a rate rise?" | A personal calculator, not a property score | User inputs, rates | R1 |
| **Future value / rental / liquidity** | "Will it appreciate, rent, resell?" | Ranges and scenarios tied to infrastructure milestones, framed as information, not advice | Licensed data, listings, infrastructure tracker | R3 |
| **Not building** | Crime and "safety" scores; community, religion or caste filters | — | Bias and discrimination risk; US platforms removed such scores [RISK]. Founder decision D7 | — |

---

## 7. Target journeys: what changes for each actor

### 7.1 Under-construction buyer (Gurugram)

| Stage | Today | With us | Feature IDs |
|---|---|---|---|
| Discover | YouTube, a CP, a portal shortlist | Natural-language search ("3BHK under 2.5 cr on Dwarka Expressway, possession by 2028, low delivery risk"); corridor pages | F-30, F-31 |
| Shortlist | Brochures, brand halo | Delivery Risk card and truth panel on every project; developer group page rolling up SPVs; side-by-side compare | F-01–F-05 |
| Price discovery | "₹12,500/sq ft + charges, onwards" | Send the cost sheet on WhatsApp and get the all-in cost per carpet sq ft back, with loading %, negotiable items and an affordability stress test | F-10–F-13 |
| Visit | CP-run site visit | WhatsApp visit booking with a "questions to ask this builder" list generated from the risk reasons. **Visualise**: photograph the sample flat or a bare unit and see it furnished in your style (labelled) | F-24, F-44 |
| Decide and book | EOI cheque under pressure | Payment-safety check (payee = the RERA collection account; ≤10% before agreement); payment-plan simulator weighted by Delivery Risk; BBA points to discuss with a lawyer | F-41, F-16 |
| Wait 3–5 years | Silence | **Project Watch**: QPR digests, satellite activity, extension and complaint alerts, band-change alerts, co-allottee community | F-50–F-52 |
| Possession | Surprise demands, snags | Possession assistant: OC check (incl. audit list), AI snag list, final-demand check, delay-interest calculator, RERA complaint helper | F-53, F-54 |

### 7.2 Resale buyer (Gurugram from R2; Noida/GNW from R3)

| Stage | Today | With us |
|---|---|---|
| Find | Ghost listings, broker spam | Only **Verified-Available** listings: tiered badge, availability reconfirmed ≤14 days, auto-expiry; counterparty label (owner / RERA-registered agent) |
| Assess | Hearsay | Society page: OC status (incl. audit flag), conveyance status, builder transfer charges, Fair Price range, waterlogging incidents, society indicators |
| Pre-token | Hope | **Transferability check**: project flags plus a document red-flag reader with page citations; CERSAI and lender-payoff step; optional lawyer sign-off (Verified Flat Check) |
| Offer | Anchored by the dealer | Fair Price range plus a negotiation brief |
| Close | 13 hand-offs in 6–10 weeks | **Deal Room** for the Haryana flow: builder transfer NOC/endorsement, property ID and municipal no-dues, society NOC, bank document release (RBI's 30-day rule), TDS Form 141, paperless registry slot, mutation. Plus loan pre-check and a partner broker or desk. The Noida flow (TM charge, authority NOC) is added at R3 |

### 7.3 Seller, developer, broker (summary; detail in [CJ], [SS])

- **Seller:**
  - free verified listing built from a phone video walkthrough;
  - AI price range;
  - labelled staging;
  - masked number plus an AI gatekeeper that pre-qualifies buyers on budget, loan and timeline;
  - a net-proceeds and tax calculator (LTCG options, 54/54EC, TDS);
  - a pay-on-success fee only, never prepaid plans.
- **Developer** (never a customer; D1):
  - claim the profile and correct facts through Evidence & Reply (free, and the *only* developer input to the score);
  - publish the official price list and construction updates, cross-checked against QPRs.

  When a buyer explicitly asks to be contacted, the developer receives that consented enquiry free of charge. We sell developers nothing: no leads, visits, placement, SaaS or CP commission.
- **Broker:**
  - RERA agent number verified;
  - mandate-backed listings confirmed by owner OTP;
  - CRM-lite on WhatsApp;
  - proof-of-introduction ledger;
  - commission ledger;
  - an earned quality badge, recomputed monthly.

  Leads are never sold or broadcast.

---

## 8. Feature requirements

Priority: **P0** = MVP (R1–R2), **P1** = R3, **P2** = later. Surface: W = web, A = app, WA = WhatsApp. Sources point to the inputs that recommend each feature.

### 8.1 Pillar 1: Know the builder

| ID | Feature | User | Pri | Release | Surface | Source |
|---|---|---|---|---|---|---|
| F-01 | **Project truth panel**: RERA ID verified live; original vs current date; extensions; QPR % built vs time elapsed; complaints and orders; OC/CC; bank account on record; licence validity | UC buyer, NRI | P0 | R1 (S1) | W, A, WA | CT R2, CMP-01, PA-02 |
| F-02 | **Delivery Risk card** (§6.2): band, natural frequency, ≤4 reasons, confidence, "what would change this", developer response, methodology link | UC buyer, NRI, CP | P0 | R1 (S2) | W, A, WA | CJ-01, CT R1, AI R-04, PA-01 |
| F-03 | **Developer Track Record page**: group rollup of SPVs via MCA/DIN; past projects with promised vs actual dates | UC buyer | P0 | R1 | W | PA-03 |
| F-04 | **Compare** 2–4 projects: band, all-in cost per carpet sq ft, possession reliability, top reasons | Buyers | P0 | R1 | W, A | CT R19 |
| F-05 | **Shareable risk card**: image plus deep link, one-tap "Share with family" | Buyers, families | P0 | R1 | WA, W | BM-02 |
| F-06 | **Evidence drawer**: every fact links to source, date and snapshot | All | P0 | R1 | W, A | PA-02 |
| F-07 | **Methodology, disclosures and "How we make money"** pages; badge glossary | All | P0 | R1 | W | CT R21, CMP-04 |
| F-08 | **RERA Status Check** and **"Is this broker registered?"** (search or scan QR) | Buyers | P0 | R1 | W, WA | CMP-03 |
| F-09 | **NCR Developer Delivery Index**: half-yearly; quarterly Delay Monitor | Media, buyers | P1 | R3 (M5) | W | BM-17 |

### 8.2 Pillar 2: Know the cost

| ID | Feature | User | Pri | Release | Surface | Source |
|---|---|---|---|---|---|---|
| F-10 | **Cost-sheet normaliser**: photo or PDF of the quote → all-in cost per carpet sq ft, loading %, negotiable items | UC, resale buyer | P0 | R1 | WA, W | CJ-02, CT R3 |
| F-11 | **True-cost calculator**: state stamp duty (gender mix, circle rate), registration, GST (UC vs OC-ready), TDS s.393(1) shown as withheld, brokerage + GST, loan fees; versioned rules engine, CA-reviewed | Buyers | P0 | R1 | W, A | CMP-09, PA-20 |
| F-12 | **Affordability stress test**: EMI/income, +100 bps scenario, pre-EMI plus rent during construction | Buyers | P0 | R1 | W, A | CJ-09 |
| F-13 | **Loan pre-check**: eligibility estimate, whether the project is lender-approved, registry/valuation risk; single-lender referral first | Buyers | P0 | R2 | W, A | CJ-10, BM-07, CMP-17 |
| F-14 | Multi-lender comparison (LSP-compliant display) | Buyers | P2 | Later | W, A | CMP-22 |
| F-15 | Loan balance-transfer nudges | Owners | P1 | R3 | WA | BM-19 |
| F-16 | Payment-plan simulator (CLP / flexi / subvention) weighted by Delivery Risk | UC buyer | P1 | R3 | W | CJ-16 |

### 8.3 Pillar 3: Know the flat

| ID | Feature | User | Pri | Release | Surface | Source |
|---|---|---|---|---|---|---|
| F-20 | **Society title-status tracker**. *Gurugram (R2):* OC (incl. audit flag), conveyance deed, builder transfer NOC and charges, RWA handover. *Noida/GNW (R3):* registry status per tower (done / pending / blocked by dues), Kant package, TM estimate | Resale buyer, seller | P0 | R2 (Gurugram) / R3 (Noida) | W, WA | BM-12, CT R6 |
| F-21 | **Transferability check**: project flags + unit checklist + document reader + CERSAI/payoff step; Ready / Needs documents / Blocked | Resale buyer, NRI | P0 | R2 | W, A | CJ-03, CMP-18 |
| F-22 | **Verified-Available standard**: tiered badges (identity → ownership document → availability ≤14 days → registry/OC checked by human). A geofenced in-app photo shows the flat number. Every badge is dated and scoped, expires automatically, and verified listings outrank unverified ones (verification is free) | Resale buyer | P0 | R2 | W, A, WA | CT R5, CJ-04, INT #1 |
| F-23 | **Counterparty labels**: developer (verified), RERA agent and number, KYC'd owner; who pays whom | Buyers | P0 | R1 | W, A | CT R9 |
| F-24 | **Visualise (AI staging)**: (a) buyers stage their own photos of empty rooms during visits; (b) sellers stage listings. Indian style and budget presets, structure lock, scale check, burned-in label + C2PA + SynthID, original-first toggle. Under-construction units: labelled "artist's impression" renders only | Buyers, sellers | P0 | (a) R1 beta, (b) R2 | A, W | AI R-08, CJ-13, CMP-05 |
| F-25 | **Fair Price range / Price Fairness card**: 3 registered comparables, society median, range ≤10% when confident; declines when data is thin; asking vs registered | Buyers, sellers | P0 if data licensed / P1 | R2 / R3 | W, A | CJ-06, CT R10, INT #4–5 |
| F-26 | **Waterlogging panel** for launch societies (dated incidents, resident evidence, mitigation right of reply) | Resale buyer | P0 (launch societies) / P1 | R2 / R3 | W | CJ-18 |
| F-27 | **Society Health profile** (resident-contributed) | Resale buyer | P1 | R3 | W, A | CJ-18 |
| F-28 | Future value / rental / liquidity ranges with infrastructure milestones | Investors, NRIs | P1 | R3 | W, A | CJ-25, AI R-20 |
| F-29 | Floor plan → 3D walkthrough and carpet-area check | Buyers | P1 | R3 | W, A | AI R-23 |

### 8.4 Discovery and the AI concierge

| ID | Feature | User | Pri | Release | Surface | Source |
|---|---|---|---|---|---|---|
| F-30 | **AI concierge** ("Home Advisor"): tools-first answers grounded in our data, citations, claim verifier, refusal rules, AI disclosure, human handoff | Buyers, sellers | P0 | R1 | WA, W, A | AI R-07, CJ-08, PA-06, CMP-07 |
| F-31 | **Conversational search**: natural language → filters + map; tolerant of typos, local place-name spellings and Hinglish input; voice notes | Buyers | P0 | R1 | W, A, WA | AI R-06, PA-07 |
| F-32 | **Table-stakes discovery**: public browsing with no login; filters (budget, BHK, possession year, UC/ready, new/resale, owner/agent, RERA); map + list; project page (gallery, 2D plans with dimensions, amenities, ungated brochure, EMI, price trend); shortlist, saved search | Buyers | P0 | R1 | W, A | CT §2.7 |
| F-33 | **Programmatic SEO pages**: `/project`, `/developer`, `/society`, `/corridor`, `/compare/a-vs-b`, with structured data so AI answer engines cite us | Acquisition | P0 | R1 | W | BM §5.3 |
| F-34 | **Project & Society Dictionary**: a canonical graph keyed to RERA ID, tower and unit, with carpet-area normalisation, de-duplication and freshness SLAs. It is the foundation for listings, scores and search | Platform | P0 | R1 | Backend | CT R7, INT #3 |
| F-35 | **NCR Listing Standard**: mandatory material-information fields (OC, registry/TM status, society NOC, loan on property, carpet area, maintenance). Blanks are shown as "Not provided" | Resale buyers | P0 | R2 | W, A | INT #3 |

### 8.5 Pillar 4: Close safely

| ID | Feature | User | Pri | Release | Surface | Source |
|---|---|---|---|---|---|---|
| F-40 | **Document red-flag reader**: OCR + LLM; 12 v1 checks; page citations; Aadhaar masking; "points to discuss with a lawyer"; never "clear title" | Buyers, NRIs | P0 | R2 | W, A | AI R-09, CMP-11 |
| F-41 | **Payment-safety check**: payee matches the RERA collection account; ≤10% before a registered agreement (s.13); cash warnings. We never move money | Buyers | P0 | R1 | W, A | CMP-12 |
| F-42 | **Deal Room**: token-to-registry checklist and timeline per authority, shared with the parties | Resale buyer, seller | P0 checklist / P1 multi-party | R2 / R3 | W, A, WA | CJ-15, CT R18 |
| F-43 | **Verified Flat Check**: AI extraction + independent advocate opinion (structure pending lawyer Q4) | Resale buyer | P0 | R2 (Gurugram) | W, WA | BM-06, CMP-16 |
| F-44 | **WhatsApp visit booking**: slots, reminders, route, recap; OTP check-in | Buyers, sellers, CPs | P0 | R1 (UC) / R2 (resale) | WA | CT R11 |
| F-45 | **Resale desk pilot** with partner brokers: co-broking, fee only on registration | Buyers, sellers | P0 | R2 (M4–M5) | W, A | BM-10 |
| F-46 | BBA checker vs the state model agreement; RERA complaint helper | UC buyer | P1–P2 | R3+ | W | CMP-21 |
| F-47 | Bank-escrow token flow | Resale | P2 | Later | W, A | CMP-23 |

### 8.6 Pillar 5: Stay protected

| ID | Feature | User | Pri | Release | Surface | Source |
|---|---|---|---|---|---|---|
| F-50 | **Follow and alerts**: band changes, QPR filed or missed, extensions, complaints and orders, NCLT, price; developer notified at the same time; utility templates only | Buyers, allottees | P0 | R1 | WA, A, W push | AI R-05, BM-05, PA-04 |
| F-51 | **Project Watch** for booked buyers (booked anywhere): QPR digests, satellite activity signal, delay trend, co-allottee invites | Allottees | P0 (basic) / P1 (premium ₹1,499/yr) | R2 / R3 | A, WA | CJ-07, BM-16 |
| F-52 | Crowd-sourced progress (geotagged photos, demand letters) | Allottees | P1 | R3 | A | BM §6.1 |
| F-53 | **Possession assistant**: OC check, AI snag list, final-demand check, delay-interest calculator | Allottees | P1 | R3 | A | CJ-17 |
| F-54 | Stalled-project watchlist (NCLT, RERA orders, revival status); never monetise distressed allottees | Allottees | P2 | Later | A, WA | CT R24 |

### 8.7 Supply surfaces

| ID | Feature | User | Pri | Release | Surface | Source |
|---|---|---|---|---|---|---|
| F-60 | **Seller Studio**: free listing from WhatsApp Flow, web or **video walkthrough** (auto photos, description, floor sketch); availability pings; document-readiness score | Sellers | P0 | R2 | WA, A, W | AI R-12, PA-11, CJ-13 |
| F-61 | **Seller gatekeeper**: masked number; AI pre-qualification (budget, loan, timeline); visit scheduler with OTP-verified visitors | Sellers | P0 | R2 | WA, A | CJ-05, CJ-26 |
| F-62 | **Seller price range + net-proceeds and tax calculator** (LTCG options, 54/54EC, TDS, NRI lower-deduction flag) | Sellers | P0 | R2 (calculator R1 for SEO) | W, A | CJ-11, AI R-11 |
| F-63 | **Developer Evidence & Reply portal**: claim profile, submit evidence (labelled by provenance), corrections fast lane, published response. Free, permanently | Developers | P0 | R1 | W | CJ-12, SS §3.4, PA-09 |
| F-64 | Developer facts: official price list, construction updates (cross-checked against QPRs), free consented enquiries (only when the buyer asks) | Developers | P1 | R3 | W | SS §6 |
| F-65 | ~~Developer CRM integrations~~: **not building**. Developers are not customers (D1) | — | — | — | — | — |
| F-66 | **Broker workspace**: RERA/KYC onboarding, mandate-backed listings (owner OTP), CRM-lite on WhatsApp, co-broking, proof-of-introduction (60-day ownership window), commission ledger | Brokers | P0 (partner pilot) | R2 | WA, W (mobile) | SS §6, AI R-13 |
| F-67 | Broker Pro (AI follow-ups, listing kit, earned quality badge) | Brokers | P1 | R3 | A, WA | BM-21 |
| F-68 | ~~Developer AI pre-sales agent~~: **not building** (D1). Voice AI is reused for the *buyer* help line instead (inbound, R3) | — | — | — | — | AI R-17 |
| F-69 | ~~RERA-ad compliance checker~~ (a developer SaaS): **not building** (D1). We apply the rules to our own surfaces via F-85 | — | — | — | — | — |
| F-70 | **Owner dashboard + WhatsApp value digest**: "What's my flat worth", quarterly updates, registry alerts; the owner chooses to list with us or meet a verified broker | Owners, sellers | P1 | R3 | W, A, WA | INT #10, BM-15 |

### 8.8 Platform, trust and privacy

| ID | Feature | Pri | Release | Source |
|---|---|---|---|---|
| F-80 | **Consent ledger + "Who has my number" + capped routing**: one partner per buyer–property; ≤3 parties per buyer per 30 days; buyer chooses; masked relay; one-tap revoke | P0 | R1 | CT R4, CMP-06, SS, PA-08 |
| F-81 | **Privacy centre**: one-tap delete, consent history, download data | P0 | R1 | CT R20 |
| F-82 | **Trust & safety suite**: duplicate/stale detection, broker-posing-as-owner detection, image forensics, scam-chat detection, fair-listing classifier (discriminatory language) | P0 | R1–R2 | AI R-15, INT #18 |
| F-83 | **SGI label and provenance service** for all AI imagery, video and voice | P0 | R1 | AI R-16, CMP-05 |
| F-84 | **Grievance desk**: 24 h acknowledgement, 7-day resolution, 3-hour takedown runbook | P0 | R1 | CMP-10 |
| F-85 | State-aware RERA disclosure renderer (number, URL, QR, DTCP licence; Haryana "bold top-right"; spoken in audio/video) | P0 | R1 | CMP-02 |
| F-86 | Admin console: review queues (extraction, disputes, listings, DD), publishing gates, WhatsApp inbox | P0 | R1 | PA-12 |
| F-87 | Agent-compliance back office; KYC/CDD, sanctions screening, STR queue | P1 (before the first fee-earning deal / ₹20 L turnover) | R2 | CMP-13/14 |
| F-88 | DPDP full stack (rights portal, retention jobs, processor contracts, breach drill, minors gate) | P0 by **13 May 2027** | R3 (M7) | CMP-20 |
| F-89 | Dark-pattern checklist in design review and CI; CCPA self-audit declaration | P0 | R1 | CMP-08 |

---

## 9. AI: what ships, what it costs, how we keep it honest

**Architecture** [AI, ARCH]:
- One verified data layer (RERA, DTCP, IBBI, ratings, MCA, orders, documents), each fact with provenance.
- One tool-using agent on top, serving search, the advisor, comparison, alerts and WhatsApp.
- A **task-based model gateway** (code asks for `extract.harera_order@3`, not a model), with versioned prompts, golden-set evals gating deploys, cost budgets and fallbacks.
- **Human-in-the-loop queues** for extraction disagreements, score disputes, listings and document review.

| AI capability (MVP) | Unit cost [AI/ARCH, Oct 2026 prices; re-verify] | Quality bar / guardrail |
|---|---|---|
| Order and rationale extraction (17.9k HARERA orders) | ~₹4–10k for the full backfill; ~₹2–5k a month | Two independent extractors; F1 ≥0.97 on dates, amounts and entities; human review on disagreement |
| Concierge and search | ~₹0.2–3 per turn; ~₹0.4 per chat on Haiku/Flash-Lite class models | Tools first; every number must exist in tool results; cites sources; refuses advice outside scope; discloses it is AI |
| Visualise (Nano Banana-class image model) | ₹3–5 per image; ~₹55–100 per staged listing | Structure lock (walls, windows, floors unchanged); furniture scaled from door height; label + C2PA + SynthID; original first |
| Cost-sheet and document reading | ~₹55–90 per 40-page pack | Page citations; Aadhaar masking; no "clear title"; lawyer tier |
| WhatsApp qualification (sellers, developers) | ₹2–5 per lead | Consent logged; property-only scope (Meta policy) |
| Voice help line (R3) | ₹4–6/min + telephony | Inbound first; outbound only within the TRAI 7-day enquiry window, pre-declared A2P |

- **Indicative AI cost:** about ₹5–6 L a month at 20k MAU [AI].
- **Total infrastructure:** about ₹28–69k a month at MVP, rising to about ₹3.7–6.9 L a month at 50k MAU [ARCH].
- **Model names and prices change monthly.** Run a 2-week bake-off (Gemini Flash-class vs Claude Sonnet/Haiku-class) on our golden sets before committing. Keep both live behind the gateway.

---

## 10. Lessons from international platforms

Global leaders validate our direction. Their features adapt well to NCR as long as we copy the **trust mechanics, not the business models that compromised them** [INT].

| Import | Proven where | Evidence (company-reported unless noted) | Our adaptation | Feature |
|---|---|---|---|---|
| **Verified & Available badge**, time-boxed, which outranks paid listings | Bayut TruCheck, Property Finder Verified, Beike authentic listings | Property Finder verified listings get **4x** site-average enquiries. TruCheck requires an in-app photo taken within 500 m that shows the flat number, and the badge expires after 30 days | Sale deed or allotment letter + owner KYC + geofenced in-app photo + WhatsApp "still available?" ping every 7–14 days. Verification is free and is the ranking currency | F-22 |
| **Government project-status page** | Dubai DLD project status | Completion % per inspection, inspection reports, escrow bank | Rebuild it from HARERA QPRs + dated photo log + satellite, then add the *forecast* Dubai lacks | F-01, F-02, F-51 |
| **Mandatory "material information" with flagged blanks** | UK National Trading Standards listing rules | Statutory since 2024 | **NCR Listing Standard**: OC, registry/TM, society NOC, loan on property, carpet area, maintenance. Any blank is shown as "Not provided" | F-35 |
| **Price statement**: 3 comparables, society median, range ≤10% | Victoria (from 1 Oct 2026), Bayut Transactions, Rightmove sold prices | Regulatory standard | **Price Fairness card** on every resale listing (when data is licensed) | F-25 |
| **Conversational AI search** | Ask Rightmove; Redfin; Scout24 | Rightmove: +40% time on site, ~2x likelihood of sending a lead. Redfin: ~60% more favourites, tours and shares | Conversational search plus "Ask this flat" on our own surfaces. ChatGPT apps showed no lift for Zillow, so that channel is P2 | F-30, F-31 |
| **Owner dashboard + value digest** | REA (realestate.com.au), Rightmove online valuation, Homebot | >50% of REA's 100k+ seller leads come from it | "What's my flat worth" + quarterly WhatsApp digest; owners choose to meet a verified broker or list with us | F-70 |
| **Measured broker-quality badge** | Property Finder SuperAgent, Bayut TruBroker, Beike score | Automated, recomputed monthly | Earned from responsiveness, listing accuracy and closings. Never sold | F-66, F-67 |
| **Co-broking ledger with automatic role-based split** | Beike ACN | >70% of deals cross-store (2020); platform fee ~0.37% of the value handled by partner agents | Light ledger: proof of introduction, fixed split rules. **Never fix commission rates** (Spain sanctioned CRM-mediated rate coordination) | F-66 |
| **Pay on success for sellers** | Hemnet "sell first, pay later" (40–45% uptake) | Hemnet's share of Swedish sales fell from ~90% to 82% as prices rose | Free base listing; fee only on registration | F-45, F-60 |
| **Labelled AI staging / redesign** | Zillow Virtual Staging, Redfin Redesign | Zillow ties it to premium listings | Labelled, structure-locked, original first, including staging of buyers' own photos | F-24 |
| **Affordability on every listing** | Zillow BuyAbility, Redfin buying power | Feeds mortgage revenue | Affordability band + all-in cost on cards | F-11, F-12 |
| **Canonical building dictionary** | Beike Building Dictionary | Underpins Beike's authentic listings | **Project & Society Dictionary** keyed to RERA ID and tower | F-34 |
| **Fair-listing classifier** | Zillow (open source) | — | Block discriminatory listing language and AI answers | F-82 |

**Do not import** [INT]:
- buying homes or instant cash offers (Zillow Offers lost $420M in one quarter);
- buy-before-you-sell as principal;
- modelled hazard scores without observed events (Zillow's climate-score removal);
- crime or neighbourhood-composition scores;
- ratings paid for by the rated party (iCIRT, HBF);
- standalone developer CRM (PropertyGuru shut down FastKey in 2023);
- single-vendor 3D formats (Zillow lost Matterport tours after CoStar bought Matterport);
- hidden referral-fee steering;
- our own payments or escrow licence.

---

## 11. Platforms and surfaces

| Surface | Role | Release |
|---|---|---|
| **Web** (Next.js, server-rendered) | Acquisition (SEO risk pages), deep research, payments, developer portal, admin | R1 |
| **WhatsApp** (Meta Cloud API direct, our own inbox) | Zero-install first contact, cost-sheet upload, alerts (utility templates), visit booking, seller and broker intake (WhatsApp Flows) | R1 |
| **Android app** (**Flutter**, per D15; originally Expo) | R1: search, project pages with truth panel and Delivery Risk card, follow and alerts (push), compare, cost-sheet upload, **Visualise camera flow**, concierge chat, offline cache of followed projects. R2 adds the document vault, seller video capture and Project Watch | **R1** (D3); adds ~3–4 weeks, so R1 runs ~16 weeks |
| **PWA** | Fallback for iOS users until the iOS app ships | R1 |
| **iOS app** (same Expo codebase) | NRIs, premium buyers | **R2** |
| **Voice** | Inbound AI help line for buyers (English) | R3 |

**Non-functional requirements** [ARCH]:
- **Speed:** report pages under 150 KB of JS; LCP under 2.5 s on throttled 4G.
- **App:** under 25 MB; cold start under 3 s on a 3–4 GB RAM phone; offline cache of followed projects.
- **Language:** `en-IN` only at launch (English UI, content and AI replies). The AI accepts Hinglish or Hindi input. Hindi UI isn't planned; revisit only if Noida/GNW or Tier-2 expansion data shows demand. **DPDP note:** the privacy notice must still be *available on request* in English or any Eighth Schedule language (DPDP s.5(3)), so keep a translated notice set ready.
- **Accessibility:** WCAG 2.2 AA (48 dp / 44 px touch targets).
- **Hosting:** in Mumbai (Supabase ap-south-1, Vercel bom1, Cloud Run asia-south1).
- **Personal data:** kept in India; only pseudonymised context goes to model APIs (lawyer to confirm).

**Stack:**
- One TypeScript monorepo for web, mobile, API and shared packages.
- Python for pipelines and scoring.
- Postgres with PostGIS and pgvector.
- Every fact snapshotted, with URL, timestamp and hash.
- Scores are immutable versioned runs.

The full layout is in [ARCH] §9 and seeds Phase 4.

---

## 12. Trust, compliance and legal requirements

### 12.1 Non-negotiable rules (product requirements)

1. **Score independence** (founder decision D1):
   - **The platform never accepts money from developers in any form:** no commission, leads, visits, placement, advertising, SaaS or sponsorship.
   - Every in-scope project is scored, with no opt-out.
   - No one can pay to change, suppress, delay or preview a score.
   - Ranking, recommendations and AI answers never use any commercial signal, including broker or lender payouts. This is enforced in the data model and audited quarterly.
   - Lenders who license project-risk data (later) get the **same** score as the public.
   - Founder and staff declare any holdings in rated developers.
2. **Never touch client money.** Tokens and bookings go only to the seller, the RERA collection account or a regulated escrow. We collect only our own fees.
3. **Never certify title.** We give red flags with citations. Opinions come from independent advocates the user engages.
4. **Every RERA project surface** shows the RERA number, authority website and QR code. In Haryana these go in bold, top right, and are spoken aloud in audio and video. Our agent number appears on every assisted sale.
5. **Every AI image, video or voice** is labelled and carries embedded provenance.
6. **Outbound calling:** no outbound AI calls until the TRAI A2P declaration is made, and then only within the 7-day enquiry window. WhatsApp and inbound come first.
7. **No dark patterns:** consents start unticked, there are no urgency timers, and contact is free for buyers.

### 12.2 Launch gates [REG]

| Gate | Must be in place |
|---|---|
| **Before public beta** (free scores, calculators, AI, WhatsApp) | Company and GST. Terms and privacy notice (English; scheduled-language versions available on request per DPDP s.5(3)). Grievance officer. Methodology v1, dispute desk and evidence vault. **Media-liability and cyber insurance.** Dark-pattern self-audit. Inbound-only AI voice. Lead sharing off, or consented and capped with no fee |
| **Before charging money or earning deal-linked fees** | **HARERA Gurugram agent registration** before the first resale-desk fee (₹2.5 L for a company; ~4–6 weeks; commercial office address; quarterly commission register). Confirm whether report sales alone need it (lawyer Q1). FIU-IND registration, KYC/CDD, STR queue, sanctions screening. PI and crime cover. Payment-aggregator merchant account. Lender DSA agreements. TRAI DLT before any outbound message |
| **Before 13 May 2027** | Full DPDP: itemised notices, consent artefacts, rights handling, retention and erasure, processor contracts, 72-hour breach process, minors gate |
| **Before Noida/GNW (R3, ~month 8)** | UP RERA agent registration. Its 4-day training plus exam must be completed first, and it needs a UP office, so **start ≥3 months before** |
| **Later** | Delhi RERA; multi-lender LSP display; escrow; NRI flows; reviews module |

### 12.3 Top lawyer questions to close before build (full list of 22 in [REG] §6)

1. **RERA perimeter:** which of the following need agent registration in Haryana, UP and Delhi? (a) free listings; (b) report fees; (c) booking success fees; (d) resale brokerage on completed flats. Is resale covered by UP RERA's "all brokers" wording?
2. **Scoring while an agent:** does s.10(c)(i)(A) ("false… standard or grade") create exposure? Would a separate scoring entity strengthen the defences? Approve the disclaimer and band wording.
3. **Data:** do HARERA, UP RERA, MCA and eCourts terms permit low-rate automated collection (IT Act s.43)? Is "derogatory or misleading context" a risk for negative grades built on their data?
4. **Verified Flat Check structure:** is AI extraction plus a panel advocate's signature plus our fee compatible with BCI Rules 36–37?
5. **Resale fees in Haryana:** confirm that HARERA agent registration covers owner-to-owner resale brokerage in Gurugram, and the invoicing and GST treatment.
6. **Data residency:** is "PII stays in Mumbai, pseudonymised context to US model APIs" acceptable?
7. **SGI:** label size and placement, and our role when sellers self-stage.
8. **TRAI:** does a WhatsApp or web enquiry start the 7-day window? Does inbound-only AI voice need an A2P declaration?

---

## 13. Business model and go-to-market

### 13.1 Platform role (decided: D1 = no developer money, ever)

We are a **buyer-side platform**. Revenue comes only from **buyers, sellers, lenders and (later) brokers who partner with us**. Developers are scored, never sold to.

**What this changes vs the specialist recommendation** [BM, SS]:
- **No primary-booking revenue.** The commission-neutral desk is out, along with CP fees, site-visit fees, developer SaaS and pre-sales AI.
- **Lower revenue.** In the base case, developer revenue was ~26% of M24 revenue. Without it, base-case M24 revenue is roughly ₹45–50 L/month rather than ~₹64 L/month [J, rough re-scaling of the BM model]. Breakeven moves from about M16 to about M19–M22 unless resale and loan volume compensate.
- **A stronger trust claim.** *"No developer pays us. Ever."* is simple, verifiable and impossible for Aurum, 99acres or MagicBricks to match. That should lift organic share, the biggest swing factor in the model [BM].
- **Simpler compliance.** No conflict with RERA s.10(c)(i)(A), no commission-neutrality governance, and agent registration is needed only for resale and partner-broker activity.

### 13.2 Revenue sequencing (Gurugram, months 1–12)

| Month | Stream | Payer | Price (to test) |
|---|---|---|---|
| M1 | Free public risk cards, truth panels, alerts, calculators, Visualise beta | — | ₹0 |
| M2 | **Risk Report Pro**: deep dive, comparison, 12 months of written updates (alerts stay free for everyone) | Buyer | ₹999. Price tests run sequentially, one public price at a time, never split by visitor |
| M3 | **Home-loan referral** (single lender first, then 3–5 lenders) | Lender | ~0.35% of the loan |
| M4–M5 | **Verified Flat Check** (Gurugram resale) | Buyer | ₹6,999 (test ₹4,999–9,999); structure per lawyer Q4 |
| M4–M6 | **Resale desk** with partner brokers (co-broking) | Buyer and/or seller | 1% + GST, **on registration only** |
| M6–M9 | Buyer Pass ₹2,999 · Possession Watch ₹1,499/yr · NRI Concierge ₹34,999 · loan balance-transfer referral | Buyer / lender | — |
| M9–M13 | **Broker Pro** (AI follow-ups, listing kit, CRM-lite); earned quality badge stays free | Broker | ₹999–2,999/month |
| M12+ | Seller premium ("Showcase": pro photos, labelled staging pack, performance report), never gating visibility | Seller | ₹2,999–7,999 per listing [J] |
| M18+ | Lender project-risk data licence (**the same score as the public**) | Bank/HFC | ₹2–5 L/month per lender |

**Never sold:** anything to developers; score changes or previews; placement on risk pages; a buyer's number to more than one partner per property.

### 13.3 Go-to-market

| Wave | Market | Offer | Timing |
|---|---|---|---|
| **1** | **Gurugram only**: Dwarka Expressway, Golf Course Ext Road, New Gurugram/SPR (under construction); ready societies in those corridors plus Sohna Road (resale) | Free risk cards → Pro reports → loans → Verified Flat Check → resale desk | **M1–M6** |
| 2 | Noida Expressway + Greater Noida West (registry tracker leads), then Ghaziabad and Faridabad | Same playbook plus the UP registry wedge | M8–M12 (Noida/GNW); M13+ (others) |
| 3 | Delhi resale | Verified Flat Check only | M20+ |

**Wedge.** Every under-construction RERA project in the three Gurugram corridors gets a free score with reasons and sources (about 300+ projects). Buyers search by project name, and the card spreads as a WhatsApp image.

**Distribution:**
- About 400 Gurugram project, 100 developer and 150 society SEO pages by M3.
- Founder-led English YouTube teardowns ("The Truth About [Project]"), three times a week, plus daily Reels/Shorts.
- WhatsApp bot.
- Four free tools: true cost, rent vs buy, EMI shock, OC check.

**Partnerships:**
- 3–5 banks/HFCs.
- A Haryana lawyer panel.
- 30–50 partner brokers across the corridors.
- Gurugram RWAs and allottee associations (e.g. FPCE).
- Media data desks.

**PR:**
- M1: methodology launch.
- M3: "Gurugram OC Audit Tracker".
- M5: the first **Gurugram Developer Delivery Index**, expanding to NCR once Noida joins.

---

## 14. Metrics

**North star: Verified Home Decisions (VHD) per month** [BM].

**Counter-metrics** (integrity):
- disputes upheld as a share of scores;
- median days to correct;
- partners contacting each buyer (target ≤1);
- score calibration (Brier score and band backtest).

| Area | Day 90 after public launch | M6 target |
|---|---|---|
| Coverage | ≥80% of Gurugram wave-1 UC RERA projects scored (~300+) | 95%; ≥100 Gurugram ready societies with title-status pages |
| Traffic | 10k monthly visitors; 2k phone-verified; 5% of card views shared; ≥5k Android installs | 25k monthly visitors; ≥35% of qualified leads organic; app D30 retention ≥20% [J] |
| Willingness to pay | ≥150 Pro sales at ≥0.1% of visitors; refunds <5% | ≥0.15% conversion; ≥30 Verified Flat Checks a month at ≤60 lawyer minutes each |
| Transactions | ≥10 partner brokers; first loan referrals | ≥1 resale registration a month; loan attach ≥30% |
| Trust | Every dispute answered ≤14 days; no injunction | Methodology v1 public; first integrity log |

**Kill and pivot triggers** (reviewed at M6, M9 and M12) [BM]:

| Trigger | Action |
|---|---|
| Pro conversion <0.05% and Verified Flat Checks <20 a month, at ≥25k visitors | Make reports free and lean on loans, resale and data |
| Lead→deal <1% after 300 qualified leads | Narrow to one corridor |
| Organic share <30% by M9 | Partner-led distribution (banks, employers) |
| An injunction against scores stands >60 days | "Facts-only" mode until it is resolved |

**Instrumentation from day 1:** a typed event catalogue in PostHog, and attribution and CAC per deal by channel.

---

## 15. Release plan (updated for D2: Gurugram only; D3: Android in R1)

| Release | Window | Scope | Exit criteria |
|---|---|---|---|
| **R0 Foundations** | Weeks −4 to 0 | Company, GST and insurance; HARERA permission letter; WhatsApp business verification; Google Play developer account; HARERA, DTCP and IBBI pipelines plus snapshots; entity resolution v1; methodology v0.9; lender DSA conversations; 20 videos banked | ≥250 Gurugram projects ingested with QPR history |
| **R1 Public launch: "Know the builder"** | Weeks 1–16 | **Web + Android app + WhatsApp.** SEO pages and the S1 truth panel go live on web around week 6, so indexing starts early. Public launch with Android at ~week 14–16. Scope: F-01–F-08, F-10–F-12, F-23, F-24a (Visualise beta), F-30–F-34, F-41, F-44 (UC visits), F-50, F-62 (calculator), F-63, F-80–F-86, F-89. **S2 bands** after the backtest and legal gate (~week 10–14). Risk Report Pro paywall at ~M2 (if lawyer Q1 confirms) | Day-90 targets in §14 |
| **R2 "Know the flat & close safely" (Gurugram)** | Months 5–7 | **iOS app**; Gurugram resale: F-20 (Gurugram), F-21, F-22, F-25 (if data licensed), F-26 (launch societies), F-35, F-40, F-42 checklist, F-43, F-45 resale desk; seller F-60–F-62; broker F-66; F-13 loans; F-24b seller staging; F-51 basic; F-87 compliance back office; **HARERA agent registration** before the first desk fee; start **UP RERA training** at M4 | M6 targets |
| **R3 "Stay protected & expand"** | Months 8–12 | **Noida/GNW** (S3 bands, registry tracker, Noida Deal Room flow); DPDP full compliance by **13 May 2027** (F-88); Project Watch premium, F-52, F-53; F-27, F-28, F-29; F-09 Delivery Index (NCR edition); ML v2 challenger and P50/P80 dates; NRI Concierge; inbound voice help line; Broker Pro; F-70 owner dashboard | M12: ₹10–12 L+ revenue a month [J, adjusted for D1]; 8–10 deals a month; 80k visitors; annual integrity report |
| **Later** | Months 13–24 | Ghaziabad and Faridabad; lender data licence; multi-lender display; escrow; stalled-project watchlist; Delhi | — |

---

## 16. Risks and mitigations

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| A developer files a defamation suit or seeks an injunction | High / High | Facts-first, sourced reasons; published methodology; right of reply; 7-day notice; media-liability insurance; legal reserve ₹10–15 L/yr; "facts-only" fallback mode. *D1 helps: no commercial motive can be alleged* |
| Lower revenue without developer money (D1) | Certain / Medium | Lean on loans (the earliest transaction revenue globally) and resale; keep the team tiny; the "No developer pays us" claim should cut CAC; a lender data licence later |
| Gurugram concentration (D2): 57% of NCR unsold stock, slowing sales | Medium / Medium | Resale in ready societies offsets primary weakness; Noida/GNW from R3 (~M8) is pre-planned (UP training from M4) |
| R1 is longer because Android is in it (D3) | Certain / Low | Web SEO pages go live early (week ~6); one Expo codebase; app scope limited to the core R1 flows |
| Portal terms, blocking or format changes cut off data | Medium / High | Permission letters; polite rate limits; Indian-IP fetchers; snapshots; licensed fallbacks; never bypass CAPTCHAs |
| Score inaccuracy (thin labels, OC-audit noise) | Medium / High | Confidence states; neutral "Limited history"; quarterly calibration; backtest gate before bands go public |
| Aurum (Housing + PropTiger + Sell.Do) copies AI features | High / Medium | Neutrality is uncopyable for developer-paid portals; provenance-linked delivery record; move fast on data depth |
| Consumers won't pay | Medium / Medium | Kill criteria; loans and resale carry revenue; reports can become lead magnets |
| Broker backlash | Medium / Medium | Co-broking, proof-of-introduction, free workspace; we compete with lead reselling, not brokers |
| Over-reliance on WhatsApp | Medium / Medium | Property-specific bot; utility templates; native app |
| Solo-founder ops load | High / Medium | Ruthless scope; human review only where liability sits; 1 ops hire by M4 [J] |
| Cash or PMLA exposure in resale | Medium / High | Zero-cash policy; KYC/CDD; STR queue; sanctions screening |

---

## 17. Founder decisions

| # | Decision | Status | Outcome / recommendation |
|---|---|---|---|
| **D1** | Developer money | ✅ **Decided (18 Oct 2026): Never** | No commission, leads, visits, placement, SaaS or sponsorship from developers |
| **D2** | Launch scope | ✅ **Decided: Gurugram only for the first 6 months** | UC in R1; Gurugram resale in R2; Noida/GNW from R3 (~month 8) |
| **D3** | Mobile app timing | ✅ **Decided: Android in R1** | R1 ≈ 16 weeks; iOS in R2 |
| **D4** | Score display | ✅ **Decided: five named bands** | Low · Moderate · Elevated · High · Severe, plus a natural frequency; no public number |
| D5 | Transaction-data budget (Fair Price) | Open | License ₹10–25 L/yr before R2 if funded; otherwise launch Fair Price at R3 |
| D6 | Document liability posture | Open | Free red-flag tier + paid advocate review, structured per the lawyer's opinion |
| D7 | Community, religion and "veg-only" filters | Open | Decline, and explain why |
| D8 | Founder on camera | Open | Yes: 3 English videos a week |
| D9 | Capital and legal reserve | Open | ₹1.5–2 cr runway (more needed given D1); ₹10–15 L/yr legal reserve before S2 bands go public |
| D10 | Brand | Open | Decide in Phase 3 naming; consider an independent sub-brand for the Index |

---

## 18. Validation (founder decision, 18 Oct 2026)

The founder chose to **build now**. The pre-build lawyer memo, user interviews and pre-launch backtest gate are **dropped**. What remains is built into the product itself:
1. **Price tests** at launch: Pro at ₹499 / ₹999 / ₹1,999.
2. **Concierge-first fulfilment:** the first cost-sheet normalisations and Transferability checks run with a human in the loop. This builds golden sets.
3. **Product analytics and the integrity counter-metrics** in §14.

Open legal questions (§12.3) stay on a list to resolve when convenient. They don't block the build.

---

## 19. Next: Phase 3 (UI design)

Phase 3 will produce:
- the information architecture and navigation for **web and the Android app** (one design system, platform-appropriate patterns) and for WhatsApp;
- the design system (tokens, English typography, data-viz and the visual language for the five risk bands, built on the brand promise *"No developer pays us. Ever."*);
- high-fidelity flows for the R1 scope:
  - home and search;
  - project page with truth panel and Delivery Risk card;
  - developer page;
  - compare;
  - cost-sheet normaliser;
  - Visualise camera flow;
  - follow and alerts;
  - the WhatsApp conversation designs;
  - the developer Evidence & Reply portal;
- a clickable prototype for the interviews in §18.

---

## 20. v1.1: changes after the design evaluation (18 Oct 2026)

The design was evaluated from buyer, developer and broker perspectives, and the 10x ideas were consolidated; see `product/evaluation/SUMMARY.md`. The founder decided D11–D14 below.

| # | Decision |
|---|---|
| **D11** | Four 10x features join R1: **Claims vs records**, **Site-visit co-pilot**, **Pay-as-built guard** and **Since you last looked** |
| **D12** | The **free Developer workspace ships in full in R1**. It is D1-compatible: nothing is paid and nothing affects scores |
| **D13** | The contact promise becomes **"never shared without your tap"**. The relay stays alive while a deal is active, and the buyer may share their number after a confirmed visit |
| **D14** | **R1 extends by about 8–10 weeks** (≈ 24–26 weeks in total) to ship everything approved |
| **D15** | **Mobile app in Flutter** (as in the founder's Thapki app); web in Next.js (SEO); one Supabase backend. Shared contracts: generated TS/Dart types, one design-token file generated for both, and business rules computed server-side once |

**New and changed R1 features:**

| ID | Feature | Surfaces |
|---|---|---|
| F-90 | **Claims vs records:** forward or upload any brochure, flyer, cost sheet, voice note or hoarding photo. Returns "Brochure says / Records show" with sources. Shared pipeline with F-91 and F-92 | Web, App (share sheet, camera), WhatsApp forward |
| F-91 | **Site-visit co-pilot:** the visit pass carries 5 questions drawn from the records. After the visit, the buyer's own voice or text recap is checked against the records and filed as an unverified "Developer says". No recording of third parties | App, WhatsApp |
| F-92 | **Pay-as-built guard (present tense only):** upload the payment plan or demand letters and Plinth flags any demand ahead of the slabs filed (e.g. a demand for slab 12 while the QPR shows slab 9). No forecasts in R1 | Web, App, WhatsApp |
| F-93 | **Since you last looked:** what changed on followed projects since your last visit; a weekly "this week in filings" digest; shared cards say what has changed since they were issued | Web, App, WhatsApp (utility) |
| F-94 | **Before you pay:** payee vs RERA collection account, the 10% cap before a registered agreement, EOI refund terms, receipt capture (F-41 designed) | Web, App |
| F-95 | **Afford the wait:** rent + pre-EMI during construction, plus the cost of a 12 or 24-month delay in rupees (F-12 extended) | Web, App |
| F-96 | **Hard states:** project pages for Severe, Limited history, Not scored and Stalled, plus "if you've already booked here" | Web, App |
| F-97 | **Home details + "From the developer":** configurations, carpet sizes, floor plans, towers, amenities, location; dated price list with history; payment plans | Web, App |
| F-63+ | **Free Developer workspace:** claim profile · consented enquiry and visit inbox · CRM hand-off by email/CSV (webhook R2) · Live Record QR/link kit · "From the developer" editor · heads-up on every band change · 2-day clerical lane · evidence without dispute | Web |
| F-66a | **Thin broker layer in R1:** "For agents" page · WhatsApp onboarding with a live HARERA agent check · "Is this broker registered?" · agent of record in visit booking · honest agent labels · cap counts only parties who can contact the buyer · introductions logged | Web, WhatsApp |
| F-98 | **Family circle (slice):** a relative taps a link to opt into the same alerts | All |

**Policy:**
- Plinth never registers itself as a lead source with a developer.
- Plinth never takes any share of CP commission (that would be developer money passed through a third party, against D1).
- The **canonical timeline** in DESIGN.md §5b is the single source of facts for every screen.

**Dropped:** live listening to salespeople; becoming a DPDP Consent Manager; an open CC-BY dataset; AR walk-throughs; the sound/air snapshot; furnishing "top-up loans".
