# Fixture conflicts and proposed §5b additions

Owner: T03 (then T03b). WORK_BREAKDOWN §1 rule 5: facts come only from DESIGN.md §5/§5b. When a fixture needs a fact that is missing, or two sources disagree, it is listed here. The lead decides and, where needed, adds the fact to §5b; then the fixtures change in `src/author` and `npm run -w @plinth/fixtures gen` regenerates everything.

How the fixtures behave until a row is decided:

- A **missing fact stays `null`** in canonical and expected JSON. Nothing is guessed.
- A **derived value** (arithmetic from §5b facts with a published rule) is used and marked `derived: …` in its `source`.
- **Copy** (sentences, not facts) comes from the artboards named in WORK_BREAKDOWN T03 (AppRisk, WebProject) and the state artboards. Every fact inside that copy is from §5b.
- Every canonical record carries a `source`. Records that depend on a row below cite it as `CONFLICTS.md C-xx (proposed; not yet in DESIGN §5b)`.

Status: **open** (needs the lead), **proposed** (fixtures follow the proposal; the lead confirms), **resolved** (already in §5b).

| ID | Status | Topic |
|---|---|---|
| C-01 | resolved | Registration months and rounding (Kestrel, Laurel, Heron Point, the all-in rounding) |
| C-02 | proposed | Sapphire and Coral registration months, derived from time used |
| C-03 | proposed | Aurelia's 14 QPR rows: which quarters |
| C-04 | open | RERA numbers for 5 phases (the database requires one) |
| C-05 | open | Cedar Walk, Phase 2 has almost no facts |
| C-06 | open | QPR filing dates and timeliness outside Aurelia |
| C-07 | open | Orbis Land's claim state |
| C-08 | open | Claim dates for Meridian Habitat and Halcyon Homes |
| C-09 | open | Elmstone's insolvent group company is unnamed |
| C-10 | proposed | Coral Towers' extension orders |
| C-11 | open | Complaint orders exist only as counts |
| C-12 | proposed | Northfield's units base for the complaint rate |
| C-13 | open | Exact all-in rupees outside Aurelia |
| C-14 | open | Dispute D-118 dates |
| C-15 | proposed | Band ranges, calibration counts and model release dates |
| C-16 | proposed | Reason texts and "what would change" outside Aurelia |
| C-17 | proposed | Band history before 14 Oct 2026 outside Aurelia |
| C-18 | proposed | Aurelia's payment plan: 13 stages, not 11 |
| C-19 | proposed | The developer reply text and signatory |
| C-20 | open | Map coordinates for the pins |
| C-21 | open | "1 project hidden by your filter" becomes 2 with all 8 phases |
| C-22 | proposed | Afford the wait: the monthly payout path |
| C-23 | proposed | Facts-only design-state fixtures |
| C-24 | open | The old share card (26 Jun 2026, model v1.1) predates v1.1 |
| C-25 | proposed | API_CONTRACTS §4.3 still shows Kestrel's old completion date |
| C-26 | proposed | AppRisk's reason 4 text differs from BUILD_PLAN §7.1 |
| C-27 | open | Artboard-only facts that are not used (ready to paste into §5b) |
| C-28 | open | Schema gaps found while seeding T04's tables |
| C-29 | open | `ai_ask` and the other kill switches in the fixture world |

---

## C-01 · Registration months and rounding (resolved)

WORK_BREAKDOWN T03 asked for these to be recorded. DESIGN §5b "Engineering fixture decisions (19 Oct 2026)" now settles them, and the fixtures follow it:

