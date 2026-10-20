# Fixture conflicts and §5b decisions

Owner: T03 (then T03b). WORK_BREAKDOWN §1 rule 5: facts come only from DESIGN.md §5/§5b. When a fixture needs a fact that is missing, or two sources disagree, it is listed here. The lead decides and adds the fact to §5b. Then the fixtures change in `src/author`, and `npm run -w @plinth/fixtures gen` regenerates everything.

**Round 2 (19 Oct 2026):** the lead answered every row in DESIGN §5b "Fixture decisions, round 2" (PR #8). All rows are now **resolved**. Each one says how the fixtures apply the decision. Canonical records cite the decision as `DESIGN §5b · Fixture decisions, round 2 (C-xx)`.

How the fixtures behave:

- A **missing fact stays `null`**. Nothing is guessed.
- A **derived value** (arithmetic from §5b facts with a published rule) is marked `derived: …` in its `source`.
- **Copy** (sentences, not facts) comes from the artboards named in WORK_BREAKDOWN T03 (AppRisk, WebProject) and the state artboards. Every fact inside that copy is from §5b.

| ID | Status | Topic |
|---|---|---|
| C-01 | resolved | Registration months and rounding (Kestrel, Laurel, Heron Point, the all-in rounding) |
| C-02 | resolved | Sapphire Jan 2025, Coral Jul 2022 |
| C-03 | resolved | Aurelia's 14 QPR rows start Apr–Jun 2023 |
| C-04 | resolved | RERA numbers for 6 phases |
| C-05 | resolved | Cedar Walk, Phase 2 |
| C-06 | resolved | QPR filing dates outside Aurelia |
| C-07 | resolved | Orbis Land claimed 3 Dec 2025 |
| C-08 | resolved | Meridian 5 Dec 2025, Halcyon 9 Dec 2025 |
| C-09 | resolved | Elmstone Infra Projects Pvt Ltd |
| C-10 | resolved | Coral's extension orders |
| C-11 | resolved | Complaints as count facts |
| C-12 | resolved | Northfield units base 2,980 → 3,400 |
| C-13 | resolved | Rounded all-ins outside Aurelia |
| C-14 | resolved | D-118 dates |
| C-15 | resolved | Methodology numbers |
| C-16 | resolved | Reasons and "what would change" |
| C-17 | resolved | Band history since 15 Jul 2026 |
| C-18 | resolved | 13 payment stages |
| C-19 | resolved | Developer replies and signatory |
| C-20 | resolved | Map pins by sector |
| C-21 | resolved | "2 projects hidden by your filters" |
| C-22 | resolved | Afford the wait: the monthly path |
| C-23 | resolved | Facts-only design-state fixtures |
| C-24 | resolved | Old share card: 30 Sep 2026, v1.1 |
| C-25 | resolved | Kestrel's completion in API_CONTRACTS §4.3 |
| C-26 | resolved | AppRisk reason 4 text |
| C-27 | resolved | Northfield's finished projects |
| C-28 | resolved | Schema gaps (T04 PR #4) |
| C-29 | resolved | AI kill switches off until M5 |

---

- **C-01 · Registrations and rounding.** These are in §5b "Engineering fixture decisions":
  - Kestrel: Nov 2023 → Nov 2028 (58%).
  - Laurel: Nov 2020 (106%).
  - Heron Point Ph 2: 28 Apr 2026, stored with `registered_on_precision = 'day'`.
  - The all-in is rounded to the nearest lakh before the afford-the-wait arithmetic.
- **C-02.** Sapphire Grove Ph 1 was registered Jan 2025 and Coral Towers Jul 2022. Both are stored with `registered_on_precision = 'month'`.
- **C-03.** Aurelia's QPR rows run Apr–Jun 2023 to Jul–Sep 2026: 13 filed plus the missing Jul–Sep 2026.
- **C-04.** RERA numbers:
  - Kestrel Park GGM/781/513/2023/64.
  - Sapphire Grove Ph 1 GGM/867/599/2025/03.
  - Coral Towers GGM/612/344/2022/41.
  - Laurel Residency GGM/447/179/2020/52.
  - Juniper Enclave GGM/889/621/2025/22.
  - Cedar Walk Ph 2 GGM/566/298/2022/31.
  - The `PENDING-C04-*` seed tokens are gone.
- **C-05 · Cedar Walk Ph 2.**
  - Promoter: Cedarline Developers, Sector 99, Dwarka Expressway.
  - Registered Jan 2022 → Mar 2027, 320 units.
  - Apr–Jun 2026: 70% built. Time used today is 92%, which is month-based: Jan 2022 → Oct 2026 is 57 of 62 months.
  - QPRs were on time in each of the last 8 quarters, seeded as 8 on-time rows with no filed dates.
  - 3 BHK, 1,350 sq ft carpet, from ₹1.85 Cr (price list of 12 Jun 2026); no all-in.
  - Moderate, low confidence, "Between 15 and 30 of 100", with the 3 reasons.
  - Its Jul–Sep 2026 QPR (due 15 Oct) is not in §5b, so no row is seeded for it.
- **C-06.**
  - Kestrel Apr–Jun 2026 was filed 14 Jul 2026, on time.
  - Laurel's 4 QPRs were filed on time on 13 Oct 2025, 12 Jan 2026, 14 Apr 2026 and 15 Jul 2026, at 34% each.
  - Juniper's Apr–Jun 2026 QPR was filed 10 Jul 2026, at 9%.
  - All of these rows are now seeded. Sold % stays null outside Aurelia; screens show "Not reported".
- **C-07, C-08.** Claims are seeded as `claimed_on`, and the claim line reads "claimed developer page, replies here": Orbis Land 3 Dec 2025, Meridian Habitat 5 Dec 2025, Halcyon Homes 9 Dec 2025.
- **C-09.** The insolvent company is `Elmstone Infra Projects Pvt Ltd` (status `cirp`, NCLT order 12 Mar 2023).
- **C-10.** Both extensions are RERA s.6:
  - Extension 1: granted 20 Jan 2026 (`granted_on_precision = 'day'`), order HARERA/GGM/EXT/2026/014.
  - Extension 2: granted 14 Oct 2026, order HARERA/GGM/EXT/2026/219.
- **C-11.** Complaints are `orders.complaints_against_promoter_24m` count facts. No `core.orders` rows are seeded.
- **C-12.** Northfield's rate uses 3,400 units today. `complaint_counts.units_history` keeps 2,980 until Dec 2025, and the developer page carries the `units_line`.
- **C-13.** Kestrel, Sapphire and Coral use the rounded all-ins: ₹2.44 / ₹2.27 / ₹1.90 Cr.
- **C-14.** D-118 was raised 14 Aug 2026 and upheld 3 Sep 2026. The correction line now carries the date.
- **C-15.** These numbers live in `scoring.json` (`score_models`, `calibration`, `calibration_summary`), sourced to §5b:
  - Band ranges.
  - Illustrative calibration.
  - Model dates.
  - Weights.
  - Confidence, limited-history, not-scored, stale and re-score rules.
- **C-16.** Reasons come from the catalogue, and Cedar Walk adds `TIM_QPR_ON_TIME`. Where sales aren't reported, "what would change" reads "Two consecutive quarters of construction at or ahead of schedule would move this to <band>" (Sapphire, Coral, Cedar Walk). Aurelia keeps the sales version, and Kestrel the Low version.
- **C-17.** Phases other than Aurelia hold their band from 15 Jul 2026 (v1.0) and were re-run under v1.2 on 14 Oct 2026, so `band.since` is 2026-07-15.
- **C-18.** Aurelia's plan has 13 stages (`ws.payment_plan_stages` rows), and the before-booking copy says 13.
- **C-19.**
  - **Aurelia's project reply:** `signatory_title` "Authorised signatory" (API_CONTRACTS §2.1 in PR #8), signed "Ananya Rao, authorised signatory, Northfield Estates".
  - **The developer page's group-level reply:** about the Heron Point Ph 1 fire NOC, by the same signatory. It is seeded on Heron Point Ph 1 with `scope = group`.
  - **Gap for T12:** `ws.developer_replies` has no column for the signatory's name. `signed_line` lives in canonical; T12 should add a column or derive it.
- **C-20.** Pins are by sector (lat, long) on `core.localities`. Projects get the sector pin as `centroid` (seeded as EWKT `SRID=4326;POINT(lng lat)`). Search returns `[lng, lat]`.
- **C-21.** The canonical search hides 2 (Aurelia, and Heron Point Ph 2, which has no price list). Cedar Walk Ph 2 (Sector 99, quoted ₹1.85 Cr, Moderate) is now a result, so the results are Kestrel, Cedar Walk, Sapphire and Juniper. The zero-results query hides 6.
- **C-22.** The paid-out share rises in equal monthly steps from 52.5% (Nov 2026) to 95% (Dec 2027). A delay holds the Dec 2027 outgo. `expected/methodology/default.json` publishes this under `how_we_worked_this_out.afford_the_wait`.
- **C-23.** The `--facts-only` keys are design states and are not seeded. Contract tests skip them.
- **C-24.** Aurelia now has a v1.1 Moderate run published 2 Sep 2026 (the v1.1 release). The old share card (data as of 30 Sep 2026, v1.1, Moderate; T03b) refers to that run. Band history:
  - Moderate, v1.0: 15 Jul → 2 Sep.
  - Moderate, v1.1: 2 Sep → 2 Oct.
  - Elevated, v1.1: 2 Oct → 14 Oct.
  - Elevated, v1.2: from 14 Oct.
  - Nothing shows Elevated before 2 Oct.
- **C-25.** Search shows "Original completion Nov 2028" for Kestrel. PR #8 updates the §4.3 example.
- **C-26.** Reason 4 is "2 of the group's 6 finished RERA projects got OC more than 12 months late." The insolvency search is its own evidence record.
- **C-27 · Northfield's finished projects.**
  - Each project is seeded with its RERA number, promoter, and an OC `core.completion_events` row (month stored as the 1st).
  - The original RERA date is derived (OC minus the months late):

    | Project | Original RERA date | OC |
    |---|---|---|
    | Cedar Walk | Jun 2019 | Apr 2019 |
    | Aurelia Heights Ph 1 | Dec 2020 | Mar 2023 |
    | Wren Court | Dec 2020 | Nov 2021 |
    | Opaline Residences | Jun 2022 | May 2023 |
    | Heron Point Ph 1 | Mar 2023 | Jun 2025 |
    | Linden Square | Dec 2023 | Sep 2024 |

  - New developers: Cedarline Developers, Northfield Buildtech and Opaline Realtors LLP, all Northfield group.
  - Northfield Estates Pvt Ltd is the group parent and the promoter of Aurelia Ph 2.
- **C-28 · Schema gaps.** T04 PR #4 (a318d96 and the next commit) adds what the seed now targets:
  - `rera_registrations.registered_on_precision` and `extensions.granted_on_precision` (domain `core.date_precision`).
  - `core.facts.method = 'rules'` (time used, all-ins).
  - `core.facts.corrections` jsonb (D-097, CL-201, D-118, D-127).
  - `ops.runtime_settings('env', 'fixture')`, which replaces ALTER DATABASE.
  - Checked locally with T04's PGlite tool on a318d96, plus a stand-in for `ops.runtime_settings`: the seed loads and T04's 171 assertions pass.
  - One small gap remains for T04: `core.completion_events.granted_on` has no precision column, so OC months are stored as the 1st.
- **C-29.** The seed turns `ai_ask`, `ai_doc_check` and `ai_staging` off. `expected/flags/anon.json` reads false for all three.
