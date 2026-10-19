# Competitive Benchmark: Indian Online Real Estate Buy/Sell Platforms + Global Reference Platforms (as of October 2026)

> Research notes for designing an AI-first buy/sell flat platform for Delhi NCR. Researched 17 Oct 2026.
> **Method caveat:** The session's web-search budget ran out partway through, so many findings come from direct fetches of primary pages: Play Store/App Store listings, company pricing pages, investor PDFs, and Trustpilot. **Reddit threads and consumer-complaint forums could not be searched.** User-complaint evidence therefore relies on Play Store reviews, Trustpilot, and a broker-side review article. Each data point carries its year. Where sources conflict, the conflict is flagged.
> App-store figures were pulled directly from Google Play (India locale) and the iTunes catalog API (India storefront) on **17 Oct 2026**.

---

## 1. Product/UX of each Indian platform: buyer/seller flows, verification, search, project pages, price data, reviews, 3D tours, add-ons, app ratings

### Takeaway
The four big horizontal portals (99acres, MagicBricks, Housing.com, NoBroker) have reached feature parity on the basics: filters, project pages, price trends, locality reviews, loans, interiors and rent agreements. Their app-store ratings are high, at 4.4–4.8 on Play. "Verification" is mostly a marketing label. Trust in listings and post-enquiry experience is where they fall down, not search features. Square Yards is a transaction/brokerage business with a thin consumer app. CommonFloor is effectively dormant.

### Cited Findings

**App-store ratings snapshot (pulled 17 Oct 2026)**