- **Kestrel Park:** registered Nov 2023, original completion Nov 2028. (The old Jun 2027 date implied registration in Nov 2025, which contradicted 63% built.) Time used: Nov 2023 → Oct 2026 = 35 of 60 months = 58%.
- **Laurel Residency:** registered Nov 2020. Nov 2020 → Oct 2026 = 71 of 67 months = 106%.
- **Heron Point, Phase 2:** registered 28 Apr 2026, so less than 6 months before the 14 Oct 2026 cutoff: not scored. `core.rera_registrations.registered_on` has no precision column, so month-precision registrations are stored as the 1st of the month and Heron Point's as the day (C-28).
- **Afford the wait:** the all-in is rounded to the nearest lakh (₹2,74,00,400 → ₹2,74,00,000) before any loan arithmetic (BUILD_PLAN D-6). `vectors/afford_the_wait.json` pins the results.

## C-02 · Sapphire and Coral registration months (proposed)

§5 gives time used today and the original completion, not the registration month. With the month-based rule (BUILD_PLAN §7.1):

- **Sapphire Grove, Phase 1:** 55% with completion Mar 2028 has one solution: **Jan 2025** (21 of 38 months).
- **Coral Towers:** 70% with original completion Aug 2028 fits **Jul 2022** (51 of 73 = 69.9%) or Jun 2022 (52 of 74 = 70.3%). The fixtures use Jul 2022.

Proposal: add both months to §5b.

## C-03 · Aurelia's 14 QPR rows (proposed)

DATA_MODEL and WORK_BREAKDOWN say "14 Aurelia filing rows". Registered in Dec 2022, Aurelia could have 14 filed quarters (Jan–Mar 2023 to Apr–Jun 2026) plus the missing Jul–Sep 2026, which is 15. The WebProject evidence copy says "QPR filing register for Phase 2, Jun 2023 to Jun 2026", so the fixtures seed **Apr–Jun 2023 to Jul–Sep 2026: 13 filed rows plus the missing one = 14**. Progress values only on the 8 §5b quarters. Filed dates exist only where §5b gives them: 15 Jul 2026, and the three late quarters (due date + days late: 27 Oct 2024, 26 May 2025, 22 Feb 2026). The other on-time rows have `filed_on = null`.

Proposal: confirm the first QPR is Apr–Jun 2023.

## C-04 · RERA numbers for 5 phases (open)

§5b has RERA numbers only for Aurelia (GGM/673/405/2022/117) and Heron Point (GGM/902/634/2026/12). Kestrel Park, Sapphire Grove Ph 1, Coral Towers, Laurel Residency and Juniper Enclave have none, and no artboard shows one. Expected JSON carries `rera_number: null`.

T04's `core.rera_registrations.rera_number` is NOT NULL, so `seedmap/catalogue.mjs` writes a visible token `PENDING-C04-<slug>` (never a HARERA-shaped number) for those five rows. T12's contract test will fail on `phase.rera_number` until this is decided, which is intended.

Proposal: the lead adds five fictional numbers to §5b; T03b or the lead puts them into `src/author/canonical.mjs`.

## C-05 · Cedar Walk, Phase 2 (open)

§5/§5b say only: Northfield ongoing project, Moderate; a price list dated 12 Jun 2026; Nisha's visit and Farah's enquiry (T03b). There is no RERA number, sector, registration, completion date, units, progress, price or reasons. Its fixtures carry the band (Moderate), a low-confidence range derived from Northfield's 6 finished projects (15–30 of 100), and nulls elsewhere. It has no registration row and no reasons.

The WebDeveloper artboard proposes: RERA GGM/566/298/2022/31; "70% built with 92% of the promised time used" (Apr–Jun 2026). See C-27. Proposal: add a Cedar Walk Ph 2 block to §5b (RERA number, sector, registration and completion, units, latest QPR, 3 BHK price, and the reasons for Moderate).

## C-06 · QPR filing dates and timeliness outside Aurelia (open)

- **Kestrel Park Apr–Jun 2026** (built 59%): filing date and on-time status unknown.
- **Laurel Residency, 4 QPRs Jul–Sep 2025 to Apr–Jun 2026** (34% each): filing dates and statuses unknown.
- **Juniper Enclave:** "9% built" is from "the latest QPR", quarter unknown.
- No sold % is given for any phase except Aurelia.

