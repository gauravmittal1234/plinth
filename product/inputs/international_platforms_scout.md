# International platforms scout: what to import for an AI-first NCR flat platform

**For:** senior PM (PRD synthesis) · **Role:** international proptech scout · **Date:** 18 Oct 2026 · **Recommendation IDs:** `INT-xx`

**Method.** Builds on Phase 1 research without repeating it; prior findings are cited **[P1-x]** (key at the end). New facts come from newsrooms, investor filings, regulators and analysts, cited **[Sx]**, all accessed 18 Oct 2026 by direct URL fetch (WebSearch was exhausted). Unreachable: PropertyGuru consumer and FastKey pages (Cloudflare challenge, not bypassed); 99.co, Domain, NewHomeSource and KE Holdings IR (403). Gaps are flagged in the text.

**Tags.** **[J]** marks my own judgement. "co." means a company-reported metric that is usually not randomised and often affected by self-selection. Treat these as directional.

---

## 1. Summary

1. **Global leaders make money from trust infrastructure and workflow, not only from traffic.** Rightmove keeps 96% of its estate agents and reports a 69% margin [S39][P1-CB]. Scout24 runs a 63% organic margin in Germany [S71]. Indian portals sell leads with Trustpilot scores of about 1.1 [P1-CB]. The gap is product design, not market size [J].
2. **The single best import is Bayut's two-step TruCheck verification:** documents first, then an in-app photo taken within 500 m of the property. The badge lasts 30 days, shows a timestamp and lifts ranking [S45][S46][S47]. Property Finder's Verified listings get **4x** site-average enquiries (co.) [S54]. Beike treats authentic listings as the precondition for broker cooperation [S60].
3. **Dubai's Project Status service is the closest working analogue to our Delivery Risk product.** The DLD's *Mashrooi* shows each project's completion %, dated inspections with downloadable reports and photos, and the escrow bank [S58]. HARERA quarterly progress reports (QPRs) plus our own photo log can rebuild this for NCR; our score adds the forecast Dubai lacks [J].
4. **Conversational search works when it is grounded in the platform's own data:**
   - Ask Rightmove: **+40% time on site, ~2x lead propensity** [S39]
   - Redfin: conversational-search users favourite, tour and share **~60% more** (co.) [S18]
   - Scout24: AI search interactions up **47x** year on year [S71]

   By contrast, ChatGPT apps did not move Zillow's engagement [S15]. LLM referrals are **<0.5%** of Rightmove traffic and **<1%** of Scout24's [S39][S71].
5. **Owner tools are where seller supply comes from:**
   - REA's Property Owner Dashboard generates **more than half** of its 100,000+ annual seller leads and tracks 5.2M homes [S43].
   - Rightmove's Online Agent Valuation drove **~50% more** valuation leads [S39].
   - Bayut turned one-off TruEstimate valuations into a tracked Portfolio [S50].
6. **Beike's Agent Cooperation Network (ACN) shows how to work with brokers rather than against them:**
   - Commission is split automatically by each agent's role in the deal.
   - Stores hold listing rights in their vicinity.
   - A behaviour-based Beike score governs access.
   - Platform fees are about **0.37% of the GTV handled by connected agents** [S60].

   We should copy this as a light co-broking ledger, not as a franchise [J].
7. **Disclosure standards beat scores for title and legal risk.**
   - The UK's Material Information Parts A/B/C make portals flag empty fields [S40].
   - Victoria's Property Price Statement (from 1 Oct 2026) requires the 3 closest comparable sales, the suburb median and a price range of no more than 10%, and publishes the final sale price [S44].
   - Both translate directly into an NCR listing standard.
8. **Financing at the point of search is now standard in the US.** Zillow links BuyAbility and Verified Pre-approval to search, so each listing shows whether it fits the buyer's budget (only 28% of buyers are pre-approved before they search) [S9]. Redfin shows buying-power bands and bundles Rocket's 1% rate cut [S24][S27]. In India, lending is where the money is [P1-R].
9. **Business-model warnings:**
   - **Buying homes for resale failed.** Zillow Offers lost $420M in one quarter. Opendoor lost $1.3B in FY2025 [P1-BM].
   - **Standalone developer software failed.** PropertyGuru shut down its FastKey developer-sales software in 2023 over unit economics [S63].
   - **Seller-pays pricing can overreach.** Only 82% of Swedish sales appeared on Hemnet in 2025 (down from about 90%), and Hemnet introduced "Sell first, pay later" [S69][S70].
10. **Do not import:**
    - buying homes on our own balance sheet
    - modelled hazard or crime scores that are not backed by lived evidence
    - badges or ratings paid for by the rated party
    - hidden referral-fee steering (a Zillow class action alleges it takes up to 40% of commissions) [S16]
    - 3D capture locked to one vendor (Zillow pulled Matterport tours after CoStar bought Matterport) [S35]

---

## 2. Platform-by-platform feature notes

### 2.1 United States

**Zillow** is a marketplace with 235M average monthly users. It makes money from agent advertising and referral programmes, Showcase subscriptions, mortgages and rentals. Q3 2025 revenue was $676M (+16%). Mortgage revenue rose 36% as purchase loan originations grew 57% to $1.3B [S11][S13].

| Feature (launch) | What it does | Evidence | India adaptation |
|---|---|---|---|
| Zestimate | Value estimate for every US home; Zillow publishes its error | ~2% median error on-market, ~7% off-market [P1-VD] | Show a range and the published median error by micro-market. Refuse to estimate where data is thin. Deed under-declaration means NCR errors will be wider [P1-VD]. |
| Showcase (2023) | Premium listing: AI room tagging, interactive floor plan, high-resolution media, agent branding. Agents pay a subscription. Capped at **≤10% of listings per market** [S3] | co.: **75% more views, 68% more saves**, 2% higher sale price, 20% more likely to have an offer accepted within 14 days [S2]. Agents using it on more than half their listings win 30% more listings. 50+ brokerage deals [S3] | Sell a "Showcase" tier to brokers and sellers. Generate floor plans from phone video. Cap it per society to keep it scarce. Seller performance reports drive broker retention [S6] |
| SkyTour (Jul 2025), Virtual Staging (Sep 2025) | Gaussian-splat aerial tours built from drone footage. One-tap AI restyle or furniture removal on Showcase photos (from the Virtual Staging AI acquisition, Oct 2024) | co.: Showcase homes sell for $7,000 more [S4][S5] | Staging is a founder priority. For empty NCR resale flats, offer it with an **AI-generated label** (IT Rules Feb 2026) and an original/staged toggle |
| Natural-language search (Sep 2024), **AI mode** (beta Mar 2026), ChatGPT app (Oct 2025) | Search by commute, budget, school or point of interest. AI mode remembers preferences, estimates repair costs, explains price cuts and books tours [S1][S8][S7] | ChatGPT app: "haven't seen a number change" [S15] | Build grounded Hinglish search on web, app and WhatsApp first. A ChatGPT app is a cheap later add-on |
| BuyAbility, Verified Pre-approval, buyer hub (Jun 2026) | Pre-approval tied to search. Each listing shows whether it fits, including taxes, insurance, HOA and closing costs. A hub tracks 4 milestones. A shared collection serves co-buyers [S9] | 28% of financing buyers are pre-approved before searching [S9] | Show affordability bands with **total cost** (stamp duty, GST, registration, PLC, maintenance). Add a family shared shortlist on WhatsApp |
| Zillow Pro, Follow Up Boss, My Agent (Oct 2025; national Jul 2026) | Agent CRM (acquired Nov 2023) enriched with what consented clients do on Zillow. Includes an AI "Likely to List" tag and AI-drafted outreach [S10][S11] | ~20,000 beta agents. Pro members' buyers are 80% more likely to meet face to face (co.; Zillow footnotes intent bias) [S11] | Broker CRM with buyer activity shared **only with explicit consent** (DPDP, in full force from May 2027) |
| Zillow Preview (Jun 2026) | Pre-market listings shown in every search with a label. Sellers see views, saves and tour requests. 1,200+ brokers; live on Realtor.com since 17 Sep 2026 [S9][S14] | Zillow research claims private-network sellers net 1.5% less [S9] | A time-boxed "Coming soon" open to all verified buyers (INT-21) |
| Offer Insights (Jul 2025) | Estimated chance that an offer at a given price is accepted [S5] | None published | P2. NCR negotiation data is thin |
| Fair Housing Classifier (May 2024, open source) | Flags steering on protected characteristics in AI conversations [S12] | Released openly | Adapt to Indian exclusion language (religion, caste, diet, marital status) [J] |
| Climate scores (Sep 2024 → removed Nov 2025) | First Street flood and fire scores | Removed after the California Regional MLS (CRMLS) objected and a seller sued [P1-LR] | Lead with dated events, not models (INT-23) |

