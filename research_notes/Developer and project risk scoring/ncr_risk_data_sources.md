# NCR developer and project risk scoring: data source inventory and access plan (as of 18 Oct 2026)

Scope: data sources for a "credit score for developers and projects" that predicts delivery risk for under-construction residential projects in Delhi NCR (Delhi, Gurugram/Faridabad in Haryana, Noida/Greater Noida/Ghaziabad/YEIDA in UP), and explains the factors behind each score.

Method note: The session's WebSearch budget ran out after about 20 queries. Bing, DuckDuckGo, Mojeek and Yahoo then returned irrelevant results, CAPTCHAs or 429 errors. Most portal claims below were therefore checked by fetching the portal pages directly (WebFetch and curl from the researcher's machine on 18 Oct 2026). Counts marked "parsed by researcher" come from downloading the public HTML and counting rows. They are snapshots, not official statistics. Findings that rest only on a search-engine snippet are labelled as such.

---

## Q1. What do the NCR RERA portals expose per project and per promoter, can it be scraped, and are there defaulter lists?

### Takeaway
HARERA (Haryana) is the richest open source in NCR. It publishes the full project list, the Form A-H registration data, quarter-by-quarter QPRs, complaint cases linked to each project, and extension/OC/CC/sale-ban/cancellation documents as JSON. It also publishes a judgments index of about 17,900 orders. All of this is plain HTML or JSON with no CAPTCHA, so it can be collected programmatically, subject to the terms-of-use issues in Q8. UP RERA has a full project list with "Default on QPR" and "De-registered" flags, per-project and per-promoter complaint counts, revised end dates and extension orders, and three bank accounts per project. However, complaint and RC lookups there need a complaint number plus a CAPTCHA. Delhi RERA could not be reached from the research environment, and it covers few projects in any case.

### Cited Findings

