# Business model, pricing and growth/GTM input for the PRD

Author: business-model, pricing and growth strategist (specialist input) · Written 18 Oct 2026 · For: senior PM drafting `product/PRD.md`

**How to read this.** Each claim is tagged:
- **[S]**: sourced. Phase-1 sources are cited inline. New sources are listed in the reference list at the end, all accessed 18 Oct 2026.
- **[A]**: a model assumption. Change it when real data arrives.
- **[J]**: my judgement.

The plan assumes month 1 (M1) is November 2026. On that basis the DPDP full-compliance date (13 May 2027) falls in M7.

---

## 1. Summary

1. **Recommended role: a buyer-side hybrid that is commission-neutral, with credibility built before any commission is taken.** [J] For about 9 months the platform earns only from buyers, sellers and lenders. After the risk score has a public track record, it accepts developer channel-partner (CP) commission only under a written neutrality policy: a flat retained fee, commission-blind ranking, a cap on developer revenue, and disclosure on every page.
2. **Why not the alternatives?** Pure information is too small. NoBroker's premium plans "proved inadequate" [S], and Hemnet shows consumer-side pricing power is finite [S]. A classic agent is conflicted. Zillow dropped its climate-risk score in November 2025 after agents complained [S].
3. **MVP revenue (switch on in M2–M5):** Risk Report Pro at ₹999; Verified Flat Check (resale document review signed off by a lawyer) at ₹6,999; home-loan referral at about 0.35% net; a pilot resale desk with partner brokers at 1% on registration.
4. **Later revenue:**
   - Next (M7–M13): the commission-neutral primary desk (gated, M10+), NRI Concierge, broker subscriptions and Possession Watch.
   - Later (M18+): lender data licences and rental management. Developer SaaS is decided at M18.
5. **Base-case unit economics [A]:**
   - Resale deal: about ₹1.17 lakh revenue and ₹96k contribution before acquisition cost (CAC). Fully loaded CAC is ₹40–46k; cash payback is about 3 months.
   - Primary booking: about ₹2.3 lakh, paid in tranches.
   - Reports: 50–95% contribution margin, sold to organic traffic only.
6. **24-month scenarios [A]:**

   | | Base | Bear | Bull |
   |---|---|---|---|
   | Revenue/month | ₹16 lakh (M12) → ₹64 lakh (M24) | ₹5 lakh (M12) → ₹19 lakh (M24) | ₹41 lakh (M12) → ₹1.6 crore (M24) |
   | Monthly cash breakeven | M16 | not reached by M24 | M8 |
   | Peak cumulative burn | about ₹1 crore | about ₹3 crore if no action is taken | about ₹0.45 crore |

   In the bear case the kill criteria (section 7) cap the loss at about ₹1.2 crore.
7. **GTM wedge:** free public Delivery Risk cards for every under-construction RERA project in the Gurugram wave-1 corridors, plus a Noida/GNW society registry-and-dues tracker. They spread through programmatic SEO, Hinglish YouTube and Reels, and a WhatsApp bot. The annual **NCR Developer Delivery Index** is the main PR moment.
8. **Growth comes from data loops, not ad spend:** alerts, shareable cards, allottee groups that later supply resale listings, and closed deals that feed verified prices back in. **The moat** is a per-project and per-society record of delivery, registry status and real closing prices.
9. **North-star metric: Verified Home Decisions per month (VHD).** It is guarded by integrity metrics: disputes upheld, time to correct, and score calibration.
10. **Top risks:** developer lawsuits, CAC drift, the cycle (NCR sales down 11% in Jan–Sep 2026; RBI rate hike on 7 Oct 2026) [S], copying by incumbents, and access to RERA data. Taking no developer money at launch weakens the "malice" argument in defamation cases, and conflicted incumbents cannot copy that.

---

## 2. Platform role recommendation

### 2.1 The three options

| | (a) Neutral information + verification | (b) Transaction-led RERA agent | (c) Hybrid, buyer-side and commission-neutral (**recommended**) |
|---|---|---|---|
| Who pays | Buyers; later lenders | Developers (CP commission 1–3%, up to 5% luxury) and resale parties (about 1% per side) [S] | Buyers, sellers and lenders first; developers later at a flat fee under the neutrality policy |
| Conflict with the score | Cleanest | Severe: the "issuer-pays" problem behind IL&FS and 2008, and why Zillow dropped its climate score [S] | Manageable if the rules in 2.3 are enforced in code and governance |
| RERA agent registration | Probably not needed without introduction fees. Untested: MahaRERA served notices on portals in 2018, outcome unknown [S] | Needed in Haryana and UP. Penalty ₹10,000/day up to 5% of unit cost [S] | Register in Haryana and UP before the resale desk opens (about M3) [J] |
| FIU-IND / PMLA | Not a reporting entity | Reporting entity once turnover passes ₹20 lakh: KYC, CTR/STR filings, 5-year records [S] | As (b). Threshold crossed around M8–M9 in the base case |
| Revenue timing | Small cash from day 1 | Lumpy. Resale pays at registration, 6–10 weeks after token. CP tranches run 12–36 months with clawback [S] | Reports from M2; loans and resale M4–M6; CP from M12 |
| Revenue per customer | ₹1k–35k | ₹1–4.5 lakh | ₹1k–2.3 lakh |
| Ops load | Low | High (field agents, visits) | Medium. Partner brokers do visits, AI qualifies leads and chases documents, salaried relationship managers (RMs) handle closing |
| Verdict | Too small alone | Conflicts with the founder's non-negotiable | **Go** |