| Platform | Google Play rating / reviews / installs / last update | iOS App Store (India) rating / # ratings |
|---|---|---|
| 99acres (Info Edge) | 4.8 / 2.16 lakh reviews / 1 Cr+ / 6 Oct 2026 — [Play](https://play.google.com/store/apps/details?id=com.nnacres.app&hl=en_IN) | 4.65 / 26,410 — [App Store](https://apps.apple.com/in/app/id781765588) |
| MagicBricks (Times Internet) | 4.4 / 3.17 lakh / 1 Cr+ / 13 Oct 2026 — [Play](https://play.google.com/store/apps/details?id=com.timesgroup.magicbricks&hl=en_IN) | 4.08 / 21,711 — [App Store](https://apps.apple.com/in/app/id486328406) |
| Housing.com (now Aurum PropTech) | 4.4 / 4.09 lakh / 10M+ / 16 Oct 2026 — [Play](https://play.google.com/store/apps/details?id=com.locon.housing&hl=en_IN) | 4.55 / 20,650 — [App Store](https://apps.apple.com/in/app/id967257660) |
| NoBroker | 4.7 / 5.01 lakh / 1 Cr+ / 12 Oct 2026 — [Play](https://play.google.com/store/apps/details?id=com.nobroker.app&hl=en_IN) | 4.36 / 105,652 — [App Store](https://apps.apple.com/in/app/id1200507100) |
| Square Yards | Android consumer app not found under the package IDs tried (gap) | 4.37 / 1,362 — [App Store](https://apps.apple.com/in/app/id1093755061) |
| CommonFloor | 2.1 / 14.6K / last updated 17 Oct 2025 (one year stale) — [Play](https://play.google.com/store/apps/details?id=com.commonfloor&hl=en_IN) | n/a |

**99acres (Info Edge)**
- App listing (Oct 2026) claims 600+ cities and "4M+ properties". It offers residential and commercial buy, rent and lease, plus PG. Listings come from "qualified property agents & top builders as well as no brokerage properties" — [Play listing](https://play.google.com/store/apps/details?id=com.nnacres.app&hl=en_IN)
- Features listed in the app (Oct 2026):
  - "Real Estate Intelligence" locality positives/negatives
  - Society/locality **Ratings & Reviews** by current and past residents
  - Landmark search and "Similar Localities"
  - Price trends with "property transaction prices", locality insights and charts
  - Online rental agreement delivered to the doorstep
  - For owners: a "dedicated relationship manager" and "posting through WhatsApp"
  - The claim "Backed by AI for faster and efficient property search"
  - Source: [Play listing](https://play.google.com/store/apps/details?id=com.nnacres.app&hl=en_IN)
- The Oct 2026 "What's new" note adds expert real-estate advice videos from builders and consultants on New Projects pages — [Play listing](https://play.google.com/store/apps/details?id=com.nnacres.app&hl=en_IN)
- One report says 99acres had over 1.3 million listings and "more than 1.99 lakh projects" (2026). This comes from a search summary of Q4 FY26 coverage that was not verified in the fetched article, and the project count looks implausibly high — [Angel One](https://www.angelone.in/news/stocks/info-edge-q4-fy26-results-out-99acres-turns-profitable-net-profit-soars-to-55-357-million-on-exceptional-gains)

**MagicBricks (Times Internet)**
- App listing (Oct 2026) claims "10 lakh+" listings across 50+ cities. Other features:
  - "Top Matches" personalised recommendations
  - **MagicHomes** new-project section with RERA certificates, project inventory status, quarterly progress reports and expert review videos
  - **FREE site-visit cab** pick-up and drop
  - Personalised dashboard covering shortlists, saved searches, contacted properties, proposals and site-visit schedules
  - **MB Prime** membership to contact owners directly
  - Home loans with 40+ banks, and interiors quote comparison
  - Source: [Play listing](https://play.google.com/store/apps/details?id=com.timesgroup.magicbricks&hl=en_IN)
- The same listing says "12 lakh+ monthly visitors". That is far below the third-party figures in Section 3 and is probably a typo or stale copy — [Play listing](https://play.google.com/store/apps/details?id=com.timesgroup.magicbricks&hl=en_IN)
- **PropWorth** AVM (page live Oct 2026):
  - Claims "~98% accurate", an estimate "in just 30 sec", and "error margin of just ±2%"
  - Covers 60,000+ projects and 6,000 localities across 30 cities
  - Models are trained on "15 years of data and 3 crore+ listings", with inputs from 30,000+ agents
  - Offers "Check property transaction prices in any Project — Based on govt. registry records"
  - No accuracy methodology is published
  - Source: [MagicBricks PropWorth](https://www.magicbricks.com/propworth)

**Housing.com (REA India until 2026, now Aurum PropTech)**
- App listing (Oct 2026):
  - "10L+ listings" and "35mn+ monthly visitors"
  - "Verified Enquiries" from verified users, an owner dashboard with analytics, and Housing Chat
  - **Housing Edge** "Pay Rent by Credit Card"
  - 30K+ PG options; "8-million strong customer base" and "over 2 lakh real estate partners"
  - The listing now describes Housing.com as "part of the Aurum PropTech ecosystem"
  - Source: [Play listing](https://play.google.com/store/apps/details?id=com.locon.housing&hl=en_IN)
- A user review (2026) reports that clicking to show an owner's phone number no longer reveals it: "It only submit your details to the concerned party, who may contact you if they're a paid member" — [Play reviews](https://play.google.com/store/apps/details?id=com.locon.housing&hl=en_IN)
- Another review (2026) says premium buyers are cut off after a "threshold limit" of expressed interest — [Play reviews](https://play.google.com/store/apps/details?id=com.locon.housing&hl=en_IN)

**NoBroker**
- App listing (Oct 2026):
  - Delhi NCR coverage includes Delhi, **Gurgaon, Noida, Greater Noida, Faridabad and Ghaziabad**, alongside Bangalore, Mumbai, Chennai, Hyderabad and Pune
  - Claims "1000s of verified listings"
  - Offers rental agreements with 1-day delivery and a property value/rent calculator
  - Credit-card rent and fees payment
  - Home services (painting, cleaning, AC repair, electricians and similar), interiors, and EMI/home-loan assistance
  - Personal loans at 10.99%–30% APR ("up to 40%") via partner NBFC Kisetsu Saison
  - Source: [Play listing](https://play.google.com/store/apps/details?id=com.nobroker.app&hl=en_IN)
- The core property business operates in Bengaluru, Mumbai, Pune, Hyderabad, Chennai and Delhi-NCR. NoBrokerHood (society management) is in 11 cities, 25,000+ societies and 48 lakh families (Sep 2026) — [PropNewsTime](https://propnewstime.com/latestnewsstories/MzczOTI=/nobroker-targets-profitability-within-8-10-months-as-fy26-revenue-crosses-inr-1-000-crore)
- Wikipedia reports that a 2024 report found NoBroker "has shifted from its original no-brokerage policy" and charges owners for premium tenant data in some cities — [Wikipedia: NoBroker](https://en.wikipedia.org/wiki/NoBroker)

**Square Yards**
- The website's navigation (Oct 2026) shows Square Connect (agents), Site Accelerator (developers), **PropVR (3D/AR/VR services)**, Data Intelligence Services, SuperAgent Pro, mortgage partnerships, Interior Company and rent agreements. It also offers calculators for property tax, capital gains and interiors — [Square Yards blog page](https://www.squareyards.com/blog/square-yards-crosses-rs-2000-crore-revenue-fy26)
- Business lines: brokerage with an NRI focus, Urban Money mortgage aggregation, Azuro rental/property management (acquired 2020), Interior Company, PropVR 3D visualisation (acquired 2021) and the PropsAMC analytics acquisition (2021) — [Wikipedia: Square Yards](https://en.wikipedia.org/wiki/Square_Yards_(company))

**CommonFloor (defunct/dormant)**
- The app is still listed but rated 2.1 and was last updated Oct 2025. Its copy still claims "37+ lakh property" in 900+ cities with 3D/sky views — [Play listing](https://play.google.com/store/apps/details?id=com.commonfloor&hl=en_IN)

**PropTiger / Makaan**
- PropTiger was acquired by Aurum PropTech. A Business Standard/PTI headline (23 Jul 2025) reads "Aurum PropTech acquires home brokerage platform PropTiger for Rs 86.45 cr". The article returned 403, so only the headline was seen — [Business Standard](https://www.business-standard.com/pti-stories/national/aurum-proptech-acquires-home-brokerage-platform-proptiger-for-rs-86-45cr-125072301075_1.html)
- REA reported that India revenue fell sharply after the "PropTiger and Housing Edge exits" (FY26) — [Online Marketplaces](https://www.onlinemarketplaces.com/articles/rea-group-ends-fy26-with-flat-listings-and-double-digit-yield-growth/)

**Anarock**
- Its website (Oct 2026) positions Anarock as an advisory/transaction firm across India, the Middle East and Singapore. It lists "Technology Solutions", "AI-driven insights powering smarter real estate decisions", a channel-partner network, and "$ bn+ transacted and advised since June 2017". The numbers render via JavaScript and were not captured — [Anarock](https://www.anarock.com/)

### Inferences
- Indian portals score 4.4–4.8 on Play, but 1.1–1.2 on Trustpilot (Section 5). App-store ratings are probably inflated by in-app rating prompts to satisfied searchers. Sellers and paying users, who complain on Trustpilot, are under-represented. An NCR entrant should not treat app ratings as a sign of satisfaction.
- The core search toolkit is commoditised: filters, maps, price trends, project pages, locality reviews and calculators. A new entrant cannot win on these.
- Housing.com now gates owner phone numbers behind paid memberships, and NoBroker has moved away from "no brokerage". Both suggest the free "direct owner contact" promise is eroding at incumbents. This is white space for a platform that offers verified owner contact without spam.
- None of the Indian app listings mention 3D/virtual tours as a consumer feature, except CommonFloor's legacy copy and Square Yards' PropVR B2B service. 3D tours appear under-deployed for resale flats.

### Gaps
- Detailed buyer/seller flow walkthroughs (screens and steps) were not captured. The portal web pages were bot-protected: 99acres returned 403 and Housing.com returned a security page.
- No source was found on any portal's listing-verification method (for example RERA ID checks, owner KYC, or physical inspection) beyond marketing labels.
- The Square Yards Android app package could not be identified. Makaan's 2026 status (folded or live) was not confirmed.
- No evidence was found on Hindi or voice search on Indian portals. Absence was not confirmed either.

---

## 2. Business model, monetisation, pricing and financials (FY24–FY26)

### Takeaway
Indian portals sell to the supply side: developer and broker subscriptions, owner "assisted" plans and ads. Leads are shared with many buyers of the data. NoBroker and Square Yards have moved toward transactions and adjacencies (loans, interiors, services).

Financially:
- 99acres has just reached breakeven at quarterly PBT, with Q4 FY26 PBT of ₹3.4 Cr, but lost about ₹59 Cr in FY26.
- MagicBricks is small but reportedly profitable, with FY25 revenue of ₹332 Cr.
- Housing.com was a loss-maker that REA exited in 2026.
- NoBroker crossed ₹1,000 Cr revenue in FY26 (unaudited) and is still loss-making.
- Square Yards is the scale and profitability leader on a brokerage model: FY26 revenue ₹2,086 Cr, EBITDA ₹176 Cr.

### Cited Findings

**99acres / Info Edge**
- Q4 FY26 (Jan–Mar 2026): 99acres revenue was ₹144 Cr vs ₹106 Cr in Q4 FY25 (+36%) — [Entrackr](https://entrackr.com/fintrackr/info-edge-posts-rs-756-cr-pat-in-q4-fy26-other-income-stands-at-rs-497-cr-11862692)
- Storyboard18 gives the same quarter as ₹143.7 Cr vs ₹105.8 Cr, with Q4 operating profit of about ₹3 Cr — [Storyboard18](https://www.storyboard18.com/amp/brand-marketing/info-edge-q4-profit-rises-on-naukri-and-99acres-growth-ws-l-98935.htm)
- Q4 FY26 segment PBT was ₹34.2 million (about ₹3.4 Cr), against a ₹204.6 million loss in Q3 FY26 — [Angel One](https://www.angelone.in/news/stocks/info-edge-q4-fy26-results-out-99acres-turns-profitable-net-profit-soars-to-55-357-million-on-exceptional-gains)
- FY26 full year: 99acres had a pre-tax loss of ₹591.5 million (about ₹59 Cr), attributed to spending on customer acquisition, visibility and expansion. Results were disclosed 22 May 2026 — [PropNewsTime](https://propnewstime.com/getdetailsStories/MzA3NDg=/99acres-revenue-rises-but-fy26-losses-persist-amid-growth-investments)
- FY26 99acres billings were ₹497.1 Cr, +10.3% YoY. This comes from a search-result summary of Info Edge's Q4 FY26 update and was not independently fetched — [EquityBulls](https://www.equitybulls.com/category.php?id=368848)
- Info Edge consolidated FY26 revenue from operations was ₹3,285 Cr vs ₹2,850 Cr in FY25 — [Entrackr](https://entrackr.com/fintrackr/info-edge-posts-rs-756-cr-pat-in-q4-fy26-other-income-stands-at-rs-497-cr-11862692). Another outlet reports ₹3,052 Cr, likely a standalone figure — [Whalesbook](https://www.whalesbook.com/corporate-news/Hinglish/technology/Info-Edge-FY26-Revenue-Rises-15percent-to-indian-rupee3052-Crore-Board-Recommends-Dividend/6a6cc55710bce1fd2037bd7c)
- Info Edge reorganised the real-estate vertical sales leadership effective 1 May 2026. The company noted Q4 sales-organisation changes "creating transitional billing impacts" and expects an "improved growth trajectory in FY27" — [ScanX](https://scanx.trade/stock-market-news/companies/info-edge-announces-internal-reorganisation-of-education-and-real-estate-verticals-with-senior-management-changes/37717321)
- **Governance flag:** on 15 Sep 2025, Info Edge's audit committee engaged a "reputed specialist law firm" to investigate a whistle-blower complaint alleging "violation of company policies by certain employees of 99acres". The details and outcome were not disclosed — [Inc42](https://inc42.com/buzz/info-edge-engages-law-firm-to-probe-whistle-blower-complaint-about-99acres/)
  - The same Inc42 summary cites Q1 FY26 99acres revenue of ₹110.7 Cr and "₹93.6 Cr profit". That conflicts with segment-loss reporting elsewhere and is probably a misreading (possibly billings). Treat it as unreliable.

**MagicBricks (Times Internet)**
- FY25: revenue ₹332.0 Cr, expenses ₹276.2 Cr, PAT ₹17.6 Cr (5.3% net margin) — [Inc42 Datalabs](https://inc42.com/company/magicbricks/financials/)
- An earlier search summary reported FY23 revenue of ₹308.1 Cr with a ₹19.4 Cr loss. This was not verified on the fetched page — [Inc42 Datalabs](https://inc42.com/company/magicbricks/financials/)
- Times Internet's FY25 revenue was ₹1,618 Cr with net income of ₹218 Cr. This is the parent, not MagicBricks alone — [Wikipedia: Times Internet](https://en.wikipedia.org/wiki/Times_Internet)
- Monetisation visible in the app (2026): MB Prime buyer membership, owner/agent paid packages (a reviewer cites a "Titanium Pro" pack), free site-visit cabs funded by developers, and loans and interiors referral — [Play listing and reviews](https://play.google.com/store/apps/details?id=com.timesgroup.magicbricks&hl=en_IN)

**Housing.com / PropTiger / Makaan (REA India, now Aurum PropTech)**
- REA FY26 (year to Jun 2026):
  - Group revenue A$1,793m (+7%), or A$1,730m excluding India (+12%)
  - Operating EBITDA A$1,088m (61% margin); core NPAT A$650m (+15%)
  - Source: [Kalkine](https://kalkine.com.au/news/announcements/rea-group-reports-fy26-revenue-of-1793m-and-operating-ebitda-margin-of-61)
- India in FY26:
  - Revenue fell 38% to A$81m; the international segment (mainly India) had EBITDA losses of A$38m
  - By Q3 FY26, India revenue was down 65% after the PropTiger and Housing Edge exits
  - India is presented as a discontinued operation
  - Source: [Online Marketplaces](https://www.onlinemarketplaces.com/articles/rea-group-ends-fy26-with-flat-listings-and-double-digit-yield-growth/)
- Housing.com core revenue was "down 3% on a constant currency basis and down 17% in A$ to $12m". The period is unclear and is likely a half or quarter — [Kalkine](https://kalkine.com.au/news/announcements/rea-group-reports-fy26-revenue-of-1793m-and-operating-ebitda-margin-of-61)
- **Housing.com sale (announced 16 Jul 2026):**
  - Aurum PropTech acquires 100% of Housing.com in an all-equity deal: 1,97,93,309 new Aurum shares, about 20.5% of enlarged capital
  - REA India ends with 24.9% of listed Aurum
  - Housing.com is cited at 58M+ average monthly visits and 12M+ MAU
  - The stated aim is an "AI Native Operating System" for Indian real estate
  - Source: [Aurum PropTech](https://www.aurumproptech.in/pulse/media/aurum-proptech-acquires-housing-com-ai-real-estate-operating-system); [RealtyNMore](https://realtynmore.com/aurum-proptech-to-acquire-housing-com-in-mega-deal/)

**NoBroker**
- FY24 (filed): operating revenue ₹803 Cr (+32% from ₹609 Cr in FY23); net loss ₹411 Cr (down from ₹506 Cr) — [Entrackr](https://entrackr.com/fintrackr/nobroker-reports-rs-803-cr-revenue-in-fy24-but-57-expenses-remain-unexplained-9063969)
- FY25 (CEO claim, unaudited): revenue ₹965 Cr, "up from INR 888 crore" (this conflicts with the filed ₹803 Cr for FY24). Losses fell to about ₹300 Cr.
- FY26 (CEO claim, unaudited): revenue crossed ₹1,000 Cr.
- About 50% of revenue is core buy/sell/rent; the other half is packers and movers, interiors, NoBrokerHood and home services.
- The CEO targets profitability "within the next 8-10 months" (Sep 2026). There is no IPO or fundraise until then.
- Source for the FY25/FY26 claims, revenue split and outlook: [PropNewsTime, 29 Sep 2026](https://propnewstime.com/latestnewsstories/MzczOTI=/nobroker-targets-profitability-within-8-10-months-as-fy26-revenue-crosses-inr-1-000-crore)
- Revenue mix per Inc42 (Jul 2026): real estate 50–55%, financial services about 22.4%, home services the rest. Other points from the same article:
  - Freemium base, with about 90% free users
  - March 2026 figures: 100,000+ real-estate transactions, 150,000 home-service orders and ₹1,000 Cr of primary-sales transactions
  - The co-founder cited a profitability target of "12-15 months", which conflicts with the CEO's 8–10 months
  - Source: [Inc42](https://inc42.com/features/nobrokers-future-is-beyond-home-listings-but-will-profits-follow/)
- Unicorn since Nov 2021 ($210M round led by General Atlantic and Tiger Global); about $361M raised by 2023 — [Wikipedia: NoBroker](https://en.wikipedia.org/wiki/NoBroker)
- **Published NoBroker plan prices (Oct 2026, nobroker.in, default city; all +18% GST):**
  - **Seller plans (3 months):**
    - Relax ₹7,499
    - Super Relax ₹13,499 ("leave your house keys")
    - MoneyBack ₹16,499 ("guaranteed buyers or moneyback", RM)
    - Super MoneyBack ₹20,999 (adds a field assistant to show the house)
    - Source: [NoBroker Seller Plans](https://www.nobroker.in/seller/plans)
  - **Buyer plans:**
    - Power ₹1,899: up to 25 owner contacts, legal consult, loan assistance
    - Property Expert ₹1,999: up to 50 contacts, a property expert who shortlists and negotiates, and 100% cashback if the home loan goes through NoBroker
    - Property Expert MoneyBack ₹4,999: "Guaranteed property or 100% Refund"
    - Source: [NoBroker Buyer Plans](https://www.nobroker.in/buyer/plans)
  - **Owner (rental) plans:**
    - Relax ₹3,399
    - Super Relax ₹5,899
    - MoneyBack ₹6,999
    - Super MoneyBack ₹10,999
    - Source: [NoBroker Owner Plans](https://www.nobroker.in/owner/plans)

**Square Yards (brokerage-led)**
- FY25: revenue about ₹1,410 Cr (+40% from ₹1,001 Cr in FY24); EBITDA ₹46 Cr; gross profit ₹316 Cr; 186,000+ transactions; "GTV ₹59,093 Cr" — [Entrackr](https://entrackr.com/fintrackr/square-yards-crosses-rs-1400-cr-revenue-in-fy25-gross-profit-surge-52-9083107); [RealtyNMore](https://realtynmore.com/square-yards-fy25-revenue-hits-%E2%82%B91410-crore-ebitda-%E2%82%B946-crore/)
- FY26 (company blog dated 7 Jul 2026):
  - Revenue ₹2,086 Cr (+48%); EBITDA ₹176 Cr (margin 3%→8%; the third straight year of positive EBITDA)
  - India 88% of revenue (+57% YoY)
  - 2.73 lakh customer acquisitions; real-estate transactions ₹13,236 Cr; cumulative ₹70,000 Cr
  - Urban Money loan disbursements ₹87,831 Cr, 86% of it mortgages
  - Source: [Square Yards](https://www.squareyards.com/blog/square-yards-crosses-rs-2000-crore-revenue-fy26)
- Gross profit was ₹476 Cr (+49%, 23% margin). FY27 guidance is 40%+ revenue growth and roughly double the EBITDA — [Online Marketplaces](https://www.onlinemarketplaces.com/articles/square-yards-fy26-revenue-up-48-as-ebitda-nearly-quadruples-pre-ipo/)
- **Conflict:** FY25 "GTV ₹59,093 Cr" against FY26 property transactions of ₹13,236 Cr. The FY25 figure probably bundles mortgage volume, so the definitions differ. Do not compare them directly.
- IPO:
  - A DRHP for a ~₹2,000 Cr IPO was planned for Dec 2025–Mar 2026 — [Deccan Founders](https://deccanfounders.com/2025/08/news/square-yards-is-set-to-file-its-drhp-for-a-%E2%82%B92000-crore-ipo-between-december-2025-and-march-2026/)
  - Later reporting: "Expected 2026 listing with minimum $1.5 billion valuation target", after a $35M pre-IPO round at $900M pre-money — [Online Marketplaces](https://www.onlinemarketplaces.com/articles/square-yards-fy26-revenue-up-48-as-ebitda-nearly-quadruples-pre-ipo/)
  - Wikipedia cites a valuation above $1.6B in Jun 2026 — [Wikipedia](https://en.wikipedia.org/wiki/Square_Yards_(company))
  - DRHP filing status as of Oct 2026 was not confirmed.

**Broker/agent package pricing (2026, broker-reported)**
- 99acres: entry plans about ₹899/month; "BOSS" broker packages about ₹3,149/month; real spends ₹4,000–₹60,000/month depending on city and tier
- MagicBricks and Housing.com: quote-only, estimated at ₹5,000–₹75,000+/month
- No portal offers lead exclusivity
- Source: [ClosingFox, Jul 2026](https://closingfox.com/for-business-owners/99acres-vs-magicbricks-vs-housing/)
- Owner paid plans on 99acres reportedly cost ₹5,999–₹22,000+ (Trustpilot reviewers, 2026) — [Trustpilot 99acres](https://uk.trustpilot.com/review/99acres.com)

### Inferences
- Revenue at the listing portals is small compared with the transaction value they influence. In FY26, 99acres had about ₹500 Cr billings and MagicBricks about ₹330 Cr (FY25). Square Yards, monetising the transaction, has ₹2,086 Cr. The money is in transaction and adjacency capture (brokerage, mortgage, interiors), not listing fees. That supports an AI-first model that monetises outcomes: success fees, mortgage and legal.
- The incumbent model creates misaligned incentives:
  - Selling the same enquiry to many paying brokers pays the portal more per lead and creates spam.
  - Owner "assisted" plans are prepaid with weak refund paths.
  - Outcome-based pricing, as in NoBroker's "MoneyBack" tier, is the counter-model but generates refund disputes (Section 5).
- REA's exit from India after more than 8 years, Housing.com moving to Aurum, and PropTiger and Housing Edge being divested all show how hard it is to make a pure Indian portal profitable outside the top 1–2 players.

### Gaps
- Official full-year FY26 99acres revenue was not fetched. The Info Edge annual report and investor presentation were not reached.
- MagicBricks FY26 financials are not available.
- Housing.com standalone revenue and losses are not available; no FY26 Locon Solutions filing was found.
- NoBroker FY25/FY26 audited financials have not been filed (2026).
- Published 99acres, MagicBricks and Housing.com owner and developer price cards could not be fetched: the pages were blocked or URLs unknown.
- Anarock financials and channel-partner tech revenue were not found.

---

## 3. Traffic and market share (2026)

### Takeaway
The leaders are 99acres and MagicBricks. They are close on comScore unique visitors, and 99acres claims about half of web traffic share. NoBroker and Housing.com are a tier below. Traffic figures vary 3–5x by source, so use them only for ranking, not sizing.

### Cited Findings
- comScore, May 2026 monthly unique visitors: **MagicBricks 8.0M, 99acres 7.6M, NoBroker 6.1M, Housing.com 5.6M** (published 2 Jul 2026) — [MediaBrief](https://mediabrief.com/magicbricks-crosses-8-million-monthly-unique-visitors/)
- Info Edge says 99acres held **49% web traffic share and 53% app traffic share** "by early 2026" — [ScanX](https://scanx.trade/stock-market-news/companies/info-edge-announces-internal-reorganisation-of-education-and-real-estate-verticals-with-senior-management-changes/37717321)
- Semrush, September 2026: 99acres.com had 10.77M visits — [Semrush](https://www.semrush.com/website/99acres.com/overview/)
- A Semrush-based summary for June 2026 gives magicbricks.com 11.19M visits and housing.com 9.67M (search summary, not fetched) — [Semrush MagicBricks](https://www.semrush.com/website/magicbricks.com/overview/)
- Housing.com/Aurum claim 58M+ average monthly visits and 12M+ MAU (Jul 2026) — [Aurum PropTech](https://www.aurumproptech.in/pulse/media/aurum-proptech-acquires-housing-com-ai-real-estate-operating-system). The Housing app listing says "35mn+ monthly visitors" (Oct 2026) — [Play](https://play.google.com/store/apps/details?id=com.locon.housing&hl=en_IN)
- A low-quality blog estimate puts MagicBricks at 30M+, 99acres at 23M and Housing.com at 11M monthly visitors. No method is given — [Beegru blog](https://beegru.com/blog/priya-ramachandran/top-10-real-estate-websites-in-india-2026-beegru)
- Global benchmark: Rightmove has a **90% share of time (comScore) and 75% (SimilarWeb/Sensor Tower)** among UK portals. Over 85% of its traffic is direct or organic, and **less than 0.5% is referred from LLMs** (H1 2026) — [Rightmove H1 2026 RNS](https://plc.rightmove.co.uk/content/uploads/2026/07/2026.07.31-Rightmove-final-RNS-H12026-unsigned.pdf)

### Inferences
- India has no Rightmove-style monopoly. The top four portals split attention roughly evenly on unique visitors. A credible new entrant could take share in a single metro (Delhi NCR), especially since 99acres and MagicBricks are both NCR-headquartered and NCR-heavy but loss-making or low-margin.
- Rightmove's under-0.5% LLM referral share (2026) suggests that AI chat is not yet a meaningful acquisition channel for property portals. SEO, direct/app and WhatsApp distribution still matter for an AI-first entrant.

### Gaps
- No SimilarWeb data was obtained: the fetch was refused. There is no NCR-specific traffic split. Square Yards traffic was not found.

---

## 4. AI features launched by 2026 (AI search, chatbots, AI price estimates, virtual staging, Hindi voice, AI descriptions)

### Takeaway
Indian incumbents' AI is mostly behind the scenes (recommendations, ML valuation, call analytics) or marketing language. No source was found of an Indian portal shipping a measured, consumer-facing conversational search or agent comparable to "Ask Rightmove" or BayutGPT. The most concrete Indian AI items are:
- MagicBricks' PropWorth AVM, with unverified accuracy claims
- NoBroker's CallZen.AI conversational-intelligence product
- Aurum/Housing.com's stated (not yet shipped) "AI-native operating system"

Hindi voice search, virtual staging and AI-generated listing descriptions are not evidenced at any Indian portal.

### Cited Findings
**India**
- 99acres: the app claims to be "Backed by AI for faster and efficient property search" (Oct 2026), with no named AI product — [Play](https://play.google.com/store/apps/details?id=com.nnacres.app&hl=en_IN)
- MagicBricks:
  - PropWorth uses ML trained on 15 years of data and 3 crore+ listings, claims ±2% error and ~98% accuracy, and covers 60,000 projects across 30 cities (2026) — [PropWorth](https://www.magicbricks.com/propworth)
  - MagicBricks also cites "AI-driven recommendations" and "verified property listings" (Jul 2026) — [MediaBrief](https://mediabrief.com/magicbricks-crosses-8-million-monthly-unique-visitors/)
  - A low-quality blog claims MagicBricks launched natural-language conversational search. It is unverified and not corroborated by the app listing — [Mayank Digital Labs](https://www.mayankdigitallabs.in/blog/ai-real-estate-chatbot-property-2026)
- Housing.com/Aurum: the deal rationale is "a unified AI and data architecture designed to function as the native operating layer" for search, pricing, matching and transactions (Jul 2026). No shipped features are specified — [RealtyNMore](https://realtynmore.com/aurum-proptech-to-acquire-housing-com-in-mega-deal/); [Aurum](https://www.aurumproptech.in/pulse/media/aurum-proptech-acquires-housing-com-ai-real-estate-operating-system)
- NoBroker:
  - Has built **CallZen.AI**, a conversational-intelligence product — [Wikipedia: NoBroker](https://en.wikipedia.org/wiki/NoBroker)
  - A social-media summary of Business Standard (Sep 2026) says "AI handles 35 per cent of all NoBroker conversations" and that NoBroker is investing in AI across discovery, loans and interiors. Business Standard returned 403, so this is unverified — [X post](https://x.com/gaze_observer/status/2104803030508208317); [Business Standard](https://www.business-standard.com/companies/news/nobroker-eyes-profitability-in-8-10-months-fy26-revenue-tops-1k-cr-ceo-126090600259_1.html)
- Square Yards: PropVR (3D/AR/VR) and "Data Intelligence Services" (2026). No consumer AI product was found — [Square Yards](https://www.squareyards.com/blog/square-yards-crosses-rs-2000-crore-revenue-fy26)
- Anarock: "AI-driven insights" marketing claim (2026) — [Anarock](https://www.anarock.com/)
- A generic industry article claims the major portals all use AI to narrow results to 10–12 matches. It is low-quality and unsourced — [Buloke](https://buloke.com/ai-changing-property-search-in-bangalore-2026/)

**Global (for contrast)**
- **Rightmove (H1 2026, primary results):**
  - "Ask Rightmove" conversational search and listing experience: early data shows about **40% more time on site and roughly double the propensity to send leads**
  - AI-enabled **Online Agent Valuation**, which drove about **50% more unique valuation leads** and was "fastest-ever revenue growth from a new product"
  - 46 strategic AI initiatives in flight (vs 31 in Dec 2025); "agentic-powered solutions" for estate agents going live in H2 2026
  - A fully AI-enabled cloud data platform holding more than 5 PB of data
  - Source: [Rightmove H1 2026 RNS](https://plc.rightmove.co.uk/content/uploads/2026/07/2026.07.31-Rightmove-final-RNS-H12026-unsigned.pdf)
  - The Rightmove app offers "search with AI Keywords" (for example "3-bed with a driveway, a garage and bay windows"), Sold House Prices and Instant Valuation (Oct 2026) — [Play](https://play.google.com/store/apps/details?id=com.rightmove.android&hl=en_IN)
- **Bayut (UAE):** the app (Oct 2026) offers:
  - **BayutGPT**, billed as "the world's first AI-powered property search assistant"
  - **TruEstimate** "free AI-powered property valuations"
  - Dubai Transactions market data and Search 2.0 by commute time
  - Four languages (English, Arabic, Russian, Chinese)
  - Source: [Play](https://play.google.com/store/apps/details?id=com.bayut.bayutapp&hl=en_IN)
- **Zillow:** the app (Oct 2026) offers a BuyAbility affordability score, Zillow Home Loans Verified Pre-approval, **Zillow Preview** pre-market listings and **Sky Tours** 3D home tours — [Play](https://play.google.com/store/apps/details?id=com.zillow.android.zillowmap&hl=en_IN). Zillow Preview listings went live on Realtor.com on 17 Sep 2026 (press-release title only; the page did not load) — [Zillow newsroom](https://zillow.mediaroom.com/press-releases)
- **REA (Australia):** the company says its "audience and proprietary data firmly position the business as a leading beneficiary of AI" (FY26). No specific AI products were found in the fetched coverage — [Online Marketplaces](https://www.onlinemarketplaces.com/articles/rea-group-ends-fy26-with-flat-listings-and-double-digit-yield-growth/)

### Inferences
- Rightmove's H1 2026 numbers are the best public evidence that conversational AI search lifts engagement (+40% time on site) and lead intent (about 2x). That is a measurable benchmark for an NCR AI-first platform.
- No Indian incumbent has published comparable AI-search metrics. Their AI is used mostly in sales-side tooling (call analytics, lead scoring), which may raise lead volume without improving consumer trust.
- India is a mixed-language market. No evidence was found of Hindi or Hinglish voice and conversational search at the leaders, so this is likely white space for NCR, where Hindi is dominant.

### Gaps
- Primary-source launch announcements for 99acres, MagicBricks or Housing.com AI features (2025–2026) were not found because of the search-budget limit.
- No evidence either way on AI virtual staging, AI-written listing descriptions, or AI listing-fraud detection at Indian portals.
- The Zillow AI feature set (natural-language search, ChatGPT integration) could not be confirmed from primary sources. Zillow's Zestimate accuracy page returned 403.

---

## 5. User pain points and complaints (buyers, sellers, owners)

### Takeaway
Complaints are consistent across all portals and are structural:
- Ghost and outdated listings, and fake contact numbers
- Brokers posing as owners
- Constant sales calls pushing paid plans
- Throttled free listings
- Paid plans that deliver nothing, with relationship managers who disappear after payment
- No refunds
- Spam after enquiry, with no way to delete the account

Trustpilot scores for 99acres, MagicBricks and Housing.com are 1.1–1.2. Trustpilot has suppressed the ratings for NoBroker and Square Yards over guideline breaches (fake-review signals).

### Cited Findings
**Trustpilot (Oct 2026)**

| Platform | TrustScore | Reviews | Share of 1-star reviews |
|---|---|---|---|
| 99acres | 1.2 | 134 | 95% |
| MagicBricks | 1.1 | 290 | 98% |
| Housing.com | 1.1 | 165 | 99% |
| NoBroker | Suppressed (guideline breach) | 4,575 | 39% (47% 5-star) |
| Square Yards | Suppressed (guideline breach) | 847 | 19% (76% 5-star) |

- **99acres** complaint themes (Aug–Oct 2026):
  - "Multiple daily calls" from sales staff pushing premium upgrades, continuing after the listing is removed
  - RMs unreachable after payment; paid plans (₹5,999–₹22,000+) producing almost no leads
  - **Outdated "ghost listings"** of properties sold weeks or months earlier
  - Free listings throttled; no refunds
  - Source: [Trustpilot 99acres](https://uk.trustpilot.com/review/99acres.com)
- **MagicBricks** complaint themes (Aug–Oct 2026):
  - High-pressure sales before payment, no support afterwards
  - Premium tiers that deliver nothing; free listings throttled to zero views
  - Wrong or "out of service" numbers and failing OTP
  - Accounts deactivated before the paid term ends, with refunds denied
  - Sellers receiving "buy property" ads instead of buyer enquiries
  - Paid professional photography and verification declared "unavailable" after purchase
  - Source: [Trustpilot MagicBricks](https://au.trustpilot.com/review/magicbricks.com)
  - An earlier summary of MagicBricks reviews mentions "fake and old listings they just repost to show more options" and "dozens of people... calling you incessantly" after registration — [Trustpilot MagicBricks (DK)](https://dk.trustpilot.com/review/magicbricks.com)
- **Housing.com** complaint themes (2026):
  - One buyer (Aug 2026) said "100% of properties selected were fake listed with fake contact numbers" after buying premium
  - A developer's project was listed without promoter approval
  - The RM never called after the plan purchase; RMs refer brokers instead of owners
  - No refunds
  - Source: [Trustpilot Housing.com](https://www.trustpilot.com/review/housing.com)
- **NoBroker** complaint themes (Oct 2026):
  - "Zero property visits" after 50 days on a premium seller plan
  - Irrelevant buyer leads
  - RMs changed after payment; refunds delayed 9+ months
  - Fake visit alerts ("no one showed up")
  - Positive reviews name individual RMs
  - Source: [Trustpilot NoBroker](https://www.trustpilot.com/review/nobroker.in)
- **Square Yards** complaint themes (2026): "after sales service is pathetic", unmet promises, and a fraud allegation from a long-term investor (Jan 2026) — [Trustpilot Square Yards](https://www.trustpilot.com/review/squareyards.com)

**Google Play review samples (most-relevant reviews, Oct 2026)**
- 99acres:
  - "we are getting 10 calls per day suggesting to make payment to get genuine calls"
  - A paid seller says the assigned salesperson stopped answering after uploading photos
  - A subscriber cannot add photos and description text is forced to lowercase
  - Source: [Play 99acres](https://play.google.com/store/apps/details?id=com.nnacres.app&hl=en_IN)
- MagicBricks:
  - A subscription not activated after 4 days, and a "dysfunctional" chatbot
  - A "Titanium Pro" account deactivated within a week of a 6-month plan
  - A seller says there is no place to track lead dates
  - Source: [Play MagicBricks](https://play.google.com/store/apps/details?id=com.timesgroup.magicbricks&hl=en_IN)
- Housing.com:
  - "free for one day" listing, then 3+ sales calls a day
  - Contacts wasted on non-genuine callers asking "is it still available"
  - Owner numbers hidden unless the owner is paid
  - Premium buyers blocked after a "threshold limit"
  - Source: [Play Housing](https://play.google.com/store/apps/details?id=com.locon.housing&hl=en_IN)
- NoBroker:
  - Listing location and details wrong, and the house "not available for rent at all"
  - No permanent account deletion, with continuing calls from random numbers
  - Paid contact batches full of "wrong numbers... 'rented out'", with only 3 replacements allowed
  - Source: [Play NoBroker](https://play.google.com/store/apps/details?id=com.nobroker.app&hl=en_IN)

### Inferences
- The top pain points form a single chain: unverified supply leads to enquiries being sold to many brokers, which leads to spam calls, then a poor post-enquiry experience, then paid-plan disputes. Fixing one link alone (for example adding a "verified" badge) is not enough. An NCR entrant should design end to end:
  - Availability verification with expiry (listings auto-expire unless re-confirmed)
  - Masked communication with consent and rate limits
  - Buyer-controlled contact sharing
  - Transparent, outcome-linked seller pricing with automated refunds
- Account deletion and data-sharing complaints suggest a privacy-first positioning is a credible wedge, for example "your number is never shared or sold".
- RM quality is the single biggest driver of satisfaction in NoBroker and Square Yards reviews. AI agents (24x7 follow-up, visit scheduling, status updates) could make the good-RM experience consistent at lower cost.

### Gaps
- **Reddit evidence (r/india, r/delhi, r/gurgaon, r/IndiaInvestments) could not be collected**: the session search budget was exhausted and no thread URLs were available. Consumer-complaint forums (consumercomplaints.in, Voxya, National Consumer Helpline data) were also not collected.
- No quantitative data on fake-listing prevalence, spam calls per enquiry, or listing staleness at any Indian portal.

---

## 6. Developer- and broker-side complaints (lead quality, cost per lead, duplicate leads)

### Takeaway
Brokers report that portals sell each enquiry to 4–15 brokers at once with no exclusivity. Conversion is 1–4%, wrong-number and junk leads are common, sales teams go silent after payment, and refunds are refused. Speed-to-call, not quality, decides who wins a lead. This erodes value for both buyers (spam) and brokers (low ROI).

### Cited Findings
- "the same enquiry is sold to many brokers at once" — roughly **4 to 15 brokers per lead** in busy Tier-1 markets. Broker-reported conversion is "often 1-4% of enquiries turning into deals", and the broker "who calls in two minutes usually wins it" (Jul 2026) — [ClosingFox](https://closingfox.com/for-business-owners/99acres-vs-magicbricks-vs-housing/)
- Per-portal broker complaints (2026):
  - **99acres:** "fake or wrong-number leads", aggressive pre-sale teams, strict no-refund policy
  - **MagicBricks:** "sharpest junk lead accusations", outdated enquiries, post-payment silence
  - **Housing.com:** sales reps "ghost after payment"; some report "never received a single lead"
  - All three portals score 1/5 on exclusivity
  - "no portal publishes its lead-quality numbers"
  - Source: [ClosingFox](https://closingfox.com/for-business-owners/99acres-vs-magicbricks-vs-housing/)
- Developer-side: a project listed on Housing.com without promoter approval, with legal complaints unanswered (2026) — [Trustpilot Housing.com](https://www.trustpilot.com/review/housing.com)
- A paid developer/project subscriber on 99acres cannot add construction-update photos to an existing project, and the RM made no progress (2026) — [Play 99acres reviews](https://play.google.com/store/apps/details?id=com.nnacres.app&hl=en_IN)
- Global contrast:
  - Rightmove reports **96% agency retention**, the highest H1 in more than 10 years
  - Its top packages are taken by 36% of independent agents ("Optimiser Edge") and 36% of new-home developments ("Ascend")
  - ARPA is **£1,726/month** (+7%), and over 50% of new-homes leads either book an appointment or share availability (H1 2026)
  - Source: [Rightmove H1 2026 RNS](https://plc.rightmove.co.uk/content/uploads/2026/07/2026.07.31-Rightmove-final-RNS-H12026-unsigned.pdf)

### Inferences
- The shared-lead model is the root of buyer spam and broker frustration alike. A platform that offers **exclusive or capped-share leads**, AI-qualified before hand-off with budget, timeline, loan status and verified identity, could charge more per lead and still lower cost per closed deal. Rightmove's ARPA of about £1,726/month at 96% retention (2026) shows the UK pays far more for trusted leads than India's ₹899–₹75,000/month broker spend.
- Developers want appointment-quality leads rather than raw enquiries. Rightmove's metric (over 50% of new-homes leads booking or sharing availability) is a useful KPI to copy.

### Gaps
- No independent cost-per-lead (CPL) data for NCR developers on 99acres, MagicBricks or Housing (for example ₹/lead for Gurgaon luxury vs Noida mid-segment).
- No channel-partner (Anarock, Square Yards) complaints were collected.

---

## 7. Newer entrants: Aurum consolidation, NRI-focused, fractional, developer-direct, AI-first startups

### Takeaway
The biggest 2025–2026 structural change is consolidation. Aurum PropTech now owns PropTiger (2025) and Housing.com (announced Jul 2026) and pitches an "AI-native operating system". Fractional platforms like Strata are commercial-income products, not flat buy/sell competitors. Evidence on developer-direct online booking and 2024–2026 AI-first Indian proptech startups could not be gathered in this session.

### Cited Findings
- Aurum PropTech + Housing.com, announced 16 Jul 2026: all-equity deal, REA keeps 24.9% of Aurum. Aurum's CEO says "The real power lies in the data flywheel" — [Aurum PropTech](https://www.aurumproptech.in/pulse/media/aurum-proptech-acquires-housing-com-ai-real-estate-operating-system)
- Aurum acquired PropTiger in 2025 (headline: ₹86.45 Cr) — [Business Standard](https://www.business-standard.com/pti-stories/national/aurum-proptech-acquires-home-brokerage-platform-proptiger-for-rs-86-45cr-125072301075_1.html)
- Strata (fractional ownership; site checked Oct 2026):
  - Claims 1,00,000+ users, ₹3,800+ Cr AUM, 4.5+ Mn sq ft managed and ₹260+ Cr rent disbursed
  - Products include Strata Edge, for example a Bengaluru office asset at 8.88% gross entry yield and 13.05% target IRR
  - The page also shows unedited template text ("info@yourcompany.com", "Buy This Template"), which raises a quality flag
  - Source: [Strata](https://www.strataprop.com/)
- HomeCapital: the site (Oct 2026) shows a "HomeCapital Community" page for home-buying guidance. No product or traction data was found — [HomeCapital](https://www.homecapital.in/)
- Developer sites (Oct 2026):
  - Godrej Properties' homepage shows "Enquire Now", "Schedule a site visit", an NRI corner and "NRI Home Fest" — [Godrej Properties](https://www.godrejproperties.com/)
  - DLF's homepage shows an "NRI corner" and contact forms — [DLF](https://www.dlf.in/)
  - No "Book Online" or EOI keyword was found in the static HTML of either homepage, or of M3M's — [M3M](https://www.m3mindia.com/)

### Inferences
- With Aurum holding Housing.com, PropTiger and transaction businesses, the market now has four distinct models: a listings duopoly (99acres, MagicBricks), a vertically integrated Aurum/Housing stack, NoBroker's consumer-to-consumer marketplace plus services, and Square Yards' brokerage and fintech. An NCR AI-first entrant should place itself against all four.
- Developer-direct digital booking appears to be lead capture (enquiry, site visit) rather than end-to-end online transactions, based on homepage evidence only. Portals and channel partners therefore still carry the lead-generation role for developers.

### Gaps
- No sources were gathered on 2024–2026 AI-first Indian proptech startups: names, funding and products. The search budget was exhausted.
- No data on developer-direct online booking volumes (DLF, Godrej, M3M) or on how NCR launches sell through (EOI and cheque-based pre-launches vs online).
- No details on NRI-focused platforms beyond Square Yards' NRI positioning and the developer "NRI corners". hBits was Cloudflare-blocked. The SEBI SM-REIT framework was not researched.
- Anarock's channel-partner tech stack and partner count were not captured (JavaScript-rendered).

---

## 8. Global reference platforms: what they do that Indian platforms don't

### Takeaway
Global leaders build trust infrastructure and transaction-data transparency that Indian portals lack:
- **Verified-available listings**: Bayut TruCheck, Property Finder Verified
- **Government transaction data and AVMs** shown to consumers: Bayut Dubai Transactions and TruEstimate; Rightmove Sold House Prices and Instant Valuation; realestate.com.au sale history and estimates for every property
- **Agent quality badges**: TruBroker, SuperAgent
- **In-app pre-approval**: Zillow, realestate.com.au
- **Measured conversational AI**: Ask Rightmove

They also run healthier economics. REA has a 61% EBITDA margin and Rightmove a 69% operating margin (2026), built on trusted, high-ARPA agent subscriptions.

### Cited Findings
- **Bayut (UAE)**, app as of Oct 2026:
  - **TruCheck™** badge for listings "trusted, authentic and available", with a "TruCheck First" sort for properties "vetted by our team"
  - **TruEstimate™** AI valuations and **Dubai Transactions** market data
  - **TruBroker™** badge for agents "known for their high responsiveness and quality of service"
  - BayutGPT, commute-time search, floor plans and 360° tours
  - Rated 4.6 on Play (15.7K reviews) and 4.82 on iOS India
  - Source: [Play Bayut](https://play.google.com/store/apps/details?id=com.bayut.bayutapp&hl=en_IN)
  - The Dubai Land Department signed an MoU with Bayut in Jan 2022 to provide interactive market data and reports — [Wikipedia: Bayut](https://en.wikipedia.org/wiki/Bayut)
- **Property Finder (UAE/GCC)**, app as of Oct 2026:
  - "**Verified True listings**", so that pictures match the property, with "predefined verification steps"
  - **SuperAgent** "super-qualified agent" programme
  - WhatsApp contact, and DataGuru market data in the site navigation
  - Rated 4.3 on Play (8.67K reviews)
  - Source: [Play Property Finder](https://play.google.com/store/apps/details?id=ae.propertyfinder.propertyfinder&hl=en_IN); [Property Finder site nav](https://www.propertyfinder.ae/en/superagent)
- **Rightmove (UK):**
  - 2025 revenue £425.1M and operating income £287.9M. It **does not allow private sellers to advertise**, only agents. REA's £5.6bn approach (Sep 2024) was rejected — [Wikipedia: Rightmove](https://en.wikipedia.org/wiki/Rightmove)
  - H1 2026: revenue £225.8M (+7%); underlying operating margin 69%; 2026 revenue guidance cut to +6–8% because of weaker New Homes — [Rightmove H1 2026 RNS](https://plc.rightmove.co.uk/content/uploads/2026/07/2026.07.31-Rightmove-final-RNS-H12026-unsigned.pdf)
  - App features: Sold House Prices, Instant Valuation, AI keyword search, renter checklists — [Play Rightmove](https://play.google.com/store/apps/details?id=com.rightmove.android&hl=en_IN)
- **realestate.com.au (REA):**
  - Sold and rental history including auction results
  - "Search estimated value and sales histories for any property in Australia"
  - Property profile to track your own home's value
  - In-app conditional home-loan approval "you can use to bid at auction"
  - School data from government sources (ACARA)
  - Rated 4.7 on Play (77.6K reviews)
  - Source: [Play realestate.com.au](https://play.google.com/store/apps/details?id=au.com.realestate.app&hl=en_IN)
  - REA FY26 buy yield rose 13%, driven by a 7% Premiere+ price rise. FY27 guidance includes another 8% Premiere+ rise — [Online Marketplaces](https://www.onlinemarketplaces.com/articles/rea-group-ends-fy26-with-flat-listings-and-double-digit-yield-growth/)
- **Zillow (US):**
  - 2024 revenue $2.24bn, net loss $112M
  - Zillow Offers (iBuying) shut in Nov 2021 after a $420M Q3 2021 loss
  - Climate Risk Score added Sep 2024 and removed Nov 2025 after agent complaints
  - Compass sued in Jun 2025 over Zillow's 24-hour listing rule
  - Five states sued Zillow and Redfin in Oct 2025 over a rental agreement
  - Source: [Wikipedia: Zillow](https://en.wikipedia.org/wiki/Zillow)
  - App (Oct 2026): BuyAbility score, Verified Pre-approval, Zillow Preview, Sky Tours 3D; rated 4.8 on Play (16.7 lakh reviews, 5 Cr+ installs) — [Play Zillow](https://play.google.com/store/apps/details?id=com.zillow.android.zillowmap&hl=en_IN)
- **Opendoor (US iBuyer):**
  - 2022 revenue $15.6bn with a $1.4bn loss, and about $28K average loss per home in Q4 2022
  - 2024 revenue $5.15bn, net loss $392M
  - CEO Kaz Nejatian appointed Sep 2025
  - Source: [Wikipedia: Opendoor](https://en.wikipedia.org/wiki/Opendoor)
  - The app offers an "estimated offer in minutes" and, in select markets, listing with a local agent (Oct 2026) — [Play Opendoor](https://play.google.com/store/apps/details?id=com.opendoor.buyerapp&hl=en_IN)
- **Compass (US):** acquired Anywhere Real Estate (Coldwell Banker, Century 21, Sotheby's and others) in Jan 2026. 2025 revenue $6.961bn, net loss $58M; about 340,000 agents and associates — [Wikipedia: Compass](https://en.wikipedia.org/wiki/Compass,_Inc.)
- **Redfin (US):**
  - Acquired by Rocket Companies on 1 Jul 2025 — [Wikipedia: Redfin](https://en.wikipedia.org/wiki/Redfin)
  - The app says MLS listings refresh about every 2 minutes, with draw-on-map search, commute search and Rocket Mortgage pre-approval (Oct 2026) — [Play Redfin](https://play.google.com/store/apps/details?id=com.redfin.android&hl=en_IN)
- **PropertyGuru (Singapore):** free-text keyword search, PSF filters and a "My Enquiries" tracker across call, SMS and WhatsApp (Oct 2026); rated 4.4 on Play (6.29K reviews) — [Play PropertyGuru SG](https://play.google.com/store/apps/details?id=com.allproperty.android.consumer.sg&hl=en_IN)

### Inferences
**What global leaders do that Indian portals largely don't (as evidenced):**
1. **Availability-verified listings with a visible badge and sort.** Bayut TruCheck and Property Finder Verified are backed by a regulator data link (Dubai Land Department MoU). Indian "verified" labels coexist with widespread ghost-listing complaints.
2. **Consumer-facing government transaction data.** Bayut Dubai Transactions, Rightmove Sold House Prices and realestate.com.au sale history are shown for every property. MagicBricks PropWorth and 99acres claim "registry"-based transaction prices, but coverage and method are opaque.
3. **AVMs with credible positioning.** TruEstimate, Rightmove Instant Valuation, REA estimates and Zestimate. MagicBricks' "98% accurate" claim has no published error method.
4. **Agent quality tiers.** TruBroker and SuperAgent are based on responsiveness and quality. Indian portals rank paying brokers rather than good ones.
5. **Financing built into the flow.** Zillow Verified Pre-approval and realestate.com.au conditional approval. Indian portals offer loan referrals, not pre-approval-linked search.
6. **Measured conversational AI.** Ask Rightmove, with published metrics.
7. **Clear segmentation of who may list.** Rightmove is agent-only. Mixed owner/broker feeds in India let brokers pose as owners.

- The Opendoor and Zillow Offers history shows that iBuying is capital-intensive and volatile (Zillow lost $420M in Q3 2021; Opendoor lost $1.4bn in 2022). An NCR entrant should avoid balance-sheet iBuying and could explore an "instant estimated offer" to generate leads without buying inventory.
- Zillow's 2025 climate-score reversal shows that transparency features can provoke agent backlash. Expect similar pushback from NCR brokers on price transparency, so design for it.

### Gaps
- No primary sources for: Zillow Zestimate accuracy statistics (page 403), Zillow 2025/2026 financials, Bayut TruCheck methodology and the Trakheesi/DLD permit linkage, Property Finder financials, PropertyGuru's EQT take-private (Wikipedia 404), Zoopla, Opendoor 2025–2026 results.

---

## 9. Synthesis: what incumbents do well, what they neglect, and white space for an AI-first Delhi NCR platform

### Takeaway
Incumbents do well at supply breadth, SEO traffic, project content and adjacent services. They neglect trust (availability and identity verification), lead hygiene (spam, resold leads), post-enquiry and post-payment service, price transparency, and Hindi-first conversational UX.

The clearest white space is a **trust-and-outcome layer** for NCR resale and new flats:
- Verified-available listings tied to owner/RERA/registry checks
- AI-qualified, consent-based, capped-share leads
- Transparent registry-backed pricing and a published-accuracy AVM
- AI agents that handle follow-up end to end
- Outcome-based seller pricing

### Cited Findings
- **Do well:**
  - Breadth: 4M+ properties on 99acres and 10 lakh+ on MagicBricks (2026) — [Play 99acres](https://play.google.com/store/apps/details?id=com.nnacres.app&hl=en_IN); [Play MagicBricks](https://play.google.com/store/apps/details?id=com.timesgroup.magicbricks&hl=en_IN)
  - Project content: RERA documents, progress reports, free site-visit cabs (MagicBricks 2026) — [Play MagicBricks](https://play.google.com/store/apps/details?id=com.timesgroup.magicbricks&hl=en_IN)
  - Resident society reviews (99acres 2026) — [Play 99acres](https://play.google.com/store/apps/details?id=com.nnacres.app&hl=en_IN)
  - Adjacency revenue: NoBroker financial services at about 22% of revenue (2026) — [Inc42](https://inc42.com/features/nobrokers-future-is-beyond-home-listings-but-will-profits-follow/); Square Yards Urban Money (FY26) — [Square Yards](https://www.squareyards.com/blog/square-yards-crosses-rs-2000-crore-revenue-fy26)
- **Neglect:**
  - Ghost listings, spam calls and post-payment abandonment (Trustpilot 1.1–1.2 for the three big portals, 2026) — [99acres](https://uk.trustpilot.com/review/99acres.com); [MagicBricks](https://au.trustpilot.com/review/magicbricks.com); [Housing.com](https://www.trustpilot.com/review/housing.com)
  - Leads resold to 4–15 brokers (2026) — [ClosingFox](https://closingfox.com/for-business-owners/99acres-vs-magicbricks-vs-housing/)
- **Benchmark proof points for an AI-first design:** Ask Rightmove gives +40% time on site and about 2x lead propensity; Online Agent Valuation gives +50% valuation leads (H1 2026) — [Rightmove RNS](https://plc.rightmove.co.uk/content/uploads/2026/07/2026.07.31-Rightmove-final-RNS-H12026-unsigned.pdf). Bayut combines TruCheck, TruEstimate and TruBroker (2026) — [Play Bayut](https://play.google.com/store/apps/details?id=com.bayut.bayutapp&hl=en_IN)
- **Market structure:**
  - 99acres only reached quarterly breakeven in Q4 FY26 and lost about ₹59 Cr in FY26 — [PropNewsTime](https://propnewstime.com/getdetailsStories/MzA3NDg=/99acres-revenue-rises-but-fy26-losses-persist-amid-growth-investments)
  - REA exited India in 2026 — [Aurum](https://www.aurumproptech.in/pulse/media/aurum-proptech-acquires-housing-com-ai-real-estate-operating-system)
  - NoBroker remains loss-making (2026) — [PropNewsTime](https://propnewstime.com/latestnewsstories/MzczOTI=/nobroker-targets-profitability-within-8-10-months-as-fy26-revenue-crosses-inr-1-000-crore)

### Inferences
**White-space opportunities for an AI-first Delhi NCR buy/sell platform** (inferences, prioritised):
1. **"Verified & Available" listings as the default.**
   - Owner identity check (e.g., Aadhaar/DigiLocker e-KYC), property-ownership check against registry or society records, RERA ID match for new projects, and photo geo/EXIF checks.
   - AI re-confirmation pings (WhatsApp) that auto-expire stale listings, such as every 7–14 days.
   - Brokers must disclose they are brokers (separate feed), as on Rightmove/Bayut.
   - *Note: the specific Indian KYC and registry integrations named here were not researched in this session.*
2. **Consent-based, capped-share leads.**
   - Buyer numbers are masked, and buyers choose who may call.
   - An AI agent pre-qualifies on budget, timeline, loan readiness and NCR micro-market.
   - Each lead goes to at most 1–3 partners, with the cap published. This addresses buyer spam and broker CPL waste at once.
3. **NCR price transparency.**
   - Registry-backed transaction prices by society and tower (Gurgaon, Noida, Greater Noida West, Ghaziabad, Dwarka/Delhi).
   - An AVM with published median error by micro-market (Zestimate/Rightmove style), unlike MagicBricks' unverifiable "98%".
4. **Hindi/Hinglish conversational and voice search, plus WhatsApp-native flows.** No incumbent evidence was found. Rightmove's data suggests conversational search roughly doubles lead propensity.
5. **AI "co-pilot" for the post-enquiry journey.**
   - Visit scheduling, follow-ups, document checklist (title, OC/CC, RERA, society NOC)
   - Loan pre-approval linked to search (as Zillow and REA do)
   - Negotiation support
   - This targets the post-payment RM abandonment that dominates complaints.
6. **Outcome-based seller pricing with automated, rule-based refunds.** This reduces the refund disputes seen in NoBroker's MoneyBack and the other portals' prepaid plans.
7. **Agent quality scores** built on verified responsiveness and closed deals (TruBroker/SuperAgent style) rather than spend tier.
8. **Privacy as a feature:** one-tap account deletion and a no-data-resale pledge. This responds directly to complaints about inability to delete accounts and continuing spam.
- **Risks:**
  - The incumbents' traffic moat (SEO, apps)
  - Broker backlash against transparency (Zillow's climate-score precedent)
  - Data access for registry pricing
  - Aurum/Housing.com's stated AI-native roadmap, a likely fast-follower

### Gaps
- No NCR-specific consumer research (survey or Reddit) to rank these pain points by frequency.
- No data on NCR registry data accessibility (UP IGRS, Haryana, Delhi DORIS) or on legal limits on publishing transaction prices. The specific KYC and registry integrations proposed above were not researched.
- No evidence on unit economics (CAC, CPL, take rates) for NCR resale specifically.