**Redfin** is a brokerage plus portal, owned by Rocket since Jul 2025.

| Feature | What it does | Evidence | India adaptation |
|---|---|---|---|
| Conversational search (web Nov 2025; iOS Jan 2026; built on Sierra; any language) [S17][S18] | Back-and-forth refinement; suggests widening when nothing matches | Half of queries include a non-filter attribute. Users favourite, tour and share ~60% more (co.) [S18] | Hinglish. NCR's non-filter attributes: loading %, registry status, facing, sunlight |
| Ask Redfin (2024) | Listing-page Q&A with agent handoff [S20] | 59% of questions are about the property; ~1 in 10 ask for an agent; 8% request a tour; 93% return within a week. Refuses fair-housing questions | "Ask this flat" (INT-10) |
| Redfin Redesign (Dec 2023, Roomvo) | Restyles floors, walls and counters in photos; 75k listings [S21] | None | Fold into staging |
| Data layers | Flood randomised trial: buyers shifted to homes with 54% less risk [P1-ABRS]. Sunscore 0–100 (May 2026) [S22]. Weather (Jul 2026) [S23] | Randomised (flood only) | Sunlight by tower/floor/facing; air quality; dated waterlogging events |
| Buying-power bands (Nov 2025) | Debt-to-income: Affordable ≤36%, Stretch 37–50%, Ambitious >50% [S24] | None | FOIR-style bands Indian lenders recognise |
| Redfin Next (Oct 2023); Rocket bundle (Jul 2025) | Salaried agents moved to splits up to 75% [S25]. 1% lower rate in year 1 or $6,000 credit with Rocket [S27] | Average agent income $138,800 (+14%) (co.) [S26] | Work with independent brokers; partner-bank perks for platform-closed deals |
| Seller choice | With Compass (Feb 2026): list with no days on market, price history or valuation [S28]; CRMLS "Limited Exposure Coming Soon" [S29] | None | Caution: conflicts with our transparency principle |
| New-construction community pages (Nov 2023) | Units shown as available, nearly complete or buildable plan [S30] | None | Availability states (INT-20) |

Redfin Estimate errors: 1.98% on-market, 7.72% off-market [P1-VD].

