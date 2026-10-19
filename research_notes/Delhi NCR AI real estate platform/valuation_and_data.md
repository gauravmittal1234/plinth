# Valuation, Appreciation, Resale-Liquidity and Rental Prediction for Delhi NCR Flats: Data, Methods and Drivers (research as of 17 Oct 2026)

Note on method and sources: Research done on 17 Oct 2026 with web search and fetch. The shared web-search budget ran out partway through, so some sub-questions were checked only by fetching pages directly, and a few are listed as gaps. Each source's date is given where known. Labels used below: "[secondary]" means a broker or SEO blog, or a news summary rather than the original publisher. Treat those figures as indicative, not authoritative.

---

## 1. Transaction price data: what IGR/registration portals expose and what data vendors sell

### Takeaway
All three NCR jurisdictions run free, public, per-record deed search portals: Delhi DORIS/NGDRS, Haryana Web-HALRIS (jamabandi.nic.in) and UP IGRSUP. All three are built for checking one property or one party at a time. None is a bulk or API feed, so getting sale-deed prices at scale means either scraping and OCR-ing documents or buying the data. Gurugram's registration data also had a serious quality problem in Oct 2026: 25,000 deeds were filed under the same fake PAN. Several Indian vendors already abstract registration data: PropEquity, Liases Foras, Square Yards, CRE Matrix/IndexTap, Propstack and Zapkey. Coverage is strongest in Mumbai and Pune, and none publishes a price list for NCR data.