**HARERA: structure and jurisdiction**
- haryanarera.gov.in hosts separate sections for HRERA Panchkula, HRERA Gurugram and the Appellate Tribunal. The Gurugram section links to: Search Projects, Registered Projects, Lapsed Projects, Defaulter/Cancelled/Suspended/Abeyance Projects, Complaints/Project/Adjudication cause lists, Search Judgements, Search Complaint Status, and execution complaints. — [HARERA Gurugram menu](https://haryanarera.gov.in/login/loginview/2)
- HARERA Gurugram's jurisdiction is the entire Gurugram district (notification of 14/12/2017). Faridabad falls under HRERA Panchkula. In the Panchkula registered list, Faridabad has 215 rows out of 1,112 (parsed by researcher, 18 Oct 2026). — [HARERA GGM QPR Regulations 2018](https://haryanarera.gov.in/regulations/Quarterly_Progress_ReportGURUGRAMRegulations2018.pdf); [HRERA Panchkula registered projects](https://haryanarera.gov.in/admincontrol/registered_projects/1)

**HARERA Gurugram: registered projects list**
- The list has these columns: registration certificate no., project ID, project name, builder, location, district, registered with (HRERA or Interim RERA), Form A-H link, "Registration Up-to" date, certificate, Quarterly Progress, Monitoring Cases, Corrigendum, and OC/CC/PCC. — [HARERA GGM registered projects](https://haryanarera.gov.in/admincontrol/registered_projects/2)
- Parsed by researcher (18 Oct 2026):
  - 1,083 registrations in total: 817 HRERA and 266 Interim RERA.
  - 520 have a "Registration Up-to" date on or after 18 Oct 2026.
  - 200 rows are flagged "Lapsed Project" and 158 are flagged "QPR not Uploaded".
  - There are 644 distinct builder-name strings. The same entity appears under variants such as "EMAAR MGF LAND LTD." and "EMAAR MGF LAND LTD".
  - The list does not include a residential/commercial type column.
  - The whole list is served as one roughly 2.6 MB HTML page, with no CAPTCHA.
  — [HARERA GGM registered projects](https://haryanarera.gov.in/admincontrol/registered_projects/2)
- The separate Lapsed Projects list has 230 Gurugram entries with "Approval From/To" dates. — [HARERA GGM lapsed projects](https://haryanarera.gov.in/admincontrol/lapsed_projects/2)
- The Defaulter/Cancelled/Suspended/Abeyance list for Gurugram had only 5 entries. Examples are Mahira Buildtech and Czar Buildwell projects, each linked to its defaulter or cancellation order. — [HARERA GGM defaulter/cancelled list](https://haryanarera.gov.in/admincontrol/cancelled_projects/2)

**HARERA Form A-H (REP-I) registration data per project.** Fetched for 102 Eden Estate, RERA-GRG-741-2020.
- Part A: promoter name, CIN, registered address, managing director and directors (residential address, phone, email), authorised representative. PAN fields are masked; mobile numbers and residential addresses are shown in clear.
- Part B: land area, licence numbers and licensees, collaboration agreement.
- Part C: estimated cost split into land, infrastructure and other; units total, booked and unsold; projected completion date; infrastructure % complete.
- Part C-X: total sale value booked, amount received, loan raised, total liabilities.
- Part D: escrow account (bank, account number, IFSC) and its authorised operators.
- Part E: approvals with dates (EC, forest NOC, layout, zoning).
- Part F: handover date promised in the draft agreement.
- Part G: the promoter's projects in the previous 5 years, each with initial and likely completion date, loan sanctioned and drawn, and whether litigation is pending.
- No CAPTCHA.
— [HARERA Form A-H for project 1444](https://haryanarera.gov.in/view_project/project_preview_open/1444)

**HARERA QPR data per quarter**
- Each project has a quarter list running Q1-2021 to Q3-2026. Each quarter is a POST form (quarter_no, quarter_year, project id/year) to `view_project/quaterly_schedule_preview_open`, which returns structured HTML. — [HARERA QPR quarter list](https://haryanarera.gov.in/assistancecontrol/print_quarterly_schedules/Mg==/NzQx/MjAyMA==); [QPR preview endpoint](https://haryanarera.gov.in/view_project/quaterly_schedule_preview_open)
- The Q2-2026 QPR for this project (submitted 15 Jul 2026) contains:
  - estimated vs revised cost by head (land, building, infrastructure, EDC/IDC);
  - approval status with dates;
  - cash inflow for the quarter (collections from allottees, bank/FI funding, promoter contribution);
  - cash outflow (land, construction, infrastructure, EDC/taxes);
  - escrow account opening balance, deposits, withdrawals and closing balance;
  - units/plots sold in the quarter against the total;
  - "EDC due as on date" and EDC actually paid;
  - upload dates of five certificates: promoter self-certificate of units sold, CA certificate of money received and withdrawn from escrow (including money withdrawn for non-project purposes), engineer's % of infrastructure work, CA's cumulative cost and % remaining, and architect's % of construction completed.
  — [HARERA QPR preview endpoint (POST)](https://haryanarera.gov.in/view_project/quaterly_schedule_preview_open)
- Data-quality problems seen in that same QPR: a negative "amount collected from allottees" (−572.98 lakh); an impossible period label ("quarter ending on 31/06/2026"); and unrendered template placeholders in the bank-name field. — [HARERA QPR preview endpoint](https://haryanarera.gov.in/view_project/quaterly_schedule_preview_open)
- Under the regulations, Form QPR-1 must disclose:
  - physical progress per tower/block (% complete, likely completion date);
  - infrastructure components (% complete);
  - project-account withdrawals;
  - government dues (EDC/IDC payable, paid and backlog);
  - architect, engineer and CA certificates;
  - legal cases;
  - a unit-level sale report.
  The QPR is due within 15 days of quarter end and "is open for public viewing". — [HARERA GGM QPR Regulations 2018 (Gazette, 5 Dec 2018)](https://haryanarera.gov.in/regulations/Quarterly_Progress_ReportGURUGRAMRegulations2018.pdf)

**HARERA complaints, extensions, OC/CC and judgments**
- "View Monitoring Cases" lists every complaint number linked to a registration with its status. 102 Eden Estate has 4 cases: first hearing, first hearing, disposed, pending. — [HARERA monitoring cases](https://haryanarera.gov.in/assistancecontrol/view_monitoring_cases/R0dNLzQxNS8xNDcvMjAyMC8zMSBEQVRFRCAwOS4xMC4yMDIw)
- The corrigendum popup is a JSON endpoint, `assistancecontrol/view_corrigendums_popup`. Its document types are: Corrigendum/Addendum, Extension (EXT), Occupation Certificate, Part Completion Certificate, Completion Certificate, Cancel Order and Sale Ban. Each record has a file URL, entry date and remarks. The records also include the email address of the staff member who entered them. — [HARERA registered projects page JS](https://haryanarera.gov.in/admincontrol/registered_projects/2); [corrigendum JSON endpoint](https://haryanarera.gov.in/assistancecontrol/view_corrigendums_popup)
- The project detail page shows the registration timeline and the text of hearing proceedings. For example, the authority found the project's IndusInd loan escrow terms "contradictory to the banking directions" issued by HARERA Gurugram in 2019. — [HARERA project detail 1444](https://haryanarera.gov.in/view_project/searchprojectDetail/1444)
- Search Judgements returns all records in one ~21.5 MB HTML page with no CAPTCHA. Columns are complaint no., complainant, respondent, complaint type, date of decision, judgement link and upload date. Parsed by researcher:
  - 17,938 rows, from Apr 2018 to 16 Oct 2026.
  - By type: 14,454 HRERA complaints, 1,994 execution, 1,283 adjudication, and 200 suo motu (projects, monitoring and complaints).
  - By decision year: 2023: 2,232; 2024: 2,727; 2025: 4,647; 2026 to date: 2,037.
  - Most frequent respondents: Emaar MGF Land (841 plus variants), Vatika Limited/Ltd (553 + 406), BPTP (360 + 226), Ambience Projects (301), Ocean Seven Buildtech (287), Sunrays Heights (278), Raheja Developers (258), Neo Developers (257), Supertech (257), Ireo Grace (189), Ansal Housing (173).
  — [HARERA GGM judgements](https://haryanarera.gov.in/admincontrol/judgements/2)
- Individual complaint pages are at sequential IDs with no CAPTCHA. They show parties, status, hearing history, order PDFs and judgment date. The "Search Complaint Status" form does have a CAPTCHA, as does the "Search Projects" form. — [HARERA complaint detail 587](https://haryanarera.gov.in/assistancecontrol/searchcasedetailopen/587); [complaint search](https://haryanarera.gov.in/assistancecontrol/searchcaseopen); [project search](https://haryanarera.gov.in/view_project/search_project)
- In 2020, HARERA Gurugram said about 50 builders with delayed earlier projects would be blacklisted from new projects. Empire Realtech and CHD Developers were named, but no full public list was published. — [Tribune, 23 Oct 2020](https://www.tribuneindia.com/news/haryana/delayed-projects-haryana-real-estate-authority-to-blacklist-50-builders-160303)
- hareraggm.gov.in also exists as a HARERA Gurugram site with project lists, complaints, orders and cause lists. The visible notices date from around 2021–2022. — [hareraggm.gov.in](https://hareraggm.gov.in/en/)

**UP RERA: project list and flags**
- The homepage links to Registered Projects, Registered Promoters, Completed Projects, De-registered Projects, NCLT Projects, Abeyance Projects, Withdrawn Registration, NCLT Projects u/s 8, Complaint Status, Collection Account Details, Cause List, View RC Status, and "Project Account Directions, 3rd Revision dt 11.05.2026". — [UP RERA home](https://www.up-rera.in/)
- The Registered Projects list loads via an ASP.NET postback with no CAPTCHA (~15 MB HTML). Columns are promoter, project, RERA reg. no., type, district, start date, end date, registration date, details. Parsed by researcher:
  - 3,822 projects statewide: 971 in Gautam Buddha Nagar and 482 in Ghaziabad.
  - In GB Nagar plus Ghaziabad, 1,072 are residential, 350 commercial and 31 mixed.
  - 237 NCR projects (560 statewide) carry the suffix "(Default on QPR)" in the project name.
  - 233 NCR residential projects (142 in GB Nagar) have an end date on or after 18 Oct 2026.
  — [UP RERA registered projects](https://www.up-rera.in/projects)
- The project summary page has no CAPTCHA. It shows declared date of completion, registration date, proposed period, promoter and co-promoter (with mobile and email), "Number of the projects of the promoter", "Total complaints against the promoter", "Total no. of complaints in respect to this Project", and a document list (CA, engineer and architect certificates, encumbrances, commencement certificate and others). — [UP RERA registered projects → Projectsummary](https://www.up-rera.in/projects)
- The detailed project view (same session) shows:
  - project cost and sanctioning authority (Noida Authority, Greater Noida Authority, Yamuna Expressway Authority, GDA, etc.);
  - permit numbers and validity;
  - a "Revised End Date" field, with the note "End date can be extended only by RERA" and the extension order number and date;
  - all three RERA accounts (collection, separate 70%, transaction) with bank, account number and IFSC;
  - land documents and unit-wise plan;
  - architect and structural engineer names;
  - "Quarterly Progress Report: View Physical and Financial Progress / View Quarterly Progress Certificates". These are loaded dynamically and were not parsed.
  — [UP RERA viewprojects](https://www.up-rera.in/viewprojects)
- De-registered Projects: 72 projects statewide, 63 in GB Nagar and 3 in Ghaziabad (parsed). Amrapali group entities dominate (more than 35 rows), with Ansal, Antriksh, Unnati Fortune and others also listed. The "Projects U/S-8" page showed "No records". The NCLT and Abeyance lists render client-side and were not parsed. UP RERA defines Abeyance Projects as those where "promoters have failed to upload key documents such as land records and approved maps". — [UP RERA De-registered list](https://www.up-rera.in/DefaulterList); [UP RERA home](https://www.up-rera.in/)
- The Completed Projects list returned only 11 rows statewide (parsed from the postback HTML; it may be paginated or incomplete, which was not checked further). None were in GB Nagar or Ghaziabad. — [UP RERA home → Completed Projects](https://www.up-rera.in/)
- Complaint status and RC status lookups each need a complaint number plus an image CAPTCHA. Neither offers a bulk list by promoter. — [UP RERA complaint status](https://www.up-rera.in/Frm_All_Complaint_Status_Page.aspx); [UP RERA RC report](https://www.up-rera.in/frm_Rc_Report.aspx)
- From the quarter ending 30 Sep 2026, QPRs under the "UP RERA 2.0" portal need digitally signed certificates uploaded directly by the architect, engineer and CA. The Q2 FY27 QPR deadline was extended to 21 Oct 2026. — [Grihik](https://www.grihik.com/news/real-estate-news/up-rera-new-rules); [PropNewsTime (search snippet)](https://propnewstime.com/latestnewsstories/MzgyNjg=/up-rera-extends-qpr-filing-deadline-to-october-21-makes-digital-signatures-mandatory)
- A search-result summary (not opened) says UP RERA charges a ₹15,000 late fee for delayed QPRs and that two quarters of continuous default can bring a show-cause notice. — [Torbit Realty (search snippet)](https://torbitrealty.com/up-rera-tightens-project-compliance-norms-stresses-timely-qpr-and-annual-audit-filings/)
- UP RERA recovery certificate (RC) statistics, from search snippets:
  - 6,018 RCs issued, with ₹1,505 crore recovered and ₹535 crore settled in 1,734 RC cases (period up to 2025);
  - interest of ₹73.84 lakh paid to about 430 complainants over delayed RC disbursement (Sep 2026).
  — [RealtynMore](https://realtynmore.com/up-rera-strong-action-brings-%E2%82%B92040-cr-relief-to-homebuyers/); [PropNewsTime](https://propnewstime.com/latestnewsstories/MzcxNTk=/up-rera-pays-inr-73-84-lakh-interest-over-delayed-recovery-certificate-disbursements)

**Delhi RERA and the national portal**
- rera.delhi.gov.in refused connections from both WebFetch and curl on 18 Oct 2026 (ECONNREFUSED or timeout).
- Secondary guides describe these lists:
  - registered projects: `/registered_promoters_list`
  - completed: `/completed_project_list`
  - rejected: `/rejected_promoters_list`
  - pending: `/pending_promoters_list`
- Delhi's registered list is "genuinely short relative to Gurugram and Noida".
— [HomeFirst Delhi RERA guide, 6 Aug 2026](https://homefirstindia.com/blog/article/delhi-rera); [PropWatch, 2 Jul 2026](https://www.propwatch.in/blog/how-to-verify-delhi-project-delhi-rera)
- MoHUA launched a Unified RERA Portal (rera.mohua.gov.in) on 4 Sep 2025. Reports put its coverage at 35 States/UTs, 1,51,113 registered projects and 1,06,545 agents, and say it aims to use AI to flag delayed or stalled projects. On 18 Oct 2026 its TLS certificate had expired, so it could not be fetched. — [News on AIR, 4 Sep 2025](https://www.newsonair.gov.in/union-minister-manohar-lal-launches-unified-rera-portal-to-boost-transparency-in-real-estate); [Real Estate Law Journal](https://realestatelawjournal.in/unified-rera-portal-launched-to-boost-transparency-and-address-stalled-projects/); [Construction World (search snippet)](https://www.constructionworld.in/latest-construction-news/real-estate-news/unified-rera-portal-launched-to-boost-sector-transparency/78500)

### Inferences
- **HARERA Gurugram can support a near-complete, project-level feature set with no paid data.** Usable features include:
  - promised vs registration-validity date;
  - number and timing of Section 6 extensions (EXT documents);
  - OC/CC/PCC dates, which can serve as the outcome label;
  - quarterly physical and financial progress;
  - escrow inflow/outflow, and money withdrawn for non-project purposes (from the CA certificate);
  - units sold per quarter;
  - EDC dues;
  - complaints per project and per respondent over time, with execution cases as a proxy for orders that were not complied with;
  - sale-ban and cancellation flags;
  - lapsed status;
  - QPR non-filing.
- **UP RERA needs more effort.** QPR data loads dynamically, complaint and RC detail sit behind CAPTCHAs, and the "Completed" list is nearly empty. Still, the list-level "(Default on QPR)" and "(De-registered Project)" tags, the complaint counts on summary pages, the revised end dates and extension orders, and the bank accounts are enough for v1 features.
- **Labels for supervised learning:**
  - Gurugram: use the HARERA OC/CC corrigendum dates, cross-checked against DTCP BR-VII OC letters (Q5).
  - Noida/Greater Noida: OC/CC must come mainly from the authorities, because the UP RERA completed list is too sparse.
- **Entity resolution is essential.** Promoter names vary (VATIKA LIMITED / VATIKA LTD; EMAAR MGF LAND LTD / LIMITED / LTD.), and groups operate through many SPVs. Use CIN where it is present in Form A-H, then MCA director links.
- **Delhi RERA matters little for a Gurugram+Noida v1**, given how few projects it covers.

### Gaps
- No field list was obtained for the UP RERA QPR content (it loads via AJAX) or for UP RERA's NCLT and Abeyance lists (client-rendered). Whether these can be fetched without a CAPTCHA needs testing in a headless browser.
- Delhi RERA could not be reached, so its project count, QPR fields and CAPTCHA status are unverified.
- No public API was found for HARERA, UP RERA or the Unified RERA Portal. Whether the national portal is live and public could not be confirmed.
- No source was found on whether HARERA penalises non-filing of QPRs (e.g., Section 61/63 penalties) in a consistent way.
- Not confirmed: whether the 2020 list of about 50 "blacklisted" builders was ever published as a document.

---

## Q2. Who has already built datasets from RERA and market data (sales velocity, unsold inventory, delays), and on what terms?

### Takeaway
Two incumbents sell paid project-level datasets built partly on RERA: PropEquity (182k+ projects) and Liases Foras (RESSEX, including "Developers Ratings" and project "risk rating"). Neither publishes prices. Free or low-cost aggregators (UP RERA Tracker, SiteSetu) are shallow. RERA "verification APIs" (Surepass and others) return registration-level data, not risk features. ANAROCK publishes free macro and micro-market reports; project-level data is only available through paid advisory work.

### Cited Findings
- **PropEquity.** PE Plus offers project-level tracking of "182,000+ projects across 52 cities and 65,000+ developers": launches, absorption, unsold inventory, pricing and construction status, with history from 2006. It is delivered through a dashboard. Pricing is not on the website. — [PropEquity](https://www.propequity.in/)
- **PropEquity stalled-project counts (Sep 2024):**

  | City | Stalled projects | Units |
  |---|---|---|
  | Greater Noida | 167 | 74,645 |
  | Noida | 103 | 41,438 |
  | Ghaziabad | 50 | 15,278 |
  | 42 cities (national) | 1,981 | 5.08 lakh |

  No definition of "stalled" was given. — [Outlook Business, 8 Sep 2024](https://www.outlookbusiness.com/news/as-many-as-378-housing-projects-with-146-lakh-units-stalled-in-5-up-cities-propequity)
- **Liases Foras** offers:
  - "RESSEX Primary Data Interface", an "online database of real estate projects allowing you to find out risk rating & performance of projects, developers or regions";
  - "Developers Ratings" based on track record;
  - stress-testing reports covering execution and price-correction risk;
  - RERA coverage of more than 1 lakh projects in 25 states;
  - tracking of more than 20,000 projects a quarter.
  Pricing is not published. — [Liases Foras](https://www.liasesforas.com/)
- **ANAROCK** publishes free research reports, for example "NCR Q2 2026 Residential Market Viewpoints", a Dwarka Expressway micro-market report and the "Q2 2026 Pan India Residential Market Viewpoints". Bespoke data is sold through a "Research & Advisory Service". — [ANAROCK](https://www.anarock.com/)
- **UP RERA Tracker** (run by Vidastu Advisory, a UP-RERA-registered agent) indexes 974 Noida, Greater Noida and Yamuna Expressway projects. Per project it shows committed completion date plus extensions, promoter portfolio, and statutory documents required vs filed. Last sync was 10 Oct 2026. It shows no QPR or complaint data and offers no API. — [UP RERA Tracker](https://upreratracker.com/)
- **SiteSetu** lists 347 Gurugram RERA projects from 255 developers, showing name, RERA number, status and price. It has no completion dates, QPRs or complaints. Updated 30 Apr 2026. — [SiteSetu Gurgaon](https://sitesetu.app/rera/haryana/gurgaon)
- **Surepass** sells a RERA Verification API for "all Indian states". It takes a RERA ID and returns "approvals, completion status, financial disclosures". Pricing is on request. — [Surepass RERA API](https://surepass.io/rera-verification-api/)

### Inferences
- **No vendor sells an explainable, NCR-specific "developer delivery score" with public pricing.** Liases Foras' developer ratings come closest; ask for a quote and sample output before deciding whether to build or buy.
- **Market velocity (absorption, unsold inventory) is the main feature family the free sources cannot supply.** HARERA QPR "units sold in the quarter" offers a partial substitute for Gurugram.

### Gaps
- No public pricing was found for PropEquity, Liases Foras, ANAROCK data services or Surepass. All need sales contact.
- PropEquity's definition of "stalled" is unverified. A WebSearch result summary attributed "158 stalled projects with 52,509 units" in Gurugram to PropEquity, but no source page or date could be tied to that figure, so it is unconfirmed.
- No evidence was found of MahaRERA-style published "defaulter promoter" lists in NCR beyond the HARERA defaulter/cancelled list (5 Gurugram entries) and the UP RERA de-registered list (72 entries).

---

## Q3. What can MCA21 and company-data vendors provide (financials, charges, directors, SPVs), and at what cost?

### Takeaway
MCA V3 master data is free but behind a CAPTCHA. It covers CIN, status, directors, capital and the index of charges. Filed documents (AOC-4 financials, MGT-7, charge documents) cost ₹100 per company per viewing session. The cheapest structured option with published prices is Tofler: ₹15,000 or ₹28,000 + GST a year for 40 or 100 company unlocks, plus ₹349 per extra credit. Probe42, Zauba, Signzy, Karza/Perfios and Finanvo don't publish prices. The MCA bulk master data on data.gov.in is stale (latest snapshots dated 31 Mar 2021).

### Cited Findings
- MCA V3 offers "free master data — CIN, status, directors, capital, charges" with no login but a CAPTCHA. Certified/public documents (incorporation, AOC-4, MGT-7) need a login and a per-document fee. Article updated 22 Jul 2026. — [LegalSuvidha](https://legalsuvidha.com/blog/mca-company-search-understanding-the-process)
- A search-result summary (not opened) says the fee for viewing public documents on MCA V3 is ₹100 per company/LLP. Downloadable items include AOC-4/MGT-7 with attachments and charge documents. The Index of Charges (open, modified and satisfied charges) is viewable without login or payment. — [WebSearch summary citing CA Club India and others](https://www.caclubindia.com/articles/procedure-download-view-public-documents-mca-portal-44144.asp)
- After payment, documents stay viewable for 7 days, with a 3-hour window once viewing starts (article from 2021). — [Quicko](https://learn.quicko.com/mca-portal-view-public-documents)
- Direct fetches of mca.gov.in returned HTTP 403 from the research environment. A Bing result snippet for the MCA Master Data page shows a link to view the company's charges on CERSAI. — [MCA Master Data Services](https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html)
- **Tofler pricing:**

  | Plan | Price (per year) | Credits | MCA filings | Other inclusions |
  |---|---|---|---|---|
  | Pro | ₹15,000 + GST | 40 | 1 year | 5-year financials, director/shareholder info |
  | Growth | ₹28,000 + GST | 100 | 5 years | Excel export, PDF reports |
  | Enterprise | from ₹1.5 lakh + GST | custom | — | API access |

  Extra credits cost ₹349 + GST each. — [Tofler pricing](https://www.tofler.in/price-and-plans)
- Probe42 covers directors and their other directorships, financials, charges, shareholding, group companies, GST, litigation and credit rating, and has an API. It offers a 3-company trial; paid pricing isn't disclosed. Its API portal says it is used by "nearly ever[y] bank and NBFC in India". — [Probe42 Business](https://probe42.in/products/business.html); [Bing result for Probe42 API portal](https://apiportal.probe42.in/)
- Zauba Corp returned a Cloudflare JS challenge (HTTP 403), and finanvo.in had an expired TLS certificate, so neither could be checked. — [Zauba Corp](https://www.zaubacorp.com/); [Finanvo](https://www.finanvo.in/)
- On data.gov.in, the latest "Company Master Data" snapshots for Delhi, Haryana and UP are "upto 31st March 2021" (last updated May 2021). — [data.gov.in catalog API (title search "Company Master Data")](https://api.data.gov.in/lists)

### Inferences
- **Fields to extract per promoter entity and its SPVs:**
  - CIN, status (active / struck off / under CIRP), incorporation date, paid-up capital;
  - directors (DINs) and their other directorships, to link a group's SPVs and spot directors of failed companies;
  - index of charges: lender, amount, date, open or satisfied, and increases in charges against project land;
  - AOC-4: revenue, net worth, debt, inventory, customer advances, related-party loans, auditor qualifications;
  - MGT-7 shareholding;
  - filing delays.
- **Cost for about 300 promoter entities and SPVs:** about ₹30,000 through MCA directly (300 × ₹100, but manual and PDF/XBRL-heavy), or about ₹98,000 + GST on Tofler Growth (100 included credits plus 200 × ₹349, structured). This is the researcher's arithmetic.
- **DIN/director data is personal data.** See Q8 (DPDP) for how the publicly-available-under-law exclusion likely applies.

### Gaps
- The ₹100 MCA fee and free index-of-charges access were not confirmed on mca.gov.in itself (403 to fetcher). They rest on secondary articles and search snippets.
- No published prices were found for Probe42, Zauba, Signzy, Karza/Perfios or Finanvo.
- CERSAI search fees and access were not researched.

---

## Q4. What do credit-rating disclosures offer (rationales, "issuer not cooperating")?

### Takeaway
CRAs publish rating rationales free, searchable by entity and dated. ICRA's list flags "issuer non-cooperating" (INC) in the titles. INC status and downgrades are strong, cheap distress signals for the subset of NCR developers and SPVs that carry bank-loan ratings.

### Cited Findings
- ICRA's "All Rating Rationales" page lists rationales by publication date with download links. The latest entries were dated 16 Oct 2026. Titles carry INC status, for example "Continues to remain under issuer non-cooperating category, Ratings downgraded based on best available information". In the snapshot, 9 of 23 listed rationales were INC. — [ICRA All Rating Rationales](https://www.icra.in/Rating/AllRatingRationales)
- ICRA's Ratings page supports search by entity and filtering by sector. Rationales are free; research reports are premium. — [ICRA Ratings](https://www.icra.in/Rating)
- CareEdge has a public "Find Ratings" company search. — [CareEdge](https://www.careratings.com/)

### Inferences
- **Features:** latest rating and outlook, number of notches moved in the last 12 months, INC flag (binary), "rating withdrawn" status, and key phrases from rationales (collections shortfall, refinancing risk, delays in approvals). LLMs can extract these from the PDFs.
- **Coverage will be partial.** Small SPVs often have only bank-facility ratings or none. Match on CIN or legal name.

### Gaps
- No NCR-developer-specific rationale was opened in this session; the search returned no relevant hits. CRISIL, India Ratings, Acuité, Infomerics and Brickwork portals were not checked.
- The SEBI circular that requires CRAs to disclose INC could not be retrieved.

---

## Q5. Which insolvency and litigation sources are usable (IBBI, NCLT, eCourts, consumer commissions, vendor APIs), and what do they cost?

### Takeaway
IBBI is the cleanest free source. It has a list of nearly 15,000 public announcements with export, and a quarterly Excel newsletter with sector tables. NCLT, eCourts and e-Jagriti searches by party name are free but every one has a CAPTCHA. The practical route is a paid aggregator API. eCourtsIndia publishes per-call prices: ₹0.20–0.60 per party search and ₹0.50–1.50 per case detail.

### Cited Findings
- IBBI Public Announcements: 14,952 records across 748 pages. Columns are type (CIRP, liquidation and others), date of announcement, last date of claims, corporate debtor, applicant, insolvency professional, and the announcement PDF. Export is available and there is no CAPTCHA. The list includes NCR real-estate names such as Vatika IT Parks Pvt Ltd. — [IBBI public announcements](https://ibbi.gov.in/en/public-announcement)
- IBBI's latest newsletter is Apr–Jun 2026, published as PDF, Excel and eBook. — [IBBI publications](https://ibbi.gov.in/en/publication)
- IBBI newsletter Excel, Table 3, cumulative CIRPs by sector (parsed by researcher):

  | Sector | Admitted | Closed | Ongoing |
  |---|---|---|---|
  | Real Estate, Renting & Business Activities | 1,996 | 1,531 | 465 |
  | Real Estate Activities (sub-sector) | 571 | 395 | 176 |
  | Construction | 1,129 | 834 | 295 |
  | All sectors | 9,166 | — | — |

  — [IBBI Newsletter Apr–Jun 2026 (Excel)](https://ibbi.gov.in/uploads/publication/18054eb85bc0e7388537b05326192072.xlsx)
- NCLT search pages (Party Name, Order Date) cover benches including New Delhi (Principal and Courts II–VI). They filter by party type, case year and pending/disposed status, and all need a CAPTCHA code. A "Case Data Overview" with IBC reports has no CAPTCHA. — [NCLT party-name search](https://nclt.gov.in/party-name-wise); [NCLT order-date search](https://nclt.gov.in/order-date-wise); [NCLT case data overview](https://nclt.gov.in/case-data-overview)
- eCourts district-court search offers party name, case number, filing number, advocate, FIR, act and case type. A 5-character CAPTCHA is mandatory on every search. — [eCourts services](https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index)
- Consumer commissions: e-Jagriti replaced Confonet, e-Daakhil, OCMS and CMS from 1 Jan 2025. Status search by complainant or opposite-party name is free with no account, but needs a CAPTCHA. Guide last verified Oct 2026. — [Claw Law guide](https://clawlaw.in/blog/case-search-at-the-ncdrc-and-state-consumer-commissions)
- **eCourtsIndia API pricing:**
  - Plans: Pay-as-you-go deposit packs of ₹1,000–₹5,000 (billed at 3× the base rate); Enterprise Monthly at ₹10,000 + GST for 10,000 credits; Enterprise Annual at ₹1,00,000 + GST.
  - Per-call base rates (PAYG at 3×):

    | Endpoint | Base rate | PAYG |
    |---|---|---|
    | Case search | ₹0.20 | ₹0.60 |
    | Case detail | ₹0.50 | ₹1.50 |
    | Order PDF | ₹1.25 | ₹3.75 |
    | Order + AI summary | ₹2.50 | ₹7.50 |
    | Cause-list search | ₹1.00 | ₹3.00 |

  - It claims "35.1 Cr+ case records" and "all Indian courts", and gives ₹200 of free credits.
  — [eCourtsIndia API pricing](https://ecourtsindia.com/api/pricing); [eCourtsIndia API](https://ecourtsindia.com/api)
- Other litigation APIs (pricing not public): Vakeel360 (fixed monthly plans; HCs, NCLT, CAT, ITAT, district courts), LegalKart, DigiVerification, Surepass eCourts API. — [Brave search results summary](https://search.brave.com/search?q=litigation+API+India+party+name+search+pricing+per+search+ecourts)

### Inferences
- **Features:**
  - CIRP admitted against the promoter or any group SPV (IBBI); this alone is enough for a top-risk flag;
  - Section 7/9 petitions pending at NCLT New Delhi or Chandigarh;
  - count and trend of consumer cases (NCDRC/SCDRC) and civil/criminal cases by party name;
  - execution petitions;
  - FIRs (EOW/ED/CBI) found through eCourts FIR search or news.
- **Running cost is low.** For about 300 entities with 3 name variants each, plus about 3,000 case-detail pulls, eCourtsIndia PAYG comes to roughly ₹6,000–10,000 per full refresh (researcher's arithmetic from published rates).

### Gaps
- The Supreme Court-ordered CBI probe of builder–bank "subvention scheme" nexus cases in NCR, and any ED actions, could not be verified from a primary source in this session (search budget exhausted).
- NJDG bulk or API access was not checked.
- IBBI does not tag CIRPs by NCR or by real-estate project directly. Location has to be inferred from the corporate debtor's CIN or registered office, or from NCLT bench.

---

## Q6. What do the authorities (Noida/GNIDA/YEIDA, DTCP Haryana) publish on builder dues, licences, OC/CC and approvals?

### Takeaway
DTCP Haryana's licence register is open, exportable to Excel, and has no CAPTCHA. It shows licence validity/renewal dates and links to OC permission and completion certificates. That makes it a strong source of labels and features for Gurugram. Noida Authority's group-housing dashboard (Total, Complete, Incomplete, Full-paid, Under NCLT, CC issued, sub-leases executed) still says "Updated as on 16/06/2023". Builder dues under the Amitabh Kant package are known mostly from news reports, not an official machine-readable list.

### Cited Findings
- **DTCP Haryana licence details:**
  - Filters: status (Valid / Cancelled / Migrated / DeLicense), circle, district, development plan, purpose (30+ categories), licence year, date range.
  - Columns: case no., colony name, BR-III (building plan sanction), BR-VII (OC permission letter), LC-IX (completion certificate), licence no., issue date, purpose, area, development plan, "Valid/Renewal Upto", sectors, developer name, land schedule. Per-licence map and Export to Excel are available.
  - About 3,163 table rows, no CAPTCHA (parsed by researcher).
  — [DTCP licence details](https://tcpharyana.gov.in/webadmin/license/licensedetails)
- DTCP's "Town Wise EDC Report" gives only aggregate EDC receipts by town and month, for example Gurgaon-Manesar ₹126.94 crore in April of FY2026-27. It does not give licence-level dues. — [DTCP EDC report](https://tcpharyana.gov.in/WebAdmin/edc_idc_chart/YearWiseReport)
- DTCP's homepage also links to Development Plans, Sectoral Plans, regularised colonies, TOD/TDR licence lists and a list of blacklisted architects. — [DTCP Haryana](https://tcpharyana.gov.in/)
- Noida Authority's site links "Group Housing Builder Projects Information" to pims.mynoida.org.in. Its dashboard categories are: Total Projects; Complete Projects (sub-lease open / not open); Incomplete (sub-lease open / not open); Full Paid Projects; Projects Under NCLT. Columns include flats sanctioned, total sub-leases executed and "CC Issued". It carries the note "Updated as on 16/06/2023" and a disclaimer that figures "do not have any legal sanctity". The rows load dynamically and were not parsed. — [Noida Authority](https://noidaauthorityonline.in/en); [Noida PIMS group housing](https://pims.mynoida.org.in/GroupHousing/GroupHousingProject)
- Amitabh Kant package and Noida dues, from a Brave search-results summary of news (not opened individually):
  - 57 builders were in the Noida scheme and 35 deposited 25% of dues.
  - The Authority was owed about ₹5,500 crore and sent notices to 43 projects after the deadline (Daily Jagran, 6 Nov 2025).
  - Notices went to 13 builders for ₹8,510.69 crore (ET Realty, 22 Jun 2024), naming Three C (₹572.51 crore) and Celerity (₹178.65 crore).
  - In Greater Noida, 37 of 98 stalled projects had paid 25% by Aug 2025.
  — [Brave search summary: Kant package dues](https://search.brave.com/search?q=Noida+Authority+builder+dues+list+Amitabh+Kant+package+projects+paid+25%25+2026); [Brave search summary: Noida RCs](https://search.brave.com/search?q=Noida+Authority+RC+issued+builders+dues+5500+crore+list+of+builders)
- UP RERA project records name the sanctioning authority (Noida Authority, Greater Noida Authority, Yamuna Expressway Authority, GDA and others) and the permit validity. — [UP RERA viewprojects](https://www.up-rera.in/viewprojects)

### Inferences
- **Gurugram features from DTCP:**
  - licence expired or not renewed;
  - licence cancelled or migrated;
  - OC/CC issuance date compared with the RERA promised date (this is the training label);
  - EDC/IDC dues, taken from HARERA QPR ("EDC due as on date"), because DTCP's public EDC report is aggregate only.
- **Noida/GNIDA/YEIDA features:** Kant-package participation, % of dues paid, and RCs issued by the authority. These will likely need manual compilation from authority press releases and news in v1, plus RTI or direct requests for current dues lists.
- **For UP, the 2023 PIMS dashboard can still seed historical labels** (CC issued, Under NCLT), but it should not be used as current status.

### Gaps
- No official, current, machine-readable builder-dues list was found for Noida, Greater Noida or YEIDA.
- GNIDA and YEIDA sites were not checked.
- Haryana's licence-level EDC/IDC defaulter list was not found. A 2023 report of 300 colonisers put on notice appeared only in a search summary.
- Delhi DDA, fire NOC and Parivesh (environmental clearance) search capability were not verified; Parivesh is a JS app that the fetcher could not render.

---

## Q7. Can satellite imagery measure construction progress, and at what resolution and cost?

### Takeaway
Sentinel-2 is free, with 10 m resolution and a 5-day revisit. It works for activity and change detection (site cleared, ground disturbance, slab mass appearing) and coarse height. Published Sentinel-1/2 height models have RMSE of about 3.7 m, which is too coarse to count floors reliably. Counting floors or seeing cranes needs sub-metre imagery: ISRO Cartosat through Bhoonidhi (priced), or commercial archive and tasking (SkyFi from $15 per archive image and $200 per tasking image). Google Earth imagery cannot be used commercially or for data extraction.

### Cited Findings
- Sentinel-2 has 10 m bands (blue, green, red, NIR), 20 m and 60 m bands, and a 5-day revisit with two satellites (three are now active). The data is open and free through the Copernicus Data Space Ecosystem. — [Copernicus SentiWiki S2 mission](https://sentiwiki.copernicus.eu/web/s2-mission)
- MBHR-Net estimates building height at 10 m from Sentinel-1 and Sentinel-2 time series, with 3.73 m RMSE, 0.95 IoU and R² 0.61 (Netherlands). — [arXiv 2307.01378](https://arxiv.org/abs/2307.01378)
- A random-forest Sentinel-1/2 height model reached R² 0.78 against LiDAR in US cities. — [arXiv 2405.00989](https://arxiv.org/abs/2405.00989)
- Multiple 10 m Sentinel-2 images can be distilled into 50 cm building segmentation masks (79.0% mIoU for buildings). — [arXiv 2310.11622](https://arxiv.org/abs/2310.11622)
- A unified pipeline of segmentation and detection networks determined building construction progress from satellite imagery. — [arXiv 2209.15084](https://arxiv.org/abs/2209.15084)
- NRSC's Bhoonidhi lets users "search, view and download/order open/priced data" from IRS missions, Landsat-8 and Sentinel-1/2. Cartosat-2S and Cartosat-3 products are "available for ordering". — [Bhoonidhi](https://bhoonidhi.nrsc.gov.in/bhoonidhi/home.html)
- SkyFi lists optical imagery "starting at $15", single archive images from $15, single tasking images from $200 and SAR from $450. Per-km² rates appear only in its app. — [SkyFi pricing](https://skyfi.com/en/pricing)
- UP42 sells through credits (100 credits = €1), pay-as-you-go or enterprise. — [UP42 pricing](https://up42.com/pricing)
- Planet's pricing page shows no public numbers. — [Planet pricing](https://www.planet.com/pricing/)
- Google Geo Guidelines:
  - Google Earth content "may not be used for any commercial or promotional purposes".
  - "Creating data from Street View images, such as digitizing or tracing" is prohibited.
  - Capturing output from Google Earth to "reconstruct 3D models or create similar content" is prohibited.
  — [Google Geo Guidelines](https://about.google/brand-resource-center/products-and-services/geo-guidelines/)

### Inferences
- **v1 approach:** a Sentinel-2 monthly change-detection index per project polygon, flagging "no visible activity for N months" against a QPR that claims progress. This needs project geocoding (UP RERA has lat/long fields; HARERA has sector and licence maps).
- **Escalation:** buy one or two sub-metre archive images per year for high-risk or disputed projects only, at roughly $15–200 per image (inference from SkyFi starting prices). Treat this as a spot-check rather than a full-coverage feature.

### Gaps
- No published per-km² prices were found for Planet SkySat/PlanetScope, Maxar, Airbus Pléiades Neo or Cartosat-3.
- No India-specific study was found on high-rise floor counting from imagery.
- Terms for Google Earth historical imagery specifically are not addressed beyond the general bans above.

---

## Q8. What legal and terms-of-use constraints apply (website terms, IT Act, Copyright Act, DPDP, NDSAP/GODL)?

### Takeaway
Government data in India is not automatically open licensed. GODL-India allows commercial reuse with attribution, but only covers data released under NDSAP (e.g., on data.gov.in), and it excludes personal information. HARERA's terms require emailing for permission to reproduce material. UP RERA lets users download but requires approval for "any other proposed use", and even requires prior permission to hyperlink.

Copyright Act s.52(1)(q)(iv) exempts reproduction of judgments and orders of courts, tribunals and "other judicial authority". IT Act s.43 penalises downloading or extracting data "without permission". DPDP Act s.3(c)(ii) excludes personal data that someone is legally obliged to make public, which likely covers director details published under RERA and MCA law.

The safest posture is:
- avoid CAPTCHAs (don't bypass them);
- rate-limit collection;
- display derived scores with source links rather than republishing raw documents;
- request written permission from HARERA and UP RERA.

### Cited Findings
- **HARERA Terms of Use:** "Material featured on this Portal may be reproduced after taking proper permission by sending a mail to us… reproduced accurately and not to be used in a derogatory manner or in a misleading context… the source must be prominently acknowledged."
- **HARERA Hyperlinking Policy:** no objection to linking without prior permission, but pages must not be loaded into frames.
— [HARERA Terms of Use](https://haryanarera.gov.in/login/terms_of_use); [HARERA Website Policies](https://haryanarera.gov.in/login/website_policies)
- **UP RERA Copyright Policy:** "The material may be downloaded without requiring specific prior permission. Any other proposed use of the material is subject to the approval of Uttar Pradesh Real Estate Regulatory Authority". Applications go to contactuprera@up-rera.in. Its hyperlink policy says "Prior permission is required before hyperlinks are directed from any website to this site". — [UP RERA Disclaimer and Policies](https://www.up-rera.in/DisclaimerandPolicies)
- **GODL-India** (Gazette, 13 Feb 2017) grants "a worldwide, royalty-free, non-exclusive license" to use, adapt, publish and create derivative works "for all lawful commercial and non-commercial purposes" with attribution. It covers data under NDSAP. Exemptions include "Personal Information" and data the provider is not authorised to license. — [GODL Gazette notification](https://data.gov.in/sites/default/files/Gazette_Notification_OGDL.pdf)
- **Copyright Act 1957, s.52(1)(q):** reproduction or publication of "(i) any matter which has been published in any Official Gazette… (iv) any judgment or order of a court, Tribunal or other judicial authority, unless the reproduction or publication of such judgment or order is prohibited" is not infringement. — [Indian Kanoon, s.52](https://indiankanoon.org/doc/1013176/)
- **IT Act 2000, s.43(a)–(b):** penalties and compensation for anyone who, without permission of the owner or person in charge, "accesses or secures access to" a computer resource or "downloads, copies or extracts any data, computer data base or information" from it. — [Indian Kanoon, IT Act s.43](https://indiankanoon.org/doc/39800/)
- **DPDP Act 2023, s.3(c)(ii):** the Act does not apply to "personal data that is made or caused to be made publicly available by (A) the Data Principal… or (B) any other person who is under an obligation under any law for the time being in force in India to make such personal data publicly available." — [DPDP Act 2023 (MeitY)](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf)
- **Personal data observed on portals:**
  - HARERA Form A-H shows directors' residential addresses and mobile numbers (PAN masked).
  - UP RERA project summaries show promoter mobile and email.
  - HARERA's corrigendum JSON includes the email IDs of staff who made entries.
  — [HARERA Form A-H](https://haryanarera.gov.in/view_project/project_preview_open/1444); [UP RERA projects](https://www.up-rera.in/projects); [HARERA corrigendum JSON](https://haryanarera.gov.in/assistancecontrol/view_corrigendums_popup)

### Inferences
- **Treat RERA orders as covered by the s.52(1)(q)(iv) exemption.** RERA authorities and adjudicating officers decide complaints quasi-judicially, so quoting and summarising them is likely lawful. Bulk-republishing other portal material (Form A-H, QPR PDFs, photos) without permission carries terms-of-use and IT Act s.43 risk.
- **Mitigations:**
  - store raw data internally and show only scores, flags and links to the official page;
  - write to HARERA and UP RERA for permission;
  - never bypass CAPTCHAs (eCourts, NCLT, e-Jagriti, UP RERA complaint/RC) — use licensed aggregators (eCourtsIndia, Probe42) instead.
- **DPDP:** the s.3(c)(ii) exclusion likely covers director and promoter data the RERA Act and Companies Act require to be published. Even so, minimise collection: drop phone numbers and addresses, and keep DINs and names only for entity linking. Re-check the DPDP Rules (not reviewed here) before launch.
- **Defamation and accuracy risk.** A published "risk score" naming developers needs clear methodology, data dates, a correction channel and "not investment advice" wording. Note that UP RERA itself tells buyers to "avoid committing to projects listed under the 'Abeyance Projects' list".

### Gaps
- No court ruling was found on scraping Indian government portals under IT Act s.43.
- Whether GODL applies to state RERA portals at all was not confirmed; they are not on data.gov.in.
- The DPDP Rules (notified 2025, per general knowledge) and their commencement dates were not verified in this session.
- No legal opinion was found on publishing developer risk scores (defamation, SEBI rules on research analysts, credit-information-company rules).

---

## Q9. Other distress and site signals: SARFAESI auctions, SWAMIH, AQI, master plans

### Takeaway
BAANKNET is the government bank-auction platform. It lists 96,111 assets and is browsable by city (Noida and Gurugram) without login. That makes it a usable source for "project or developer assets under SARFAESI auction" flags. SWAMIH does not publish its investee list on the fund page. CPCB's real-time AQI is available as a keyed data.gov.in API, updated the same day the researcher checked.

### Cited Findings
- BAANKNET (Bank Asset Auction Network) is an e-auction platform for banks. It showed 96,111 listed assets and 3,56,590 auctions conducted, including 5,748 active residential auctions. "Explore by City" includes Noida and Gurugram without registration. — [BAANKNET](https://baanknet.com/)
- The SWAMIH Investment Fund I page (SBI Ventures) covers governance only; there is no investee project list. — [SBI Ventures SWAMIH](https://www.sbiventures.co.in/swamih-investment-fund-i/)
- data.gov.in resource "Real time Air Quality Index from various locations" (CPCB) was last updated 2026-10-18. Fields are state, city, station, last_update, lat/long, pollutant_id and min/max/avg values. It needs an API key. — [data.gov.in AQI API](https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69)
- DTCP Haryana publishes Development Plans and Sectoral Plans, plus a GIS map per licence. — [DTCP Haryana](https://tcpharyana.gov.in/); [DTCP Sectoral Plans](https://tcpharyana.gov.in/WebAdmin/SectorPlan/Index)

### Inferences
- **Site features are secondary for delivery risk.** They matter more for price and liveability; v1 can skip them except for project geocodes, which satellite change detection needs.
- **SWAMIH funding is a double-edged signal:** the project is stressed but has last-mile funding. Compile it from news or developer disclosures.

### Gaps
- Noida Master Plan 2031, Gurugram Master Plan 2031, MPD-2041, Bhuvan, flood/waterlogging layers and metro GIS were not verified (search budget exhausted).
- No public SWAMIH project list was found.
- Homebuyer-forum and social sentiment sources (FPCE, X, Google reviews) and their terms were not researched.

---

## Q10. What is the minimum viable data stack for a v1 score covering 200–500 under-construction projects in Gurugram and Noida, and what will it cost?

### Takeaway
A credible v1 can be built almost entirely on free official sources, with about ₹1–1.5 lakh a year of paid data and roughly 6–10 weeks of solo engineering. The core is:
1. HARERA Gurugram (projects, QPRs, extensions/OC/CC/sale bans, complaints, judgments);
2. UP RERA (project list with QPR-default and de-registration flags, complaint counts, revised end dates);
3. DTCP licence and OC/CC register;
4. IBBI;
5. MCA through Tofler or direct ₹100 views;
6. eCourtsIndia API for litigation;
7. Sentinel-2 change detection.

Paid market-velocity data (PropEquity or Liases Foras) can wait until v2, pending quotes.

### Cited Findings
- **Universe size (parsed by researcher, 18 Oct 2026):**
  - HARERA Gurugram has 520 registrations valid on or after 18 Oct 2026, across all project types. — [HARERA GGM registered projects](https://haryanarera.gov.in/admincontrol/registered_projects/2)
  - UP RERA has 142 GB Nagar residential projects (233 including Ghaziabad) with end date on or after 18 Oct 2026. Of all 1,453 GB Nagar and Ghaziabad projects (all types), 1,044 have a listed end date before 18 Oct 2026. That group mixes completed and delayed projects, and the list's end date may not reflect RERA-granted extensions. — [UP RERA registered projects](https://www.up-rera.in/projects)
- **Paid components with published prices:**
  - Tofler Growth: ₹28,000 + GST a year (100 credits), with extra credits at ₹349. — [Tofler](https://www.tofler.in/price-and-plans)
  - eCourtsIndia API: PAYG from ₹1,000 deposits (party search ₹0.60, case detail ₹1.50, order PDF ₹3.75 at PAYG), or ₹10,000 + GST a month enterprise. — [eCourtsIndia pricing](https://ecourtsindia.com/api/pricing)
  - SkyFi: archive imagery from $15 per image, tasking from $200. — [SkyFi](https://skyfi.com/en/pricing)
- **Free components:**
  - IBBI Excel and announcements — [IBBI](https://ibbi.gov.in/en/public-announcement)
  - DTCP licence export — [DTCP](https://tcpharyana.gov.in/webadmin/license/licensedetails)
  - Sentinel-2 — [Copernicus](https://sentiwiki.copernicus.eu/web/s2-mission)
  - ICRA rationales — [ICRA](https://www.icra.in/Rating/AllRatingRationales)

### Inferences

**Proposed v1 stack**

| # | Source | Key risk features | Access | Refresh | Cost (est.) |
|---|---|---|---|---|---|
| 1 | HARERA GGM registered/lapsed/defaulter lists + Form A-H | promised date, registration validity, lapsed, cancelled; Part G past-project delays and litigation; booked units; loans; escrow bank | HTML, no CAPTCHA | monthly | free (engineering) |
| 2 | HARERA QPR (POST per project-quarter) | % construction vs plan, cost incurred vs estimate, collections, escrow withdrawals, units sold per quarter, EDC due, certificate filing dates, QPR missing | HTML, no CAPTCHA; ~520 projects × ≤23 quarters | quarterly (15 days after quarter end) | free |
| 3 | HARERA corrigendum JSON + monitoring cases + judgments index | Section 6 extensions (count, dates), OC/CC/PCC dates (label), sale ban, cancel order; complaints per project; execution cases; respondent-level complaint trend | JSON/HTML, no CAPTCHA | weekly | free |
| 4 | UP RERA projects list + summary + detail | (Default on QPR), (De-registered), complaints per project and promoter, promoter project count, revised end date and extension order, sanctioning authority, 3 bank accounts | ASP.NET postback, no CAPTCHA | monthly | free |
| 5 | DTCP licence register | licence validity/renewal lapse, cancelled/migrated licence, OC (BR-VII) and CC (LC-IX) dates | HTML + Excel export | monthly | free |
| 6 | MCA (Tofler or direct) | charges (new/open, lender), net worth, debt, customer advances, auditor remarks, struck-off/CIRP status, director cross-links to failed companies | Tofler UI/Excel; MCA ₹100/company | annual (+ charges quarterly) | ~₹30k (direct) to ~₹1 lakh + GST (Tofler, ~300 entities) |
| 7 | IBBI announcements + NCLT (via API vendor) | CIRP admitted against promoter or SPV; pending IBC petitions | free export; vendor API | weekly | free / within eCourtsIndia budget |
| 8 | eCourtsIndia API | consumer, civil and criminal cases by party; FIRs; orders | REST API | monthly | ~₹6–12k per full refresh (PAYG) or ₹10k + GST a month |
| 9 | Ratings (ICRA, CRISIL, CARE, IndRa) | rating level, downgrades, INC flag | free PDFs, manual or LLM extraction | monthly | free |
| 10 | Sentinel-2 | site activity / no-activity months vs QPR-claimed progress | free API (CDSE) | monthly | free (compute) |
| 11 | Authority dues (Noida/GNIDA/YEIDA) + Kant package | dues outstanding, % paid, RCs issued, NCLT | manual from news/press releases, RTI | quarterly | time only |
| v2 | PropEquity / Liases Foras | absorption, unsold inventory, price trend, independent construction status | subscription | quarterly | quote needed |

**Effort (solo founder):**
- About 2–3 weeks for HARERA and DTCP scrapers and parsers.
- About 2 weeks for UP RERA, including AJAX QPR handling.
- About 1–2 weeks for entity resolution: promoter name to CIN to group, using MCA directors.
- About 1 week for litigation and IBBI joins.
- About 1–2 weeks to build labels from OC/CC dates vs original completion date, train a model (gradient boosting with SHAP reason codes), and review.
- Total: about 6–10 weeks.

**Labels:** for delay, use OC/CC date (or "still incomplete at date X") minus the original declared completion date from the first registration certificate. In Gurugram this comes from HARERA corrigenda and DTCP. In Noida it comes from the authority CC data, which is weak and needs manual work.

**Biggest risks:**
- portal terms (get permission; never bypass CAPTCHAs);
- data quality in self-reported QPRs (negative values, invalid dates, missing filings — treat missing filings as a signal in itself);
- entity resolution across SPVs;
- a thin UP label set.

### Gaps
- Prices from PropEquity, Liases Foras and Probe42 are needed to cost a v2 with market velocity.
- Rate limits and robots.txt for HARERA and UP RERA were not checked.
- No benchmark exists for how much of the residential universe each source covers (e.g., what share of HARERA GGM's 520 valid registrations are residential). This requires classifying Form A-H project type.