T04's `core.qpr_filings.status` is NOT NULL with no "filed, timeliness unknown" value, so these 5 rows stay out of `10_catalogue.sql` (the SQL header lists them); their figures are still seeded as facts. Proposal: add filed dates to §5b, or T04 adds a status value for "filed, timeliness not read".

## C-07 · Orbis Land's claim state (open)

§5b: every Gurugram developer got the invitation on 24 Nov 2025; claimed: Northfield, Halcyon, Meridian; not yet claimed: Elmstone, Vantage. Orbis Land is in neither list. Fixtures: `invited`, "invited 24 Nov 2025 · not yet claimed" (the default after an invitation). Proposal: put Orbis Land in one list.

## C-08 · Claim dates for Meridian Habitat and Halcyon Homes (open)

Both are "claimed" in §5b with no date; `claimed_on` and `claim.since` are null. Proposal: add the dates.

## C-09 · Elmstone's insolvent group company is unnamed (open)

§5b: "a group company was admitted to insolvency by NCLT order on 12 Mar 2023". The developer row needs a legal name, so it is seeded as "Elmstone Developers group company" (a descriptive label, not a name). Proposal: name the company in §5b.

## C-10 · Coral Towers' extension orders (proposed)

§5b gives Extension 1 (Jan 2026, to Feb 2029) and Extension 2 (granted 14 Oct 2026, to Aug 2029), with no order references. `kind = 'section6'` is derived (a project-specific HARERA extension of registration is a RERA s.6 extension; the WebProject copy treats extensions as Section 6). Extension 1's grant day is unknown, so `granted_on` is 2026-01-01 with no precision column (C-28). Proposal: add order references and Extension 1's date.

## C-11 · Complaint orders exist only as counts (open)

§5b gives counts (Aurelia 14, latest 9 Oct 2026; Kestrel 2; Sapphire 5; Northfield 24), not individual orders. `core.orders` needs a case number per order, so no order rows are seeded; the counts are seeded as `orders.complaints_against_promoter_24m` facts. Aurelia's count moved 13 → 14 with the 9 Oct order (T03b and T43a use that). Proposal: either accept counts as facts for R1, or add the 14 orders (case numbers and dates) to §5b.

## C-12 · Northfield's units base (proposed)

§5b: "24 complaints in 24 months = 0.7 per 100 units". BUILD_PLAN §7.1 gives 3,400 units (24 / 3,400 = 0.71). API_CONTRACTS §4.4's example shows a half-year row with 2,980 units, and WebDeveloper explains 2,980 until Dec 2025 and 3,400 after Heron Point Ph 2 registered. The fixtures use 3,400 and leave `half_years` empty (the half-year counts are artboard-only, C-27). Proposal: add 3,400 (and, if wanted, the half-year table) to §5b.

## C-13 · Exact all-in rupees outside Aurelia (open)

Aurelia's all-in is exact (₹2,74,00,400 from the cost sheet). Kestrel (₹2.44 Cr), Sapphire (₹2.27 Cr) and Coral (₹1.90 Cr) are given rounded, so `all_in_inr` is 24400000 / 22700000 / 19000000. Their ₹/sq ft (17,400 / 16,200 / 15,300) are §5 figures. Proposal: accept the rounded figures, or add their cost-sheet lines.

## C-14 · Dispute D-118 dates (open)

§5b's dispute log shows D-118 with raised date "—" and outcome upheld (filed 15 Jul 2026, on time). WebMethodology says "Filed 14 Aug 2026 … Upheld 3 Sep 2026"; WebAbout says "D-118 · 14 Aug 2026 · upheld in 14 working days". The correction is recorded on the facts without dates. Proposal: put 14 Aug 2026 / 3 Sep 2026 in §5b (or fix the artboards).

## C-15 · Band ranges, calibration counts, model release dates (proposed)

Used from the engineering docs and artboards, not §5b:

