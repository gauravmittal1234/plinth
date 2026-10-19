# Supply-side input: developers, brokers and channel partners (CPs)

Author: supply-side (B2B) product specialist · Input to the PRD · 18 Oct 2026

**How to read this.** Phase 1 evidence is reused and cited to its original source. New sources were accessed on 18 Oct 2026. **[J]** marks my own judgement. Arithmetic on company filings is my own and is labelled as such. Web search was exhausted, so new evidence comes only from known URLs: company annual reports on BSE, the SEC, and vendor and precedent pages.

---

## 1. Summary

1. **Developers' biggest acquisition cost is brokerage, not advertising, and that includes the big brands.** In FY26 Signature Global added about ₹316 cr of brokerage cost against about ₹107 cr of advertising, roughly 3.8% of its ₹8,220 cr pre-sales. DLF added about ₹563 cr of "incremental cost of obtaining contracts", roughly 2.8% of ₹20,143 cr bookings (my arithmetic, §2.2). The budget we can most easily win is the CP commission line. Developers already pay it, and empanelling a new CP is a routine process with no procurement hurdle.
2. **Developer revenue at launch should be a CP-equivalent success fee.** The platform registers as a RERA agent and is paid on bookings. A per-verified-site-visit fee can be piloted with mid-size developers. Do not build a developer CRM: Salesforce, Sell.Do, LeadSquared and Kylas already fill that slot. Integrate with them instead.
3. **The risk score is never for sale, and no commercial term depends on it.** Every in-scope project is scored, with no opt-out. Developers get a free Evidence & Reply portal. Sales staff cannot see a score before it is published. Commercial eligibility is decided by objective compliance gates, not by score. Every paid surface shows the score.
4. **The hardest conflict is our own commission, not the score's methodology.** Risky projects often pay CPs more [J]. Two rules handle this: **commission-blind ranking**, where the AI advisor and search never use commission as an input, and a **published commission cap**, with no trips, kickers or performance bonuses accepted.
5. **Reactions to the score will split by developer type.** Credible mid-size developers with weak brands will champion it. Developers carrying a legacy of stalled projects will fight it with legal notices and CREDAI pressure, and may pull their inventory. Big brands will mostly be indifferent but will contest nuance. Each group needs its own playbook (§3.3).
6. **Brokers will stay loyal for four things:** verified inventory, proof that they introduced a buyer, faster and visible commission settlement, and a reputation they earn. Selling them leads will not create loyalty. Beike's ACN shows that a co-broking network works at scale when listings are authentic, commission is split automatically by role, and the platform governs behaviour: over 70% of Beike existing-home deals involved cross-store cooperation in 2020, and it had 445k+ active agents by end-2025.
7. **Resale supply should start with 15–25 target societies.** Supply comes from owner-direct listings and from exclusive or co-broked mandates through verified local dealers, with RWAs as the distribution channel. Every listing climbs a five-level verification ladder, and availability is re-confirmed every 14 days.
8. **Leads are never sold or broadcast.** The buyer chooses who may contact them. Each listing gets at most one contact, with at most three parties per buyer per 30 days by default. Numbers are masked and consent is logged. This is also the core of DPDP compliance by May 2027.
9. **MVP supply modules:** developer portal (claim, RERA-synced data, inventory and price list, construction updates, Evidence & Reply, consented lead inbox, visit calendar), broker app (verified onboarding, mandate-backed listings, CRM-lite on WhatsApp, co-broking, commission ledger), consent-based routing, and verified site visits. Booking money moves only into **RERA-registered collection accounts** that the platform has verified. The platform never holds funds.
10. **Pricing hypotheses:** 1.5–3% on new-launch bookings (70–80% to any sub-CP); ₹2,500–6,000 per verified visit, credited against the booking fee; a free broker app with ₹999–1,999/month Pro; resale success fees only on platform-originated deals; developer AI pre-sales at ₹25k–75k per project per month (P1).

---

## 2. Developers: needs and willingness to pay

### 2.1 Segments