### 2.2 Evidence from comparables

| Company | What it shows [S] | Lesson for us [J] |
|---|---|---|
| Square Yards | FY26 revenue ₹2,086 crore at 8% EBITDA; about 50% from Urban Money mortgages | Transactions plus loans pay. Attach loans from day 1. |
| NoBroker | Premium plans "proved inadequate"; about 50% of revenue now from services and loans; still loss-making | Subscriptions supplement, they do not drive. Anti-broker purity limits scale. |
| Housing.com / Aurum | Revenue: brokers 61%, developers 30%, owners 9%. Sold for about $47.5M despite heavy traffic | Traffic is not a moat. A portal paid by developers cannot credibly score them. |
| 99acres | FY26 revenue ₹488 crore; EBIT-positive only in Q4 FY26 | Classifieds take years to profit. Do not compete on listings. |
| Bayut (UAE) | TruCheck verified badge; claims "20x impressions, 5x leads" (company claim) | Supply will pay for *listing* verification. Never apply this to developer scores. |
| Hemnet (Sweden) | About 90% of Swedish homes sold are listed on it. Q2 2026: average revenue per listing (ARPL) SEK 9,095 (+12.4%); net sales −23.1%; adjusted EBITDA margin 46.4%; free entry-level formats announced 29 Sep 2026 ([Hemnet Group](https://www.hemnetgroup.se/en/investors/)) | Inference: listings fell about 30%, cause not verified. Seller-paid pricing power is real but finite. Price for volume and trust. |
| Redfin | Salaried agents and buyer refunds; bought by Rocket for $1.75B, which bundled a 1-point rate cut | Rebates and mortgage bundles are good buyer hooks; agent-heavy costs earn thin margins. |
| Purplebricks | Upfront fee whether or not the home sold (US $3,200); peak valuation above £1.3bn; sold for £1 in 2023 ([Wikipedia](https://en.wikipedia.org/wiki/Purplebricks)) | Never charge sellers upfront for an outcome you do not control. |
| Zillow | 70% of US traffic but about 1.4% of the services pool; Zillow Offers write-downs of $407.9M; climate data "scrapped" by Nov 2025 after agent complaints ([Wikipedia](https://en.wikipedia.org/wiki/Zillow)) | When supply pays, transparency gets negotiated away. This is the best argument for keeping developer money out of the score. |

### 2.3 Independence rules (put these in the PRD as non-negotiable requirements)

1. **No developer can pay to change, suppress, delay or preview a score.** Every RERA project in scope is scored, with no opt-out. Low-data projects show "Insufficient data" [S: legal note A5].
2. **Credibility before commission.** No developer revenue until (i) methodology v1 is published, (ii) at least 6 months of public score history exist, (iii) the right of reply and dispute log are live, and (iv) an external lawyer has reviewed the neutrality policy. Target: M10 [J].
3. **Commission-neutral economics.** On every primary booking the platform keeps the same fee: the lower of the CP rate and 1.0% of agreement value [A]. Any extra commission is either passed to the buyer as a booking credit, if the CP agreement and the law allow, or not taken because all developers are signed at one flat rate [J; LAWYER REVIEW].
4. **Commission-blind product.** Ranking, recommendations, AI answers and risk pages cannot read commercial fields. Keep those fields in a separate table that ranking services cannot access, and audit it every quarter [J].
5. **No pay-per-lead or pay-per-visit from developers, ever** [J].
6. **Developer revenue cap:** at most 35% of trailing-12-month revenue, published. The base case reaches 26% at M24 [J].
7. **Disclosure on every project page:** "We earn [X] from [this developer / N% of developers]. Commercial relationships never affect scores." [S: legal note A5]
8. **Governance:**
   - A methodology committee with one external member.
   - Founder declarations of any holdings in or relationships with rated developers.
   - A firewall so sales staff cannot see scores before publication.
   - An annual integrity report.

---

## 3. Revenue streams and pricing

### 3.1 Stream-by-stream

| Stream | Payer | Conflict check | Price | Willingness-to-pay / benchmark evidence | Switch on |
|---|---|---|---|---|---|
| Public risk cards and basic alerts | Free | n/a | ₹0 | FPCE (Oct 2025) asked for developer track-record checks [S] | **MVP (M1)** |
| **Risk Report Pro** (cited deep dive, comparison, 12 months of alerts) | Buyer | Clean | **₹999 incl. GST**; test ₹499 / ₹999 / ₹1,999 [A] | Buyers pay ₹20k–75k in legal fees per purchase [S]; owners pay ₹5,999–22,000 for portal plans [S]; outcome-priced products sell at about ₹299–2,999 [S, inference]. Free ChatGPT Go kills willingness to pay for generic answers [S], so sell proprietary verified data | **MVP (M2)** |
| **Verified Flat Check** (resale: AI extraction plus lawyer review of title chain, registry, dues, NOC, TM; scoped statement, never a title certificate) | Buyer | Clean | **₹6,999 incl. GST**; ₹9,999 for complex Gurugram cases [A] | Below the ₹20k–75k legal spend [S]. Landeed sells AI title reports to banks and law firms ([Landeed](https://www.landeed.com/)) | **MVP (M4, GNW first)** |
| **Home-loan referral** (as a DSA or connector) | Lender | Low | 0.2–1% of the loan (0.3–0.55% common) [S]; model 0.35% net [A] | About 50% of Square Yards' revenue and 22% of NoBroker's [S] | **MVP (M3)** |
| **Resale desk** (co-broked with partner brokers) | Buyer / seller | Clean | **1% + GST on registration**; nothing upfront [J] | Gurugram norm about 1% per side [S]; Purplebricks' upfront fees failed [S] | **MVP pilot (M4–M5)** |
| **Buyer Pass** (5 Pro reports plus a 15-minute expert call) | Buyer | Clean | ₹2,999 [A] | Untested | Next (M6) |
| **Possession Watch** (allottee digest, crowd-sourced progress, delay-compensation calculator, RERA complaint kit) | Booked buyer | Clean | Free; paid **₹1,499/year** [A] | Willingness to pay is weak [S], so mainly a retention and data play | Next (M7) |
| **Loan balance-transfer referral** | Lender | Low | 0.2–0.35% [A] | Rate hike on 7 Oct 2026; SBI from 7.50% [S] | Next (M8) |
| **NRI Concierge** (remote verified visit, document vault, POA and TDS via partner CAs) | NRI buyer | Clean | **₹34,999** or 0.25% capped at ₹75k [A] | NoBroker publishes no NRI pricing [S] | Next (M9) |
| **Commission-neutral primary desk** | Developer | **Conflicted**: allowed only under 2.3 | Keep min(CP rate, 1.0%) [J] | CP 1–3%, paid in tranches with clawback [S] | Next (M10, gated) |
| **Verified Partner broker subscription** (CRM-lite, verified-listing badge, co-broking) | Broker | Low (badge earned by documents, not money) | **₹2,999/month** plus split [A] | 99acres ₹899–3,149/month; real spend ₹4k–60k [S] | Next (M13) |
| **Lender project-risk data licence** | Bank / HFC | Medium (lenders fund developers; the score must be identical for all) | ₹2–5 lakh/month per lender [A] | Landeed shows institutional demand | Later (M18+) |
| Rental and property management (NRI) | Landlord | Clean | 1 month's rent/year or 8% [A] | Square Yards' Azuro; no prices published | Later (M20+) |
| Interiors, movers, insurance | Partner | Low | Referral fee [A] | Livspace −13.4% EBITDA [S]; insurance needs IRDAI | Later, partners only |
| Developer SaaS (lead qualification, RERA ad checker) | Developer | **High** | ₹25k–1 lakh/month [A] | 91 UP developers fined over ads [S] | **Decide at M18** [J] |

### 3.2 What we will never sell [J]

- Score changes, previews or featured placement.
- Developer-paid leads or visits.
- A buyer's number to more than one partner. Hand-off needs consent, with at most one partner broker per buyer–property pair.
- "Certified title" claims.
- Urgency timers or pre-ticked add-ons (CCPA dark-pattern rules) [S].

### 3.3 Pricing tests in the first 90 days [J]

1. Risk Report Pro: three arms (₹499 / ₹999 / ₹1,999), at least 3,000 paywall views each. Pick the highest revenue per view with refunds below 5%.
2. Verified Flat Check: ₹4,999 vs ₹6,999 vs ₹9,999 in GNW. Track lawyer minutes per order (target ≤ 60).
3. Resale desk: 1% on registration vs 0.75% plus a ₹15k deposit credited at closing.

---

## 4. Unit economics and scenarios

### 4.1 CAC by channel (cost per *qualified* buyer lead: phone-verified, budget stated, timeline ≤ 6 months)

| Channel | Benchmark | Base assumption | Role |
|---|---|---|---|
| SEO project, developer and society pages | AI Overviews cut informational clicks up to 61%; tool and transactional queries hold up better [S] | ₹100–300 [A] | Main engine; 40% of leads at M12 |
| YouTube / Reels (Hinglish, founder-led) | No Indian data; creator-led successes (TUF, Finology) [S] | ₹300–600 [A] (₹50–80k/month production) | Trust and reach; 20% |
| Click-to-WhatsApp (CTWA) Meta ads with a risk-card lead magnet | Meta CPL ₹800–1,600 premium [S]; WhatsApp free for 72 hours after the click [S] | ₹600–900 [A] | Paid amplifier; 25% |
| Google Search | ₹900–1,800 mid; ₹1,500–2,800 premium; ₹2,000–6,000 luxury Gurugram [S] | ₹1,500 [A] | High intent, capped; 10% |
| Referrals (₹5k each side, paid at registration) | No Indian data | about ₹650-equivalent [A] | After M9; 5% |
| RWA partnerships | No data | ₹300–1,000 per seller lead [A] | Resale supply |
| Partner brokers | n/a | 20–50% commission split, no upfront cost [A] | Supply and field visits |
| **Blended paid CPL** | | **₹1,000 base / ₹1,500 bear / ₹700 bull** [A] | |

### 4.2 Funnel assumptions [A unless marked]

| Step | Benchmark [S] | Bear | Base | Bull |
|---|---|---|---|---|
| Monthly unique visitors (M12 / M24) | MagicBricks 8.0M and 99acres 7.6M across all of India (May 2026) | 35k / 90k | 80k / 200k | 160k / 400k |
| Organic qualified leads as a share of visitors | n/a | 0.20% | 0.30% | 0.40% |
| Qualified lead → site visit | 20–30% without a CRM, 35–50% with one | 25% | 35% | 45% |
| Qualified lead → closed deal (token to registration) | 1–3% typical; 5–9% for top teams | 1.2% | 2.0% | 3.5% |
| Risk Report Pro buyers as a share of visitors | n/a | 0.08% | 0.15% | 0.30% |
| Loan attached per deal | Square Yards' mix suggests it is high | 30% | 40% | 50% |

### 4.3 Per-unit economics (base, net of GST) [A]

| Unit | Revenue | Variable cost | Contribution before CAC | CAC | After CAC | Cash payback |
|---|---|---|---|---|---|---|
| Resale deal (ticket ₹1.3 crore; 0.8% net take after partner split; loan 40% × 70% LTV × 0.35%) | ₹1,04,000 + ₹12,700 = **₹1.17 lakh** | ₹21k (RM, lawyer, ops) | **₹96k (82%)** | ₹40–46k fully loaded | ₹50–56k | about 3 months |
| Primary booking (ticket ₹2.2 crore; 1.0% retained × 0.95 clawback; loan ₹21.6k) | **₹2.3 lakh** | ₹25k (adds site-visit cabs) | ₹2.05 lakh | ₹60–80k (premium Gurugram) | ₹1.3–1.5 lakh | 2–8 months; about 25% arrives at possession |
| Risk Report Pro (₹999) | ₹847 | ₹40 | ₹807 (95%) | Organic only; Meta CPL of ₹150–2,000 would not pay back [S] | — | Instant |
| Verified Flat Check (₹6,999) | ₹5,931 | ₹3,000 (lawyer ~₹2,000, certified copies, AI) | ₹2,931 (49%) | Organic or cross-sell | — | Instant |
| NRI Concierge (₹34,999) | ₹29,660 | 40% | ₹17,800 | ₹5–10k [A] | ₹8–13k | Instant |

Guardrail [J]: fully loaded CAC per deal must stay at or below 40% of first-deal revenue. Above that, cut paid spend before adding headcount.

### 4.4 24-month scenarios (solo founder plus a small team)

**Inputs.**

| Input | Bear | Base | Bull |
|---|---|---|---|
| Closed deals/month (M6 / M12 / M24) | 0.5 / 4 / 12 | 1 / 10 / 35 | 3 / 20 / 70 |
| Primary share of deals from M10 | 40% | 40% | 40% |
| Average resale / primary ticket | ₹1.1 crore / ₹1.8 crore | ₹1.3 crore / ₹2.2 crore | ₹1.5 crore / ₹2.6 crore |
| Loan payout | 0.30% | 0.35% | 0.45% |
| Verified Flat Checks/month (M12 / M24) | 20 / 50 | 50 / 120 | 100 / 250 |
| Brokers on subscription (M24) | 60 | 150 | 300 |

Primary commission cash arrives 50% at +2 months, 25% at +8 months and 25% after M24.

Fixed costs are the same in all three scenarios:

| Months | Fixed cost per month | Team |
|---|---|---|
| M1–6 | ₹7 lakh | Founder, 2 engineers, data/content, legal retainer, tools, ₹1 lakh brand/content |
| M7–12 | ₹11 lakh | Adds an ops/compliance lead and a growth hire; brand/content rises to ₹2 lakh |
| M13–24 | ₹16 lakh | About 10–12 people |

One-off costs: ₹8 lakh for registrations and legal opinions in M1–3, plus ₹3 lakh a year for professional-indemnity (PI) insurance. RMs are a variable cost of about ₹15k per deal. Paid spend is calculated as (leads needed − organic leads) × CPL.

**Outputs** (amounts are cash, net of GST). The model was built for this input and kept in the scratchpad, not the repo.

| Output | Bear | Base | Bull |
|---|---|---|---|
| Revenue, M12 (per month) | ₹5.3 lakh | ₹15.8 lakh | ₹41 lakh |
| Revenue, M24 (per month) | ₹18.8 lakh | ₹63.8 lakh (run-rate about ₹7.7 crore) | ₹1.59 crore |
| Year 1 / Year 2 revenue | ₹0.21 crore / ₹1.49 crore | ₹0.56 crore / ₹4.90 crore | ₹1.62 crore / ₹12.5 crore |
| Paid CAC per deal, M12 | ₹99k | ₹26k | about ₹0 (organic covers it) |
| First month cash-positive | Never (by M24) | **M16** | M8 |
| Peak cumulative burn | ₹3.1 crore and still rising | **₹0.96 crore** | ₹0.44 crore |
| M24 revenue mix | — | Resale 34%, primary 26%, loans 9%, consumer products 22%, brokers 6%, data 3% | — |

**What the model says [J]:**
- **Organic acquisition decides the outcome.** Bull and base differ mainly in organic lead rate and conversion, not in pricing. In the bear case paid CAC per deal (about ₹1 lakh) is close to resale revenue per deal.
- **Funding:** hold ₹1.5–2 crore (base peak burn plus a 6-month buffer), which suits founder or angel money. Raise ₹3–4 crore at M9–M12 only if metrics track the bull case.
- **The business can be built without developer money.** Developer revenue is only 26% of the M24 base mix, so the founder can refuse any deal that strains neutrality.

---

## 5. Go-to-market plan for Delhi NCR

### 5.1 Corridor sequence

| Wave | Market | Why [S] | Offer | Timing |
|---|---|---|---|---|
| 1a | Gurugram: Dwarka Expressway, Golf Course Extension Road, New Gurugram / SPR | 42–43% of NCR sales; ₹2–5 crore demand steady; 57% of NCR unsold stock; rich HRERA data | Free risk cards; Risk Report Pro; loans; resale desk in ready societies | M1–M6 |
| 1b | Noida Expressway and Greater Noida West resale | About 12,000 resale registrations a year in Noida plus Greater Noida; about 75,000 unregistered flats; NHRF collects society-wise registry data | Registry tracker; Verified Flat Check; resale desk | M2–M6 |
| 2 | Sohna Road; Ghaziabad; Faridabad | End-user markets; Faridabad +18%, Ghaziabad +15% in the 12 months to H1 2026 | Same playbook | M13–M18 |
| 3 | Delhi resale | GPA chains, DDA conversion and 2014 circle rates | Verified Flat Check only | M20+ |

### 5.2 Wedge

The wedge is **"Every under-construction RERA project in Gurugram and Noida/GNW, scored for free, with reasons and sources."** It works because buyers search by project name, a navigational query that AI Overviews summarise less [J], and because the score shares as a WhatsApp image card. In Noida/GNW the companion wedge is a **society registry tracker** (done, pending, or blocked by dues, per tower). It answers the most valuable resale question there [S] and opens the RWA relationships the resale desk needs.

### 5.3 Content strategy

| Asset | Format | Target | Notes |
|---|---|---|---|
| Programmatic SEO pages | `/project/`, `/developer/`, `/society/`, `/compare/a-vs-b`, `/corridor/` | About 600 project, 150 developer and 300 society pages by M3 [A] | Structured data and citations so LLM answers cite us |
| Hinglish YouTube | "Project ka Sach" teardowns; "Possession kab milega?"; corridor updates | 3 per week | Founder-led; AI-assisted scripts; human fact-check |
| Reels / Shorts | Red flags; true cost (20–35% above sticker [S]); EMI after the hike | Daily | Synthetic media labelled under IT Rules 2026 [S] |
| WhatsApp bot | Project name → risk card + 3 questions to ask the builder | Always on | Utility messages ₹0.115; service messages charged after 1,000 free from 1 Oct 2026 [S] |
| Free tools | True cost, rent vs buy, EMI shock, registry check | 4 by M3 | SiteGPT gets 90% of its Google traffic from free tools [S] |

### 5.4 Community [J unless marked]

- **FPCE and project allottee associations:** free Possession Watch dashboards and complaint kits. Never monetise distressed allottees.
- **Noida HighRise Federation (NHRF):** a registry-data partnership [S: NHRF collects this data].
- **Society WhatsApp groups:** a digest bot that joins only when the RWA invites it.
- **Reddit (r/gurgaon, r/noida, r/IndiaInvestments):** methodology AMAs and public corrections. No astroturfing.
- **GCC and IT employers:** home-buying webinars as an employee benefit.

### 5.5 Partnerships

| Partner | They get | We get | Structure |
|---|---|---|---|
| 3–5 banks / HFCs | Verified, pre-qualified buyers | 0.3–0.5% payout; in-journey pre-approval | DSA agreement. A multi-lender display brings in RBI Digital Lending rules: neutral display and a key fact statement [S] |
| Lawyer panel (Haryana, UP) | Steady flat-fee work | Verified Flat Check sign-off | Flat fee per review; advocates are not advertised (BCI Rule 36) [S; LAWYER REVIEW] |
| Partner brokers (30–50 per corridor) | Verified buyers, CRM-lite | Visits, resale supply | Commission split; conduct standards |
| RWAs | Society dashboard, valuations | Seller supply, registry data | Free, by invitation |
| CA firms | NRI TDS work | NRI Concierge fulfilment | Flat fee |
| Media data desks | Exclusive data | PR, backlinks | Embargoed Index releases |

### 5.6 PR calendar [J]

- **M1:** methodology published.
- **M3:** GNW Registry Tracker.
- **M5:** **NCR Developer Delivery Index (H1 2027)**, comparing promised and actual possession from RERA filings.
- **M9:** quarterly Delay Monitor.
- **M12:** annual Index plus the first integrity report.

### 5.7 First 90 days

| Window | Milestones |
|---|---|
| Weeks −8 to 0 | Legal opinions (RERA agent, defamation, BCI, DSA, neutrality). File HRERA and UP RERA agent registrations. Sign 3 lender DSAs. Build the HRERA and UP RERA pipeline, methodology v0.9 and the right-of-reply portal. Bank 20 videos. |
| Days 1–30 | Beta risk cards for wave-1 projects, after 14 days' notice to developers [J]. WhatsApp bot, SEO pages, 3 videos a week. |
| Days 31–60 | Risk Report Pro paywall and price test; loan referral; GNW registry tracker. |
| Days 61–90 | Verified Flat Check in GNW; resale desk pilot with 10 partner brokers; Delivery Index draft. |

---

## 6. Growth loops, retention and moat

### 6.1 Loops

| Loop | Trigger | Mechanism | Metric | Target by M12 [A] |
|---|---|---|---|---|
| Content–data | Search for a project name | Risk page → save or alert → user-contributed facts → richer pages → better ranking | Organic share of qualified leads | ≥ 50% |
| Share | Risk card viewed | One-tap WhatsApp share ("send to Papa"), with a link | Shares per view; visits per share | ≥ 5%; ≥ 1.5 |
| Allottee | Buyer books a flat | Possession Watch → co-allottees invited → crowd-sourced progress feeds the score → investors list resale with us at possession | Possession Watch MAU; share of resale supply | 5k; 10% |
| Transaction–data | Deal closes | Verified price and registry status feed the valuation model (AVM) and society pages → better price evidence → more deals | Societies with ≥ 5 verified prices | 100 |
| Referral | Registration | ₹5k each side, paid on registration | Share of deals from referrals | ≥ 10% |
| Seller re-engagement | Owner checks "What's my flat worth" | Quarterly valuation, balance-transfer nudge, registry alerts → lists when ready | Share of seller leads | ≥ 30% |
| Broker | Broker joins Verified Partner | Brings own buyers for verification; adds verified listings | Share of resale inventory | ≥ 60% |

### 6.2 Retention mechanics

Buying a home is rare, so retention means staying with the buyer through a 3–24 month decision and a 2–4 year construction wait [J]. The mechanics:
- Saved-project alerts: QPR filed or missed, complaints, orders, extensions, NCLT filings, price changes.
- A construction digest for booked buyers.
- Rate and EMI alerts.
- Registry status changes.
- Society news.

All of these go over WhatsApp utility templates (₹0.115, against ₹0.86 for marketing [S]) or in-app notifications, never marketing broadcasts.

### 6.3 Data moat (in order of durability) [J, building on Phase-1]

1. A per-project record of promised vs actual delivery, with sources and a dispute log. Incumbents cannot publish this neutrally because developers pay them.
2. A per-society, per-tower record of registry, authority dues and NOC status (Noida/GNW first).
3. Verified closing prices from our own deals and licensed data.
4. Allottee-contributed evidence: geotagged photos, demand letters, possession letters.
5. Score calibration history: predicted bands vs outcomes. Once published, it builds a reputation for accuracy that cannot be bought quickly.

---

## 7. Metrics

### 7.1 North-star metric

**Verified Home Decisions per month (VHD)** counts unique pairs of a qualified buyer and a specific project or flat where the buyer unlocks a full verification. Unlocking means buying Risk Report Pro, buying a Verified Flat Check, or engaging the desk, where verification is included. A qualified buyer is phone-verified, has stated a budget and plans to buy within 6 months.

**Why this metric [J]:**
- It measures the value we promise: confidence in a specific decision.
- It counts "don't buy" outcomes as wins.
- Traffic cannot inflate it.
- It leads revenue from transactions, loans and reports.

**Counter-metrics:** disputes upheld as a share of scores; median days to correct; partners contacting each buyer (target ≤ 1).

### 7.2 KPI tree

```
VHD (north star)
├── Qualified buyers / month
│   ├── Monthly unique visitors (organic %, by corridor)  ← SEO pages indexed, YouTube views, WhatsApp bot chats
│   ├── Visitor → phone-verified sign-up (%)
│   └── Sign-up → qualified (budget + timeline) (%)
├── Verification unlock rate (% of qualified buyers)
│   ├── Paywall view → Risk Report Pro purchase (%) · refund rate
│   ├── Verified Flat Check orders · turnaround hours · lawyer minutes per order
│   └── Desk engagements
└── Properties verified per buyer

Money (lagging, by month)
├── Transactions: qualified lead → visit → token → registration · revenue per deal · loan attach %
├── Consumer revenue: Pro, Verified Flat Check, NRI, Possession Watch
├── CAC per deal by channel · contribution per deal · payback months
└── Developer revenue share (must be ≤ 35%)

Retention / loops
├── Saved projects per buyer · alert open rate · D30 / D90 return
├── Share rate per risk card · visits per share
└── Possession Watch MAU · allottee-contributed data points

Trust guardrails
├── Disputes received / upheld · median time to correct
├── Score calibration (Brier score / back-test by band)
├── Partners per buyer (≤ 1) · complaint rate · NPS (buyers, sellers, brokers)
└── Legal notices received / escalated
```

### 7.3 MVP success criteria (by day 90 to M6) [A]

| Area | Day 90 | M6 |
|---|---|---|
| Coverage | ≥ 80% of under-construction residential RERA projects in wave-1 corridors scored (about 300+) | 95%, plus GNW societies tracked (≥ 150) |
| Traffic and activation | 10k monthly visitors; 2k phone-verified users; 5% of card views shared | 25k monthly visitors; ≥ 35% organic share of qualified leads |
| Willingness to pay | ≥ 150 cumulative Risk Report Pro sales at ≥ 0.1% of visitors; refunds < 5% | ≥ 0.15% of visitors; ≥ 40 Verified Flat Checks a month at ≤ 60 lawyer minutes each |
| Transactions | ≥ 10 partner brokers; ≥ 3 tokens | ≥ 1 registration a month (base); loan attach ≥ 30% |
| VHD | ≥ 300 cumulative | ≥ 250 a month |
| Trust | Every dispute answered in ≤ 14 days; no injunction | Methodology v1 published; first integrity log |

### 7.4 Kill and pivot criteria (reviewed at M6, M9 and M12) [J]

| Trigger | Action |
|---|---|
| Risk Report Pro < 0.05% of visitors and Verified Flat Checks < 20 a month at M6, with ≥ 25k monthly visitors | Consumer willingness to pay has failed. Make reports free lead magnets; lean on transactions and lender data |
| Lead → deal < 1% after 300 qualified leads, or CAC per deal > 60% of revenue per deal for 3 months | Stop paid spend; narrow to one corridor |
| Organic share of qualified leads < 30% by M9 | Freeze hiring; shift to partner distribution through banks and employers |
| Injunction against scores stands > 60 days, or legal spend > 25% of burn | "Facts-only" mode (cited events, no bands) while the case runs |
| Bear path at M12 (≤ 4 deals and < ₹6 lakh revenue a month) | Cut to founder plus 2; keep consumer and data products; explore a sale (Aurum, Info Edge, Square Yards and REA are active acquirers [S]) |

### 7.5 Milestones

| By | Milestone (base case) |
|---|---|
| Day 90 (Jan 2027) | Wave-1 coverage live; price test complete; 3 lenders and 10 brokers signed; agent registrations filed |
| M6 (Apr 2027) | ₹2 lakh+ revenue a month; Delivery Index H1 edition; first resale registrations; FIU-IND registration ready before the turnover threshold |
| M7 (May 2027) | **DPDP full compliance** (13 May 2027) [S]: consent logs, erasure jobs, grievance officer, breach runbook |
| M9 (Jul 2027) | Breakeven-path review; neutrality-policy legal review signed off; NRI Concierge live |
| M12 (Oct 2027) | ₹15 lakh+ revenue a month; 10 deals a month; 80k monthly visitors; first commission-neutral developer empanelments (≥ 5); annual integrity report; wave-2 plan approved |
| M16 | Monthly cash breakeven |
| M24 (Oct 2028) | ₹60 lakh+ revenue a month; 35 deals a month; wave 2 live; first lender data licence |

---

## 8. Risks and mitigations

| Risk | Likelihood / impact [J] | Mitigation | Early warning |
|---|---|---|---|
| **Developer legal pushback** (defamation, John Doe orders, CCPA "disparagement" claims [S]) | High / High | Cited facts; bands, not grades; never a "credit rating" [S]; 14-day notice; right of reply; corrections log; ₹10–15 lakh a year legal reserve and PI cover. No developer revenue at launch weakens the "malice" argument [S] | Legal notices |
| **Incumbents copy the score** | Medium / Medium | They are conflicted (30% of Housing.com revenue comes from developers [S]; Zillow's retreat [S]). Compete on independence, calibration history, allottee data and GNW registry data | Competitor "trust scores" |
| **CAC above revenue per deal** | Medium / High | Organic-first; paid capped at CAC per deal ≤ 40% of first-deal revenue; referrals; partners | Paid CPL > ₹1,500; organic share < 35% |
| **Cycle and the rate hike** (NCR sales −11%; repo 5.50%) [S] | High / Medium | Resale-first (buyers are moving to ready homes [S]); counter-cyclical "wait or buy" reports; balance-transfer referrals; variable RM cost; 18-month runway | Paywall views flat while deals fall |
| **Data access** (scraping limits; IT Act and DPDP [S]) | Medium / High | Polite crawling with provenance; RTI fallback; licensed data; consented allottee uploads; NHRF/FPCE partnerships | Portal blocks |
| **Regulatory load** (RERA, PMLA, DPDP, RBI lending, BCI, IT Rules, CCPA) [S] | High / Medium | Register early; principal officer named; zero-cash policy; labelled AI staging; neutral loan display | Regulator notices |
| **Neutrality drift** | Medium / High | Rules in 2.3 enforced in code; 35% cap; external committee member; integrity report | Developer share > 30% |
| **Ops creep** | Medium / Medium | ≤ 60 lawyer minutes per check; ≤ 5 RM hours per deal; partners do field work | Verified Flat Check margin < 40% |
| **Verification liability** | Medium / High | Scoped statements; no title certification; human sign-off; PI insurance | Error refunds |
| **Broker backlash** | Medium / Medium | Never "no broker"; co-broking; Verified Partner programme | Partner churn |
| **Platform dependence** (WhatsApp pricing, AI Overviews) [S] | Medium / Low–Medium | Utility templates; app fallback; YouTube and direct traffic | Cost per conversation > ₹10 |

---

## 9. Product recommendations

| ID | Recommendation | User / actor | Problem solved | Priority | Platform | Effort | Dependencies / risks |
|---|---|---|---|---|---|---|---|
| BM-01 | Free public Delivery Risk cards for every under-construction RERA project in wave-1 corridors (no opt-out; "Insufficient data" state) | Buyers | Delivery risk is opaque; acquisition magnet | P0 | Both (web/SEO first) | L | Data pipeline; methodology v1; legal review |
| BM-02 | Shareable risk card (image plus deep link, Hinglish) | Buyers, families | Family decisions happen on WhatsApp; organic reach | P0 | Both + WhatsApp | S | A compressed summary must stay accurate |
| BM-03 | WhatsApp risk bot (project name → card) with consented lead capture | Buyers | Zero-install first contact | P0 | WhatsApp | M | WhatsApp provider (BSP) cost; DPDP consent |
| BM-04 | Risk Report Pro paywall (₹999, UPI) with price test; Buyer Pass bundle (₹2,999) in P1 | Buyers | Deep, cited due diligence; proves willingness to pay | P0 | Web + app | M | Payment gateway; CCPA dark patterns; refunds |
| BM-05 | Saved-project alerts (QPR, complaints, orders, extensions, NCLT, price) | Buyers, allottees | Risk changes after the first visit; retention | P0 | App + WhatsApp | M | Data freshness; template approval |
| BM-06 | Verified Flat Check (AI plus lawyer sign-off, scoped statement, ≤ 72 hours) | Resale buyers | Title, registry and dues uncertainty | P0 (GNW, M4) | Web + WhatsApp | M | Lawyer panel; BCI Rule 36; PI insurance |
| BM-07 | Loan eligibility check plus lender referral with neutral display | Buyers | Financing friction; revenue | P0 | Both | M | DSA agreements; RBI Digital Lending rules |
| BM-08 | Integrity package: disclosure banner, neutrality policy, commission-blind ranking in the data model, annual integrity report | All | Credibility; defamation defence | P0 | Both | S | Governance discipline |
| BM-09 | Developer right-of-reply portal (free; evidence upload; 14-day notice; public dispute log) | Developers | Fairness; legal defence; data quality | P0 | Web | M | Moderation load |
| BM-10 | Resale desk with Verified Partner brokers (co-broking; fee on registration) | Buyers, sellers, brokers | Spam; closing coordination | P0 (pilot M4) | Both | L | RERA agent registration; FIU-IND; RMs; zero-cash policy |
| BM-11 | Consent-first lead policy (no lead resale; one partner per buyer–property; DND compliant) | Buyers | Spam from shared leads | P0 | All | S | Less short-term broker revenue |
| BM-12 | Society registry-and-dues tracker (Noida/GNW), NHRF partnership | Buyers, sellers, RWAs | Unregistered-flat risk; resale wedge | P0 | Web | M | Data access; liability wording |
| BM-13 | Attribution and CAC dashboard by channel; referral rewards paid on registration | Growth | CAC per deal unknown | P0 | Internal | S | Analytics consent |
| BM-14 | Hinglish content engine (per-project YouTube and Reels; human-checked; SGI-labelled) | Buyers | Trust and reach at low CAC | P0 | YouTube / Instagram | M | Founder time; IT Rules |
| BM-15 | "What's my flat worth" with quarterly updates; declines to estimate when data is thin | Owners | Pricing from hearsay; re-engaging sellers | P1 | Both | M | Licensed price data; valuation error |
| BM-16 | Possession Watch (free plus ₹1,499/year): digest, crowd-sourced progress, delay-compensation calculator, complaint kit | Booked buyers | "Has my project quietly stalled?" | P1 | App + WhatsApp | M | Moderation; no individual legal advice |
| BM-17 | NCR Developer Delivery Index plus quarterly Delay Monitor | Media, buyers | PR; category authority | P1 (M5) | Web | M | Legal review of each release |
| BM-18 | NRI Concierge (₹34,999) | NRI buyers | Remote, high-risk purchase | P1 | Web + WhatsApp | M | CA and lawyer partners; FEMA/TDS accuracy |
| BM-19 | Loan balance-transfer nudges after the rate hike | Owners | EMI shock; reactivating owners | P1 | WhatsApp | S | RBI rules; consent |
| BM-20 | Commission-neutral primary booking desk (flat retained fee; revenue cap) | Buyers, developers | Primary revenue without conflict | P1 (gated, ≥ M10) | Both | M | Legal opinion; developer acceptance; clawback |
| BM-21 | Verified Partner broker subscription (₹2,999/month) | Brokers | Lead quality; brokers become distribution | P1 | Web + app | M | Adoption; badge integrity |
| BM-22 | Lender project-risk data licence (API) | Banks, HFCs | Project risk in lending | P2 | API | L | Same score for all users; sales cycle |
| BM-23 | NRI rental and property management (partner-led) | NRI landlords | Remote ownership | P2 | App | L | Field operations; partner SLAs |
| BM-24 | Developer SaaS (lead qualification, RERA ad checker) in a firewalled unit | Developers | Lead quality; ad fines | P2 (decide M18) | Web | L | **Conflict risk** |

## 10. Open questions for the founder

1. **Developer money:** will you ever accept CP commission, even under the neutrality rules? If so, do you prefer passing excess commission to buyers (a strong hook that developers may resist) or one flat rate for all developers?
2. **Capital and risk appetite:** fund ₹1.5–2 crore yourself or with angels? Will you hold a ₹10–15 lakh a year legal reserve and fight a developer suit in year 1?
3. **Licences:** are you comfortable registering as a RERA agent in Haryana and UP and as an FIU-IND reporting entity by about M8?
4. **Resale first?** Or do you want earlier primary revenue, and earlier conflict exposure?
5. **On camera:** will you front Hinglish content three times a week? Organic distribution is the biggest bull/bear swing.
6. **Cash component:** accept a zero-tolerance policy that will lose some deals?
7. **Brand:** should the score and the Index have a separate, independent sub-brand?
8. **Revenue cap:** is 35% from developers the right ceiling, and should it be published?
9. **NRI focus:** Gulf or US/UK first?
10. **Data budget:** ₹10–25 lakh a year for licensed transaction data [A]?
11. **Kill criteria:** are the triggers in 7.4 binding, including a possible strategic sale?

### New sources (accessed 18 Oct 2026)

- Hemnet Group, investors page (Q2 2026 net sales, ARPL, adjusted EBITDA margin, 29 Sep 2026 strategy announcement): https://www.hemnetgroup.se/en/investors/
- Hemnet Group homepage ("approximately 90% of all property sold in Sweden are listed on Hemnet"): https://www.hemnetgroup.se/en/
- Wikipedia, Purplebricks (fixed upfront fee, deferral, peak valuation, sold to Strike for £1): https://en.wikipedia.org/wiki/Purplebricks
- Wikipedia, Zillow (climate risk data scrapped by Nov 2025 after agent complaints): https://en.wikipedia.org/wiki/Zillow
- Landeed homepage (AI title reports, 28 states, 8M+ users, B2B focus): https://www.landeed.com/
- Square Yards Azuro (property-management services; fees not published): https://www.squareyards.com/azuro
- NoBroker legal services (property legal assistance "coming soon"; no prices published): https://www.nobroker.in/legal-services

All other [S] items come from the Phase-1 notes and reports cited in `product/BRIEF.md`, mainly `business_model_gtm_risks.md`, `market_size_and_dynamics.md`, the Phase-1 report, `solo_founder_feasibility.md` and `legal_risk_and_score_ux.md`. Their original source links are in those files.

**Gaps:** WebSearch was exhausted this session. Four things could not be verified:
- consumer prices for Indian title-verification services (Vakilsearch returned 403),
- Indian CIBIL report pricing (403),
- Zillow Flex and other referral-fee rates,
- the cause of Hemnet's 2026 volume decline.

Treat the related prices as [A] until primary interviews or price checks confirm them.