- **Band ranges** (WebMethodology, WebAbout, AppRisk): Low 5–15, Moderate 15–30, Elevated 30–45, High 45–65, Severe 65–80 of 100. Coral's "Between 45 and 65 of 100" and Cedar Walk's "Between 15 and 30" come from these.
- **Calibration** (BUILD_PLAN §7.1 per-100; WebAbout counts): Low 4/46 = 9, Moderate 19/61 = 31, Elevated 20/52 = 38, High 19/34 = 56, Severe 14/19 = 74; total 76/212 = 36 (the only part in §5b); Brier 0.19 vs 0.23.
- **Model versions** (WebMethodology; DATA_MODEL for v1.0 and v1.2): v1.0 15 Jul 2026, v1.1 2 Sep 2026, v1.2 14 Oct 2026, with their changelog lines and committee dates.
- **Rules** (BUILD_PLAN §7.1): weights 30/30/20/15/5; confidence needs 8 finished projects; limited history below 3; not scored below 6 months; stale after 120 days (180 before v1.2); re-score within 72 hours.

Proposal: add a short "Methodology numbers" block to §5b.

## C-16 · Reason texts and "what would change" outside Aurelia (proposed)

BUILD_PLAN §7.1 pins Aurelia's 4 reasons. For the other scored phases the reasons are composed from §5b numbers with the reason catalogue (`scoring.json` `reason_templates`); T11 must reproduce them:

- **Kestrel (Low):** "63% built with 58% of the promised time used." · "1 of the group's 9 finished RERA projects got OC more than 12 months late." · "2 complaints decided against the promoter in 24 months · 0.5 per 100 units. Median count for similar projects: 3."
- **Sapphire (Moderate):** "48% built with 55% of the promised time used." · "5 complaints … 1.4 per 100 units. Median count for similar projects: 3." · "The Apr–Jun 2026 QPR was filed 12 days late." · "2 of the group's 11 finished RERA projects got OC more than 12 months late."
- **Coral (High):** "22% built with 70% of the promised time used. 2 extensions on record." · "The Apr–Jun 2026 QPR, due 15 Jul 2026, is not on HARERA."
- **Laurel (Severe, rule):** the NCLT order, the passed Jun 2026 date with 34% built, and the 4-quarter stall.

The first sentence of each matches WebCompare's "Top reason" row. "What would change" uses AppRisk's template ("Two consecutive quarters with construction ahead of sales would move this to <next band down>", or the Low and rule variants). For Sapphire, Coral and Cedar Walk that template mentions sales, which §5b does not give for them. Proposal: the lead confirms or rewrites these lines.

## C-17 · Band history before 14 Oct 2026 outside Aurelia (proposed)