**Compass and private exclusives.** A typical exclusive stays off-market 2–3 weeks; 94% later reach the MLS; 55% of new listings opted in during Feb 2025. With an 82/18 agent split, a 1-point shift is worth $56M to Compass (DelPrete's estimate) [S31]. "Address Upon Request" (Jan 2026) hides the address so buyers must call the listing agent [S32]. Compass sued Zillow in Jun 2025 over its ban on privately pre-marketed listings [S16]; Zillow warns private listings reinforce segregation [S77]. **India [J]:** NCR brokers already hoard listings in WhatsApp groups. Our job is consented, verified visibility, not more private networks.

**Other US players.**
- **Realtor.com.** Shows First Street climate factors [P1-ABRS] and carries Zillow Preview [S14]. Nothing unique to import.
- **Opendoor and Zillow Offers.** See §4–5 [P1-BM].
- **Homebot.** White-label home-finance digests that lenders and agents send past clients, flagging likely movers [S38]. No public metrics. **India:** a monthly WhatsApp value and EMI digest funded by a bank or HFC partner [J].
- **Ribbon and Flyhomes (buy-before-you-sell).** Ribbon retired its iBuyer programmes and Hurst Lending bought its assets [S37]. Flyhomes closed direct mortgages (2024), left brokerage (2025) and now sells bridge loans wholesale [S36]. It survives only as a lender's product.
- **Matterport.** CoStar bought it (closed Feb 2025): 2024 revenue $169.7M, 1.2M subscribers, two price rises. Zillow removed Matterport tours on 20 Oct 2025 after a licensing dispute [S35]. Keep capture tooling in-house.
- **Google** tested for-sale listings with agent contact in mobile search in Dec 2025 [S33]. Make listing pages structured and indexable [J].

### 2.2 United Kingdom

**Rightmove** (H1 2026 results) [S39]

| Feature | Evidence | Business model | India adaptation |
|---|---|---|---|
| **Ask Rightmove** (AI search assistant plus evaluation assistant) | ~40% more time on site, ~2x lead propensity. Even higher when both assistants are used | Lifts lead value; supports price rises | Benchmark for our conversational search (INT-09) |
| **Online Agent Valuation** | ~50% more unique valuation leads; "fastest-ever revenue growth from a new product" | Agents pay for seller (valuation) leads | Owner tools that route seller leads to verified brokers (INT-06) |
| Tiered packages: Optimiser Edge (agents), Ascend (developers) | Optimiser Edge: 36% of independent agents. Ascend: 36% of developments. Products per branch +14% | Average revenue per advertiser (ARPA) £1,726/month (+7%). Agency £1,636; New Homes £2,247. 16,591 agency branches; agency retention **96%** | Tiered broker plans sold on outcomes, not lead counts |
| New Homes tools: Development Profiles, Virtual Tour Request, Interactive Brochure, Showcase Carousel | More than 50% of leads book an appointment or share availability | Developer subscriptions | Developer project pages (INT-20) |
| Rightmove Plus and Hub; mortgage in principle; Equity Tracker; Enhanced Leads for rentals | Rental Services revenue +67% (4m Enhanced Leads) | Workflow lock-in; financial services | Broker workspace; loan sanction (INT-14) |
| Agent-only listings | — | Avoids owner/broker confusion [P1-CB] | **Do not copy** (§5). NCR owners matter |

**Material Information (National Trading Standards).** Consumer-protection law requires disclosure in three parts: A (council tax, price, tenure), B (type, construction, utilities, parking; every listing) and C (flood, covenants; where relevant). Portals show these as fields and **flag empty ones** with an explanation; 91% of agents supported a defined list [S40]. **India:** an "NCR Material Information" schema (INT-03): RERA ID, OC/CC, registry or transfer memorandum (TM) status, carpet vs super area and loading %, authority dues, society NOC, power backup, water, parking, maintenance.

**Zoopla (Houseful)** owns the portal plus Hometrack valuations, Alto agent CRM and Mojo Mortgages [S41]: the vertical data-plus-CRM pattern. **OnTheMarket**, an agent-owned portal (2015) whose "one other portal" rule was upheld in court, sold to CoStar for £99M in 2023 [S42]. A broker cooperative alone does not displace an incumbent.

### 2.3 Australia

**REA Group (realestate.com.au)**, FY26: revenue A$1,793M (+7%), EBITDA A$1,088M [S43].

| Feature | Evidence | Model | India adaptation |
|---|---|---|---|
| **Property Owner Dashboard** with realEstimate; AI conversation to explain the estimate | More than half of seller leads come from the dashboard. 100,000+ seller leads (+22%). 5.2M homes tracked by owners (+15%). Dashboard visits +50% | Seller leads sold to agents | INT-06 |
| Conversational search; AI property highlights on every listing; AI market summary; social-style video feed | "Encourages high-value actions" (no number given) | Engagement | Hinglish AI summary of each listing |
| **Ignite** agent platform with *Campaign Assist* chat (consumer intent plus PropTrack AVM) | Monthly active Ignite users +17% | Included with subscriptions | AI listing coach in the broker app |
| Premiere+ and Luxe (premium listings, paid by the seller via the agent) | Luxe: 48% more high-value interactions | Seller-paid "depth" pricing; yield up ~15%/yr over 5 years [S34] | Premium tier (INT-17) |
| Pro subscription | Agents on Pro get **88% more seller leads** | Agency subscription | Broker tiers tied to seller leads |
| Mortgage Choice broking; CampaignAgent (vendor "PayLater" advertising finance) | A$27bn in loans settled (+13%). PayLater funding +12% | Finance revenue | Loan partnerships; pay-on-success (INT-18) |
| Acquisitions: iGUIDE (AI 3D tours, 61.5%); stake in Before You Buy (due-diligence marketplace) | — | Immersion plus due diligence | Partner for due-diligence reports |

REA also sold Housing.com to Aurum in Jul 2026, its exit from India [S43].

**Victoria's Property Price Statement (from 1 Oct 2026)** [S44]: prices must be a single figure or a range of at most 10%, with no "from", "offers above" or "+". Each statement shows the 3 most comparable sales and the suburb median; the reserve is disclosed 7 days before auction; the final sold price is published. **India:** a "Price Fairness card" (INT-04) and no "₹1.2 cr onwards" pricing.

**Domain** was bought by CoStar in 2025; REA led on revenue A$1.3bn vs A$374M in FY24 [S34]. NSW iCIRT: see [P1-RP].

### 2.4 Middle East

**Bayut (UAE)** has more than 3,500 agencies [S53].

| Feature | Mechanics | Evidence | India adaptation |
|---|---|---|---|
| **TruCheck™** (since 2019) | Step 1 "Checked": the broker uploads the title deed, owner ID and validation form (or Dubai Form A). Step 2: the broker visits and photographs the property through the Profolio app, which only opens the camera **within 500 m**. Apartments need the door open with the flat number visible. Bayut's QA team reviews. The badge is **valid 30 days** and timestamped. Verified listings rank higher, including above paid "Signature/Hot" listings without the badge [S45][S46][S47] | co.: 20x impressions, 5x leads [P1-BM] | INT-01. Ownership docs = sale deed, allotment letter or builder–buyer agreement. Owner KYC through a vendor. Show the tower and flat plate in the capture |
| **TruBroker™** | Awarded to brokers who earn both the "Responsive Broker" and "Quality Lister" badges. Agent reviews. Weekly area rankings [S48] | — | INT-12 |
| Listing Quality Score | Green/amber/red rating that drives rank [S47] | — | Score shown in the broker app |
| **TruEstimate™** | Valuation from DLD data, looked up by title deed, Oqood or unit number. Shows rental yield and comparables. Report shareable on **WhatsApp**/PDF. Change alerts. Portfolio tracking (Dec 2025) [S49][S50] | — | INT-05 and INT-06 |
| **Dubai Transactions** | DLD sales and rental records by building, with unit, floor, price and date, on a map [S51]. Built on a 2022 MoU with DLD [P1-CB] | — | INT-04, using licensed registry data |
| BayutGPT (Sep 2023); Search 2.0 (commute time) | Area prices, rents and yields; recommendations of verified listings [S52][S53] | — | Grounded assistant |

**Property Finder** (UAE/GCC):
- **Verified Listings** (Dubai 2015; 140,000 verified by 2019): a team checks documents for price, area, availability and the agent's authority to market. Verified listings get **4x enquiries** (co.) [S54].
- **SuperAgent** (2022): "100% automated", data-based selection for responsiveness and listing quality [S55]. Agents report it requires proof of direct contact with the seller [S56].
- **Data Guru**: price map, community insights, buy-vs-rent calculator and building-level "residential insights" [S57].

**Dubai Land Department (DLD), the regulator.**
- **Project Status (*Mashrooi*)**, also in the Dubai REST app [S58], shows completion % at each inspection vs the previous one, downloadable inspection reports and photos, the escrow bank, and the developer and management company.
- Public lists of licensed brokers and approved developers, plus title-deed verification [S58].
- Structural protections: 100% off-plan escrow (Law 8 of 2007) [P1-RP]; a tribunal for cancelled projects, with full refunds when projects never start (Decree 33 of 2020) [S59].

**India [J]:** HARERA QPRs give quarterly % complete plus escrow and collections data. UP RERA data is usable [P1-R]. We can replicate Mashrooi, add our own geotagged photo log, and lay the risk forecast on top (INT-07).

### 2.5 Asia

**Beike/Lianjia (China).** FY2025: GTV RMB3,183bn (existing homes 2,152bn; new homes 891bn); revenue RMB94.6bn; 61,139 stores; 523,009 agents (445,632 active) [S61].

| Feature | Mechanics [S60] | Evidence | India adaptation |
|---|---|---|---|
| **Agent Cooperation Network (ACN)** | A deal is split into steps. Agents from different brands and stores share commission **"allocated automatically based on agents' various roles… not based on negotiations."** A store "has the right to manage existing home listings in vicinity." Buy-side agents earn a share for referring clients to agents in other regions. Penalises off-platform deals and client poaching | "Five or more agents collaborate in a housing transaction" [S62]. Platform fees from connected agents: RMB5.0bn on RMB1,349bn GTV (~0.37%) | INT-16. Start with 2–4 roles (listing, buyer, field visit, documentation). Platform fee taken at token. Must not fix commission *rates* (see the Idealista competition case below) [J] |
| **Authentic listings** | Verified through customer callbacks, physical visits and AI. "The foundation of agent cooperation" | Lianjia slogan: "true listings" [S67-zh] | INT-01 and INT-02 |
| **Housing Dictionary** (from 2008) | Neighbourhood → building → floor → room database. ~**303M properties** (2025), up from 226M in 2020. Agents submit corrections; used to verify listings and value homes [S60][S62] | — | An NCR "Society Dictionary": tower, floor plan, carpet/super area, RERA ID, OC dates. Build it per launch corridor (INT-05) |
| Beike score | Agent performance and service score that gates privileges [S60] | — | INT-12 |
| RealSee VR | 3D walkthrough with live agent narration; sessions recorded for coaching | — | P2 VR co-viewing for NRIs (INT-25) |
| eHomePay escrow, Lucky Sign signing centres, NTS | Licensed escrow (People's Bank of China) releases funds when title clears. Standardised, documented signing [S60] | — | INT-24 via a bank partner, not a licence |
| AI | Home-search assistant moving "from information retrieval to decision support". AI CRM. AI agents for new-home business development [S60] | — | Same direction as ours |

**PropertyGuru (SG/MY)** [S63][S64][S65]:
- Launched GuruPicks (an ML-personalised feed) and an AI image-moderation engine in 2023.
- ARPA was S$1,256 (+25%) across 16,095 Singapore agents.
- **FastKey**, launched as a "developer sales enablement platform", was **shut down in Aug 2023**, along with the Indonesian marketplace, to focus on "businesses with strong unit economics."
- The current portfolio covers DataSense (data), AgentNet and PropertyGuru Finance.
- **Gaps:** Home Valuation and AI search detail (sites behind Cloudflare). EQT take-private terms not verified this session.

**Other Asian players.**
- **SUUMO (Japan)** combines online, print and **in-person consultation counters** [S66]: a possible developer-funded advice model for NCR launches, but operations-heavy [J].
- **Korea.** Zigbang ("directly taken room photos") moved into apartments (2016) and new sales (2018) and bought the price-data app Hogangnono [S67]. KISO, an industry self-regulation body, runs listing-verification and "clean listing" centres used by portals [S68] (method not retrieved). Verification can be an industry utility.
- **99.co** returned 403 and is not covered. **Lamudi** has nothing distinctive to import.

### 2.6 Europe and Latin America

**Hemnet (Sweden; the seller pays)** [S69][S70]. About 40M monthly sessions; 97% awareness among sellers. Average revenue per paid listing (ARPL) was SEK 9,095 (+12.4%), driven by Premium upsells. But only **82% of 2025 sales were ever advertised on Hemnet** (SCB), down from about 90%, and Hemnet is "not satisfied." It responded with **"Sell first, pay later"** (chosen by **40–45%** of sellers) and **"Under the Radar"** (logged-in users see homes before public launch). Q2 2026 net sales fell 23% as revenue moved to the point of sale. Hemnet also pays agents "administration and commission compensation" (SEK 99.7M in the quarter) for selling its packages.

**Scout24/ImmoScout24 (Germany)** [S71][S72]. Professional ARPU €1,224/month (+10.4%) across 24,525 customers. **ImmoPoints** credits unlock AI features (used by ~60% of business customers). More than **500,000 consumer subscribers** (tenant networks, waiting lists, SCHUFA credit self-checks). HeyImmo AI search hit 3.3M interactions in Jun 2026. Strategy: an "Agentic OS"; Propstack CRM AI-feature users doubled.

**Idealista (Spain).**
- Cinven bought 70% in Dec 2024. Idealista bought Certicalia (property certificates and technical paperwork) in Jul 2025.
- In 2021 the competition authority (CNMC) sanctioned agency networks for anticompetitive conduct facilitated through CRM software. Idealista was named in the case as a CRM operator [S73].
- **Lesson for any ACN-style ledger [J]:** set the split *rules*, never common commission *levels*.

**Funda (Netherlands).** Majority-owned by the agents' association NVM (71%); General Atlantic bought 24% in Feb 2024; 4.6M monthly unique visitors [S74]. A broker-owned portal *can* lead.

**QuintoAndar (Brazil).**
- Guarantees landlords their rent even if the tenant defaults; tenants need no guarantor or deposit.
- Manages more than 350,000 rental contracts (Jul 2026).
- Its sales business provides document specialists and free financing advice.
- Valued at US$5.1bn [S75].

**Loft (Brazil).** Not reachable this session.

### 2.7 Off-plan and new-development specialists

| Mechanism | Where | What buyers get | India note |
|---|---|---|---|
| Inspection-based progress, escrow bank, developer file | Dubai Mashrooi [S58] | Verifiable % complete over time | Best template for our Project Status page (INT-07) |
| 100% off-plan escrow; tribunal for cancelled projects | Dubai [P1-RP][S59] | Structural protection | India's RERA requires 70% escrow. Escrow compliance and withdrawals should be score inputs [P1-RP] |
| Project "whitelist" and presale controls | China [P1-RP] | Completion finance for compliant projects | Sales rank is not safety: cap brand weight [P1-RP] |
| Developer rating (pass mark 3★, developer pays) | NSW iCIRT [P1-RP] | Developer screen | Avoid developer-pays; rate every project [P1-LR] |
| Development profiles, virtual tour and brochure requests | Rightmove New Homes [S39] | Higher-intent leads | INT-20 |
| Unit states: available / nearly complete / buildable | Redfin and Zillow [S30] | Clear timing | Show RERA possession date vs a modelled range |

NewHomeSource was blocked (403). No US builder-delivery-risk product was found. The gap is real, and it is ours to fill [J].

---

## 3. Import list: the top 20

Ranking weighs four things: buyer or seller value in NCR; fit with the founder's non-negotiables; feasibility for a small team; and evidence strength [J]. P0 = MVP, P1 = next, P2 = later.

| # | Import (source pattern) | Why it ranks here | Priority |
|---|---|---|---|
| 1 | **Two-step "Verified & Available" badge** with 30-day expiry and timestamp (Bayut TruCheck, Property Finder Verified, Beike authentic listings) | Fixes the #1 NCR complaint (ghost listings). The evidence (4x enquiries) is the strongest of any trust feature. Makes trust the ranking currency | P0 |
| 2 | **Project Status page plus Delivery Risk band** (DLD Mashrooi, iCIRT, Redfin risk display) | The founder's core differentiator. A proven government UX for inspection-based progress | P0 |
| 3 | **NCR Material Information standard** with flagged blanks (UK NTS) | Cheap. Makes missing OC, registry or TM data *visible*, which is the main resale trap [P1-R] | P0 |
| 4 | **Price Fairness card**: 3 comparables, society median, ≤10% price range (Victoria PPS, Bayut Transactions, Rightmove sold prices) | No incumbent shows transaction-backed prices credibly [P1-CB] | P0 |
| 5 | **AVM with published error and range** (Zestimate, Redfin, TruEstimate) | Underpins price fairness, seller leads and future-value features | P0 |
| 6 | **Grounded Hinglish conversational search plus "Ask this flat"** (Ask Rightmove, Redfin, Ask Redfin, BayutGPT, HeyImmo) | The best-measured AI uplift (+40% time on site, 2x leads). Visible AI from day one | P0 |
| 7 | **Labelled AI virtual staging** for empty resale flats (Zillow Virtual Staging, Redfin Redesign) | Founder priority. Zillow ties it to premium listings ($7k uplift, co.). Low cost | P0 |
| 8 | **Measured broker-quality badge** (TruBroker, SuperAgent, Beike score) | Lets us work with brokers while protecting buyers. Responsiveness is measurable from day one | P0 (responsiveness), P1 (full) |
| 9 | **Affordability bands and total cost** at every listing (BuyAbility, Redfin buying power) | Neglected buyer question. Feeds loan monetisation | P0 |
| 10 | **Owner Dashboard plus WhatsApp value digest** routing seller leads (REA, Rightmove OAV, TruEstimate Portfolio, Homebot) | Supply engine: >50% of REA's seller leads | P1 |
| 11 | **Bank in-principle sanction and loan referral** (Zillow Home Loans, Rocket, Mortgage Choice) | Where the money is [P1-R]. US and AU proof | P1 |
| 12 | **Deal Room**: milestones from token to registry, document checklist, family sharing (Zillow hub, Beike NTS) | Targets post-enquiry abandonment [P1-CB] | P1 (shortlist sharing is P0) |
| 13 | **Co-broking ledger with role-based automatic split** (Beike ACN) | Turns brokers from adversaries into supply partners. Long-term moat | P1 |
| 14 | **Showcase premium tier** with seller performance report and per-society cap (Zillow Showcase, REA Premiere+ and Luxe) | Proven monetisation that improves quality | P1 |
| 15 | **Pay-on-success seller pricing** (Hemnet Sell first pay later, CampaignAgent) | Answers refund disputes and seller distrust [P1-CB] | P1 |
| 16 | **Broker CRM with consented buyer signals and "likely to sell"** (Zillow Pro/Follow Up Boss, Bayut SmartLeads, REA Campaign Assist) | Retention and willingness to pay for brokers | P1 |
| 17 | **Developer project pages**: availability states, tour and brochure requests, AI pre-sales qualification (Rightmove New Homes, Beike AI agents) | Developer revenue without selling raw leads | P1 |
| 18 | **Fair-listing classifier** for listings and AI answers (Zillow open source) | Cheap. Protects the brand. Discriminatory listing language is common in NCR rentals and resale [J] | P1 |
| 19 | **Living-conditions layer**: sunlight, air quality, documented waterlogging (Redfin Sunscore, weather, flood) | Differentiating, evidence-first, avoids the Zillow climate backlash | P1 |
| 20 | **Token escrow via bank partner** (Beike eHomePay, Dubai escrow) | High trust value, but needs a partner and legal work | P2 |

Just outside the 20: pre-market "Coming soon" (INT-21), 3D/VR co-viewing, market index reports, Offer Insights and a ChatGPT app.

---

## 4. Business-model lessons

| Lesson | Evidence | Implication for us [J] |
|---|---|---|
| **Seller-pays works when the portal *is* the market, but overpricing pushes sales off-portal** | Hemnet: ARPL +12%, but the share of sales on Hemnet fell to 82%. Moved to deferred payment, with 40–45% uptake [S69]. REA yield +15%/yr [S34] | Keep the base listing free. Charge sellers on success (at registry), or sell premium depth. Never gate visibility |
| **Agent subscriptions grow through products, not lead counts** | Rightmove ARPA +7%, product-led; 96% retention [S39]. Scout24 ARPU +10%; ImmoPoints [S71]. REA Pro brokers get 88% more seller leads [S43] | Price broker plans on tools that win *mandates* (valuation leads, Showcase, CRM), not on "leads delivered" |
| **Cooperation platforms take a small cut of a large GTV** | Beike: platform fees ~0.37% of connected-agent GTV, vs ~2.5% gross commission (RMB20.0bn on RMB802bn) at its own Lianjia brand [S60] | On a ₹1.5 cr resale (brokers charge ~1% per side [P1-R]), a 10–15% platform share of commission is about ₹15–22k per side. That needs volume and enforcement against off-platform deals |
| **Verification as ranking currency, premium boosts on top** | Bayut: verified Signature/Hot listings outrank unverified ones. Property Finder's verification is free [S47][S54] | Verification is free and mandatory for top placement. Charge for Showcase, never for the badge |
| **Owner engagement is the seller-lead engine** | REA: >50% of seller leads from the Owner Dashboard. Rightmove OAV delivered its "fastest-ever revenue growth from a new product" [S43][S39] | Seller leads to verified brokers are our first B2B revenue line, with no spam to buyers |
| **Bundled finance** | Zillow mortgages +36%. Redfin + Rocket rate cut. REA A$27bn settled [S13][S27][S43] | Home-loan referral or DSA income is the earliest transaction revenue |
| **Referral-fee models invite steering claims** | Class action alleging Zillow takes up to 40% of commissions [S16] | Disclose who pays us. Always show the listing broker's contact |
| **Holding inventory destroys capital** | Zillow Offers lost $420M in Q3 2021. Opendoor FY2025: contribution margin 3.4%, net loss $1.3B [P1-BM]. Ribbon and Flyhomes retreated [S36][S37] | No buying homes. Offer "instant estimate" only |
| **Employed-agent models revert to splits** | Redfin moved from salaries to splits up to 75% [S25]. Purplebricks [P1-BM] | Partner with independent brokers. Don't employ a sales force |
| **Exclusive inventory is broker leverage** | Compass: 55% opt-in; a 1-point split shift is worth $56M [S31] | Offer brokers *better* exposure via verified, consented pre-market (INT-21), not exclusivity |
| **Standalone developer software fails** | PropertyGuru shut FastKey down in 2023 [S63] | Developer tools must ride on our verified demand |
| **Broker-owned portals: mixed record** | Funda (NVM 71%) leads [S74]. OnTheMarket sold for £99M [S42] | Partner with broker associations for supply, but don't depend on exclusivity rules |
| **Consumer subscriptions can work in tight markets** | Scout24 has 500k+ consumer subscribers [S72] | Later: paid NRI or premium due-diligence packs, not paid search |
| **Own the data and workflow layer** | Houseful (Hometrack, Alto); Scout24 (Propstack, valuations); Idealista (Certicalia) [S41][S71][S73] | Build the Society Dictionary and broker CRM in-house. They are the moat |

---

## 5. Do-not-import list

| Do not import | Why | What to do instead |
|---|---|---|
| Buying homes or instant cash offers on our balance sheet | Large losses (§4). Capital-heavy for a solo founder | Instant *estimate*, then a verified broker |
| Buy-before-you-sell or bridge loans as principal | Both US providers retreated to wholesale lending [S36][S37] | Refer to a bank or NBFC bridge product (P2) |
| Modelled hazard scores without lived evidence | Zillow removed climate scores after CRMLS objected and a seller sued [P1-LR] | Dated, sourced events first; model second |
| Crime or neighbourhood-composition scores | Bias concerns led Redfin and Realtor.com to drop crime data [P1-ABRS]. Caste and religion proxy risk in India | Facilities, commute, air quality, documented civic issues |
| Ratings or badges paid for by the rated party | iCIRT is developer-paid; HBF stars inflated [P1-RP] | Rate every in-scope project. No pay-to-influence |
| Private exclusive networks that withhold inventory | Segregation and price concerns [S77][S9]. NCR already suffers from WhatsApp hoarding | Time-boxed pre-market, visible to all verified buyers |
| Agent-only listings (Rightmove) | NCR owners are key supply. Brokers posing as owners is the actual problem | Separate, labelled owner and broker feeds plus mandate proof |
| Standalone developer CRM software | FastKey failure [S63] | Developer tools bundled with demand |
| One vendor's 3D hardware or format | Matterport lock-in; Zillow removal [S35] | Phone video, floor plans and splats generated in-house |
| A ChatGPT app as a P0 growth channel | No engagement change at Zillow; LLM referrals <1% [S15][S39][S71] | Build later and cheaply (P2) |
| Paid consumer search subscriptions | Only works in rental shortage markets [S72] | Free search; paid reports later |
| Rent guarantees (QuintoAndar) | Credit risk; not our segment | Out of scope |
| Our own payments or escrow licence | Beike's eHomePay needs a central-bank licence [S60] | Bank-partner escrow (INT-24) |
| Hiding price history or days on market for sellers | Redfin/Compass "seller choice" [S28] erodes buyer trust | Show history; let sellers add context |

---

## 6. Product recommendations

Effort: **S** ≤ 2 engineer-weeks; **M** 1–2 months; **L** a quarter or more [J].

| ID | Recommendation | User/actor | Problem solved | Priority | Platform | Effort | Dependencies / risks |
|---|---|---|---|---|---|---|---|
| INT-01 | Two-step "Verified & Available" badge: (1) documents plus owner KYC; (2) geofenced in-app photo or video of door/tower plate. 30-day validity, timestamp, ranking boost | Buyer, owner, broker | Ghost listings; brokers posing as owners | P0 | Both (capture in app) | M | KYC vendor; document parsing (sale deed, allotment, RERA). Fake documents; broker pushback; DPDP consent for KYC data |
| INT-02 | Freshness engine: WhatsApp "still available?" ping every 7–14 days; auto-hide when there is no reply | Buyer, broker | Stale listings | P0 | WhatsApp | S | WhatsApp Business API costs; message fatigue |
| INT-03 | NCR Material Information schema (A: price, area basis, RERA; B: OC/CC, registry/TM, parking, power, water, maintenance; C: dues, litigation, waterlogging). Blanks flagged | Buyer, seller | Hidden title and registry traps | P0 | Both | S–M | Legal review of wording; seller drop-off from friction |
| INT-04 | Price Fairness card: 3 comparables, society median, sample size, confidence. Single price or ≤10% range; ban "onwards" | Buyer, seller | Overpaying; vague pricing | P0 | Both | M | Licensed registry data (PropEquity or Liases Foras) [P1-R]; under-declared deeds; broker backlash |
| INT-05 | Society Dictionary plus AVM with range and published median error per micro-market. Refuse to estimate when data is thin | All | Pricing guesswork | P0 | Both | L | Data cleaning (carpet vs super area); accuracy disclosure; no "certified value" claims |
| INT-06 | Owner Dashboard: track value and rental yield; monthly WhatsApp digest; "get a verified broker" seller lead | Owner, broker | Seller supply; seller spam | P1 | App + WhatsApp | M | Depends on INT-05; DPDP consent; lead caps |
| INT-07 | Project Status page: QPR % complete vs RERA timeline, escrow and collections, extensions, complaints, our dated photo log, "last synced" stamp, Delivery Risk band | Under-construction buyer | Delay and stall anxiety | P0 | Both | L | HARERA/UP RERA scraping; methodology and right of reply; defamation [P1-LR] |
| INT-08 | Project Watch alerts on QPR change, new complaint, extension, missed milestone | Under-construction buyer, NRI | Silent stalls | P0 | WhatsApp + app | S–M | Depends on INT-07; false-alarm tuning |
| INT-09 | Grounded Hinglish conversational search with non-filter attributes; answers only from platform data, with citations | Buyer | Filter-based search fails NCR needs | P0 | Both + WhatsApp | M | LLM cost; hallucination guardrails; voice later |
| INT-10 | "Ask this flat" listing Q&A with handoff to owner or broker, and fair-listing guardrails | Buyer | Unanswered basic questions | P0 | Both | S–M | Listing data completeness (INT-03) |
| INT-11 | Labelled AI virtual staging and declutter, with original/staged toggle | Buyer, seller | Empty flats are hard to picture | P0 | Both | S–M | IT Rules labelling; misrepresentation if structure changes |
| INT-12 | Broker quality badge: response time, listing accuracy, verified closings, reviews. Recomputed weekly; never sold | Buyer, broker | Can't tell good brokers apart | P0 (response) / P1 | Both | S–M | Gaming; review fraud; appeals process |
| INT-13 | Affordability bands (FOIR) and total cost of ownership on every listing | Buyer | Hidden costs; budget fit | P0 | Both | S | Stamp-duty and circle-rate tables kept versioned [P1-R] |
| INT-14 | Bank in-principle sanction and loan referral, with partner rate perks | Buyer, lender | Finance uncertainty; revenue | P1 | Both | M | Bank/HFC partnerships; DSA or regulatory status |
| INT-15 | Deal Room: token → agreement to sell → loan → registry/TM milestones; document checklist; family shared shortlist | Buyer, seller, broker | Coordination; post-enquiry abandonment | P1 (sharing P0) | Both + WhatsApp | M | Document storage security; scope creep |
| INT-16 | Co-broking ledger: listing, buyer, field and documentation roles; split recorded at token; platform fee; anti-poaching rules | Broker, platform | Lead resale; broker conflict; off-platform leakage | P1 | Broker app + web | L | RERA agent registration and FIU-IND/PMLA reporting duties; CCI (rules, not rates); enforcement |
| INT-17 | Showcase premium listing: pro media, video-derived floor plan, staging, weekly seller report; capped per society | Seller, broker | Listing quality; monetisation | P1 | Both | M | Photographer network or self-capture quality |
| INT-18 | Pay-on-success seller plan: free listing; fee payable at registry | Seller | Prepaid-plan refund disputes | P1 | Web + WhatsApp | S (billing) | Collections risk; agent-registration implications |
| INT-19 | WhatsApp-first broker CRM: consented buyer signals, AI follow-up drafts, "likely to sell" owners | Broker | Follow-up burden; retention | P1 | Broker app + WhatsApp | L | DPDP consent design; ties to INT-12 |
| INT-20 | Developer project pages: availability states, tour and brochure requests, AI pre-sales qualification, booking-intent leads | Developer, buyer | High cost per booking; poor lead quality | P1 | Both | M | Firewall between developer revenue and the risk score |
| INT-21 | Pre-market "Coming soon" to all verified buyers (≤14 days, then public), with demand stats for the seller | Seller, broker | Price discovery; broker hoarding | P1 | Both | S–M | Fairness perception; must not become private networks |
| INT-22 | Fair-listing classifier blocking religion, caste, diet or marital-status exclusion in listings and AI answers | All | Discrimination; brand risk | P1 | Back-end | S | Policy definitions; owner pushback |
| INT-23 | Living-conditions layer: sunlight by tower, floor and facing; air quality; dated waterlogging events (evidence first) | Buyer | Unknown liveability risks | P1 | Both | M | Data sourcing; dispute process [P1-LR] |
| INT-24 | Token escrow via bank partner | Buyer, seller | Token fraud | P2 | Web + app | L | Bank partner; legal; PMLA |
| INT-25 | Phone-captured 3D/splat tours with live broker co-viewing (for NRIs) | NRI, buyer | Remote buying | P2 | App | M–L | Capture quality; bandwidth on low-end Android |
| INT-26 | Monthly NCR price and rent index by corridor (PR, SEO, B2B licensing) | Media, lenders | Authority; data revenue | P1 | Web | M | Depends on INT-05; methodology publication |

---

## 7. Open questions for the founder

1. **Commission or not at launch?** Taking commission makes us a RERA agent and an FIU-IND reporting entity [P1-R]. That decision gates INT-16, INT-18 and INT-24.
2. **Verification cost and operations.** Self-capture by brokers in the field (Bayut model), or our own visits? Who pays: free to all (recommended [J]) or bundled into premium plans?
3. **Registry data budget and rights.** Will we license PropEquity or Liases Foras data with consumer-display rights before launch? INT-04 and INT-05 depend on it.
4. **Broker stance.** Will we require written owner mandates (proof of direct seller contact, as Property Finder SuperAgents must show) before a broker can list an owner's flat?
5. **Developer money vs the risk score.** Will we accept developer advertising in corridors where we publish Delivery Risk bands, and on what firewall terms?
6. **Pre-market listings.** Allow a time-boxed "Coming soon" at all, given hoarding norms in NCR?
7. **Seller pricing.** Pay-on-success percentage or a flat fee at registry? Who collects if the deal closes off-platform?
8. **Red flags vs relationships.** Will we show "registry/TM pending" in red on broker listings in Noida and Greater Noida, even at the cost of supply?
9. **AI staging default.** Opt-in by the seller, or on by default with a label?
10. **Channel priority.** Should conversational search launch on WhatsApp or in-app first? WhatsApp limits rich maps and media.
11. **Lending.** Which 2–3 banks or HFCs do we approach for in-principle sanction? Do we need DSA status?

---

## Sources

All accessed 18 Oct 2026. "co." marks company-reported figures.

**Zillow**
- S1 Natural-language search (4 Sep 2024): https://zillow.mediaroom.com/2024-09-04-Zillows-AI-powered-home-search-gets-smarter-with-new-natural-language-features
- S2 Showcase results (16 Apr 2024): https://zillow.mediaroom.com/2024-04-16-Showcase-listings-on-Zillow-are-more-than-just-cutting-edge-featured-homes-sell-faster-and-for-more-money
- S3 Showcase, 50+ brokerages (30 Sep 2025): https://zillow.mediaroom.com/2025-09-30-More-than-50-brokerages-adopt-Zillow-Showcase-as-go-to-tool-for-listing-marketing-innovation
- S4 Virtual Staging (10 Sep 2025): https://zillow.mediaroom.com/2025-09-10-Zillow-brings-AI-powered-Virtual-Staging-to-Showcase-listings
- S5 Summer launch: SkyTour, Offer Insights (15 Jul 2025): https://zillow.mediaroom.com/2025-07-15-Summer-just-got-hotter-Zillow-debuts-five-powerful-new-features
- S6 Listing performance insights (15 Apr 2025): https://zillow.mediaroom.com/2025-04-15-Zillows-listing-performance-feature-gives-agents-deeper-market-insights-sellers-value
- S7 ChatGPT app (6 Oct 2025): https://zillow.mediaroom.com/2025-10-06-Zillow-debuts-the-only-real-estate-app-in-ChatGPT
- S8 AI mode (25 Mar 2026): https://zillow.mediaroom.com/2026-03-25-Zillow-debuts-AI-mode,-bringing-guided-intelligence-to-every-step-of-the-housing-journey
- S9 Buyer hub, Preview, Verified Pre-approval (23 Jun 2026): https://zillow.mediaroom.com/2026-06-23-Zillow-launches-a-personalized-hub-that-guides-home-buyers-from-first-search-to-closing
- S10 Zillow Pro (15 Oct 2025): https://zillow.mediaroom.com/2025-10-15-Zillow-announces-Zillow-Pro-A-suite-of-products-designed-to-transform-how-agents-capture-business-and-meet-consumer-needs
- S11 Zillow Pro membership (9 Jul 2026): https://zillow.mediaroom.com/2026-07-09-Zillow-brings-its-consumer-insights-directly-to-agents-with-Zillow-Pro-membership
- S12 Fair Housing Classifier (21 May 2024): https://zillow.mediaroom.com/2024-05-21-Zillow-providing-open-source-technology-to-promote-fair-housing-in-AI-powered-real-estate-conversations
- S13 Q3 2025 results: https://zillow.mediaroom.com/2025-10-30-Zillow-Group-Reports-Third-Quarter-2025-Financial-Results
- S14 Preview on Realtor.com (17 Sep 2026): https://zillow.mediaroom.com/2026-09-17-Zillow-PreviewSM-listings-are-now-live-on-Realtor-com-R-,-offering-the-same-early-access-on-the-two-most-visited-real-estate-platforms-in-the-country
- S15 Zillow AI SVP interview (The AI Innovator): https://theaiinnovator.com/zillows-svp-of-ai-on-launching-inside-chatgpt/
- S16 Wikipedia: Zillow (lawsuits, 40% commission allegation): https://en.wikipedia.org/wiki/Zillow
- S77 Zillow release title on private listings and segregation (20 Nov 2025): https://zillow.mediaroom.com/2025-11-20-Chicago-shows-how-private-listings-can-reinforce-segregation-in-housing-and-its-a-warning-for-the-nation

**Redfin** (S17–S30), each at https://www.redfin.com/news/ followed by the slug:
- S17 `redfin-debuts-conversational-search/`
- S18 `conversational-search-is-now-available-on-the-redfin-iphone-app/`
- S19 `redfin-debuts-its-home-search-app-in-chatgpt/`
- S20 `ask-redfin-launches-nationwide/`
- S21 `introducing-redfin-redesign-ai-tool/`
- S22 `redfin-launches-sunscore-to-show-exactly-how-much-sunlight-homes-get/`
- S23 `redfin-partners-weather-company/`
- S24 `new-on-redfin-see-your-buying-power-while-you-search/`
- S25 `redfin-max/`
- S26 `agent-pay-report-2025/`
- S27 `redfin-now-powered-by-rocket/`
- S28 `redfin-policy-seller-choice/`
- S29 `seller-choice-keeps-winning-quietly/`
- S30 `redfin-adds-new-construction-listings-and-features/`

**Analysts and other US**
- S31 Mike DelPrete, exclusive inventory: https://www.mikedp.com/articles/2025/4/2/the-business-case-for-exclusive-inventory
- S32 Mike DelPrete, Address Upon Request: https://www.mikedp.com/articles/2026/1/8/compasss-new-product-address-upon-request
- S33 Mike DelPrete, Google enters portal wars: https://www.mikedp.com/articles/2025/12/12/google-enters-the-portal-wars
- S34 Mike DelPrete, Portal Wars Australia: https://www.mikedp.com/articles/2025/8/26/portal-wars-australia
- S35 Wikipedia: Matterport: https://en.wikipedia.org/wiki/Matterport
- S36 Wikipedia: Flyhomes: https://en.wikipedia.org/wiki/Flyhomes
- S37 Ribbon Home: https://www.ribbonhome.com/
- S38 Homebot: https://homebot.ai/

**UK**
- S39 Rightmove H1 2026 results: https://plc.rightmove.co.uk/content/uploads/2026/07/2026.07.31-Rightmove-final-RNS-H12026-unsigned.pdf
- S40 National Trading Standards, Material Information: https://www.nationaltradingstandards.uk/news/full-material-information-guidance-published/
- S41 Wikipedia: Houseful: https://en.wikipedia.org/wiki/Zoopla
- S42 Wikipedia: OnTheMarket: https://en.wikipedia.org/wiki/OnTheMarket

**Australia**
- S43 REA Annual Report 2026: https://onlinereports.irmau.com/2026/REA/
- S44 Consumer Affairs Victoria: https://www.consumer.vic.gov.au/housing/buying-and-selling-property/understanding-property-prices-and-underquoting-for-buyers

**Bayut** (S45–S53), each at https://www.bayut.com/mybayut/ followed by the slug:
- S45 `trucheck-bayut-uae/`
- S46 `expert-advice-trucheck-bayut/`
- S47 `bayut-profolio-mobile-app/`
- S48 `new-bayut-features-profolio-launched/`
- S49 `truestimate-property-valuation-bayut/`
- S50 `truestimate-portfolio/`
- S51 `dubai-transactions-feature-bayut/`
- S52 `bayutgpt-ai/`
- S53 `about-bayut-uae/`

**Property Finder** (S54–S57), each at https://www.propertyfinder.ae/blog/ followed by the slug:
- S54 `propertyfinder-ae-sets-industry-benchmarks-with-the-release-of-verified-listings/`
- S55 `your-superagent/`
- S56 `superagent-interview/`
- S57 `data-guru/`

**Dubai**
- S58 DLD Project Status (Mashrooi): https://dubailand.gov.ae/en/eservices/real-estate-project-status-landing/real-estate-project-status
- S59 Dubai law on cancelled projects (MyBayut): https://www.bayut.com/mybayut/dubai-introduces-law-cancelled-unfinished-real-estate-projects/

**Beike**
- S60 KE Holdings Annual Report 2025 (6-K, 24 Apr 2026): https://www.sec.gov/Archives/edgar/data/1809587/000110465926048085/tm2612586d1_ex99-1.pdf
- S61 KE Holdings FY2025 results: https://www.sec.gov/Archives/edgar/data/1809587/000110465926029843/tm268951d1_ex99-1.htm
- S62 KE Holdings F-1 (Jul 2020): https://www.sec.gov/Archives/edgar/data/1809587/000104746920004229/a2242063zf-1.htm
- S67-zh Chinese Wikipedia, Lianjia: https://zh.wikipedia.org/wiki/链家

**PropertyGuru**
- S63 Q2 2023 results: https://www.sec.gov/Archives/edgar/data/1873331/000095017023044241/pgru-ex99_1.htm
- S64 March 2022 release: https://www.sec.gov/Archives/edgar/data/1873331/000119312522078439/d328520dex991.htm
- S65 Products page: https://www.propertygurugroup.com/products/

**Other Asia**
- S66 Wikipedia: Recruit Holdings (SUUMO): https://en.wikipedia.org/wiki/Recruit_Holdings
- S67 Korean Wikipedia, Zigbang: https://ko.wikipedia.org/wiki/직방
- S68 KISO: https://www.kiso.or.kr/

**Europe and Latin America**
- S69 Hemnet Q2 2026 report: https://www.hemnetgroup.se/files/mfn/caf1d168-e8b0-4fe3-bcef-0c1876b9c984/hemnet-quarterly-report-q2-2026-eng.pdf
- S70 Hemnet Group site: https://www.hemnetgroup.se/en/
- S71 Scout24 Q2 2026: https://www.scout24.com/en/investor-relations/financial-news/ir-news/detail/scout24-maintains-strong-momentum-in-q2-with-20-revenue-growth-double-digit-organic-revenue-growth-and-18-adjusted-eps-growth
- S72 Scout24 Capital Markets Day 2026: https://www.scout24.com/en/investor-relations/financial-news/ir-news/detail/scout24-unveils-the-agentic-os-for-real-estate-and-outlines-next-phase-of-scalable-growth-at-capital-markets-day-2026-1
- S73 Spanish Wikipedia, Idealista: https://es.wikipedia.org/wiki/Idealista.com
- S74 Dutch Wikipedia, Funda: https://nl.wikipedia.org/wiki/Funda
- S75 Portuguese Wikipedia, QuintoAndar: https://pt.wikipedia.org/wiki/QuintoAndar

**Prior research** (`/Users/macbook/code/Real Estate/`):
- [P1-CB] `research_notes/Delhi NCR AI real estate platform/competitive_benchmark.md` §8–9
- [P1-VD] `research_notes/Delhi NCR AI real estate platform/valuation_and_data.md` §4
- [P1-BM] `research_notes/Delhi NCR AI real estate platform/business_model_gtm_risks.md` §3
- [P1-AI] `research_notes/Delhi NCR AI real estate platform/ai_opportunities.md` Q2
- [P1-RP] `research_notes/Developer and project risk scoring/rating_precedents_methodologies.md` §3, §5
- [P1-LR] `research_notes/Developer and project risk scoring/legal_risk_and_score_ux.md` B2
- [P1-ABRS] `research_notes/Developer and project risk scoring/additional_buyer_risk_scores.md` KQ3
- [P1-R] `reports/Delhi NCR AI real estate platform.md`
