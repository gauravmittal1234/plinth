# Risk and trust visualisation: component specs for Delivery Risk and its evidence

**Status:** Phase 3 input, v0.1 · **Date:** 18 Oct 2026 · **Inputs:** PRD §2, §6.2, §6.4, §6.5, §8.1–8.6; `research_notes/…/legal_risk_and_score_ux.md` Part B ([N]).
**Conventions:** [S#] = source list at the end, all accessed 18 Oct 2026 unless marked [N]. **[J]** = design judgement, not a research finding. Numbers in the example copy are placeholders.

---

## 1. What the research says, as design rules

| # | Rule | Evidence | Applies to |
|---|---|---|---|
| R1 | **Gist first, then numbers, then evidence:** band → natural frequency → sourced reasons and documents. | Spiegelhalter: "a top gist level, then numerical information, and then evidence and uncertainty" [S1] | Card, panel, drawer |
| R2 | **Always pair a word with a number.** | Words alone lower accuracy and raise risk aversion [S1]. Pairing verbal terms with numbers narrows how they are read [S5][N] | Band, frequency |
| R3 | **Natural frequency with a fixed denominator (100), a stated reference class and a time window.** | Frequencies counter denominator neglect [S1][S2]. The reference class must be stated and appropriate [S1] | Icon array |
| R4 | **Show both frames.** Say "40 of 100 were late" and "60 of 100 were not". | Positive and negative framing shift perceived risk (1.43 vs 1.82 on a 1–5 scale) [S1] | Frequency copy |
| R5 | **Blocked icon arrays, not scattered.** | Scattered icons are hard to count. Low-numeracy readers judge area, so icons must be blocked [S1]. Random layout plus a severe outcome inflates estimates [S3] | Icon array |
| R6 | **Show uncertainty explicitly:** a range plus a confidence label, or decline to score. | Uncertainty improves decisions and keeps trust when a forecast misses [N: Joslyn]. Zestimate's range widens with less data [S16]. Morningstar publishes Data Coverage % [S17] and an Uncertainty Rating [S18] | Confidence, ranges |
| R7 | **Put history next to any prediction.** | Zillow's climate scores fell when predictions contradicted visible history and stayed unchanged for years [N] | Track record, timeline |
| R8 | **Compare to a peer range, not an absolute.** | AutoCheck shows a score against the range for "similar vehicles": read alone, a score "will only reveal half the story" [S14] | Reasons, complaints |
| R9 | **Say what an absence means.** "No record found" is not "never happened". | Carfax: the report "is based only on information supplied to CARFAX" [S15] | Truth panel, drawer |
| R10 | **Colour is redundant, never the only cue.** | WCAG 1.4.1 (use of colour), 1.4.11 (3:1 for graphical objects) [S8]. CVD affects ~2–9% of Indian men across studies (3.9% in one large study) [S9] | All |
| R11 | **Badges must be scoped, dated, expiring and never for sale.** | Bayut timestamps TruCheck [S38]. Airbnb dates the badge and says it "doesn't guarantee" identity [S39]. LinkedIn names provider and date [S40]. A paid X check enabled the fake Eli Lilly post [S41] | Verified-Available |
| R12 | **The total is the hero; parts are disclosed upfront.** | Wise splits all costs before you confirm [S31]. DOT bars showing any component more prominently than the total [S32]. India's CCPA bans "drip pricing" [S33] | True cost |
| R13 | **Keep the original promise visible when a date changes.** | UPS shows "updated delivery date" with a reason [S36]. Amazon keeps the original date in tracking [S37] | Timeline |
| R14 | **Cite at claim level, with preview and archive.** | Perplexity: per-claim numbered sources with hover previews [S27]. Wikipedia: `access-date`, `archive-url`, `url-status` [S28] | Source chip, drawer |
| R15 | **The rated party's reply sits with the rating, dated and attributed.** | Glassdoor responses show the date and responder's title [S29]. Trustpilot replies are public under the review [S30]. SEBI's "Issuer Not Cooperating" label is used instead of silence [N] | Developer response |

**Borrowed, and deliberately not copied:**
- **Credit-score apps** (Credit Karma, CIBIL, OneScore, Experian): take factor impact labels [S19], score history and the what-if simulator [S20]. Skip the 300–900 dial (PRD D4) and the green-to-red gauge [S21][S22].
- **First Street on Redfin:** take one shared label set [S12]. Buyers who saw risk scores bid on lower-risk homes [S13]. Skip the 1–10 number.
- **Nutri-Score:** take all five steps visible, current one enlarged [S11]. Skip A–E, which looks like AAA–D [N].
- **iCIRT:** take QR + date-rated [S23]. Skip stars and opt-out [N].
- **MahaRERA:** take Overview/Technical/Financial/Legal grouping [S24]. No visual exemplars found; the scheme was halted [N].
- **IPCC embers:** take a yellow → red → purple ramp, with confidence as dots [S6].
- **Apple Health Trends:** take "consistent" and "slipping" groups [S25].
- **GOV.UK:** take sentence-case task statuses and warning text with a hidden prefix [S26].

---

## 2. Foundations

### 2.1 Band scale, thresholds and colour tokens

Thresholds are **[J] placeholders** until the calibration table exists (PRD §6.3 S2).

| Band | Step | Late12 frequency shown | Light ink | Light fill | Dark ink | Dark fill |
|---|---|---|---|---|---|---|
| Low | 1 | fewer than 15 in 100 | `#4A90A4` | `#E6F2F5` | `#7CC0D2` | `#15323A` |
| Moderate | 2 | 15–29 in 100 | `#9E8300` | `#F7F0D2` | `#D9BC45` | `#332B0C` |
| Elevated | 3 | 30–44 in 100 | `#A9480C` | `#FBE6D8` | `#F08A4B` | `#3A2210` |
| High | 4 | 45–64 in 100 | `#94211C` | `#F8DFDD` | `#F2706A` | `#3D1A19` |
| Severe | 5 | 65+ in 100, or any red-flag override | `#4A1445` | `#F0E1EE` | `#D58BD0` | `#341A33` |
| Limited history | — | none (no band) | `#6B7079`, dashed | `#FFFFFF` | `#A3A8B0`, dashed | `#1C1F24` |
| Not scored | — | none | `#8C9199`, outline | none | `#7D828A`, outline | none |

**Neutrals:**
- Text: `#1A1C1E` (light) and `#ECEDEF` (dark).
- Muted text: `#5B6068` (6.3:1 on white).
- Empty-segment track: `#D9DBDF` with a 1 px `#8C9199` border (light); `#3A3E45` with a `#7D828A` border (dark).

**Contrast notes** (computed: WCAG 2.x ratios, CIELAB L\*, CVD simulation with Machado 2009 matrices at full severity).

*Light theme* (on `#FFFFFF`; surface `#F6F5F2`):
- **All five inks meet ≥3:1 for graphical objects:** Low 3.61, Moderate 3.68, Elevated 5.80, High 8.42, Severe 14.2. On the surface: 3.31, 3.38, 5.32, 7.72, 13.0.
- **Low and Moderate inks are below 4.5:1, so never use them for text.** Elevated, High and Severe inks may be used as text.
- **Label text `#1A1C1E` on every fill is 13.5–15:1.** Ink on its own fill is 3.2–11.3:1, so segments drawn on chips stay ≥3:1.
- **Lightness runs 56 → 56 → 43 → 33 → 17.** Low and Moderate differ by hue (blue vs ochre), which survives deuteranopia and protanopia.
- **Adjacent-band ΔE under deuteranopia:** 78 / 13 / 17 / 55. Moderate→Elevated is the weakest pair, so segment position and label are mandatory.

*Dark theme* (on `#121417`; surface `#1C1F24`):
- **All inks are 6.4–9.9:1, so all may be used as text.** Light text `#ECEDEF` on the dark fills is 11.6–13.4:1.
- **Lightness is deliberately not monotonic** (74 / 77 / 67 / 63 / 67), so Severe stays salient on black; order is carried by hue, segments and label. Deuteranopia ΔE: 79 / 11 / 20 / 54.

**Why this ramp [J]:**
1. **IPCC ember order** (yellow → red → purple) [S6]. Purple keeps "Severe" distinct from ordinary red alarms and error states.
2. **Low is blue-teal, not green.** Green reads as "safe/approved", a legal and expectation risk if a Low project slips; teal also avoids the red/green pair.
3. **Colour is the third cue, after position and words.** The ≥30 L\* gap advised for colour-only palettes [S10] cannot fit five steps that all meet 3:1 on white.

### 2.2 Non-colour cues (mandatory everywhere)

1. **Segment meter.** Five equal segments. Bands fill cumulatively left to right (Low = 1 filled … Severe = 5), all in the current band's ink. Unfilled segments are a track with a 1 px outline, so all five positions stay perceivable.
   - [J] Equal heights avoid the "signal-strength = good" reading of ascending bars.
   - Indian investors already read a needle moving right as more risk on SEBI's mutual-fund Riskometer. *[J; general knowledge, not verified this session]*
2. **Text label**, always present: "Elevated", never a colour alone.
3. **Glyphs for exceptional states:**
   - ⚑ Red flag (override)
   - ◌ Limited history (dashed meter)
   - — Not scored
   - ◷ Stale data
   - ◉ On watch
4. **Confidence dots**, borrowed from the IPCC: ●● High confidence; ●○ Low confidence.

### 2.3 Type, spacing and targets

- Mobile-first (360 px). Body 16/24; small 13/18; nothing below 13 px, including disclaimers, dates and chips.
- Band name: 28/34 semibold (card), 20/26 (header), 13/16 semibold (chip).
- Tap targets ≥44×44 px [J; WCAG 2.5.8 minimum is 24×24]. 4 px spacing grid. Tabular figures.
- Formats: ₹42.5 L, ₹1.86 cr; "14 Oct 2026" (no ordinals, no commas); numerals from 2 upwards [S26].

### 2.4 Wording rules

| Do | Don't |
|---|---|
| "Records show…" / "Developer says…", always labelled and visually separate | Developer copy shown as fact |
| "Delivery risk: High" (our opinion, per Methodology v1.2) | "Risky builder", "avoid", "dangerous", "unsafe", "safe", "trustworthy", "guaranteed" |
| "Finished 22 months after the original RERA date" | "Failed to deliver", "cheated buyers" |
| "14 complaints decided against the promoter (HARERA, 24 months)" | "Fraud", "scam", "cheat", "blacklist", "defaulter" (unless quoting an order verbatim, in quotes, with a link) |
| "Admitted to insolvency (CIRP), NCLT order 12 Mar 2023" | "Bankrupt", "collapsed" |
| "No CIRP found in IBBI/NCLT records for the promoter or 14 linked companies (checked 14 Oct 2026)" | "No legal issues", "clean record", "clear title" |
| "About 40 of 100 similar projects…" (a pattern in a reference class) | "40% chance this project will be late" (a claim about this project) |
| "Not a credit rating. Not issued by any RERA." | "Rated", "AAA", "certified", "RERA-approved rating" |

**Fact templates:** number first, then subject; source and date in the chip; one fact per sentence, ≤20 words; verbs *shows, filed, granted, extended, decided, admitted*; no judgement adjectives; comparisons name the peer group ("NCR median for similar projects: 2.1").

---

## 3. Component specs

### C1. Delivery Risk band indicator

**Sizes:**

| Size | Where | Anatomy | Dimensions |
|---|---|---|---|
| **S — chip** | Search results, map pins, compare columns, cards | `[meter] Elevated ●○` | Height 24. Meter is 5 segments of 6×10 with 2 px gaps. Label 13/16 semibold. Padding 4/8. Radius 6. Fill = band fill; 1 px border = band ink |
| **M — header** | Project/developer page header, shortlist, Project Watch | Eyebrow "Delivery risk"; band 20/26; meter of 5 × 16×8; confidence; "as of 14 Oct 2026" (13 px muted) | Height ~64 |
| **L — scale** | Top of the risk card | Full-width 5-segment scale with all band colours and labels under each (Low … Severe), Nutri-Score style. Current segment raised 4 px, 2 px outline, ▲ pointer, band name 28/34 above | Segments ≥56 wide on a 360 viewport |

**States:**

| State | Visual | Copy (chip / long) |
|---|---|---|
| Scored, high confidence | Filled meter, ●● | "Elevated" / "Delivery risk: Elevated · High confidence" |
| Scored, low confidence | Filled meter, ●○. The frequency becomes a range | "Elevated ●○" / "…· Low confidence: 3 finished projects in this group" |
| Red-flag override | Severe meter + ⚑ | "Severe ⚑" / "Severe: set by a published red-flag rule (CIRP admitted)" |
| Limited history | Dashed empty meter ◌, grey | "Limited history" / "Too few finished projects to score. No penalty." |
| Not scored | Outline meter, "—" | "Not scored" / "Not scored: registered less than 6 months ago" (always give the reason) |
| Stale | Any band + ◷. The meter is not greyed, so the band stays readable | "◷ Data over 4 months old" |
| On watch | Band + ◉ | "On watch: NCLT petition filed 2 Oct 2026, not yet admitted" |
| Recently changed (≤30 days) | Band + "was Moderate" text with a small ↑ | "Elevated (was Moderate until 2 Oct)" |
| Past the 12-month line [J] | No band (the Late12 outcome has already happened). Neutral chip, no meter | "Already late: 22 m past original date" / then the timeline, Stall check and (v2) expected range |
| Loading / error | Skeleton / last-known value with its timestamp. Never blank or zero | "Couldn't refresh. Showing 14 Oct 2026 data." |

**Accessibility:**
- The chip is a button with name "Delivery risk: Elevated, step 3 of 5, low confidence. Open details."
- The meter is `aria-hidden`.
- Windows forced-colours mode: segments get outlines, and filled segments use `CanvasText`.

**Content rules:** never show internal points; never show a band without "Delivery risk" in view (column header or tooltip in lists); never use band colours for anything else.

### C2. Delivery Risk card (full)

**Question:** "Will this builder deliver this phase on time?" One card per RERA phase.

**Anatomy, top to bottom (mobile 360–414; desktop column max 640):**

1. **Header:** "Delivery risk · [Project], Phase 2 (RERA GGM/512/244/2021/88)". Actions: ⓘ (opens methodology at the band definitions) and Share.
2. **Band scale (C1-L)** with confidence tag and the line "Data as of 14 Oct 2026 · Model v1.2".
3. **Frequency block (C3):** sentence and 10×10 array side by side on desktop, stacked on mobile.
4. **"Why"**, up to 4 reasons, ordered by contribution [N: Reg B four-reason norm]. Each reason has:
   - Eyebrow with factor group (Finances · Track record · Timeline · Legal · Site), 13 px, sentence case, muted.
   - Fact sentence, 16/24.
   - One or more **source chips (C4)**.
   - Optional "Disputed by developer · under review since 10 Oct" marker (◐ + text). The fact stays until a decision is made.
   - An override reason is always #1, prefixed ⚑ "Red-flag rule".
5. **What would change this:** one line, public-record actions only. For example: "Two consecutive QPRs with construction ahead of sales would move this to Moderate."
6. **Track record so far** (R7): one-line link with the C5 dot strip, e.g. "Group: 7 of 11 RERA projects due before Oct 2025 got OC/CC >12 months late."
7. **Developer's response (C6).**
8. **Footer:** "Our opinion, based on public records." · "How this is calculated (Methodology v1.2)" · "Not a credit rating. Not issued by any RERA." · "Recalculated 15 Oct 2026" · "Report an error" · "How we make money". ≥13 px at 4.5:1 and never collapsed: disclaimers cannot hide material information [N].

**Example copy (Elevated, low confidence):**

> **Delivery risk: Elevated** ●○ Low confidence · Data as of 14 Oct 2026 · v1.2
> Between **30 and 45 of 100** similar Gurugram projects finished more than 12 months after their original RERA date. The rest (55–70) finished within 12 months.
> *Similar = registered 2017–2021, 300–800 units, developer with ≤3 finished RERA projects. Based on 212 projects.*
> **Why**
> 1. *Finances* · 72% of units sold, 41% built `HARERA QPR · Jun 2026`
> 2. *Timeline* · 78% of the promised time used; QPRs filed late in 3 of the last 8 quarters `HARERA QPR · Jun 2026` `HARERA QPR register`
> 3. *Legal* · 14 complaints decided against the promoter in 24 months (NCR median for similar projects: 3) `HARERA orders`
> 4. *Track record* · A group company was admitted to insolvency in 2023 `IBBI` `NCLT order`
> **What would change this:** two consecutive quarters with construction ahead of sales.

**States:**
- **Limited history:** no scale and no array. Show "We don't guess. This group has 1 finished RERA project." Then the truth panel facts, and "We'll score it after [criterion]".
- **Not scored:** reason plus truth panel.
- **Override:** the array is replaced by "Severe is set by a published rule, not by the model: [rule], [order link]". Add a frequency only if the calibration table has an override cohort.
- **Stale:** a ◷ banner naming the old input: "Latest QPR is from Mar 2026; next was due 15 Jul 2026."
- **Past the 12-month line [J]:** replace the band and array with "Already 22 months past the original RERA date. The question now is when, not whether." Show the timeline (C7-A), the Stall check and, in v2, the expected range.

**Shareable image (F-05, 1080×1350):** band, frequency, data-as-of, version, disclaimer, and a QR code to the live card with "Check the live version" (iCIRT pattern [S23]; PRD "live link only").

### C3. Natural-frequency icon array (sub-component of C2)

**Grid:**
- 10×10, row-major, filled from top-left, in **blocks of complete rows** (35 → 3 full rows + 5). Never scatter [S1][S3].
- Cells are rounded squares: 14 px with a 3 px gap on mobile (167 px square); 18/4 on desktop.
- [J] Squares rather than building glyphs: at 14 px glyphs become noise. Anthropomorphic icons only helped recall among more numerate readers [S4].

**Encoding:**
- Filled cells = band ink (late >12 months).
- Empty cells = track with an outline (≥3:1 border).
- **Low-confidence range:** fill to the lower bound. Hatch the cells up to the upper bound with 45° stripes in band ink. Legend: "▨ uncertain range".

**Copy:**
- Both frames (R4).
- Reference class, n, period and horizon in the caption (R3).
- Rounding [J]:
  - nearest 5 when n < 300;
  - a range when low confidence;
  - the exact decimal and n only in the evidence drawer, e.g. "38.4%, n = 212, cohort 2017–2021".

**Accessibility:** `role="img"` with `aria-label` equal to the full sentence including both frames. A "Show as table" toggle lists the calibration rows.

**Don't** animate the fill, use a 1,000-cell grid, or use "1 in X". Only 72–75% of people correctly picked the biggest of "1 in 100, 1 in 1,000, 1 in 10" [S1].

### C4. Source chip and Evidence drawer (F-06)

**Source chip:**
- Inline pill, 24 px high, 13/16 text, max 28 characters: `HARERA QPR · Jun 2026` plus ↗.
- Content is the authority + document type + document period/date. Never a raw URL.
- Multiple chips wrap. More than 3 collapse into `+2 sources`.
- Tap opens the drawer scrolled to that fact. Desktop hover shows a preview: title, date and a 2-line extract, following Perplexity [S27].
- Chip states: default · ⚠ "Original changed" (live page differs from our snapshot) · ✕ "Original removed" (snapshot only) · ◐ "Disputed".

**Evidence drawer:** bottom sheet at 90% height on mobile; right panel 420 px on desktop. One section per fact:

| Field | Example | Rule |
|---|---|---|
| Fact | "72% of units sold, 41% built" | The exact sentence shown on the card |
| Label | **Records show** | Never mixed with "Developer says" |
| Source | HARERA · Quarterly Progress Report · Q1 FY27 (Apr–Jun 2026) · Doc ID 88-Q1-27 | Authority, document type, period, ID |
| Dates | Filed 15 Jul 2026 · We fetched it 16 Jul 2026 · Last checked live 14 Oct 2026 | Mirrors Wikipedia's `date` / `access-date` [S28] |
| Snapshot | "View our archived copy (PDF, p. 3)" · SHA-256 shown on tap · "Open original" | Mirrors Wikipedia's `archive-url` + `url-status` (live / changed / removed) [S28] |
| Extract | Quoted passage with the value highlighted; page number | Deep-link to the passage [S27] |
| How we read it | "Read by two AI extractors; matched. Checked by a person 16 Jul 2026." or "…disagreed; resolved by a person" | Per PRD §6.2 |
| Used in | "Reason 1 of Delivery risk; Truth panel → Progress" | Traceability |
| Developer's note on this fact | Optional, dated | From the Evidence & Reply portal |
| Corrections | "Corrected 3 Sep 2026: unit count was 412, not 421 (developer request #D-118)" | Public change log |
| Actions | Report an error · Copy citation | — |

**Absence facts** (R9): "Searched IBBI and NCLT cause lists for the promoter and 14 linked companies on 14 Oct 2026. No CIRP found. These registers may lag by weeks."

### C5. Developer Track Record summary (F-03)

**Question:** "Does this group finish what it promises?" Scope: the whole group, SPVs rolled up.

**Anatomy:**

1. **Header:** "[Group] track record". The subhead "Includes 14 companies linked by common directors and shareholding (MCA) · See list" opens the drawer with evidence for each link.
2. **Summary sentence + dot strip:** "Of **11** RERA projects due before Oct 2025, **7** got OC/CC more than 12 months late and **1** is stalled." One dot per project, sorted by original date. Shape and colour both encode the outcome, so it works in greyscale:
   - ● on time / ≤6 m late
   - ◑ 6–12 m late
   - ■ >12 m late
   - ○→ unfinished past date
   - ✕ stalled
3. **Benchmark tick:** "NCR median delay for similar projects: 19 months" (R8).
4. **Promise-vs-actual dumbbell list**, one row per project:
   - Name, phase, RERA no.
   - Promised (hollow circle) → OC/CC (filled) on a shared year axis, with the delay labelled "+22 m".
   - Unfinished projects get a dashed line to a "Today" rule, labelled "not finished, 14 m past date".
   - Regulator-wide blanket extensions are drawn as a light grey segment and not counted (per PRD Late12).
   - Desktop shows a table alternative alongside: Project | Original RERA date | Extended to | OC/CC | Delay | Sources.
5. **Group facts, each with a chip:** complaints and orders per 100 units (24 m) vs peer median; unexecuted recovery certificates; insolvency events in the group; credit rating level, "Issuer Not Cooperating" status or downgrades, quoting the CRA's symbol only as reported.
6. **Trend line, Apple-Trends style [S25]:** "Last 3 finished projects: average delay 9 m (earlier: 26 m) ↓". Shown only with ≥3 projects in each window.

**States:**
- **Limited history** (fewer than 3 finished RERA projects): show the list without a rate. "Too few finished projects to show a pattern."
- **Pre-RERA projects:** listed in a collapsed "Before RERA (2017)" group and excluded from the numbers. "Dates less reliable."

Show good news symmetrically ("Delivered 2 projects early"). One-sided adverse lists create risk aversion [S1].

### C6. Developer response block

- **Placement:** directly under the reasons, at the card's width and text size. Only text over 600 characters collapses, behind "Read more".
- **Anatomy:**
  - Header "Developer's response" + verified-developer label.
  - Responder role (Glassdoor-style title [S29]) + date.
  - Text (max 3,000 characters; plain text).
  - Attachments, shown as source chips.
  - **Our status line:** "Reviewed 20 Oct 2026: 1 fact corrected (see change log)" or "Under review since 12 Oct (decision due by 2 Nov)".
- **Rules:** we don't edit the text, except under published moderation rules (personal data, abuse, legal threats), as Glassdoor and Trustpilot do [S29][S30]. Removals are logged publicly.
- **Empty states:**
  - "We invited [Developer] to respond on 3 Oct 2026. No response yet."
  - After 30 days [J]: "Developer has not responded" (SEBI INC analogue [N]).
- **Dispute counter:** "Disputes this quarter: 2 · 1 upheld" links to the public log (Trustpilot transparent flagging [N]).

### C7. Project truth panel (F-01; stage S1, facts only, no band)

**Question:** "Is this project on track, according to records?"

**Top summary:** a one-line gist. Example (Tower C, a phase already past its original date): "Records show: 2 project extensions · 22 months past the original date · 58% built · 14 complaints decided against the promoter · OC not applied."

Six modules follow. On mobile, modules are an accordion. On desktop they sit in a 2-column grid.

**A. Promise timeline** (R13)

On mobile this is a vertical stepper, like delivery tracking. On desktop it is a horizontal axis.

| Marker | Copy | Style |
|---|---|---|
| ◇ Original | "31 Dec 2024 · Original RERA completion date (set at registration, 12 Mar 2021)" | Hollow, never removed or struck through |
| ▲ Project extension | "+6 m · Section 6 extension · HARERA order 14 Mar 2025" and "+18 m · HARERA order 20 Jan 2026", each with its reason quoted | Neutral ink; counts toward delay |
| ▲ Regulator-wide | "+4 m · MoHUA extension, Jul 2026, all projects" | Grey, labelled "applies to all projects"; not counted |
| ◆ Current | "30 Apr 2027 · Current RERA date" | Filled |
| │ Today | "18 Oct 2026 · 22 months after the original date" | Rule |
| ▭ Expected (v2) | "Likely Mar 2028 · 1 in 5 chance after Dec 2028" | Range bar with a darker P50–P80 core, a Bank of England fan-chart idea [S7]; no point estimate alone |
| "Developer says" | "Possession Dec 2026 (brochure, Aug 2026)" | Quote style, labelled, set apart from records |

**B. Progress vs time:** a bullet graph [S35] on a 0–100% track.
- Bar = **% built** (QPR); solid tick = **% of time used**; dashed tick = **% units sold**. Direct labels, no legend.
- Gist above: "Built 41% · Time used 78% · Sold 72%" (Phase 2).
- Time used = time since registration ÷ (registration → original date + regulator-wide extensions). Over 100%, the track extends into a hatched "past original date" zone (Tower C: 128%).
- No qualitative background bands [J]: they would imply thresholds we haven't published.
- Below: an 8-quarter QPR strip (✓ on time / ◷ late / ✕ not filed) with a built-% sparkline. Missed quarters stay as labelled gaps, never interpolated.

**C. Complaints and orders:** counts in 24 months and per 100 units vs peer median; decided against / for the promoter / pending / withdrawn; unexecuted recovery certificates; each linked to its orders.

**D. Approvals:** OC/CC ("Granted 12 Jan 2026" / "Applied 3 Aug 2026" / "Not applied" / "Self-certified; under DTCP audit"); DTCP licence number, validity and renewal; RERA registration validity; RERA bank account on record (last 4 digits).

**E. Insolvency and legal flags:** CIRP, IBC petitions (filed vs admitted), stop-sale, revocation. Each states its search scope and date (R9).

**F. Identity strip:** RERA number, authority website and QR, in bold at top right (PRD §12.1 rule 4).

Every row has: label · value · status tag (text + icon) · source chip · "as of". Status tags use neutral styling, never band colours.

### C8. True-cost breakdown (F-10/F-11)

**Question:** "What will I really pay?"

**Headline (largest type; R12):**
- **All-in ₹2.31 cr** · **₹19,090 per carpet sq ft**
- Secondary: "Advertised ₹1.89 cr (₹9,950 per sq ft of super area) · All-in is 22% more"

**Ledger with proportional bars** (on mobile, a horizontal waterfall [S34]; on desktop, a vertical waterfall):

| Group | Rows | Tag per row |
|---|---|---|
| Paid to developer | Base price · PLC/floor rise · Car parking · Club · EDC/IDC · IFMS · Power backup | Mandatory / Optional / **Negotiable** |
| Taxes | GST (under construction; nil if OC received) | Mandatory |
| Government | Stamp duty (owner gender mix, circle rate) · Registration | Mandatory |
| Your costs | Legal check · Loan processing · Brokerage + GST (if any) | Optional |
| Later | Maintenance advance · Society deposits | Usually mandatory; range |
| Shown separately | TDS: "Part of the price that you pay to the government for the seller. Not extra." | Withheld, not added |

**Row rules:**
- Each row has an amount, a source chip ("Cost sheet p. 2", "Haryana stamp duty, Rules v2026.10, CA-reviewed 1 Oct 2026") and "Developer says" vs "Our estimate" labelling.
- Unknowns appear as rows, never omitted: "Not in cost sheet. Typical ₹2–4 L. Ask the developer." They are included in the total as a range, so the total becomes "₹2.29–2.33 cr". Omitting them would be drip pricing [S33].

**Area panel:**
- Carpet area drawn inside super area (nested bars).
- Loading % = (super − carpet) ÷ carpet. [J] Align this definition with the methodology before launch, because NCR sources differ. Show the formula on tap.
- Copy: "You pay for 1,900 sq ft; you can use 1,210 sq ft."

**Footer:** "Rules engine v2026.10 · Calculated 18 Oct 2026 · Information, not tax or legal advice." **States:** quote uploaded / manual entry / partial / outdated rules (banner).

### C9. Verified-Available badge (F-22)

**Tiers** (cumulative; the badge shows the highest contiguous tier achieved):

| Tier | Badge text | Checked how | Expires [J] |
|---|---|---|---|
| 1 | "ID checked" | Owner/agent KYC; RERA agent number verified | 12 months |
| 2 | "Ownership checked" | Title/allotment document matched to owner ID | 180 days |
| 3 | "Available · 12 Oct" | Owner reconfirmation + geofenced in-app photo showing the flat number | **14 days** (PRD) |
| 4 | "Records checked" | Human check of OC, registry/conveyance and society NOC | 90 days |

**Anatomy:**
- Shield-check glyph + text + date, neutral ink `#1A1C1E`, white chip, 1 px border. Never band or success colours.
- Tap opens a scope sheet: each tier ✓ / "Not done", date, method, checker role, expiry countdown.
- **"What this does not mean":** "Not a title opinion. Not a guarantee the flat is free of loans or disputes" (Airbnb-style limitation [S39]).

**Credibility rules:**
1. Free and never purchasable (the X lesson [S41]).
2. Always dated (Bayut, Airbnb [S38][S39]).
3. Names the checking method and provider (LinkedIn [S40]).
4. Expires automatically and downgrades visibly: "Availability not reconfirmed since 21 Sep."
5. The standard is published and linked from every badge.
6. Ranking uplift applies only while unexpired.

**States:** active / expiring (≤3 days, visible to the seller only) / expired (strikethrough date + "not reconfirmed") / revoked ("Removed 4 Oct: flat sold"), with a log.

### C10. Transferability status (F-21)

**Question:** "Can this flat be legally sold, registered and mortgaged to me?"

**Overall pill:**

| Status | Icon | Token | Copy |
|---|---|---|---|
| Ready | ✓ in circle | Success `#1E6B4A` (6.5:1 on white) | "Ready: every required document we checked was found." |
| Needs documents | document glyph | Attention `#8A5A00` (5.9:1) | "Needs documents: 2 items to collect before token." |
| Blocked | ⊘ | Blocked `#9B1C1C` (8.2:1) | "Blocked: 1 issue stops registration today." |

The pill is followed by: "Not a title opinion. Based on documents checked on 18 Oct 2026."

**Rule:**
- Blocked if any item is Blocking.
- Otherwise Needs documents if any item is Needed or Not checked.
- Ready only if every required item is Found and a person has reviewed it.

**Checklist** (GOV.UK task-list pattern [S26]: sentence-case statuses; the whole row is tappable):
- Item statuses: "Found" (plain text) · "Needed" (tag) · "Blocking" (tag + ⊘) · "Not checked yet" · "Not applicable".
- Each row expands to: why it matters · how to get it · who issues it · typical time and cost · evidence chip.
- Gurugram R2 items:
  - OC (incl. self-certified audit flag)
  - Conveyance deed
  - Builder transfer NOC + endorsement charges
  - Haryana property ID + municipal no-dues
  - Mutation
  - DTCP licence
  - CERSAI search / lender payoff letter
  - Society NOC

Statuses carry icon and text. The success/blocked pair is never colour-alone (R10).

### C11. Alerts (F-50)

**Channels:**
- In-app card (feed + project page banner).
- Push.
- WhatsApp **Utility** template. Templates must be non-promotional and tied to the user's own subscribed service [S42]; the trigger is the user's Follow.
- The developer is notified at the same time.

**Copy rules:** fact first; "from → to"; source + date; one action ("See what changed"); no exclamation marks, urgency words or advice to cancel.

Good news is sent with equal weight (OC granted, band improved).

**Delivery:** red flags and band changes go out immediately; other events go in a daily digest; quiet hours 21:00–08:00 IST [J].
- Push: title ≤45 characters, body ≤120 characters, with the key fact in the first 60 [J; truncation limits not verified this session].
- WhatsApp: "Update on [project], which you follow:" + push title + body + "Details: [link]".

| Event | Push title / body | In-app card |
|---|---|---|
| Band up / down | "Delivery risk changed: Moderate → Elevated" / "Phase 2 · 2 Oct 2026. New QPR shows 41% built vs 78% of time used." | Before/after C1-M, reasons added/removed, change-log link, developer response |
| New extension | "Completion date extended to 30 Jun 2028" / "Phase 2 · HARERA order 14 Oct 2026 · 1st extension · 9 m after the original date" | Timeline (C7-A) with the new marker highlighted |
| Missed QPR | "QPR not filed for Jul–Sep 2026" / "Phase 2 · due 15 Oct 2026 · last filed for Apr–Jun. We'll tell you when it's filed." | QPR strip with ✕ |
| Red flag | "Red flag: insolvency case admitted" / "Group company · NCLT order 9 Oct 2026 · Delivery risk now Severe" | C2 with ⚑ reason #1 + "What you can do: RERA complaint helper · Talk to a lawyer" (information, not advice) |

---

## 4. Open questions to test in Phase 3

1. **Comprehension:** frequency + array vs band-only with 20 Gurugram buyers; target ≥80% recall of "about X in 100" after 24 hours.
2. **Severe purple:** does it read as "worse than red" for Indian buyers [J]? Fallback: maroon `#5C1414` (13.4:1 on white).
3. **S chip:** cumulative fill vs single-position highlight; "Elevated" vs "Medium-high".
4. **Alert fatigue and panic responses** [N].

---

## 5. Sources (accessed 18 Oct 2026 unless noted)

- [S1] Spiegelhalter D. (2017) *Risk and Uncertainty Communication*, Annu. Rev. Stat. Appl. — https://regulation.org.uk/library/2017-Spiegelhalter-Risk_and_Uncertainty_Communication.pdf
- [S2] Galesic, Garcia-Retamero & Gigerenzer (2009) icon arrays and low numeracy — https://www.semanticscholar.org/paper/Using-icon-arrays-to-communicate-medical-risks:-low-Galesic-Garc%C3%ADa%E2%80%90Retamero/efae8da10f88de01a87420dcfbf0853e19e50b99 ; Garcia-Retamero et al. (2010) denominator neglect — https://journals.sagepub.com/doi/10.1177/0272989X10369000
- [S3] *Probability overestimation induced by icon arrays* (2024) — https://www.sciencedirect.com/science/article/pii/S0001691824002294
- [S4] Zikmund-Fisher et al. (2014) *Blocks, ovals, or people?* — https://pubmed.ncbi.nlm.nih.gov/24246564
- [S5] IPCC AR5 Uncertainty Guidance Note — https://www.ipcc.ch/site/assets/uploads/2017/08/AR5_Uncertainty_Guidance_Note.pdf
- [S6] IPCC "burning embers" (ESSD 2025) — https://essd.copernicus.org/articles/17/317/2025/essd-17-317-2025.pdf
- [S7] Bank of England, understanding the fan chart — https://www.bankofengland.co.uk/-/media/boe/files/quarterly-bulletin/1998/the-inflation-report-projections-understanding-the-fan-chart.pdf
- [S8] WebAIM contrast and WCAG 1.4.1/1.4.11 — https://webaim.org/articles/contrast/ ; https://www.thewcag.com/criteria/1.4.11
- [S9] CVD prevalence in India (Kundu et al. 2020 and others) — https://www.researchgate.net/publication/344623493_Prevalence_of_Colour_Vision_Defect_in_the_Indian_Population_-Results_from_a_Pre-Employment_Screening_Centre_of_a_Tertiary_Care_Hospital
- [S10] Colour-blind-safe palette guidance — https://colorblind.io/guides/colorblind-safe-palettes ; Paul Tol — https://sronpersonalpages.nl/~pault/
- [S11] Nutri-Score — https://en.wikipedia.org/wiki/Nutri-Score
- [S12] Redfin/First Street methodology — https://www.redfin.com/guides/climate-change-housing-impact/methodology
- [S13] Redfin flood-data experiment — https://www.redfin.com/news/redfin-users-interact-with-flood-risk-data/
- [S14] Experian AutoCheck score range — https://www.experian.com/blogs/insights/keeping-score/
- [S15] Carfax report structure — https://www.ridecheckpro.com/carfax-vehicle-history-report-guide/ ; limitations — https://support.carfax.com/article/i-know-this-vehicle-has-had-an-accident-why-isn-t-it-listed-on-the-carfax-vehicle-history-report/ (search summary; page returned 403)
- [S16] Zillow Zestimate range — https://zillow.zendesk.com/hc/en-us/articles/1500002001701-What-is-a-Zestimate-home-value (search summary)
- [S17] Morningstar Medalist methodology (Data Coverage %) — https://s25.q4cdn.com/634000362/files/doc_downloads/2026/08/Medalist_Methodology_3-0_v2-2.pdf (search summary)
- [S18] Morningstar Uncertainty Rating — https://www.morningstar.com/investing-terms/uncertainty-rating
- [S19] Credit Karma UK factor impact — https://help.creditkarma.co.uk/articles/en_US/Knowledge/What-key-factors-impact-my-credit-score (search summary; also [N])
- [S20] CIBIL Score Simulator — https://www.cibil.com/blog/taking-informed-credit-decisions-just-got-easier-with-the-score-simulator
- [S21] OneScore factors — https://www.onescore.app/blog/5-factors-determine-credit-score/
- [S22] Experian score ranges — https://www.experian.com/blogs/ask-experian/infographic-what-are-the-different-scoring-ranges/
- [S23] iCIRT — https://www.nsw.gov.au/departments-and-agencies/building-commission/icirt ; https://www.billbergia.com.au/how-to-check-if-a-property-developer-is-icirt-certified/
- [S24] MahaRERA grading matrix — https://taxguru.in/corporate-law/understanding-mahareras-new-grading-matrix-for-real-estate.html
- [S25] Apple Health Trends — https://www.myhealthyapple.com/how-to-use-health-trends-in-ios15/
- [S26] GOV.UK Design System warning text, task list; A–Z style guide — https://design-system.service.gov.uk/components/warning-text ; https://design-system.service.gov.uk/components/task-list/ ; https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/
- [S27] Citation UX patterns — https://www.shapeof.ai/patterns/citations ; https://www.aiuxplayground.com/gallery/perplexity-citations/
- [S28] Wikipedia `cite web` and link rot — https://en.wikipedia.org/wiki/Template:Cite_web ; https://en.wikipedia.org/wiki/Wikipedia:Link_rot
- [S29] Glassdoor employer responses — https://www.glassdoor.com/blog/responding-to-negative-glassdoor-reviews-faqs/
- [S30] Trustpilot replies — https://help.trustpilot.com/s/article/Engage-with-your-reviewers?language=en_US
- [S31] Wise fee transparency — https://wise.com/us/blog/wise-vs-international-bank-transfers
- [S32] US DOT airline price rules — https://www.transportation.gov/policy/aviation-policy/airline-rules-fares ; https://www.federalregister.gov/documents/2024/04/30/2024-08609/enhancing-transparency-of-airline-ancillary-service-fees
- [S33] CCPA Dark Patterns Guidelines 2023 (drip pricing) — https://www.legal500.com/intelligence/india/consumer-protection/ccpas-guidelines-on-dark-patterns-an-overview
- [S34] FT Visual Vocabulary — https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary
- [S35] Few, Bullet Graph Design Specification — https://www.perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf
- [S36] UPS tracking statuses — https://www.ups.com/us/en/support/tracking-support/where-is-my-package/understanding-tracking-status
- [S37] Amazon delayed deliveries — https://www.amazon.com/gp/help/customer/display.html?nodeId=GL669SSDXFCJ2ZA6
- [S38] Bayut TruCheck — https://www.bayut.com/mybayut/trucheck-bayut-uae/
- [S39] Airbnb identity verification — https://www.airbnb.co.uk/help/article/1237
- [S40] LinkedIn verifications — https://www.linkedin.com/help/linkedin/answer/a1359065 (search summary)
- [S41] Fake Eli Lilly verified account — https://www.forbes.com/sites/brucelee/2022/11/12/fake-eli-lilly-twitter-account-claims-insulin-is-free-stock-falls-43/
- [S42] WhatsApp Utility template guidelines — https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines
- [N] `research_notes/Developer and project risk scoring/legal_risk_and_score_ux.md` Part B. These sources were accessed in that earlier research: Joslyn & LeClerc; Budescu et al.; Walk Score; Zillow/CRMLS; Reg B four-reason norm; Trustpilot Transparent Flagging; SEBI INC; CCPA disclaimers.

*Method note:* about 45 web searches and fetches. Several primary pages returned 403 (Carfax support, ResearchGate, ACM, SAGE), and the session's search budget ran out before I could verify WhatsApp/push character limits and the SEBI Riskometer. Those points are marked [J]. I computed the palette numbers locally with WCAG 2.x luminance and Machado (2009) CVD matrices.