Only Aurelia's history is in §5b. Every band was recalculated on 14 Oct 2026 (v1.2), and first public bands were 15 Jul 2026 (v1.0). The fixtures assume the other phases kept the same band and state from 15 Jul 2026, so `band.since` is 2026-07-15. For Kestrel, Sapphire and Coral this is supported by Rohan's replay (follows since 1 Jul; the only band mark is Aurelia's 2 Oct). It is an assumption for Laurel, Juniper, Heron Point and Cedar Walk. Proposal: confirm.

## C-18 · Aurelia's payment plan: 13 stages, not 11 (proposed)

§5b lists booking 10, agreement 10, foundation 10, seven slabs at 7.5, brickwork 7.5, finishing 5, possession 5: **13 stages summing to 100%**. DATA_MODEL ("Aurelia's 11 rows") and the WebProject copy ("11 stages") say 11. The fixtures seed 13, and the before-booking copy says 13. Proposal: fix DATA_MODEL and the artboard.

## C-19 · The developer reply (proposed)

§5b: "Developer reply published 15 Oct 2026; Plinth checks it by 5 Nov." The text is from AppRisk/WebProject: "Tower B structure was completed in September 2026. The QPR for Jul–Sep 2026 was filed on 12 October." WebDeveloper shows a different, group-level text (about Heron Point Ph 1's fire NOC). The signatory title "Head of Customer Relations" is from API_CONTRACTS §2.1 (WebProject says "Northfield Estates, compliance team"). Proposal: settle one reply text and title in §5b.

## C-20 · Map coordinates (open)

No project or sector coordinates are in §5b; `centroid` is null in search results, so T22/T30 cannot place pins from the fixtures. Proposal: add approximate fictional pin positions (or sector centroids) to §5b.

## C-21 · "1 project hidden by your filter" (open)

API_CONTRACTS §4.3 and T22's acceptance expect the canonical query ("3 bhk dwarka expresway under 2.5 cr low risk") to hide 1 project (Aurelia). The WebSearch artboard has 6 projects; with all 8 seeded phases, **Heron Point, Phase 2** (Sector 104, Dwarka Expressway, no price list) cannot match "3 BHK" either, so the expected output says **"2 projects hidden by your filters."** and lists both. Proposal: either accept 2 (and update T22's acceptance text), or rule that phases with no price list are listed separately instead of being counted as hidden.

## C-22 · Afford the wait: the monthly payout path (proposed)

§5b pins the endpoints (₹1,18,077 now, ₹2,00,563 by Dec 2027, ₹24.1 L / ₹48.1 L for 12 / 24 months, ₹1,90,227 EMI). The month-by-month path between Nov 2026 and Dec 2027 is not in §5b: the series raises the paid-out share in equal monthly steps from 52.5% to 95%, and a delay holds the Dec 2027 level. Delay cost = months × the rounded Dec 2027 outgo (this is what reproduces ₹24,06,756). Proposal: publish this in the methodology "How we worked this out" (with D-6).

## C-23 · Facts-only design-state fixtures (proposed)

T14, T20c and T23 need a facts-only fixture. §5b describes it as a design state, not a current fact. Three variant keys exist: `risk_summary/aurelia-heights-phase-2--facts-only`, `project_page/aurelia-heights-phase-2--facts-only` and `developer_page/northfield-estates--facts-only`. They are not seeded: the database would need `core.developer_groups.facts_only_since = 2026-10-18` for Northfield, which would change every Northfield read. The contract test should skip `--facts-only` keys (or run them against a database with that row set).

## C-24 · The old share card (open)

§5b: "Old card example: data as of 26 Jun 2026, model v1.1, showing Moderate." But v1.1 was released 2 Sep 2026 (WebMethodology), and first public bands were 15 Jul 2026 with v1.0 (DATA_MODEL, BUILD_PLAN). No v1.1 run with a June cutoff exists in `scoring.json`. Proposal: change the example to "data as of 15 Jul 2026, model v1.0" or "data as of 30 Sep 2026, model v1.1". (The share card itself is T03b's.)

## C-25 · API_CONTRACTS §4.3 example (proposed)

It shows Kestrel with "Original completion Jun 2027"; §5b now says Nov 2028. The expected search output uses Nov 2028. Proposal: update the doc example.

## C-26 · AppRisk reason 4 text (proposed)

AppRisk shows "2 of the group's 6 finished RERA projects got OC more than 12 months late. No insolvency found."; BUILD_PLAN §7.1 (exact text) and API_CONTRACTS §2.1 drop the last sentence. The fixtures follow BUILD_PLAN; the insolvency search is its own record. Proposal: align the artboard.

## C-27 · Artboard-only facts, not used (open)

These appear in artboards but not in §5b, so the fixtures leave them out. Each is ready to paste into §5b if the lead agrees:

- **Northfield finished projects (WebDeveloper):** Cedar Walk Ph 1 GGM/118/50/2017/24 (Cedarline Developers, OC Apr 2019, 2 months early); Aurelia Heights Ph 1 GGM/131/63/2017/38 (Northfield Buildtech, OC Mar 2023, 27 months late, 21 after the 6-month COVID extension); Wren Court GGM/176/108/2018/09 (OC Nov 2021, 11 months late); Opaline Residences GGM/262/194/2018/71 (Opaline Realtors LLP, OC May 2023, 11 months late); Heron Point Ph 1 GGM/301/233/2019/15 (Heronstone Projects, OC Jun 2025, 27 months late); Linden Square GGM/349/281/2019/56 (OC Sep 2024, 9 months late). Without these the developer page's promise-vs-OC timeline has names and late flags only.
- **Northfield linked companies (WebDeveloper):** Northfield Buildtech, Cedarline Developers, Wrenfield Infra, Heronstone Projects, Linden Habitat, NF Land Holdings, Northfield Facility Services … with ownership notes. WebDeveloper says Northfield Estates Pvt Ltd has "no RERA projects in its own name", while §5b's collection account names it as the Aurelia account holder (the fixtures follow §5b: it is Aurelia's promoter).
- **Cedar Walk Ph 2 (WebDeveloper):** GGM/566/298/2022/31; 70% built, 92% of time used (C-05).
- **Complaint half-years (WebDeveloper):** e.g. 7 in Jan–Jun 2025 (0.23 per 100 units), 2 in Jan–Jun 2023 (C-12).
- **QPR notes (WebProject):** "Excavation complete" (Apr–Jun 2023), "Foundations complete for Towers A–C" (Oct–Dec 2023), document ids and partial snapshot hashes.
- **WebAbout response board cases:** E-0412, E-0398, G-0016, "Erasures: 11 completed", "268 phases scored". **Sync line:** "17,938 orders read", "HARERA synced 2 hours ago".
- **Money lines (WebAbout):** "~0.35% of a home loan, from Jan–Mar 2027", "₹6,999 Verified Flat Check", "1% + GST on resale". §5b allows only "planned for R2 (from 2027)" for the lender fee; `about` uses the §5b money lines only.

## C-28 · Schema gaps found while seeding T04's tables (open)

The seed was applied with T04's own PGlite check (migrations from `origin/task/T04-db-core` + `10/20/30_*.sql`): it loads cleanly and T04's 160 pgTAP assertions still pass. Gaps to decide (T04 or the lead):

- `core.rera_registrations.rera_number` is NOT NULL (C-04) and `registered_on` has no `*_precision` column.
- `core.qpr_filings.status` has no value for "filed, timeliness unknown" (C-06).
- `core.extensions.granted_on` has no precision column (C-10).
- `core.facts.method` allows parser, llm_x2, manual, developer. Time used and the all-in are rule outputs; they are seeded as `parser` (method_version "time-used rule v1.2") and `developer` (method_version "cost rules 2026.10"). Proposal: add `rules`.
- Corrections on facts (D-097, CL-201, D-118, the open D-127) live in canonical `facts[].corrections` only; `api.evidence` needs them for `corrections_line`. Proposal: a `corrections jsonb` column on `core.facts`, or a join to `ws.disputes` (M4, T03b data).
- The evidence drawer copy (`chip`, `document`, `dates_line`, `used_in`) is in canonical `facts[].evidence_copy`; T12 must derive the same strings or read them from a table.
- `core.score_models.changelog` is text; title, items and committee note are joined with newlines.
- The seed sets `plinth.env = 'fixture'` on the database when it is unset, and turns `bands_public` on (T04 seeds it off).

## C-29 · `ai_ask` and the kill switches (open)

T04 seeds the kill switches `ai_ask`, `ai_doc_check` and `ai_staging` as enabled (enabled = allowed). T24 expects the Compare AI answer to stay hidden "while `ai_ask` is off (M5)". `expected/flags/anon.json` follows the database (T04 defaults + `bands_public` on; internal-audience flags read false for anon), so `ai_ask` is true. Proposal: T04/the lead decide whether the fixture world turns the AI kill switches off until M5.