### Cited Findings
**Government portals**
- **Delhi:** The Delhi Revenue Department says there is "no fee for search of details of past registration of properties." Searches run through revenue.delhi.gov.in and doris.delhigovt.nic.in. Records from 2002 onwards are on DORIS (login required). Documents from before 1993 are in the Delhi Archives e-search (archives.delhi.gov.in/abhilekh). — [Delhi Revenue Dept](https://revenue.delhi.gov.in/revenue/important-information-regarding-registration-property)
- **Delhi:** DORIS lists e-Search, Search Registered Deed, B-BOOK (certified copies and inspection) and a "Prohibited Properties" list. A notice on the portal says all Sub-Registrar offices have moved to the NGDRS portal and are no longer active in DORIS. — [DORIS portal](https://doris.delhigovt.nic.in/) (seen via search snippet); [ghar.tv explainer, secondary](https://www.ghar.tv/blog/doris-delhi-complete-guide-to-property-registration-in-delhi/artid1853)
- **Delhi:** A separate deed-document scan service exists at scan.delhigovt.nic.in ("Deed Doc"). — [scan.delhigovt.nic.in](https://scan.delhigovt.nic.in/)
- **Haryana:** Web-HALRIS (jamabandi.nic.in), run by the Revenue Department, has a "Property Registration → Deed Search" function. You pick district, tehsil and year, then search by buyer or seller name or by deed number. Jamabandi (record of rights), mutation and registration records can be searched by owner name, khewat or khasra number. — [NoBroker forum, secondary](https://www.nobroker.in/forum/how-to-check-registry-of-property-in-haryana/); [99acres, secondary](https://www.99acres.com/articles/land-records-online-in-haryana.html); [Paisabazaar, secondary](https://www.paisabazaar.com/home-loan/jamabandi-haryana-land-records/)
- **UP (Noida, Greater Noida, Ghaziabad):** igrsup.gov.in has "Online Search" by property, village, document or map. For Gautam Buddh Nagar you can search by owner name, property number or registration year, and the portal also offers encumbrance (EC) and stamp-duty tools. — [Kotak IGRS UP guide, secondary](https://www.kotak.bank.in/en/stories-in-focus/loans/home-loan/igrs-up-guide.html); [Godrej Properties blog, secondary](https://www.godrejproperties.com/blog/igrsup-portal-land-records-and-property-details-verification); [Bhavishya Nirman, secondary](https://bhavishyanirman.com/blog/how-to-check-flat-ownership-in-noida/)
- **Gurugram data-quality warning (12 Oct 2026):**
  - An Income Tax I&CI (Chandigarh) survey found about 25,000 property registrations in Badshahpur tehsil, Gurugram, filed over two years under the same fake PAN "ABCDEF1234".
  - Another 10,000–12,000 transactions worth about ₹15,000 crore were not reported at all.
  - Over 35,000 deals worth ₹55,000 crore had reporting gaps.
  - Only 45 of Haryana's 140 tehsildars had filed Statements of Financial Transactions by 8 Oct.
  - — [PropNewsTime, 12 Oct 2026](https://propnewstime.com/latestnewsstories/MzgxNTA=/gurugram-property-registrations-under-scrutiny-after-25-000-deals-use-same-fictitious-pan)

**Commercial data vendors**
- **PropEquity (P.E. Analytics Ltd, NSE-listed, founded 2008):**
  - Products: PE Plus (residential and commercial business intelligence), PropBuild (construction and manufacturing leads), PropEdge Valuations (retail valuation and project-finance monitoring) and Catchment Area Analysis (geospatial).
  - Coverage: 182,000+ projects, 52 cities, 65,000+ developers, data back to 2006.
  - Delivery: SaaS plus API access. Pricing is not public (demo and quote only). — [PropEquity homepage](https://www.propequity.in/)
  - One summary of its FY25 annual report cites 6 million property registration records covering the past 13 years and 200+ B2B clients. Annual subscription fees depend on vertical and number of cities, with Tier-1 cities priced higher. — [PropEquity Annual Report 2024-25](https://www.propequity.in/investorrelations/AnnualReport_2024-25.pdf) (via search summary); [Wikipedia: Propequity](https://en.wikipedia.org/wiki/Propequity)
- **Liases Foras (Mumbai, founded 1998, DMGT invested $5M):**
  - RESSEX is its online project-performance and risk-rating database.
  - Property Science is its AVM. It combines four data layers:
    - primary data from tracking 20,000+ live projects in field surveys;
    - listing data on about 1 million properties;
    - "up-to-date mapping of 5 million legal transactions" (registration data);
    - RERA data.
  - Coverage is 60 cities, including Delhi. The method is a proprietary "Urban Price Setting Model": multivariate regression on distance, economic density, surroundings and product quality.
  - Pricing: basic valuation free; premium ₹499 per valuation (includes comparables, guideline values, catchment data and Price Correction Risk); enterprise bulk subscriptions on request. — [Liases Foras Property Science](https://ps.liasesforas.com/); [Inc42 on DMGT funding](https://inc42.com/flash-feed/liases-foras-funding/); [old.liasesforas.com](https://old.liasesforas.com/)
- **Square Yards:**
  - Says it has published registration-based transaction data for 1.4 lakh buildings and projects, covering 8.6 million transactions across India's top 10 cities. — [Construction Week, via search snippet; page returned 403](https://www.constructionweekonline.in/business/square-yards-brings-price-transparency-in-real-estate-with-actual-recorded-history-of-transaction-prices)
  - Bought PropsAMC (real estate data and analytics) in 2021 and Azuro (rental/property management) in 2020. — [Wikipedia: Square Yards](https://en.wikipedia.org/wiki/Square_Yards_(company))
  - Publishes registration-based research such as "2025 Recap, 2026 Outlook" (Apr 2026). — [Square Yards PDF](https://www.squareyards.com/blog/wp-content/uploads/2026/04/2025-Recap-2026-Outlook-Residential-Real-Estate.pdf)
- **CRE Matrix / IndexTap:**
  - IndexTap is a CRE Matrix product (founded 2021, Mumbai) offering comparable transaction data for residential, commercial and loan deals, including rent transactions. — [IndexTap](https://www.indextap.com/); [IndexTap rent search](https://www.indextap.com/search?SearchForm%5Btype%5D=rent&SearchForm%5Bcity%5D=Mumbai); [Tracxn](https://tracxn.com/d/companies/indextap/__9MIcxvYQHv9x33LrkNdsVvVQH4lv8we4Hglp6luT9TM)
  - Its consumer coverage is described as Mumbai and Pune. — [Inc42 company page](https://inc42.com/company/indextap/)
  - CRE Matrix publishes NCR sales statistics: Gurugram 20,393 units and Noida 19,017 units sold in 2025; 64% of Gurugram units priced above ₹5 crore; Gurugram average ticket ₹5.21 crore. — [CRE Matrix blog, via search summary](https://www.crematrix.com/blog/pan-india-real-estate-2025-trends-sales-data-city-insights/)
- **Propstack (Mumbai, 2013):** Subscription SaaS focused on commercial real estate. It claims "the largest private repository of registered sale, lease, and mortgage information in India," abstracted from registered agreements, and covers Mumbai, Pune, Bangalore, Chennai, NCR, Hyderabad and Kolkata. — [Propstack news page](https://www.propstack.com/news/propstack-ready-to-seize-commercial-real-estate-opportunity-in-india/); [Tracxn](https://tracxn.com/d/companies/propstack/___EGi8bZ5SjBVDoKrWsj0rJeXalT3SvyA6SR0KdOGWdI)
- **Zapkey (Mumbai, 2020):**
  - Aggregates public registration data on residential purchases, sales and leases.
  - Pivoted toward a "home sale guarantee": it sells a home within 90 days at a pre-agreed price or buys it at that price.
  - Has raised about $2.65M (including a $2M round in Mar 2022 from Gruhas Proptech and Blume Founders Fund).
  - — [Tracxn](https://tracxn.com/d/companies/zapkey/__VH8k93joR4tPE_XtvoXpr3OCfC2m_lIZCb-OLMSoq_I); [Entrackr 2022](https://entrackr.com/2022/03/zapkey-raises-2-mn-from-gruhas-proptech-blume-founders-fund-others/); [Zapkey /sell](https://www.zapkey.com/sell)
- **ANAROCK Research:** Publishes micro-market reports, such as the Dwarka Expressway report (Aug 2022), and annual residential updates. — [ANAROCK Dwarka Expressway report](https://websitemedia.anarock.com/media/Dwarka_Expressway_Micro_Market_Report_e3f8f559a0.pdf); [ANAROCK Annual Report 2024](https://websitemedia.anarock.com/media/ANAROCK_Research_Indian_Residential_Market_Annual_Update_2024_3b5aa5b04d.pdf)

### Inferences
- The founder's question assumes Zapkey was acquired. I found no evidence of that. Tracxn lists it as active, and it now sells a sale-guarantee product.
- Practical data paths, ranked by cost and effort:
  1. **License registration abstracts.** PropEquity (6M records), Liases Foras (5M) or Square Yards (8.6M across 10 cities) would give the fastest start. Ask each for NCR-specific record counts, years, fields (consideration value, carpet or super area, floor, tower/unit, stamp duty) and the right to use the data inside a consumer AVM.
  2. **Build your own pipeline from the IGR portals.** Deed search works by party name or deed number per tehsil and year, so bulk extraction would need systematic querying plus OCR of scanned deeds. That raises legal, terms-of-use and DPDP issues (see Section 9) and is fragile when portals change, as Delhi's DORIS-to-NGDRS move shows.
  3. **Partnerships.** Banks, HFCs and valuers hold valuation reports (NHB builds RESIDEX from these). Brokers and developers hold actual deal prices.
- Registered consideration in NCR is likely to be biased downward, because circle rates sit far below market (Section 2) and deeds may be under-declared. The Gurugram PAN episode suggests party-level data is unreliable. Any AVM trained on deeds needs outlier filtering, and possibly a model of how far deed values sit below the "true" price.
- Noida flats in stalled or legacy projects without registries (Section 7) will not appear in IGR data at all. That creates selection bias in exactly the stock where liquidity risk is highest.

### Gaps
- No published prices or NCR-specific coverage counts for any vendor, except Liases Foras's ₹499 per report. Vendors quote on demand.
- I could not confirm which fields each NCR portal shows on screen (for example, whether consideration value is visible in search results or only in the scanned deed), or whether certified copies are needed to see prices.
- No information on Delhi NGDRS bulk access, on Haryana/UP open-data releases of registration data, or on whether the RBI shares its registration microdata (it receives transaction-level data from registration authorities; see Section 2).
- I did not establish Zapkey's current NCR coverage or confirm an acquisition. The premise appears unsupported.

---

## 2. Official indices: RBI HPI, NHB RESIDEX, and circle rates as floor values

### Takeaway
The RBI HPI is quarterly, covers 18 cities including Delhi, and is built from registration-authority transaction data (base 2022-23). That makes it the best official benchmark for NCR price trends. NHB RESIDEX covers 50 cities but uses bank and HFC valuation data. Circle rates are statutory floors that often sit far below market. Delhi's have not been revised in about a decade, while Gurugram reportedly moved them up 15–75% for 2026.

### Cited Findings
- **RBI HPI release, 29 May 2026 (Q4 FY2025-26):** Base year 2022-23, 18 major cities, compiled from "transaction-level data received from the registration authorities." The all-India index rose to 115.9 from 115.6 the previous quarter (+0.2% QoQ, +4.2% YoY vs 3.8% a year earlier). Time series are on DBIE (data.rbi.org.in → Statistics → Real Sector → Prices & Wages). — [RBI press release](https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=62833)
- **RBI HPI Q2 FY2025-26 (released Nov 2025):** All-India YoY slowed to 2.2% (from 7% a year earlier) and QoQ was −0.6% (113.4 → 112.7). Ghaziabad was among the cities supporting gains. The base year changed from 2010-11 to 2022-23. — [Upstox, 28 Nov 2025](https://upstox.com/news/personal-finance/latest-updates/top-insights-from-rbi-housing-prices-index-5-points-2/article-185409/)
- **City-level HPI series** (including Delhi) are republished as a dataset by Dataful and the BIS (via FRED). — [Dataful](https://dataful.in/datasets/17611/); [FRED QINR628BIS](https://fred.stlouisfed.org/series/QINR628BIS)
- **NHB RESIDEX:**
  - Launched July 2007 as India's first official HPI. Originally half-yearly, quarterly since 2010.
  - HPI@Assessment Prices covers 50 cities across 21 states and is "based on valuation data of residential properties received from Banks and HFCs."
  - Method: weighted average, Price Relative Method (modified Laspeyres).
  - Each city is segmented by municipal or property-tax zones, and locations are chosen for spatial spread.
  - — [NHB White Paper on RESIDEX methodology](https://www.nhb.org.in/wp-content/uploads/2020/08/WHITE-PAPER-NHB-RESIDEX-METHODOLOGY.pdf); [NHB About Residex](https://www.nhb.org.in/about-residex/) (via search snippet; the direct fetch failed on an SSL error)
- **Delhi circle rates:**
  - Current rates (₹/sq m of land) are: A 7,74,000; B 2,45,520; C 1,59,840; D 1,27,680; E 70,080; F 56,640; G 46,200; H 23,280.
  - A first-in-a-decade revision has been "under review since June 2025," with reported proposals of +6–7% for category A, +10–30% for B–H, and a new A+ band. It was not notified at the time of these sources.
  - — [99acres, secondary](https://www.99acres.com/articles/circle-rates-in-delhi.html); [Prateek Properties, secondary](https://prateekproperties.com/circle-rate-in-delhi)
- **Gurugram circle rates 2026:**
  - Reported revisions of 15–75%, steepest on Dwarka Expressway and SPR.
  - SPR sectors 63–67 residential rates rose about 45% (₹58,500 → ₹84,825 per sq yd).
  - Dwarka Expressway commercial rates rose up to 75% (to about ₹2,04,750 per sq yd).
  - — [BW Businessworld, via search snippet; page returned 403](https://www.businessworld.in/article/emerging-corridors-drive-up-to-75-circle-rate-hike-in-gurugram-report-602616); [Haryana.com, secondary](https://www.haryana.com/blog/gurugram-circle-rates-2026)
- **Circle-rate vs market gap:** On Golf Course Road, Gurugram, actual transactions often exceed ₹50,000–60,000/sq ft, and a 10% circle-rate hike "barely keeps pace with the market." — [Zee Business](https://www.zeebiz.com/real-estate/news-will-higher-circle-rates-make-home-buying-costlier-in-gurugram-experts-weigh-in-394078)

### Inferences
- Use the RBI HPI (Delhi; plus Ghaziabad, which appears in RBI commentary) as a macro calibration and back-testing anchor for appreciation models. It is too coarse, with no micro-market detail, to drive flat-level forecasts.
- RESIDEX reflects bank valuers' assessments rather than prices. It is useful as a second signal, especially if NCR satellite cities are among its 50, but it inherits valuer smoothing and lag.
- Circle rates work as (a) a hard floor or sanity check on any estimate, (b) a feature, since the circle-rate category or band encodes a government view of locality quality, and (c) a predictor of how far deed values are under-declared. When circle rates jump, as in Gurugram 2026, declared deed values in the registration data should jump too, even if market prices do not. Models must not mistake this for appreciation.

### Gaps
- Delhi's own RBI HPI figures could not be verified. One search summary said Delhi's HPI was 96.22 in Q1 FY2026-27 (implying a decline from the 2022-23 base), which would conflict sharply with ANAROCK's +47% for Delhi from 2019 to 2026 (Section 5). I could not trace this to a primary RBI table, so treat it as unverified. If it is true, the gap probably reflects the difference between a registration-based index dominated by resale and builder-floor deeds and ANAROCK's primary-market launch prices. Worth checking in DBIE.
- NCR cities in RESIDEX's 50 and the latest RESIDEX quarter are not confirmed (fetch failed).
- Noida/Ghaziabad (UP) circle-rate revision dates for 2025-26 were not researched.
- The effective date of the Gurugram 2026 revision was not confirmed in a primary notification.

---

## 3. Listing (asking-price) data and the asking-vs-transaction gap

### Takeaway
Portals (Magicbricks, 99acres, Housing.com) are the densest source of attribute-rich data in NCR and already run listing-trained valuation tools. I found no rigorous public study of the asking-vs-registered price gap in NCR. It has to be measured in-house by matching listings to deeds.

### Cited Findings
- **Magicbricks PropWorth (July 2024):** An ML valuation tool "trained on 15 years of data and over 30 million listings," covering 50,000 projects in 5,500 localities across 30 cities (apartments, independent houses, villas). Magicbricks claims "98% accuracy," but the metric is not defined. — [Construction Week](https://www.constructionweekonline.in/business/magicbricks-launches-propworth-instant-valuation-for-50000-properties); [Devdiscourse](https://www.devdiscourse.com/article/business/3011106-magicbricks-launches-propworth-valuation-tool-for-accurate-property-estimates); [Odisha Today](https://odishatoday.com/2024/07/12/magicbricks-unveils-propworth-offers-instant-property-valuation-for-50000-projects-across-5500-localities/)
- **Housing.com (a PropTiger group company):** Reportedly offers a free estimator. You enter address or PIN, property type and built-up area, and it shows a min–max range. — [search summary; underlying page not verified](https://www.bajajfinserv.in/home-valuation-calculator); [TechCrunch on the PropTiger–Housing.com merger](https://techcrunch.com/?p=1437124)
- **Liases Foras** blends listing ("secondary") data on about 1M properties with registration and primary survey data. In other words, listings alone are treated as insufficient. — [Liases Foras Property Science](https://ps.liasesforas.com/)
- **US evidence:** Zillow's on-market Zestimate is much more accurate (about 2% median error vs about 7% off-market), partly because it moves toward the list price once a home is listed. — [Wikipedia: Zillow](https://en.wikipedia.org/wiki/Zillow); [Houwzer, secondary](https://houwzer.com/blog/the-zillow-zestimate-can-it-be-trusted/)

### Inferences
- NCR listings typically report super built-up area, while deeds may report carpet or super area. Prices are often quoted "all-inclusive" vs base price, and duplicates and broker re-posts are common. A cleaning layer is needed before training: dedupe, normalise area type, and parse tower, floor and facing.
- Recommended approach: build a matched panel (listing ↔ registered deed for the same society, tower and size within a time window) to estimate an asking-to-transaction discount by micro-market, price band and age. Use it to convert listing-based estimates into transaction-equivalent values. The gap will be confounded by deed under-declaration (Section 2), so the "true" price likely lies between the two.
- Scraping portals raises terms-of-use and legal risk (Section 9). A data partnership or licence with a portal, or with a broker network, may be safer.

### Gaps
- No quantified NCR asking-vs-transaction gap (in % or by segment) was found from any credible source.
- PropWorth's and Housing.com's accuracy methodology was not disclosed in what I found.
- Magicbricks PropIndex, 99acres and Housing.com research price-trend series were not examined (search budget ran out).

---

## 4. AVM methods and accuracy: global benchmarks, Indian products, bank valuation practice

### Takeaway
The main AVM families are comparable-sales, hedonic regression, repeat-sales indices, and ML ensembles, increasingly multimodal with photos. Best-in-class US AVMs reach about a 2% median error on listed homes and about 7–8% off-market. That depends on dense, accurate, public transaction data, which NCR lacks. In India, AVMs are mostly portal or vendor tools (PropWorth, Liases Foras) with unverified accuracy claims, while lending still relies on human empanelled valuers under RBI rules. RICS now explicitly allows AVM-based bank valuations from 2026, with conditions.

### Cited Findings
- **Method families:**
  - Comparables-based AVMs pick comparable properties, as appraisers do. Hedonic models apply pre-estimated coefficients for property attributes without picking comparables.
  - Systems that combine models give each a confidence score and weight them by it.
  - Stated limitations: AVMs ignore property condition, perform poorly on new builds and large apartment blocks, rely on transaction data that lags three to six months, and work best on "generic" housing stock.
  - — [Wikipedia: Automated valuation model](https://en.wikipedia.org/wiki/Automated_valuation_model)
- **Zillow Zestimate:**
  - Zillow says it is "usually off by as much as approximately 7% for most homes that are not currently listed for sale, and almost 2% for homes that are for sale."
  - The typical US error was $14,000 in July 2016.
  - The algorithm was updated in June 2021 to be "more responsive to local trends and seasonality."
  - Zillow Offers, its iBuying arm that relied on pricing algorithms, lost $420M in Q3 2021. It was shut down in Nov 2021 with about 7,000 homes in inventory and a 25% workforce cut.
  - — [Wikipedia: Zillow](https://en.wikipedia.org/wiki/Zillow)
  - 2026 secondary sources quote about 1.9% on-market and about 7.0% off-market median error (ranges cited: 1.74–2.4% and 7.06–7.49%). — [Houwzer, secondary](https://houwzer.com/blog/the-zillow-zestimate-can-it-be-trusted/); [Irina Norrell, secondary](https://irinanorrell.com/how-accurate-is-zillows-zestimate/)
- **Redfin Estimate:** National median error reported at 1.98% on-market and 7.72% off-market. Error is much higher in data-sparse states, for example Maine at 12.89% off-market. — [Real Estate Witch, secondary](https://www.realestatewitch.com/redfin-home-value-estimator/); [Clever, secondary](https://listwithclever.com/real-estate-blog/how-accurate-is-a-redfin-home-value-estimate/)
- **RICS standards:**
  - The new professional standard "Bank lending valuations and mortgage lending value" was published Oct/Dec 2025 and takes effect 1 Jan 2026. It allows AVMs to estimate market value and mortgage lending value.
  - The Red Book was updated with mandatory standards on AVMs, automation and AI. An AVM output reviewed with a surveyor's professional judgement counts as a written valuation.
  - AVMs may be used only for property types that are sufficiently uniform and trade in a reasonably active market, and firms must check that data is adequate.
  - — [RICS standard PDF](https://www.rics.org/content/dam/ricsglobal/documents/standards/Bank-lending-valuations-and-MLV_2nd-edition_Dec2025.pdf); [RICS Red Book Global](https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/valuation-standards/red-book/red-book-global); [RICS AVM Roadmap](https://www.rics.org/content/dam/ricsglobal/documents/standards/rics_avm_roadmap.pdf)
- **Multimodal AVMs:** Academic work on AVMs that combine tabular, text and image data exists, e.g., "Artificial Intelligence and Real Estate Valuation: The Design and Implementation of a Multimodal Model," *Information* 16(12):1049 (2025). — [MDPI](https://www.mdpi.com/2078-2489/16/12/1049). RICS responsible-AI valuation case study: — [RICS](https://www.rics.org/profession-standards/rics-standards-and-guidance/conduct-competence/responsible-use-of-ai/ruai-case-studies-02)
- **India-specific ML papers:** These are mostly student or conference work on scraped listing datasets.
  - A Delhi study using Random Forest on 7,738 records reported R² of about 0.92. — [ResearchGate](https://www.researchgate.net/publication/406987448_House_Price_Prediction_Using_Machine_Learning_Techniques)
  - A GitHub project on 12,000+ Delhi records reported RF R² of about 0.913. — [GitHub](https://github.com/sujal05v/Delhi-House-Price-Prediction)
  - Gradient boosting often performs best in such comparisons. — [Springer chapter](https://link.springer.com/chapter/10.1007/978-981-96-6906-6_41)
- **Indian AVM products:**
  - Liases Foras Property Science: regression-based, 60 cities, ₹499 per report, includes comparables and a "Price Correction Risk" score. — [Liases Foras](https://ps.liasesforas.com/)
  - Magicbricks PropWorth: ML on 30M+ listings, claims 98% accuracy (Section 3).
  - PropEquity PropEdge Valuations: for retail valuation and project finance. — [PropEquity](https://www.propequity.in/)
- **Bank valuation practice (RBI framework):**
  - Banks need a Board-approved property valuation policy and valuations by independent, professionally qualified valuers with no conflict of interest.
  - They keep an empanelled "approved list of valuers."
  - Two independent valuation reports are required for properties valued at ₹50 crore or more.
  - — [RBI circular index](https://rbi.org.in/Scripts/BS_CircularIndexDisplay.aspx?Id=8977); [RBI notification](https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=3231&Mode=0); [Banking School summary, secondary](https://bankingschool.co.in/loans-and-advances/rbi-guidelines-on-valuation-and-revaluation-of-properties/)
  - SBI publishes valuer eligibility criteria for empanelment (updated Aug 2025). — [SBI](https://sbi.bank.in/documents/39129/51516783/ELIGIBILITY+CRITERIA+FOR+VALUERS20250830110128033.pdf)
  - A claim that two valuations are needed for exposures over ₹1 crore with security over ₹50 lakh comes from a low-quality source and is unverified. — [monomousumi, unverified](https://monomousumi.com/revised-guidelines-on-property-valuation-by-rbi-for-property-backed-borrowers-in-2026/)

### Inferences
- **Recommended NCR architecture:**
  - A hedonic or GBM ensemble (LightGBM/CatBoost) on deed and listing data, with project/society-level fixed effects. In NCR the society, tower and developer explain most of the variance for flats.
  - A comparable-sales layer within the same society for explainability.
  - A repeat-sales or society-level index to time-adjust stale comparables.
  - Optionally, photo- and text-derived condition and finish features from listings.
- **Expect worse accuracy than the US.** Off-market median error will likely be well above Zillow's 7% given deed under-declaration, sparse resale volume, and super-vs-carpet area noise. Benchmark honestly on held-out registered deeds, using median absolute percentage error and the share of estimates within ±10% and ±20%, segmented by city, micro-market, age and ticket size.
- NCR's flat-heavy, society-based stock is "sufficiently uniform" in the RICS sense for large branded societies. It is much less so for Delhi builder floors, unauthorised or regularised colonies, and plotted housing, which may need lower confidence or a refusal to estimate.
- Indian "98% accuracy" claims and R² values of about 0.9 on listing data are not comparable to US median-error metrics. Do not use them as benchmarks.
- **B2B route:** Banks and HFCs still use human valuers. An AVM could be sold as a pre-screen, portfolio revaluation or fraud-check tool (all permitted uses), not as a replacement for the statutory valuation.

### Gaps
- UK (Hometrack, CoreLogic UK) and Australian (CoreLogic/Cotality FSD) AVM accuracy figures and confidence-score definitions could not be retrieved (search budget exhausted).
- I found nothing on Indian banks' or credit bureaus' (CRIF, TransUnion CIBIL) use of AVMs as of 2026.
- I found no evidence on computer-vision-on-photos accuracy gains specific to India.
- The repeat-sales methodology used by the RBI HPI was not confirmed.
- The US 2024 interagency AVM quality-control rule was not verified in this session.

---

## 5. Rental data sources and NCR rental yields

### Takeaway
NCR has no registered-rent dataset comparable to Maharashtra's, because 11-month leave-and-licence agreements in Delhi, Haryana and UP do not have to be registered. Rent models must rely on listings (NoBroker, Housing, 99acres, Magicbricks) and partnerships. ANAROCK's city-average gross yields for Q2 2026 are Gurugram 4.3%, Noida 3.9% and Delhi 3.2%. New-launch corridors such as Dwarka Expressway imply lower yields (about 2–2.6%).

### Cited Findings
- **ANAROCK (4 Aug 2026), 2019 → Q2 2026:**

  | City | Avg price 2019 (₹/sq ft) | Avg price Q2 2026 (₹/sq ft) | Price growth | Gross rental yield 2019 → Q2 2026 |
  |---|---|---|---|---|
  | Noida | 4,795 | 10,780 | +125% | 3.2% → 3.9% |
  | Gurugram | 6,150 | 13,350 | +117% | 3.5% → 4.3% |
  | Delhi | 18,200 | 26,700 | +47% | 2.2% → 3.2% |

  — [Business Today, 4 Aug 2026](https://www.businesstoday.in/personal-finance/real-estate/story/top-housing-markets-deliver-up-to-125-price-appreciation-rental-yields-rise-by-100-bps-anarock-547053-2026-08-04)
- **Dwarka Expressway (ANAROCK, published 11 Sep 2026):**
  - A 2BHK of about 1,000 sq ft rents for ₹25,000–31,125 per month. Rents rose 87% from 2021 to H1 2026.
  - Average price is ₹14,180/sq ft in H1 2026.
  - — [Trade Brains, 11 Sep 2026](https://tradebrains.in/money/dwarka-expressway-property-prices-surge-135-in-5-years-check-prices-rents-and-growth-potential-of-this-ncr-corridor-12515457)
- **Rent-agreement registration:**
  - In Maharashtra, Section 55 of the Maharashtra Rent Control Act 1999 makes registration of every leave-and-licence agreement mandatory, whatever its duration. — [eDrafter](https://www.edrafter.in/maharashtra-rent-agreement/); [Rentdraft](https://www.rentdraft.in/blog/rent-agreement-format-maharashtra)
  - In Delhi, registration is compulsory only for tenancies over 11 months (Registration Act 1908). Agreements of 11 months or less are usually just notarised. — [NoBroker](https://www.nobroker.in/blog/how-to-register-rent-agreement-in-delhi/); [RentOk](https://rentok.com/blogs/market-trends/why-is-a-rental-agreement-made-for-11-months-only)
  - Because of this, IndexTap can offer registered rent transactions for Mumbai. — [IndexTap rent search](https://www.indextap.com/search?SearchForm%5Btype%5D=rent&SearchForm%5Bcity%5D=Mumbai)
- **Earlier yield reference (Apr 2024):** Gurugram housing rental yields up to 4.1%; Bengaluru highest at 4.45%. — [Business Standard, Apr 2024](https://www.business-standard.com/amp/industry/news/rental-yields-from-housing-assets-in-gurugram-up-4-1-says-report-124042900983_1.html)

### Inferences
- **Implied corridor yields.** At ₹14,180/sq ft, a 1,000 sq ft unit costs about ₹1.42 crore, so ₹25,000–31,125/month implies a gross yield of about 2.1–2.6%. That is well below Gurugram's 4.3% city average. City averages hide large variation: new, investor-driven corridors yield less because prices have run ahead of rents.
- **Implied city rents per sq ft per month:**
  - Gurugram: 4.3% × ₹13,350 / 12 ≈ ₹48
  - Noida: 3.9% × ₹10,780 / 12 ≈ ₹35
  - Delhi: 3.2% × ₹26,700 / 12 ≈ ₹71
- **Net yield.** Deducting maintenance (often ₹3–6/sq ft/month in NCR high-rises; not verified here), property tax, vacancy (1–2 months/year), brokerage and repairs would likely cut 0.5–1.0 pp. This should be modelled explicitly rather than assumed.
- **Rent model data plan:** listing rents (asking), plus partnerships with property managers (e.g., Square Yards' Azuro), rent-payment and fintech platforms, and society RWAs. A "rent asking-to-achieved" discount should be estimated as for sale prices.

### Gaps
- NoBroker, Housing.com and 99acres rent data products, APIs or licensing terms were not researched (search budget exhausted).
- I found no NCR micro-market net-yield study.
- I found no data on rent-to-listing discounts or rental time-on-market in NCR.
- Rent growth for Q3 2026 (e.g., an unverified search claim of "Delhi rents +6.7% QoQ") could not be sourced.

---

## 6. Future-value drivers in NCR: infrastructure pipeline, timelines, and evidence of price impact

### Takeaway
Several marquee projects opened between Aug 2025 and Jun 2026:
- Dwarka Expressway Delhi section and UER-II Phase 1 (Aug 2025)
- Namo Bharat Delhi–Meerut, fully open (Feb 2026)
- Delhi Metro Phase 4 Magenta/Pink extensions (Mar 2026)
- Noida International Airport commercial flights (15 Jun 2026)

The next wave is still at DPR or approval stage, or is uncertain: Gurugram Metro (2028+), Delhi–Gurugram–Bawal and Delhi–Panipat–Karnal RRTS (not yet Union Cabinet-approved), Gurugram–Faridabad–Jewar RRTS, Global City, Film City, FNG, and MPD-2041. Evidence from Gurugram and Delhi shows metro premiums of about 20–30% within 500 m that fade beyond 1.5–2 km. Corridor-level data (Dwarka Expressway +135% from 2021 to H1 2026) suggests prices often move ahead of completion.

### Cited Findings
**Airport and expressways**
- **Noida International Airport (Jewar):**
  - Phase 1 inaugurated 28 Mar 2026; commercial operations started 15 Jun 2026 (first flight IndiGo from Lucknow; Akasa also operating).
  - Phase 1 capacity is 12 MPPA on one 3,900 m runway, planned to grow to 30, 50 and 70 MPPA in later phases.
  - Concession: Zurich Airport (YIAPL), 40-year DBFOT running 2021–2061.
  - Planned links: Namo Bharat, metro, and Ghaziabad–Jewar RRTS.
  - — [Wikipedia: Noida International Airport](https://en.wikipedia.org/wiki/Noida_International_Airport); [Republic World](https://www.republicworld.com/india/noida-international-airport-in-jewar-to-start-commercial-flights-from-june-15)
- **Jewar link expressway:** On 10 Mar 2026 the Union Cabinet approved a revised cost of ₹3,630.77 crore for greenfield connectivity to Jewar airport from the DND–Faridabad–Ballabhgarh–Sohna spur of the Delhi–Mumbai Expressway, including about 11 km elevated. — [PIB](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2237576&reg=3&lang=1)
- **DND–Faridabad–Sohna spur (59 km, 3 packages):** The final two packages are open. The first 9 km (DND–Jaitpur) was 94.23% complete with a target opening of June 2026. Whether it actually opened is not confirmed. — [NewsBytes](https://www.newsbytesapp.com/news/india/delhi-mumbai-expressway-s-key-stretch-94-done-opening-in-june-2026/story); [Wikipedia: Delhi–Mumbai Expressway](https://en.wikipedia.org/wiki/Delhi%E2%80%93Mumbai_Expressway)
- **Dwarka Expressway Delhi section and UER-II:**
  - Inaugurated 17 Aug 2025: the 10.1 km Delhi section of Dwarka Expressway (₹5,360 crore) and the UER-II Alipur–Dichaon Kalan stretch with Bahadurgarh and Sonipat links (₹5,580 crore). — [Business Today, 17 Aug 2025](https://www.businesstoday.in/india/story/uer-ii-dwarka-expressway-open-today-what-changes-for-noida-dwarka-residents-homebuyers-489705-2025-08-17); [Deccan Herald](https://www.deccanherald.com/india/delhi/delhis-road-knots-get-11k-cr-untangling-as-modi-inaugurates-2-highways-3684563)
  - UER-II is 75.7 km and runs Alipur–Rohini–Mundka–Najafgarh–Dwarka–Mahipalpur. Phase 1 (Alipur–IGI) is fully operational. Phases 2–4 (IGI–Tughlakabad, Tughlakabad–Tronica, Tronica–Alipur) are under construction or at DPR stage. — [Wikipedia: UER-II](https://en.wikipedia.org/wiki/Urban_Extension_Road-II)
- **FNG Expressway (56 km):** The Noida–Ghaziabad stretch is operational. Elevated sections and the Yamuna bridge to Faridabad are pending. No authoritative completion date exists; secondary estimates range from late 2025 to 2027. — [99acres, secondary](https://www.99acres.com/articles/fng-expressway.html); [Noida Realty Trends, secondary](https://www.noidarealtytrends.com/posts/fng-expressway-in-2026-route-real-status-and-what-it)

**Rail and metro**
- **Namo Bharat Delhi–Meerut (82.15 km):** Fully operational from Sarai Kale Khan to Modipuram since 22 Feb 2026, when the PM opened the final 26 km. Travel time is under 50 minutes. — [NewsOnAir, 22 Feb 2026](https://www.newsonair.gov.in/pm-modi-flags-off-meerut-metro-namo-bharat-train-in-uttar-pradesh); [Wikipedia](https://en.wikipedia.org/wiki/Delhi%E2%80%93Meerut_Regional_Rapid_Transit_System)
- **Other Namo Bharat corridors:**
  - As of 29 Jul 2026, per the MoS Housing and Urban Affairs reply in the Rajya Sabha, DPRs for Delhi–Karnal, Delhi–Bawal, Bawal–Behror and Ghaziabad–Noida International Airport are "under review." None is approved or funded. — [Business Today, 29 Jul 2026](https://www.businesstoday.in/india/story/delhi-to-karnal-jewar-airport-by-namo-bharat-4-proposed-routes-could-reshape-ncr-travel-545864-2026-07-29)
  - The Public Investment Board cleared the Delhi–Gurugram–Bawal corridor's extension to Behror (about 36 km, 4 stations; total about ₹43,000 crore) and forwarded it to the Ministry of Finance. Union Cabinet approval is still pending. — [Metro Rail Today, 31 Jul 2026](https://metrorailtoday.com/news/delhi-gurugram-bawal-namo-bharat-rrts-corridor-set-for-behror-extension-after-pib-clearance)
  - Delhi–Panipat was expanded to Delhi–Panipat–Karnal (136.3 km, 21 stations). — [Wikipedia: Delhi–Panipat RRTS](https://en.wikipedia.org/wiki/Delhi%E2%80%93Panipat_Regional_Rapid_Transit_System); [India TV, 23 Apr 2026](https://www.indiatvnews.com/business/news/after-meerut-namo-bharat-express-to-run-on-the-delhi-karnal-route-check-details-2026-04-23-1038651)
  - A 64 km Gurugram (IFFCO Chowk)–Faridabad–Noida–Jewar Namo Bharat corridor (₹19,390 crore; 7 RRTS and 15 metro stations) had its DPR approved by a committee under the Meerut Divisional Commissioner. It still needs UP government and then Centre approval. — [The Tribune, 4 Aug 2026](https://www.tribuneindia.com/news/gurugram/dpr-for-64-km-namo-bharat-corridor-linking-jewar-airport-gurugram-and-faridabad-approved/)
- **Delhi Metro Phase 4:**
  - Opened 8 Mar 2026: Magenta Line Deepali Chowk–Majlis Park, and Pink Line Majlis Park–Maujpur (12.3 km). — [Wikipedia: Magenta Line](https://en.wikipedia.org/wiki/Magenta_Line_(Delhi_Metro)) (via search summary)
  - Janakpuri West–RK Ashram Marg and Aerocity–Tughlakabad (Golden Line) are expected between late 2026 and mid-2027. — [Swarajya](https://swarajyamag.com/news-brief/delhi-metro-phase-4-three-new-corridors-to-be-operational-by-december-says-dmrc-md-vikas-kumar); [DD News](https://ddnews.gov.in/en/delhi-metro-to-open-its-phase-4-priority-corridors-by-2026-over-50-per-cent-work-already-done/); [Wikipedia: Golden Line](https://en.wikipedia.org/wiki/Golden_Line_(Delhi_Metro))
  - The Rithala–Kundli corridor was Cabinet-approved on 6 Dec 2024. — [NewsOnAir](https://www.newsonair.gov.in/cabinet-approves-rithala-kundli-corridor-of-delhi-metro-phase-iv-project)
- **Gurugram Metro, Millennium City Centre–Cyber City (28.5 km, about ₹5,452 crore, elevated):**
  - Phase 1 (MCC–Sector 9) is about 30% complete on civil works, targeting 2028.
  - Phase 2 (Sector 9–Cyber City, 14.5 km, 14 stations) got a ₹1,662 crore civil package cleared, with the tender floated in early Oct 2026.
  - — [Business Standard, ~1 Oct 2026 (via search snippet; page returned 403)](https://www.business-standard.com/amp/india-news/gurugram-metro-phase-2-haryana-clears-rs-1662-crore-tender-126100100358_1.html); [Square Yards blog](https://www.squareyards.com/blog/gurugram-metro-phase-2-gets-civil-works-clearance-linking-old-gurgaon-to-cyber-city)

**Townships, film city and plans**
- **Global City Gurugram (about 1,000 acres, HSIIDC, on Dwarka Expressway):** All of the following comes from broker blogs and is lower reliability.
  - ₹940 crore trunk-infrastructure tender for 587 acres.
  - On 13 Aug 2026 the CM ordered core infrastructure finished within 3 months.
  - On 10 Jul 2026 the Punjab & Haryana High Court reportedly quashed a PIL, clearing e-auctions.
  - Plot handover is targeted from Dec 2026.
  - — [Realtor Rashmi, secondary](https://www.realtorrashmi.in/blog/global-city-gurugram-2026/); [Realty Promoo, secondary](https://realtypromoo.com/news/haryana-global-city-gurugram-phase-1-infrastructure-construction-commences-across-587-acres-with-940-crore-tender-awarded-targeting-december-2026-completion-boosting-dwarka-expressway-real-estate-in-sectors-36-37)
- **Noida Film City (about 1,000 acres, YEIDA Sector 21; developer Bayview Bhutani, i.e., Boney Kapoor + Bhutani):**
  - Phase 1 layout was approved in June 2025, but financial closure is still pending six years after the announcement. — [Free Press Journal](https://www.freepressjournal.in/india/noida-film-city-project-faces-fresh-delay-as-financial-closure-remains-pending-after-six-years)
  - Other reports say construction is "nearing," and that a film (Mom 2) has begun shooting on site. — [Storyboard18](https://www.storyboard18.com/amp/brand-marketing/boney-kapoor-bhutani-infras-noida-film-city-to-drive-hospitality-retail-investments-as-construction-nears-101963.htm); [Outlook Business](https://www.outlookbusiness.com/news/noida-film-city-project-moves-closer-to-construction-after-approvals-work-likely-to-begin-soon)
  - These sources conflict on status.
- **YEIDA:** Launched a 973-plot residential scheme near the airport at ₹36,260/sq m (allotment 18 Jun 2026). — [Outlook Money](https://www.outlookmoney.com/news/yeida-plot-scheme-yamuna-expressway-authority-opens-up-residential-plots-near-jewar-airport)
  - Claims of 120–158% Yamuna Expressway gains come from developer and broker blogs and are not reliable. — [Sobha blog, secondary](https://www.sobha.com/blog/yamuna-expressway-real-estate-jewar-airport-investment-corridor/)
- **Delhi Master Plan 2041:** The draft was released in June 2021 and drew about 33,000 objections. It was still not notified by MoHUA as of April 2026. MPD-2021 remains the operative plan. — [1acre.in](https://1acre.in/map-layers/delhi-ncr/delhi-masterplan); [IMPRI](https://www.impriindia.com/insights/policy-update/master-plan-delhi-2041/)

**Evidence of price impact**
- **Dwarka Expressway (ANAROCK):**
  - +79% from end-2019 to H1 2024 (₹5,359 → ₹9,600/sq ft). — [Business Standard, Aug 2024](https://www.business-standard.com/finance/personal-finance/best-real-estate-deals-dwarka-express-in-ncr-sees-79-price-surge-in-5-yrs-124082700426_1.html)
  - +135% from 2021 to H1 2026 (₹6,032 → ₹14,180), with rents +87%.
  - 38,680 units launched since 2021. Inventory overhang is 10,770 units (about 18 months), with 95% of stock under construction.
  - — [Trade Brains, Sep 2026](https://tradebrains.in/money/dwarka-expressway-property-prices-surge-135-in-5-years-check-prices-rents-and-growth-potential-of-this-ncr-corridor-12515457)
- **Gurugram metro hedonic study (Panwar & Fandian, 2025; 300 plotted residential properties, 2007–2024):**
  - Within 500 m of a station, prices rose 20–25% after the project was announced and about 30% after operations began, relative to earlier trends.
  - About half the premium appeared during planning and construction.
  - Premiums shrink beyond 1 km and vanish beyond 1.5–2 km.
  - Price falls about 12% per km of distance (p < 0.01); model R² ≈ 0.64.
  - — [Journal of Contemporary Urban Affairs 9(2):387–401](https://www.ijcua.com/ijcua/article/download/544/713) (DOI 10.25034/ijcua.2025.v9n2-4)
- **Delhi commercial study (Tyagi & Singhal, 2020; 1,256 commercial sales, 2000–2008):** Station proximity had a negative effect before commissioning (traffic, noise, construction) and a significant positive premium after; the effect extended about 500 m. — [IRES/Architexturez](https://ires.architexturez.net/doc/ires-phd-2020-tyagi-paper); [ResearchGate](https://www.researchgate.net/publication/357218532_Analyzing_the_Influence_of_Metro_Stations_on_Commercial_Property_Values_in_Delhi_A_Hedonic_Approach)
- **Circle rates as a lagging confirmation:** Gurugram's 2026 revisions were largest on Dwarka Expressway (up to 75%) and SPR (about 45%), the corridors with the biggest new infrastructure. — [BW Businessworld (snippet)](https://www.businessworld.in/article/emerging-corridors-drive-up-to-75-circle-rate-hike-in-gurugram-report-602616)

### Inferences
- **Infrastructure event dataset.** Build a table with project, alignment geometry, station or interchange points, and lifecycle dates (announce, DPR approval, Cabinet approval, construction start, opening). Model appreciation as an event-study or difference-in-differences effect, decaying with distance: about 500 m–2 km for metro and RRTS stations, wider for expressway interchanges, regional for the airport. The Gurugram study shows half the premium arrives before opening, so forecasts should treat stage transitions (e.g., Cabinet approval) as price events, not just openings.
- **Probability-weight the pipeline.** RRTS corridors beyond Meerut, the Jewar RRTS, Film City and Global City carry real delivery risk. Use scenario forecasts (base, delayed, cancelled) rather than point forecasts.
- **Supply drag.** Corridors with heavy under-construction pipelines (Dwarka Expressway: about 18 months of overhang, 95% under construction) may see slower resale appreciation and weaker rental yields. Include supply and inventory features from vendors such as PropEquity or Liases Foras.
- **Do not extrapolate the 2019–2026 boom.** City-level growth of 117–125% in Noida and Gurugram is a cycle, while the RBI all-India HPI shows only 2–4% YoY in FY26. Forecasts should mean-revert and show wide bands.

### Gaps
- Not researched: data centres in Noida/Greater Noida (capacity and timelines), the YEIDA Master Plan 2041, the GDA (Ghaziabad) Master Plan 2031, the Gurugram-Manesar master plan, Delhi land-pooling status, and SPR/NH-48 projects (search budget exhausted).
- Whether the DND–Jaitpur section opened in mid-2026, and current FNG status, need verification.
- Global City status relies on broker blogs and needs primary (HSIIDC/Haryana government) confirmation.
- No rigorous NCR study yet measures the price impact of the airport or RRTS. Claims from Yamuna Expressway developers are marketing, not evidence.

---

## 7. Resale value and liquidity factors

### Takeaway
There is solid evidence for a few liquidity drivers: metro distance, title and registry status (critical in Noida), developer brand and delivery track record, and supply overhang. For the micro attributes the founder listed (floor, facing, maintenance, carpet efficiency, AQI, waterlogging), I found no quantified NCR evidence. Those effects will have to be estimated from in-house data.

### Cited Findings
- **National developers' rising share:** Per ANAROCK, national developers' share of NCR housing supply rose from 3% in 2022 to over 13% in 2025, reflecting buyer preference for trusted brands with proven delivery. — [Outlook Money](https://www.outlookmoney.com/amp/story/invest/ncr-homebuyers-are-increasingly-betting-on-trusted-national-real-estate-brands)
- **Branded residences** (hotel or lifestyle brands) command global premiums of about 30% (Knight Frank/Savills; Knight Frank's 2025 survey gives a 20–35% band). That is a launch premium paid to the developer, not a demonstrated resale premium. — [Victaura analysis, secondary](https://victaura.com/en/insights/the-branded-residences-resale-test/); [Knight Frank Global Branded Residences 2023](https://content.knightfrank.com/research/1617/documents/en/global-branded-residences-2023-10285.pdf)
- **Noida title and registry backlog:**
  - Under the stalled-project rehabilitation framework (from the Amitabh Kant committee recommendations, which the UP government approved), 57 projects are being rehabilitated.
  - About 4,134 of 6,855 eligible units (about 60%) had registries completed at the time of reporting.
  - The Noida Authority relaxed the 25% upfront-dues condition in Jan 2026.
  - Thousands of buyers still await registries.
  - — [360PropGuide, secondary](https://www.360propguide.com/blogs/noida-authoritys-stalled-project-relief-big-registry-push); [Apartment Times](https://apartmenttimes.in/thousands-await-flat-registries-in-noida-nhrf-steps-in-with-city-wide-initiative/); [Deccan Herald](https://www.deccanherald.com/india/uttar-pradesh/up-govt-approves-amitabh-kant-committee-proposals-likely-to-provide-relief-to-noida-homebuyers-2817386)
  - More than 5,700 registries are reported blocked, alongside the Authority cancelling plots left vacant for 12 years. — [ghar.tv, secondary](https://www.ghar.tv/blog/noida-authority-cracks-down-on-land-hoarders-12-year-old-vacant-plots-face-cancellation-as-over-5700-registries-stay-blocked/artid4438)
- **Metro proximity:** −12% per km, with premiums concentrated within 500 m (Gurugram study). — [JCUA 2025](https://www.ijcua.com/ijcua/article/download/544/713)
- **Supply overhang:** Dwarka Expressway has 10,770 unsold units (about 18 months), and only 5% of available stock is ready to move into. — [Trade Brains/ANAROCK, Sep 2026](https://tradebrains.in/money/dwarka-expressway-property-prices-surge-135-in-5-years-check-prices-rents-and-growth-potential-of-this-ncr-corridor-12515457)
- **Concentration of NCR sales:** CRE Matrix reports 64% of Gurugram units sold in 2025 were priced above ₹5 crore. — [CRE Matrix (search summary)](https://www.crematrix.com/blog/pan-india-real-estate-2025-trends-sales-data-city-insights/)

### Inferences
- **Liquidity-score features**, roughly in order of expected importance:
  1. Title and registry status: OC received, registry possible, any authority dues. Hard gating in Noida and Greater Noida.
  2. Developer brand and delivery record: RERA history, delays, NCLT exposure.
  3. Society size and number of comparable resales, which drives AVM confidence and buyer comfort.
  4. Distance to an operational metro or RRTS station, and to expressway access.
  5. Age, floor and facing (park/road), and carpet-to-super-area efficiency.
  6. Maintenance quality and fee, waterlogging history, and local AQI.
  7. Competing new supply within a few km (overhang).
- **Time-to-sell** can be proxied from listing lifecycles (first seen → removed) on portals, ideally validated against deed dates for the same unit.
- **Sources for brand, OC and RERA data:** UP RERA, HRERA Gurugram and Delhi RERA project pages (not researched here), and authority lists of OCs and blocked registries.

### Gaps
- I found no NCR study quantifying resale premiums for brand, floor, facing, maintenance, carpet efficiency, AQI or waterlogging.
- I found no NCR time-to-sell or days-on-market data from a credible source.
- RERA portal data access (UP RERA, HRERA, Delhi RERA) was not researched.
- No evidence on the resale discount for non-OC or no-registry flats vs comparable registered flats.

---

## 8. Neighbourhood data sources for scoring

### Takeaway
Several building blocks are freely available with clear terms: CPCB real-time AQI via the data.gov.in API, NCRB crime statistics (district and metro-city level, latest year 2024), and OpenStreetMap (ODbL, with share-alike obligations). Google Places is richer but has restrictive caching and storage terms. Master-plan land use is available through aggregators such as 1acre.in. Official Delhi, Haryana and UP GIS portals and flood maps were not verified.

### Cited Findings
- **CPCB real-time air quality:** Hourly AQI from about 500 government monitoring stations, published on data.gov.in with API access after registering for a key. Fields include state, city, station, last update, latitude/longitude, pollutant ID and pollutant min/max/avg (PM2.5, PM10, NO₂, SO₂, CO, O₃, NH₃), in CSV, JSON or XML. — [data.gov.in catalog](https://www.data.gov.in/catalog/real-time-air-quality-index); [CPCB real-time data](https://cpcb.nic.in/real-time-air-qulity-data/); [Medium explainer, secondary](https://medium.com/@atharva-again/cpcbs-aqi-api-everything-you-need-to-know-41f5eff85c5a)
  - Alternatives: aqicn.org aggregates the CPCB network, and XKDR runs an India air-quality API. — [AQICN CPCB network](https://aqicn.org/network/cpcb.in/); [XKDR](https://airquality.xkdr.org/)
- **NCRB "Crime in India":** The latest edition covers 2024. Data are compiled at national, state (SCRB) and district (DCRB) levels, plus separate collection for million-plus cities. — [NCRB](https://ncrb.gov.in/crime-in-india.html)
- **OpenStreetMap:** Licensed under ODbL. It requires attribution, and derived databases may be distributed only under the same licence (share-alike). It also warns against copying from Google Maps. — [OSM copyright](https://www.openstreetmap.org/copyright)
- **Delhi master-plan zone and land-use layers:** Available on 1acre.in (commercial). — [1acre.in Delhi master plan](https://1acre.in/map-layers/delhi-ncr/delhi-masterplan)

### Inferences
- **Suggested stack:**
  - OSM for points of interest (schools, hospitals, malls, parks), road network and travel-time isochrones (via OSRM or Valhalla), keeping ODbL share-alike in mind if you publish derived POI databases.
  - CPCB AQI, interpolated by kriging or IDW across about 40 NCR stations.
  - NCRB at district level.
  - Metro, RRTS and expressway geometry digitised from DMRC, NCRTC and NHAI maps.
  - Master-plan land use for future-use risk (e.g., adjacency to planned industrial or landfill use).
- Google Places data should be used only within Google's terms. A self-built POI database is better done on OSM, enriched by your own crawling or licensed data.
- Police-station-level crime data, if Delhi Police publishes it, would be more useful than district aggregates. Not verified.

### Gaps
- Not verified (search budget exhausted): Bhuvan/ISRO layers and access terms; UDISE+ school data and any school-rating sources; Census (the 2027 Census status and ward-level data); Delhi GSDL/GIS, HARSAC (Haryana) and UP GIS portals; flood or waterlogging maps (Delhi Traffic Police or PWD waterlogging hotspot lists, NDMA/Bhuvan flood layers); Google Maps Platform Places caching rules (the fetched terms page was truncated).
- No data source found for society-level maintenance quality or RWA ratings.

---

## 9. Regulatory and ethical constraints on publishing estimates, and how platforms communicate uncertainty

### Takeaway
No India-specific rule bans publishing AVM estimates. The main constraints are:
- the DPDP Act, with compliance phasing in from Nov 2025 to May 2027, which governs processing personal data from deeds;
- terms of use and database licences (portals; OSM share-alike);
- professional-valuation rules (RBI/RICS), which make AVMs outside lending decisions advisory only;
- reputational and financial risk from over-confident algorithms, as Zillow Offers' $420M quarterly loss shows.

Best practice is to publish ranges and confidence levels, separate on-market and off-market accuracy, and disclose error rates by segment.

### Cited Findings
- **DPDP Act 2023:** Received assent on 11 Aug 2023. Commencement is phased: 13 Nov 2025 (Data Protection Board and core provisions), 13 Nov 2026 (more provisions), 13 May 2027 (remaining). It applies to digital personal data. — [Wikipedia: DPDP Act](https://en.wikipedia.org/wiki/Digital_Personal_Data_Protection_Act,_2023)
- **Registration data contains personal data:** Gurugram deeds carry party PANs, and Income Tax uses deeds for tax matching. — [PropNewsTime, Oct 2026](https://propnewstime.com/latestnewsstories/MzgxNTA=/gurugram-property-registrations-under-scrutiny-after-25-000-deals-use-same-fictitious-pan)
- **RICS:** AVMs only for uniform property types in active markets, with adequate data. An AVM output becomes a "written valuation" only when a surveyor applies professional judgement. — [RICS standard](https://www.rics.org/content/dam/ricsglobal/documents/standards/Bank-lending-valuations-and-MLV_2nd-edition_Dec2025.pdf)
- **Communicating uncertainty:**
  - Zillow publishes separate on-market and off-market median errors (about 2% vs about 7%). — [Wikipedia: Zillow](https://en.wikipedia.org/wiki/Zillow)
  - Redfin publishes error by state (e.g., Maine 12.89% off-market). — [Real Estate Witch](https://www.realestatewitch.com/redfin-home-value-estimator/)
  - Housing.com reportedly shows min–max ranges. — [search summary; unverified](https://www.bajajfinserv.in/home-valuation-calculator)
  - Liases Foras adds a "Price Correction Risk" metric. — [Liases Foras](https://ps.liasesforas.com/)
  - Multi-model AVMs weight models by confidence scores. — [Wikipedia: AVM](https://en.wikipedia.org/wiki/Automated_valuation_model)
- **Algorithmic pricing risk:** Zillow Offers lost $420M in Q3 2021, was shut down, and Zillow cut 25% of staff. — [Wikipedia: Zillow](https://en.wikipedia.org/wiki/Zillow)
- **Unverifiable accuracy marketing:** Magicbricks advertises PropWorth with "98% accuracy." — [Construction Week](https://www.constructionweekonline.in/business/magicbricks-launches-propworth-instant-valuation-for-50000-properties)
- **Bias risk:** Metro and transit premiums can "intensify socio-economic disparities if unregulated." — [JCUA 2025](https://www.ijcua.com/ijcua/article/download/544/713)

### Inferences
- **Publishing practice:**
  - Show a point estimate plus a range (e.g., an 80% interval from quantile GBM or conformal prediction).
  - Give a confidence grade driven by the number and recency of comparables in the same society.
  - Disclose back-tested accuracy by city and segment, and refuse to estimate, or widen ranges, for thin-data stock (builder floors, unauthorised colonies, no-OC projects).
  - State clearly that the estimate is "not a valuation report or appraisal," and give the as-of date and data sources.
- **Forecasts (appreciation, rent)** should be scenario bands tied to named infrastructure milestones, not single numbers. Track the sensitivity to RBI HPI-level mean reversion.
- **DPDP:** Strip party names and PANs from deed data at ingestion, aggregate to unit or society level, and keep a purpose and retention register. Get legal advice on whether the Act's exemptions for publicly available data apply to IGR records (not verified here).
- **Avoid accuracy claims you cannot back** (like "98%"), and use comparable metrics: median absolute percentage error, and the share within ±10% and ±20%.

### Gaps
- Not verified: the exact DPDP exemption for "publicly available" personal data, and its applicability to scraped IGR deeds; legality of scraping Indian property portals (the 99acres terms page returned 403) and any Indian case law; whether ASCI or consumer-protection rules apply to AVM accuracy claims; RERA advertising rules affecting price estimates on project pages; Zillow's Zestimate range and disclaimer wording (zillow.com returned 403).
- Fair-lending or bias audits of AVMs in India: no sources found.