| | **Large/branded:** DLF, Godrej, M3M (unlisted), Signature Global, Max Estates | **Mid-size:** ATS, Gaurs, Mahagun, Ace (Noida/GNW/Ghaziabad); Experion, Elan, Whiteland (Gurugram) | **Small and builder-floor** (Delhi/Gurugram plotted) |
|---|---|---|---|
| **How they sell** | EOI queues and launch events, NRI desks, top-CP networks. DLF's The Aureva sold 172 homes after 406 EOIs in 48 hours ([ICICI Direct](https://www.icicidirect.com/research/equity/trending-news/dlf-sells-out-the-aureva-senior-living-project-in-gurugram-for-1-985-cr)) | Launches plus portals, Meta/Google and heavy CP use, with site visits as the main conversion step | Local dealers, WhatsApp and portals [J] |
| **Funnel bottleneck** | Allocation, KYC, collections and CP attribution at scale. Some segments are softening: Signature's FY26 bookings fell 20% ([Business Standard](https://www.business-standard.com/industry/news/signature-global-reports-5-drop-in-q4-sales-bookings-on-weak-demand-126040900776_1.html)) | Lead quality, speed-to-lead, the NCR trust deficit, cash flow and RERA ad compliance (UP-RERA fined 91 developers in Jan 2025, [Best Media Info](https://bestmediainfo.com/mediainfo/mediainfo-marketing/up-rera-imposes-rs-266-crore-fine-on-91-developers-for-violating-ad-norms-8656562)) | Credibility, documents and financing. DTCP froze new stilt-plus-four approvals on 21 Jul 2026 (Phase 1 report) |
| **Tools** | Enterprise stack. Signature runs SAP, Salesforce CRM and an AI Centre of Excellence ([AR FY26](https://www.bseindia.com/xml-data/corpfiling/AttachHis/eba80591-fb9a-4792-8120-76030ad485ba.pdf)) | Sell.Do, LeadSquared, Kylas, Leadrat-class CRMs or spreadsheets [J; not confirmed firm by firm] | WhatsApp and Excel [J] |
| **CP dependence** | High in rupee terms (§2.2). Signature had 2,600+ active CPs in FY26 and, at 31 Mar 2025, a 30-person direct sales team against 122 people in indirect (CP-facing) sales ([AR FY25](https://www.bseindia.com/xml-data/corpfiling/AttachHis/ac89b1b0-9e2b-4f16-afff-e29206f4b649.pdf)) | High. CPs earn 1–3%, up to 5% in luxury ([Leadrat](https://leadrat.com/channel-partners-in-real-estate-a-complete-2026-guide/)). Nationally, CPs handle about 32% of bookings ([ANAROCK via Business Standard](https://www.business-standard.com/amp/finance/personal-finance/india-s-housing-sweet-spot-anarock-ai-says-it-s-50-lakh-1-cr-homes-125080801155_1.html)) | Dealer-led [J] |
| **Cost per booking** | Signature: about ₹14.9 lakh of brokerage per unit sold in FY26, on an average ticket of about ₹3.9 cr (my arithmetic) | Digital channels: about ₹50k (mid) to ₹3–6 lakh (premium/luxury). CPs: ₹1.5–4.5 lakh on a ₹1.5 cr unit (Phase 1) | Unknown |
| **How they buy** | CP empanelment through the sales or CP head takes weeks. SaaS goes through IT and procurement with a security review and takes 3–6 months [J] | The promoter or director decides with the sales head in 2–6 weeks. They want outcome pricing and negotiate payment terms hard [J] | The owner decides on WhatsApp and pays only on closure [J] |
| **Will pay for** | Bookings at standard slabs. Verified NRI/HNI demand. Possibly AI pre-sales pilots. **Not** a CRM | Bookings, verified site visits, AI pre-sales (it replaces ₹15–25k/month telecallers), ad-compliance checks. **The good deliverers here want a credible track-record page** | Per-closure only. **Not a P0 segment.** Most single-plot floors sit outside RERA, so the score does not apply |

### 2.2 New evidence: what CP dependence costs listed NCR developers

Under Ind AS 115, developers capitalise brokerage as a "cost to obtain a contract" and expense it only when revenue is recognised. The P&L line therefore understates what they actually pay. Adding the change in the capitalised balance to the year's amortisation gives an estimate of brokerage incurred in the year (my arithmetic):

| Developer, year | Capitalised brokerage/contract cost: opening → closing | Expensed in P&L | **Incurred (estimate)** | Bookings | **% of bookings** | Advertising |
|---|---|---|---|---|---|---|
| Signature Global FY26 | ₹806 cr → ₹958 cr | ₹165 cr | **≈₹316 cr** | ₹8,220 cr | **≈3.8%** | ₹107 cr |
| Signature Global FY25 | ₹474 cr → ₹806 cr | ₹137 cr | **≈₹468 cr** | ₹10,290 cr | **≈4.6%** | ₹89 cr |
| DLF FY26 (consolidated) | ₹871 cr → ₹1,283 cr | ₹151 cr | **≈₹563 cr** | ₹20,143 cr | **≈2.8%** | Combined line "brokerage, advertisement and sales promotion": ₹315 cr |

Sources: [Signature Global AR FY26](https://www.bseindia.com/xml-data/corpfiling/AttachHis/eba80591-fb9a-4792-8120-76030ad485ba.pdf) (notes 20, 36B and the Ind AS 115 note); [Signature Global AR FY25](https://www.bseindia.com/xml-data/corpfiling/AttachHis/ac89b1b0-9e2b-4f16-afff-e29206f4b649.pdf); [DLF AR FY26](https://www.bseindia.com/xml-data/corpfiling/AttachHis/7ecef16f-7888-4fed-9be5-77aa26834bd4.pdf) ("Incremental Cost of obtaining contract" note; note 34). Booking figures are from the Phase 1 notes.

**Caveats.** The capitalised costs may include items other than CP brokerage. Brokerage is booked when agreements are signed, so it can lag bookings. Bookings are a non-GAAP figure. Treat the percentages as directional.

**What this means for product [J]:**
- Even EOI-led brands pay about 3% of sales value to intermediaries. They do not lack distribution; they want *cheaper, attributable* distribution.
- Brokerage is 3–5 times advertising spend, so moving even 5% of CP-routed bookings to a verified channel beats any ad product.
- Signature already gives CPs invoice submission and real-time earnings ([AR FY25](https://www.bseindia.com/xml-data/corpfiling/AttachHis/ac89b1b0-9e2b-4f16-afff-e29206f4b649.pdf)). Payout transparency is hygiene; our edge must be **one view across developers** and faster settlement.

### 2.3 Developer pain points, ranked [J; evidence in Phase 1 notes B2–B6]

1. **Cost and opacity of CP bookings:** attribution disputes, three parties claiming one buyer, clawbacks ([Sell.Do](https://www.sell.do/blog/role-and-advantages-of-a-channel-partner-in-real-estate)).
2. **Lead leakage and slow response:** 4–6 hours to first contact on portal leads (vendor claims).
3. **Trust deficit:** 98% of buyers want assurance of timely completion (ANAROCK, Phase 1 report), yet a credible developer has no neutral place to prove its record. One paid 99acres subscriber could not even add construction photos ([Play reviews](https://play.google.com/store/apps/details?id=com.nnacres.app&hl=en_IN)).
4. **RERA ad compliance** for their own and their CPs' creatives.
5. **Softening demand:** NCR sales fell 11% in Jan–Sep 2026 ([Knight Frank via BW](https://www.businessworld.in/article/ncr-housing-sales-slip-11-till-september-2026-gurugram-leads-decline-knight-frank-626888)), so mid-size developers will prize *incremental* buyers.

### 2.4 What developers will pay for, ranked by evidence of willingness to pay

| # | Offer | Evidence of WTP | Fit with trust | Verdict |
|---|---|---|---|---|
| 1 | **Bookings at a CP-equivalent fee** | Proven budget line of about 2.8–4.6% of sales (§2.2). Empanelment is routine | Conflict managed with commission-blind ranking and a cap (§3) | **P0** |
| 2 | **Verified site visits** (pay per unique, OTP- and geo-verified first visit) | Developers already spend about ₹6,400–8,000 of ad money per site visit ([Mediaverse](https://www.themediaverse.in/digital-marketing/blog/meta-ads-real-estate-leads-india-site-visit-cost)). "A booked site visit is the single strongest predictor of a booking" ([Sell.Do](https://www.sell.do/blog/real-estate-crm-lead-management-guide)) | Good, because the buyer chose the visit | **P1 pilot** with 2–3 mid-size developers |
| 3 | **AI pre-sales add-on** (instant Hinglish voice/WhatsApp qualification, visit booking, CRM write-back) | Replaces ₹15–25k/month telecallers. Voice AI costs ₹2.7–6/min (Phase 1). Sell.Do already sells AI add-ons ([Sell.Do pricing](https://www.sell.do/pricing)) | Neutral | **P1** |
| 4 | **Demand insights** (aggregated buyer questions, objections, price sensitivity, comparison sets) | No direct evidence [J] | Aggregates only, never individual data | **P2** |
| 5 | **RERA ad-compliance checker** | Fines: UP-RERA's 91 developers; MahaRERA fines up to ₹50k per ad | Neutral; also a gift to CPs | **P2** (cheap wedge) |
| 6 | **"Trust page" / verification of project facts** | Credible mid-size developers want it [J] | **Must be free.** Charging for anything that touches the score breaks independence | Free, **P0** (§3) |
| 7 | CRM or CP-management SaaS | Crowded and priced low (see §7) | — | **Don't build. Integrate** |

---

## 3. The Delivery Risk score and developer incentives: designing for independence

### 3.1 What precedents teach

| Precedent | Model | What happened | Rule we adopt |
|---|---|---|---|
| Credit rating agencies | The issuer pays. SEBI requires disclosure of conflicts, ring-fencing, and an "Issuer Not Cooperating" label | Issuer-pays conflicts are blamed for 2008 and IL&FS (AAA to D in days) ([SEBI FAQ](https://www.sebi.gov.in/sebi_data/faqfiles/mar-2026/1772445490055.pdf); legal note A5) | No payment from a rated party is ever linked to the score. Disclose commercial ties on the page. Use a "Developer not cooperating" label rather than silence |
| NSW iCIRT | The business pays. Only 3+ stars appear on the register. Standard-report holders cannot market their rating. Valid for 1 year, with a QR badge ([iCIRT FAQ](https://icirt.com/business/faqs-business)) | Low performers opt out, fake rating claims appeared, detail costs A$1,750+, and there is no formal appeal ([Flat Chat](https://www.flatchat.com.au/developers-fake-icrt-ratings/)) | **Score every in-scope RERA project. No opt-out and no paywalled detail.** A developer may quote its score only through a live verification link or widget |
| Glassdoor | Employers buy branding: ads, Spotlight pages, review responses, featuring a review ([Glassdoor](https://www.glassdoor.com/employers/solutions/employer-branding/)). Reviews are removed only for guideline breaches, at Glassdoor's sole discretion (legal note A6) | Monetisation sits *next to* the rating, not in it | Developers may buy presentation and sales tools. They can never buy, suppress or pre-review the score |
| Trustpilot | Paid plans cost $99–799/month for invitations and widgets ([plans](https://business.trustpilot.com/plans)). Businesses "can never pay to remove reviews" ([Trust centre](https://corporate.trustpilot.com/trust)). Transparent Flagging shows publicly how a business reports reviews | Businesses abused the flagging tools in 2024, and Trustpilot changed its process | **Publish a dispute log per developer**: count, topic, outcome. Rate-limit disputes |
| Bayut TruCheck / Property Finder SuperAgent | TruCheck verifies documents plus a site visit (Bayut claims 5x leads). SuperAgent is "100% automated", judged on listing quality, response speed and accuracy, recomputed monthly ([Property Finder blog, Arabic, 15 Apr 2025](https://www.propertyfinder.ae/blog/superagent/)) | Verification and earned badges become revenue and trust levers | Charge for the *cost of verifying facts* (listings), never for *judgements* (scores). Quality badges are earned and recomputed monthly |
| MahaRERA grading; Zillow climate score | MahaRERA's grading was halted for lack of statutory power. Zillow removed climate scores after MLS and agent pushback; Redfin kept them and added a removal-request route (legal note B2) | The rated parties organise. Stale predictions lose credibility | Lead with facts, publish backtests, show "last recalculated" dates, and have a dispute route ready **before launch** |

### 3.2 The conflict that matters most is our own commission

If we earn 1.5–3% on bookings, our incentive is to push bookings. Projects with weaker sell-through often offer higher CP slabs, trips and bonuses [J; Leadrat mentions "performance bonuses… international trips"]. Rules:

1. **Commission-blind ranking.** No ranking, recommendation, AI-advisor answer or notification may take commission rate or commercial status as an input. This should be enforced in code with an audited feature list and tested quarterly.
2. **Flat, published commission cap** (e.g., ≤3% of agreement value). Refuse kickers, trips and time-bound "special slabs". Disclose on every project page: "We earn X% if you book through us. This does not affect the risk score or ranking."
3. **Objective commercial eligibility, never score-based.** We sign CP agreements only with projects that have valid RERA registration, no regulator stop-sale order and current QPR filings. A bottom-band project that meets these gates may be sold, but with mandatory risk acknowledgement before a platform-assisted booking ("I have read the 5 reasons this project is High risk"). If we refused business to low scorers, the score would become a commercial weapon, and every dispute would turn into a commercial negotiation.
4. **Revenue concentration cap.** No developer group exceeds about 10–15% of platform revenue [J]. This is the auditor-independence logic: it removes the "too big to downgrade" pressure.
5. **Firewall.** Score and methodology staff are separate from sales. Sales cannot see pre-publication scores or the dispute queue. Staff and founders disclose any holdings in rated developers. We publish an annual integrity report.

### 3.3 Who welcomes the score and who fights it

| Developer archetype | Likely behaviour | Our design response |
|---|---|---|
| **A. Big brand, strong recent delivery** (most large listed developers) | Indifferent to mildly positive. Will contest nuance, e.g. one legacy delay dragging down a group band | Project-level scores separate from the group track record. Show dated track-record facts. Give access to the evidence portal |
| **B. Credible mid-size developer with a weak brand** | **Champions it.** The score is cheap proof against big brands. Will submit evidence eagerly and embed the widget | A free live widget. A public "what would improve this score" list (on-time QPRs, escrow CA certificates, cleared authority dues). Case studies, but never paid placement |
| **C. Developer with a legacy of stalls or insolvency now launching again** | **Fights it.** Legal notices, injunction attempts, CREDAI lobbying, astroturfed reviews, refusing to empanel us, pressure on CPs | Facts-first pages with linked records. Right of reply. Media liability/E&O insurance. An evidence vault per score. A neutral "Developer not cooperating" label. Commerce unaffected (we can live without their inventory) |
| **D. First-time developer or new SPV** | Fears "Insufficient data" being read as "risky" | Show "Limited history" as a neutral state with no default penalty. Accept verifiable evidence: title, approvals, funding tie-ups, escrow certificates. Map SPVs to the group via MCA (prevents gaming by shell SPVs) |
| **E. Builder-floor / plotted** | Mostly outside RERA | Score marked "Not applicable". Use a separate document checklist (sanction, OC, DTCP status) |
| **CPs selling bottom-band inventory** | Conversion falls on our platform, so they may avoid us or lobby. Redfin's trial suggests demand shifts mostly at the high-risk tail: bidders moved to homes with 54% less risk (Phase 1 note) | Give CPs fact-based explanations to use with buyers. Make the platform useful for low-risk inventory and keep ranking commission-blind |

**Expected behaviour change.** Good: honest developers cheaply fix visible factors (QPR timeliness, escrow certificates, authority dues), so the relationship has a constructive, payment-free agenda. Bad: padded construction photos, timed filings, split SPVs. Counter by weighting regulator filings above developer uploads and cross-checking geo/time-stamped photos against QPR completion claims.

### 3.4 Evidence & Reply portal: the only developer input into the score

- **Claim the profile.** Verify the authorised signatory by company-domain email, a board-authorisation letter and a match with the RERA registration contact.
- **Submit evidence.** Accepted items include CA escrow certificates, OC/CC applications, bank NOCs, geo-tagged site media and authority-dues receipts. Each item is labelled *Public record (linked)*, *Developer-provided (unverified)* or *Verified by us*. Only verifiable items can move the score.
- **Corrections fast lane.** Acknowledge within 48 hours and decide within 15 working days. We keep editorial discretion. The developer's response is published next to the score.
- **Pre-publication notice.** Give 7 days' notice before any downgrade into the bottom two bands, for factual correction only (legal note A6).
- **Limits.** Disputes are rate-limited per developer per quarter. Outcomes go into a public dispute log. No fee is charged for any of this, ever.

---

## 4. Brokers and CPs: needs and product

### 4.1 Segments

| Segment | Business | How they work today | Top pains | What would win their loyalty |
|---|---|---|---|---|
| **Society/locality dealers** (1–5 people, office at the society gate) | Resale and rentals. About 1% per side + 18% GST; dual agency is common ([RealBetter](https://gurgaon.realbetter.com/blog/charges/brokerage-charges-in-gurgaon)) | WhatsApp broadcast groups for inventory, keys held informally, informal co-broking. Portal spend ₹899–60k/month ([ClosingFox](https://closingfox.com/for-business-owners/99acres-vs-magicbricks-vs-housing/)) | Leads sold to 4–15 brokers, junk leads, stale inventory, being bypassed after a visit [J], no proof of introduction | A verified inventory network, proof-of-introduction records, free tools, an earned badge |
| **New-launch CP firms** (5–50 people, RERA-registered) | Developer commission of 1–3%+ on slabs that rise with volume. Paid against collection milestones. "Clawback on cancellation is standard" ([Sell.Do](https://www.sell.do/blog/role-and-advantages-of-a-channel-partner-in-real-estate)) | A separate CP portal for each developer, Meta ads, WhatsApp, site-visit cabs | Payout opacity and delay; "partners who cannot see what they have earned… stop prioritising the project" (Sell.Do). Lead-ownership disputes. Juggling dozens of developer logins | One ledger across developers, faster settlement, empanelment access, verified buyers |
| **Aggregators** (ANAROCK, Square Yards, PropTiger/Aurum) | Developer mandates. Square Yards did ₹13,236 cr of transactions in FY26 (Phase 1) | Their own tech and CP networks | — | **Competitors**, at best occasional inventory partners. Do not depend on them |
| **Freelance sub-brokers / NRI referrers** | Refer clients to a master CP for a share | WhatsApp | Late or absent referral payouts | Fast, transparent referral payouts |

### 4.2 Product options compared

| Option | Value to broker | Evidence of WTP / price anchors | Strategic value to us | Verdict |
|---|---|---|---|---|
| **CRM-lite** | Medium | Commoditised: Privyr is free for up to 3 members ([Privyr](https://www.privyr.com/pricing)); Kylas is a flat ₹12,999 plan with unlimited users ([Kylas](https://www.kylas.io/pricing)); LeadSquared costs ₹2,500–5,000 per user per month ([LeadSquared](https://www.leadsquared.com/sales-crm-pricing/)) | It is the container for everything else | **P0, free**, WhatsApp-native |
| **Co-broking network with role-based splits** (ACN-style) | High: more inventory and more buyers | Beike allocates commission "automatically based on agents' various roles… not based on negotiations". By end-2025 it had 445k+ active agents in about 58k stores across 279 brands ([20-F FY2025](https://www.sec.gov/Archives/edgar/data/1809587/000110465926048109/beke-20251231x20f.htm)), and over 70% of existing-home deals involved cross-store cooperation ([20-F FY2020](https://www.sec.gov/Archives/edgar/data/1809587/000110465921046841/beke-20201231x20f.htm)) | **Moat**: a verified inventory and transaction dataset per society | **P0** in target societies |
| **Verified profile + earned quality score** | Medium-high: wins buyer trust | Earned, not bought (Property Finder's SuperAgent model) | Lets routing reward quality | **P0** verification; **P1** score |
| **AI follow-up assistant** (drafts Hinglish WhatsApp replies, reminders, visit scheduling, call-note summaries) | High time saving | Brokers already pay for portals and tools; ₹999–1,999/month is under their portal spend [J] | First real SaaS revenue | **P1, paid "Pro"** |
| **Exclusive-listing tools** (mandate e-sign, seller report with registered comparables, labelled AI staging, marketing kit) | High for listing agents | No India data [J] | Brings exclusive, verified supply | **P0** mandate and verification; **P1** kit |
| **Faster commission settlement** | Very high for CPs | Strongest stated pain (Sell.Do) | Lock-in. Needs developer payout data | **P0** ledger; **P1** pass-through within 7 days of developer payment; **P2** advances via a regulated NBFC partner |

### 4.3 Network rules (the "constitution") [J]

- **Disclosure.** Brokers must disclose that they are brokers, and broker listings sit in a separate feed (Rightmove/Bayut pattern). A listing needs mandate evidence: the owner confirms over WhatsApp OTP that the broker is authorised. This kills fake "owner" listings.
- **Default splits (published).** Platform-matched co-broke: the listing side and the buyer side each charge their own client, as is NCR norm. A cross-locality client referral pays the referrer 25% of the receiving agent's fee. New launch: the platform is the empanelled CP and passes 70–80% to the sub-CP.
- **Proof-of-introduction ledger.** Every consented contact, visit check-in and offer is time-stamped. Brokers can use it in fee disputes. This answers "the buyer went direct after my visit".
- **Enforcement.** Off-platform poaching, spamming buyers or stale listings earn strikes and then suspension, as with Beike's governance and "Beike score".

---

## 5. Resale supply acquisition

### 5.1 Channels

| Channel | How | Cost/effort | Verifiability | Risk | Priority |
|---|---|---|---|---|---|
| **Owner-direct** | Free seller tools: transaction-based valuation, net-proceeds and tax calculator, a spam-free listing with masked number, document-readiness checklist | Low marginal cost; needs SEO/WhatsApp reach | High: owner KYC plus ownership documents | Low volume at first | **P0** |
| **Exclusive or co-broked mandates via verified local dealers** | Dealers bring mandates in exchange for verified buyers, proof of introduction and free tools | Onboarding visits in each society [J: ~1 day per society] | High once the owner confirms the mandate | Dealer cartel resistance | **P0** |
| **RWA partnerships** | A "verified resale programme" for the society: free resident valuation reports, NOC/dues checklist, an RWA notice-board listing feed | Relationship-heavy | High: the RWA confirms dues and NOC process | Conflicts if we pay RWAs; MyGate (27K+ communities, [MyGate](https://mygate.com/)) and NoBrokerHood (25K+) already own the society channel | **P1**; pay nothing per deal until counsel reviews |
| **Developer resale/transfer desks** in completed projects | Developers refer owners who want to exit | Low | High: the developer confirms the allotment chain | Developers may steer buyers to their new launches | **P2** |
| **Portal scraping** | — | — | — | Contract, copyright and DPDP risk (Phase 1) | **Never** |

### 5.2 Verification ladder (shown on every listing)

| Level | Requirement | Who/what checks it |
|---|---|---|
| L0 Claimed | Basic details | — |
| L1 Identity & ownership | Owner e-KYC; ownership document matches the owner (sale deed, allotment/transfer letter); RERA/OC status of the project | AI extraction plus a human spot-check |
| L2 Available | Owner or mandated agent re-confirms on WhatsApp every 14 days; auto-expiry otherwise | Automated |
| L3 Seen | Geo- and time-stamped in-app photos and video, taken by the owner, the agent or our verifier | AI checks EXIF, duplicates and inconsistencies |
| L4 Document pack reviewed | Title chain, dues, society NOC and (for Noida) TM liability reviewed by an empanelled lawyer. **Paid by seller or buyer. We never "certify title"** | Human with liability cover |

### 5.3 Anti-spam lead routing (consent-based, capped)

1. **The buyer chooses the route:** (a) listing owner or listing agent only; (b) one verified agent of the buyer's choice, picked from up to 3 suggested by quality score; (c) our advisor desk.
2. **The seller chooses exposure:** "No brokers", "Up to N verified agents" or "Exclusive with one agent".
3. **Caps.** One contact per listing. No more than 3 parties per buyer per 30 days unless the buyer raises the limit. Leads are **never sold or re-shared**.
4. **Masked relay.** Calls and WhatsApp go through a relay. Brokers get the real number only after the buyer agrees to a visit.
5. **Consent ledger.** Every share is recorded against a stated purpose, can be revoked, and is deleted after the retention period. This covers DPDP. TRAI/DLT and WhatsApp opt-in apply to outbound messages.
6. **Quality-weighted routing.** Response time, re-confirmation compliance and post-visit buyer ratings set eligibility. Payment never does.

### 5.4 Society launch playbook (per society) [J]

Pick 15–25 registry-complete societies on Golf Course Extension Road, Dwarka Expressway and Noida Expressway/GNW. In each: map dealers, sign 2–4, run a resident valuation drive, bring available inventory to L2 within 30 days. Track **verified active listings per society**, **14-day re-confirmation rate** and **contact-to-visit rate**.

---

## 6. Supply-side module specs (MVP vs later)

| Module | P0 (MVP) | P1 (next) | P2 (later) | Platform |
|---|---|---|---|---|
| **Developer portal** | Claim and verify the profile. Project data synced from HARERA/UP RERA (RERA fields read-only). Unit-level inventory and price list with a "price list date". All-in cost sheet. Document vault with provenance labels. Geo-tagged construction updates. Evidence & Reply. Consented lead inbox with an AI qualification summary. Visit calendar | Webhook/API to Salesforce, Sell.Do and LeadSquared. AI progress digest checked against QPR % claims. Basic funnel analytics | Demand-insights reports (aggregated). RERA ad-compliance checker. Multi-project roles | Web |
| **Broker app** | RERA agent number check, PAN/GST and KYC. Mandate-backed listings (owner OTP confirmation). In-app capture with geo/time stamps. CRM-lite on WhatsApp. Co-broking requests. Proof-of-introduction ledger. Commission ledger | AI follow-up assistant (Pro). Earned quality score and badge. Listing kit with labelled staging | Referral marketplace across localities. Team accounts for CP firms | Android first plus a WhatsApp bot; iOS later |
| **Shared lead management** | Consent ledger, masked relay, routing engine with caps, lead-ownership window (first consented introduction owns it for 60 days [J]), dispute flow | Quality-weighted routing | Lead-ownership API for developers' CRMs | Both (backend) |
| **Site-visit scheduling** | Slot booking, WhatsApp reminders, check-in by OTP at the sales gallery or flat plus geo-fence (the billable "verified visit"), post-visit feedback | Pay-per-verified-visit billing. Cab booking via a partner | Virtual visits | Both + WhatsApp |
| **Booking/token flows** | **No money touches us.** New launch: booking only into the developer's **RERA-registered collection account**, checked against the account details in the RERA registration (HARERA Form A-H Part D and UP RERA's project view publish bank, account number and IFSC, per the risk-data notes). Advance capped at 10% before a registered agreement (RERA Act s.13(1); counsel to confirm). Resale: token-agreement template plus a payee name-match check | Resale token through a regulated escrow partner. Developer KYC hand-off | Home-loan sanction inside the booking flow (separate lending-compliance track) | Web + app |
| **Commission settlement** | Deal ledger: milestone status, invoices, TDS/GST, clawbacks | Pass-through to sub-CPs within 7 days of developer payment | Early payout through an NBFC partner | Web + app |

**Hard rules for every module:** labelled AI imagery (IT Rules, Feb 2026); RERA number and QR code on every project surface; audit logs of who supplied each piece of content; no buyer data shared without a purpose-specific consent record.

---

## 7. Pricing hypotheses

| Product | Payer | Hypothesis | Rationale and evidence | Test |
|---|---|---|---|---|
| **New-launch booking fee** | Developer | 1.5–3% of agreement value, on the developer's normal milestone schedule. ≤3% cap, no kickers. 70–80% passed through when a sub-CP is involved | Market CP rates are 1–3%, up to 5% ([Leadrat](https://leadrat.com/channel-partners-in-real-estate-a-complete-2026-guide/)). Effective brokerage is about 2.8–4.6% of bookings at DLF and Signature (§2.2) | Empanel with 5–8 projects in 2 corridors. Measure payout cycle time and clawback rate |
| **Verified site visit** | Developer (mid-size) | ₹2,500–6,000 per unique verified first visit (Gurugram ₹1.5–5 cr; lower in Noida/GNW), credited against the booking fee if the buyer books | Meta ad spend per visit is ₹6,400–8,000 ([Mediaverse](https://www.themediaverse.in/digital-marketing/blog/meta-ads-real-estate-leads-india-site-visit-cost)); visit-to-booking is 15–25% (vendor) | A/B test fee levels with 2–3 developers. Track visit-to-booking against their own channels |
| **AI pre-sales add-on** | Developer | ₹25k–75k per project per month, or ₹10–20 per qualified conversation [J] | Telecallers cost ₹15–25k/month each. Voice AI costs ₹2.7–6/min. LeadSquared is ₹2,500–5,000 per user per month | Pilot one project. Measure speed-to-lead and visit rate against baseline |
| **Developer portal, Evidence & Reply, trust page** | — | **Free, permanently** | Independence (§3) | — |
| **Broker app** | Broker | Free core. Pro ₹999–1,999/month (AI assistant, WhatsApp automation, listing kit). CP-firm teams ₹4,999–9,999/month [J] | Below current portal spend of ₹899–60k/month. Kylas sells a flat ₹12,999 plan with unlimited users and charges ₹25,000 one-time for onboarding ([Kylas](https://www.kylas.io/pricing)) | Track conversion to Pro and retention at month 3 |
| **Resale success fee** | Seller and/or buyer, or the partner broker | Platform-originated buyer to a network listing: 20–25% of the buyer-side fee. Owner-direct deal handled by our desk: 0.75–1% at registration. Broker-to-broker matches: free in year 1 [J] | Dealers charge about 1% + GST per side. Classifieds earn only ₹3k–15k per listing (Phase 1) | Test in 5 societies |
| **L4 document pack** | Seller or buyer | ₹4,999–9,999 per flat [J] | Lawyers review in 2–5 days (Phase 1); NoBroker seller plans cost ₹7,499–20,999 | Willingness-to-pay test at listing time |
| **Demand insights** | Developer | ₹1–3 lakh per report [J] | No evidence | P2 |

---

## 8. Product recommendations

| ID | Recommendation | User/actor | Problem solved | Priority | Platform | Effort | Dependencies/risks |
|---|---|---|---|---|---|---|---|
| S1 | Register as a RERA agent (HARERA, UP RERA) and empanel as CP on 5–8 projects in 2 corridors | Platform, developers | Gives developer revenue a legal basis | P0 | — | S | Counsel memo; PMLA reporting entity |
| S2 | Commission-blind ranking, ≤3% cap and on-page commission disclosure | Buyers, developers | Our own conflict of interest | P0 | Both | S | Must be enforced in code and audited |
| S3 | Score every in-scope project with no opt-out; "Limited history" and "Not cooperating" labels | Developers, buyers | iCIRT-style selective disclosure | P0 | Both | M | Risk-score pipeline |
| S4 | Evidence & Reply portal: claim, evidence provenance, 48h/15-day SLA, 7-day pre-downgrade notice, public dispute log | Developers | Fair process; defamation defence | P0 | Web | M | Legal review of wording |
| S5 | Firewall and governance: separate score team, no sales pre-access, conflicts register, revenue cap of about 10–15% per developer group, annual integrity report | Platform | Credibility | P0 | — | S | Hard for a solo founder; needs an external advisor |
| S6 | Developer portal P0: RERA-synced data, inventory and price list, cost sheet, document vault, construction updates, lead inbox, visit calendar | Developers | Trust deficit; stale data | P0 | Web | L | RERA sync; developer adoption |
| S7 | Free live score widget; static score claims banned in developer terms | Developers (B) | Rating misrepresentation | P1 | Web | S | Enforcement |
| S8 | Consent ledger, masked relay and capped routing engine | Buyers, sellers, brokers | Spam; DPDP | P0 | Both | M | Telephony/WhatsApp provider; TRAI DLT |
| S9 | Verified site visits (OTP + geo check-in) with feedback | Developers, brokers | Attribution; visit fraud | P0 | Both + WhatsApp | M | Sales-gallery cooperation |
| S10 | Booking only into verified RERA collection accounts; 10% advance cap | Buyers, developers | Payment fraud; RERA s.13 | P0 | Web + app | S | RERA account data; counsel |
| S11 | Broker app P0: verified onboarding, mandate-backed listings, WhatsApp CRM-lite, proof-of-introduction ledger | Dealers, CPs | Fake listings; bypass; tool sprawl | P0 | Android + WhatsApp | L | Adoption by dealers in the target societies |
| S12 | Co-broking network with published default splits and enforcement in 15–25 societies | Dealers | Fragmented inventory | P0 | App | M | Dealer cartels; cold start |
| S13 | Resale verification ladder L0–L3 with 14-day re-confirmation | Sellers, buyers | Ghost listings | P0 | Both | M | e-KYC provider; human spot-checks |
| S14 | Owner-direct seller tools (valuation, net proceeds, readiness checklist) as the supply hook | Owners | Pricing, spam, paperwork | P0 | Both | M | Licensed transaction data (seller spec) |
| S15 | Commission ledger across developers (milestones, TDS/GST, clawbacks) | CPs, sub-brokers | Payout opacity | P0 | App + web | M | Developer payout data feed |
| S16 | Sub-CP pass-through within 7 days of developer payment | Sub-CPs | Slow settlement | P1 | App | M | Working capital; accounting |
| S17 | AI follow-up assistant (Broker Pro) | Brokers | Lost follow-ups | P1 | App + WhatsApp | M | WhatsApp template costs; spam guardrails |
| S18 | Earned broker quality score, recomputed monthly | Brokers, buyers | Paying ≠ good | P1 | Both | M | Enough rating volume |
| S19 | AI pre-sales add-on with CRM webhooks | Mid-size developers | Speed-to-lead; telecaller cost | P1 | Web/API + voice | M | Hinglish accuracy; DPDP consent for calls |
| S20 | Pay-per-verified-visit pilot | Mid-size developers | Incremental demand | P1 | Web | S | Pricing; visit fraud |
| S21 | RWA verified-resale programme (no per-deal payments to RWAs) | RWAs, owners | Society supply | P1 | Web + WhatsApp | M | MyGate and NoBrokerHood incumbency; conflicts |
| S22 | L4 lawyer-reviewed document pack | Sellers, buyers | Title and dues risk | P1 | Web | M | Lawyer panel; professional indemnity |
| S23 | Resale escrow token via a regulated partner | Buyers, sellers | Token disputes | P1 | Web + app | M | Escrow partner; RBI rules |
| S24 | Demand insights and RERA ad-compliance checker | Developers, CPs | Product-market fit; fines | P2 | Web | M | Privacy; legal accuracy |
| S25 | Early commission payout via NBFC partner | CPs | Cash flow | P2 | App | L | Lending regulation; credit risk |
| — | **Do not build:** a developer CRM or CP-management SaaS, lead selling, paid placement that hides scores, portal scraping | — | — | — | — | — | — |

---

## 9. Open questions for the founder

1. **Agent or neutral marketplace?** Do we accept developer commissions, with the conflict controls in §3.2, or limit developer revenue to flat, score-independent SaaS? This choice sets our RERA and PMLA exposure and how much buyers trust us.
2. **Bottom-band projects.** Do we sell them, as I recommend (with mandatory risk acknowledgement), or refuse them?
3. **Commission cap.** Is ≤3% with no kickers or trips acceptable, given that it forgoes some revenue?
4. **Revenue concentration cap.** Do we accept capping any developer group at about 10–15% of revenue even early on, when one large partner could be most of our revenue?
5. **Our own buyer desk.** Salaried advisors or broker-network-only? This decides whether brokers see us as partner or competitor in resale.
6. **Field operations.** L3 physical verification and society onboarding need people on the ground. How much will we fund, or should we use verified dealers as our field force?
7. **RWA economics.** May we pay RWAs (society fund contributions)? Counsel and conflict review are needed.
8. **First partners.** Which 5–8 projects (favouring archetype B developers) and which 15–25 societies?
9. **Data shared with developers.** Which buyer fields, at what stage, under what consent? I recommend the minimum, after the buyer opts in.
10. **Governance capacity.** Who staffs the score team and the dispute queue separately from sales in a solo or small-team company? Would an external advisory panel suffice?
