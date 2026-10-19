# Web trust: taste pass and 10x review

Screens: `WebFollowing`, `WebMethodology`, `WebDevPortal`, `WebPrivacy` (group "web-trust"), in `scratchpad/canvas/project/`.
Reviewer: principal product design. Date: 18 Oct 2026. Rules applied: DESIGN.md §0 (taste pass v1, including the borderless risk chip), then §2–§4c, §5 data only, §7 format. Vocabulary matched to the sibling pass on `WebDeveloper` (plain sticky header, footer slab with a full-width "Plinth", borderless chip, "Developer says" tone field, filled chips, shared motion keyframes).

**How it was judged.** The taste-skill scripts were not run and no browser was opened. Each artboard was read once as if it were a screenshot, put through the 14 passes in `references/critique.md`, and scored with the Awwwards weighting (design 40%, usability 30%, creativity 20%, content 10%). Every cap applies. Every edited file passed four checks:
- an HTML tag-balance parse with an unquoted-attribute check;
- a JS parse;
- a `renderVals()` smoke test in Day and Night across the key states (reveal open and closed, every tab, submitted and withdrawn disputes, revoked parties, delete flow);
- a check that every `{{hole}}`, including loop items, resolves.

Headline lengths were checked against the two-line arithmetic (k ≈ 0.55–0.6 em per character) at each heading's real column width. Nine headings that could have reached three lines were shortened or given more room.

WebDevPortal is a work console and WebPrivacy is a settings page, so I applied the house rules there with judgement. Real data tables (projects, dispute log, data sources) keep their row lines, and real form fields (text input, textarea) keep their outlines. Everything else follows §0.

---

## What changed on all four screens

| Area | Before | After |
|---|---|---|
| Header | Glass bar with backdrop blur and a hairline. Outlined "Ask anything" pill with an outlined "Ctrl K" key. Outlined account or "Sign in" pill. Current page in green | A plain sticky bar on `t.bg`: wordmark, 4–5 text links (current page underlined) and a tone-filled theme button. **One action** per page, named for what it does: *Follow a project* (Following), *Follow changes* (Methodology, wired to a real follow of method versions), *Dispute a fact* (DevPortal), *Download my data* (Privacy) |
| Ground | Radial green glow behind the hero (Following, Methodology) | Flat `t.bg` and `t.track` bands. The only gradients left are hatch patterns that encode data and one neutral scrim under white text on a photo |
| Boxes | 1px outlined panels, hairline row dividers, dashed "Developer says" boxes, dashed drop zones, vertical hairlines between form columns | Tone fields (`t.track`, `t.panelSolid`, `t.claimBg`, `t.slab`) at radius ≤ 8, separated by space. The "Developer says" block is the `claimBg` tone field with a speech icon on every screen. Developer evidence also takes the claim tone (it is their claim until verified) |
| Risk chip | Band fill with a 1px band-ink outline; "Not scored" was outlined | **Borderless** band-fill pill with the mini meter; "Not scored" sits on `t.track` |
| Chips and links | Outlined source chips in green; green links | Filled tone pills with a document icon. Links are ink with an underline |
| Eyebrows and numbers | "Methodology v1.2 · published…" and "Developer profile" above the H1; breadcrumb above the H1 (Privacy); numbered badges 1/2/3 on reasons, steppers and "how it works" | Metadata moved into a quiet line below the heading. Steppers became tick/ring/dot marks with no digits. Ordered lists are real `<ol>` with order shown by position. Reasons read as sentences: "Finances: 72% of units sold, 41% built." |
| Type | H1 40–60px, H2 28–48px, lead and running text in grey `ink2` / `muted`, much copy at 13–15px | Hero `clamp(52–56px, 5.6–7.5vw, 76–100px)` on public pages; questions `clamp(40–44px, 5vw, 60–64px)`; console H2 `clamp(34px, 3.6vw, 44px)`. Lead 22px and running text 17–19px in full `t.ink`. Grey only for genuine metadata |
| Accent | Green on links, avatars, dots, switches, badges, tints and status pills | Green on the primary action and at most one data role (the "built" bar, the Late12 window). Switches, selected states and status dots are ink |
| Motion layer | Only the Methodology needle moved | The same keyframes as the sibling pass. The hero rises with a 90ms stagger and the hero photo drifts slowly. Headings, text and pictures rise as they scroll in (`animation-timeline: view()` inside `@supports`, so content stays visible without support). Every control gets press and hover feedback. Each page has **one signature move** (below). Transform and opacity only: old `left`, `width` and knob transitions were converted to transforms. Everything is off under `prefers-reduced-motion` |
| Footer | A small link row or grey disclaimer | The designed **slab**. A 36px statement ("No developer pays us. Ever."; on Privacy, "We never sell your number." comes first), then a sentence naming what **this page stands on** (records, or consent references). Then links and the live strip, and **"Plinth" closes at full width** |

**New `$preview` heights.** These are estimated from the layout arithmetic because nothing was rendered. Please mirror them in `canvas.json` (I did not edit it) and adjust them after one look on the canvas.

| Screen | Old | New |
|---|---|---|
| Following | 5040 | **6700** |
| Methodology | 7000 | **10500** |
| DevPortal | 3840 | **5250** |
| Privacy | 4080 | **5550** |

**Image requests.** There is one new empty slot, `filingsStack` (4:5): the Methodology hero, showing a project's quarterly reports stacked like floor slabs. It is listed in `product/design/assets/requests_web-trust.json`. Every other picture reuses an already-generated slot with its `src`: `heroAurelia`, `heroLaurel`, `siteProgress`, `ordersDesk`, `salesGallery`, `towerBSite`, and the four project thumbnails.

**Fictional data added (artboard assumptions, please confirm):**
- Following, "before 2 Oct" score inputs (Jan–Mar 2026 QPR): 66% sold, 38% built, 70% of time used, 2 of 8 QPRs late.
- Was→now values: Sapphire Grove ₹1.89 Cr → ₹1.95 Cr; Kestrel 59% → 63% built; Aurelia complaints 13 → 14.
- **Data fix:** the old Coral Towers item said "extended to 30 Jun 2028", which is *earlier* than its §5 original date of Aug 2028. It now reads Feb 2029 → Aug 2029 (1st extension to Feb 2029, 2nd on 14 Oct 2026).

---

## 1. Following: "How are your projects doing?"

### Before: 6.3 / 10

```
ROUND 0 (before)
Seen in one second: four rounded thumbnails in a hairline list under a green glow. Nothing leads.
Idea: none beyond "saved items + notification feed". Passes for any portal's watchlist.
Live thing: "See what changed", a small green link on the 5th feed item, opens a static list.
Layout words: hero=list / feed=list / saved=list / alerts=list / footer=link row (list ×4: the template showing).
Scores: design 5.5 · usability 7.5 · creativity 5.5 · content 8 → 6.35 → 6.3
Caps: glass header, radial glow, hairline dividers, numbered reason badges, dashed "Developer says" (overall ≤ 6.5).
Top problems:
1. No focal point: four list sections in a row, every row ruled by a hairline, with images at 96px and radius 18.
2. The signature, "what changed", is buried 5 items down and reveals two numbered rows and a dashed box. It shows reasons but not the change.
3. Glass header with a search pill and Ctrl K, outlined chips, grey running text, and a link-row footer.
```

### What changed
- **Hero:** a split. On the left, "How are your projects doing?" at 76px, the band-change sentence, a primary **See what changed** that opens and scrolls to the reveal, and a quiet line under it: "4 unread updates · records as of 14 Oct 2026 · model v1.2". On the right, a large square-cornered photo of Aurelia Heights (the project that moved) with a slow drift, captioned with the borderless chips **Moderate → Elevated · 2 Oct 2026**.
- **"Are they keeping pace?"** A new question for the project list, on a `t.track` band. The rows have no rules, 128px square thumbnails, a borderless chip, built bar and time tick on a solid track, and "Open project" / "Unfollow" as ink links. The unfollow dimming still works (I moved the entrance animation onto the list so it can't override the row's opacity).
- **Feed as a ledger:** a date-and-category gutter, then the headline, the project as a link, and a new **was → now pill** on every update (₹1.89 Cr → ₹1.95 Cr, Feb 2029 → Aug 2029, 59% → 63%, 13 → 14, 2 → 3). Then the body in full ink, filled source chips, and "Developer notified at the same time". The project name moved from above the headline (an eyebrow) to below it. Tabs, unread dots (now ink, not green), Mark all as read and the empty state are unchanged.
- **Signature, the "what changed" reveal:** opening the band change (from the hero or the feed) shows the score **as it was**, then lets it move to **now** after 900ms:
  - five 44×26 meter segments re-fill in band ink, staggered by 90ms;
  - "Moderate" slides out as "Elevated" slides in;
  - the sold, built and time bars grow by transform (66 → 72, 38 → 41, 70 → 77) with "up 6" deltas;
  - the gap line updates ("Sales ahead of building by 28 → 31 points; QPRs late in 2 → 3 of 8").

  A **Before 2 Oct / After 2 Oct** toggle replays it. Below it come the reasons as an unnumbered `<ol>` ("strongest first"), the "Developer says" tone field, and "What would change this". Under reduced motion, it opens straight on "now".
- **Saved searches:** two columns of 32px titles with the filters, matches, an ink switch and "Run search". There is no list box.
- **Alerts:** channels with filled icon discs and ink switches on the left. On the right is a **sticky** WhatsApp preview on a tone field, so changing a switch updates the preview in view. Masked-number note, "Who has my number" and the save status are kept.
- **Footer slab:** the page says it "stands on HARERA registrations, progress reports, extensions and complaint orders, and developers' published price lists". Then "Plinth" at full width.

### After: 7.6 / 10

```
ROUND 1 (after)
Seen in one second: "How are your projects doing?" beside a large photo of the project that moved, with Moderate → Elevated under it.
Idea: your projects' own filings, diffed. Every update says what it was and what it is now.
Live thing: the before/after reveal on one instrument (meter, name, bars, gap line), with a replay toggle.
Layout words: hero=split photo / pace=rows / feed=ledger / saved=two columns / alerts=split + sticky preview / footer=slab.
Scores: design 7.5 · usability 8 · creativity 7.5 · content 8 → 7.65 → 7.6
Caps applied: none known (inspector not run).
```

### Remaining issues
1. The Aurelia photo appears twice: as the hero and in its row. A distinct hero subject (the buyer's view of the site) would be stronger.
2. Visible type sizes run to about 7 (76/64/44/32/28/22/19/15). The ceiling is 5. The 32px saved-search titles and the 44px band name could share one size.
3. Only the band change gets the full instrument. The other five updates get a was→now pill. A small spark of the series would make every item feel live.
4. "Follow a project" in the header and "Find projects to follow" in the hero duplicate each other.
5. Height is estimated (6700), and the reveal adds about 640px when open.

### 10x ideas

| Idea | Why it's 10x | How it works | Feasibility | Main risk |
|---|---|---|---|---|
| **"Since you last looked" time machine.** The page opens on a portfolio diff since your last visit ("Since 4 Oct: 1 band change, 1 extension, 2 filings"). A date scrubber replays *all* followed projects to any past date | It turns a notification feed into an accountability instrument: buyers see drift, not noise. No portal can do this, because none keeps dated snapshots | Store a snapshot per project per filing or order (we already recompute within 72h). Generalise this page's before/after instrument to N projects. Label method-version changes separately from record changes | M | Retro-scores must show the model version that made them (v1.0 vs v1.2), or a method change looks like the developer's fault |
| **"What the delay costs me" meter.** For each followed project: rent paid while waiting, plus pre-EMI interest, minus the RERA delay interest you are entitled to, accruing daily from the adjusted promised date | It turns risk into the buyer's own rupees and points to a concrete action (claim interest). Each alert becomes "this extension costs you ₹1,84,000" | The buyer enters rent and loan once. We know the original date and extensions. Interest follows the Haryana RERA rule (SBI MCLR + 2%). It is shown as arithmetic with the rule linked | M | Drifting into legal or financial advice. Must stay "arithmetic, not advice", with the rule cited and a human handoff |
| **Verified allottee signals.** Followers who own a unit can privately prove allotment and then report "possession letter received", "site visit today" or "work stopped this week". These are aggregated as "12 verified allottees report…" | Ground truth beyond filings, and a network effect competitors can't copy. It is the strongest early warning of a stall, months before a QPR shows it | Allotment-letter upload checked privately, k-anonymity (shown only at ≥5 reports), and a third evidence lane next to "Records show" and "Developer says": **"Buyers report"** | L | Defamation and moderation load; developer pushback. Needs strict wording rules and a dispute path for the developer |
| **Explain-this-change voice note on WhatsApp.** Every band change arrives with a 30-second Hinglish voice note generated from the structured diff ("Reply 1 for before and after") | It reaches parents and first-time buyers where they already are, and makes a risk change understandable without a laptop | Text-to-speech from the same diff object as this reveal, never free text, with sources read out and an AI disclosure | S–M | A voice note feels authoritative. Any mismatch with the record damages trust, so script it from structured data only |

**Best single idea:** the **"since you last looked" time machine**. It makes Plinth a memory of every promise, which is the product's whole thesis.

---

## 2. Methodology: "How Delivery Risk works"

### Before: 6.4 / 10

```
ROUND 0 (before)
Seen in one second: a dial next to a text column under a green glow, then a long wall of identical panels.
Idea: none beyond "explainer page". It passes for any rating agency's methodology page.
Live thing: nine at equal weight (dial, OC slider, stall switches, factor bar, rules, confidence tabs, steps, changelog, band cards). None leads.
Layout words: hero=split / predict=split / stall=split / bands=split / factors=split / flags=split / confidence=split / sources=split / never=split / process=split / changelog=split (split ×11).
Scores: design 5.5 · usability 7 · creativity 6 · content 9 → 6.4
Caps: 0 real pictures (design ≤ 6.5); eyebrow above H1, glow, outlined panels, hairlines, numbered step dots (overall ≤ 6.5).
Top problems:
1. Zero pictures, and 11 sections of the same split composition at 56px spacing.
2. Two competing band pickers (the hero dial and five band cards with 500 tiny dots); the real icon array is 18px and sits low.
3. Glass header, glow, eyebrow, a 64px statement set as <p>, grey running text, link-row footer.
```

### What changed
- **Hero:** a split with "How Delivery Risk works" at up to 100px, the one-question lead, **See the five bands** (primary) and "What we never do". The version, the "No developer pays us" line and the disclaimer sit in a quiet line below. On the right is a tall, square-cornered picture that drifts slowly: the new `filingsStack` slot, a project's quarterly reports stacked like floor slabs. It is the page's idea made literal.
- **Signature, the band picker with the big icon array** (moved to second, on a `t.track` band):
  - Five large tone tiles, each with the band name at 26px, its meter and "30–45 of 100". The picked tile takes its band fill and a 6px band-ink bar that grows from the left.
  - The **10×10 array is now 34px cells**. Picking a band sweeps solid and hatched layers in row by row (6ms per cell, scale and opacity). On scroll, the cells pop in row by row by view timeline.
  - A 104px band name and the natural-frequency statement (25 words, 24px) sit beside it, with the pattern, the example project and the legend.
  - The old hero dial survives as a **quiet 168px riskometer** next to the band name, and its needle sweeps on each pick.

  The 500 mini dots were removed; their content (each band's range) is now text on each tile.
- **"What exactly do we predict?"** A bleed photo of Aurelia Heights on the left; the text and the OC timeline instrument on the right. The instrument's label above the date is now a sentence: "If Aurelia Heights, Phase 2 gets its OC in **Oct 2028**". The verdict pills are filled.
- **"What is in the score?"** (shortened from "What goes into the score?" to stay on two lines). A 112px proportional weight bar (the selected group in ink). The detail reads "Finances and cash vs progress: 30% of the score", then what we read and the example as a tone field with filled source chips.
- **"When does a rule override the model?"** The rules are full-width radio rows with flag discs, and "Red-flag rule 1" sits *under* each title rather than as a badge. "What buyers see" is a tone field with the borderless Severe chip. Beside it is the **Laurel Residency** photo, captioned "rule 1 since 12 Mar 2023".
- **"What if a project stalls?"** A full-bleed tower-and-cranes photo under a neutral scrim, with the stall instrument on a solid panel. The switches are ink, the Stall flag is a filled ink pill, and there are no row rules.
- **"How sure are we?"** The instrument is on the left and the text on the right. Tabs are ink-on-white, and the readout is a 40px label with confidence dots. "Limited history is never a penalty." is a 32px statement.
- **"Where does the data come from?"** A header row, then the sources **table** (it keeps its lines, on a white tone field) beside the `ordersDesk` photo.
- **"What will we never do?"** A bleed `salesGallery` photo ("we are never part of the sale"), the 36px statement "No developer pays us. Ever." (now within the statement rule) and the five nevers, spaced and without hairlines.
- **"What if a developer disagrees?"** A horizontal timeline: four 32px "when" headings over a thick bar that fills up to the selected step, with the step text below. The numbered dots are gone. The D-118 log line is a tone field.
- **Changelog:** an accordion with no outline box; the open version sits on a tone field. A **Follow method changes** button sits next to it (the same state as the header action, with the note "One message per new version").
- **Footer slab:** "Every score stands on HARERA registrations, progress reports, extensions and orders, DTCP licences and OCs, IBBI and NCLT records, with MCA and eCourts data from licensed vendors…", then "Plinth".

### After: 7.9 / 10

```
ROUND 1 (after)
Seen in one second: "How Delivery Risk works" beside a tall picture of reports stacked like floors.
Idea: the method is shown as the building it measures (filings as floors), then a band is made literal as 100 projects.
Live thing: the band picker. Picking a band sweeps the 34px icon array row by row; the needle swings and the sentence changes.
Layout words: hero=split photo / bands=stage / predict=bleed photo + instrument / factors=text + bar / flags=header + rules|photo / stall=full-bleed photo + panel / confidence=instrument|text / sources=table + photo / never=bleed photo + statement / process=timeline / changelog=accordion / footer=slab.
Scores: design 8 · usability 7.5 · creativity 8 · content 9 → 7.95 → 7.9
Caps applied: none known. 6 pictures (5 real now, plus 1 requested hero).
```

### Remaining issues
1. **Length:** about 10,500px and 11 questions. "What if a project stalls?" could fold into the rules section as a fifth switch, and "How sure are we?" could live inside the band stage as a confidence toggle. Together that saves about 1,400px.
2. The hero is an empty slot until `filingsStack` is generated. The page still carries 5 real pictures meanwhile.
3. Several quiet instruments remain (OC slider, stall switches, weight bar, rules, confidence tabs, steps). None autoplays, but six interactive panels is a lot for a reading page.
4. Photos repeat across pages (`heroAurelia`, `siteProgress`, `ordersDesk`, `salesGallery` also appear on Developer and Cost).
5. The bands come before the Late12 definition. The band sentence carries the "12 months late" basis, but a first-time reader may want "What exactly do we predict?" first.

### 10x ideas

| Idea | Why it's 10x | How it works | Feasibility | Main risk |
|---|---|---|---|---|
| **"Were we right?": a public calibration scoreboard.** For every phase we scored at least 12 months ago, show the band we gave and what happened, as this page's icon array: "Of 41 phases we called Elevated in Jul 2026, 14 are now more than 12 months late (expected 12–18)" | No rating body in Indian real estate publishes its own hit rate. It is the most credible proof of "No developer pays us", because the scores answer to reality, in public | A quarterly backtest job. Start with a historical cohort (2017–2021 registrations scored as of their date), then add live cohorts. Show intervals and sample sizes | M | Early cohorts are small, and a bad quarter is public. Show uncertainty honestly and commit to the cadence anyway |
| **Glass-box replay: "Score it yourself".** Type any RERA number and watch its score being computed: each red-flag rule checked with its order, each factor's points added with the source document opening beside it, the band assigned, the range drawn | It turns the methodology from a promise into something you can verify for a single project. It is a credit score you can audit | The scorecard is already interpretable, so expose the per-factor contributions we store for reasons and animate them as a waterfall into the band stage built here | M | Developers learn exactly what moves the score. That is fine (the moves are real progress and on-time filings), but expect nitpicking at the factor level |
| **Counterfactuals: "What would change this?"** For any project: "With 2 more quarters of construction ahead of sales, Aurelia would be Moderate." Generated deterministically from the scorecard; AI only narrates | It gives buyers something to watch and developers something to fix, from the same truth. It also answers the angriest question ("why not Moderate?") without a human | Search the minimal factor changes that cross a band edge, rank them by feasibility, and cite each input | M | It can read as a promise ("do X and you'll be Moderate"), so frame it as "on today's method v1.2" |
| **Open methodology kit.** Publish the weights, rules and a CC-BY dataset of facts derived from public registers, so journalists and researchers can reproduce any band | Critics become auditors, and it earns press and credibility no ad budget can buy | A versioned spec (YAML) and a public dataset limited to public-register fields (no vendor MCA or eCourts data) | M | Competitors copy the facts. The moat stays in freshness, the reply system and the scoreboard above |

**Best single idea:** **"Were we right?"**, the public calibration scoreboard. It is the one artefact that makes every other trust claim on the site checkable.

---

## 3. DevPortal: "Evidence & Reply" for developers

### Before: 6.3 / 10

```
ROUND 0 (before)
Seen in one second: a sidebar and a stack of outlined boxes; the green "free forever" note is the loudest thing.
Idea: a standard admin console.
Live thing: a "How buyers will see it" column of dashed label boxes. The real buyer-card preview sits two sections away, under Reply.
Layout words: overview=title / projects=table / notice=outlined box / dispute=3-column outlined box / reply=split / log=table.
Scores: design 5.5 · usability 7 · creativity 6 · content 8.5 → 6.35 → 6.3
Caps: "Developer profile" eyebrow, vertical hairlines, dashed drop zones and labels, numbered step badges (overall ≤ 6.5).
Top problems:
1. The dispute flow shows labels, not consequences. A developer can't see what buyers will see until after submitting, and the card preview is elsewhere.
2. Outlined boxes, dashed drop zones, vertical hairlines between form columns, numbered badges, and the accent tint in 7 places.
3. Type is small and grey (13–15px muted everywhere), the H1 is 40px, and there is no designed close.
```

### What changed
- **Header:** wordmark plus "Evidence & Reply for developers". The account is a filled pill and Sign out is a text link. The one action is **Dispute a fact**. The sidebar stays (it is a console), with tone-filled current items and no hairline.
- **Overview:** "Northfield Estates" at 72px. "Developer profile" moved from an eyebrow into the facts line. The "free forever" note became an **ink slab**: "This portal is free, forever. Payments never affect scores." at 32px. The copy-link button is a tone pill.
- **Questions as headings:** "Which of your projects are scored?", "Which fact is wrong?", "What should buyers read from you?" and "What have you disputed?". Tables keep their row lines but lose the outline box; the chips are borderless.
- **Notice:** a tone field with a **72px "7"** beside "days' notice. Takes effect 25 Oct 2026". Then borderless Elevated → High chips, "The new fact behind it:" written as a sentence, a filled source chip and the primary **Submit factual correction**.
- **Signature, the dispute flow with a live preview:** on the left, three steps (*Pick the fact*, *Add evidence*, *Submit*) with tick/ring/dot marks and no digits. Fact rows are radio rows; the "Reason 1 · Finances" labels became "Finances, on the risk card". On the right, a **sticky replica of the buyer's risk card**:
  - picking a fact lights that reason in the "Developer says" tone;
  - a marker rises in: "After you submit: Disputed by developer · *misread from source* · under review", following the "what is wrong" choice;
  - each piece of evidence adds a provenance chip as you add it: white "CA escrow certificate · Developer-provided, unverified", or ink "Register reference … · Public record, linked";
  - submitting turns the marker live and keeps the reason lit;
  - withdrawing removes it;
  - picking the notice fact shows a "Proposed change, not public yet" block instead.

  A caption under the card says the state in words ("Draft. Nothing changes for buyers until you submit."). Evidence rows take the claim tone when added, and the site-photo row shows a real thumbnail (`towerBSite`).
- **Reply:** the textarea, "Signed as" and attachments are unchanged. The preview now shows only what the reply adds: the "Developer's response" claim field with its byline, attachments and status, plus a "4 reasons · N disputed" line, so the card isn't shown twice in full.
- **Log:** the table keeps its lines, with **filled status pills** (Upheld = ink, Under review = tone, Received = claim tone, Withdrawn = plain text), so the word carries the meaning.
- **Footer slab:** "Your disputes and replies are checked against HARERA, DTCP and MCA records, the same records every score stands on." Then "Plinth".

### After: 7.5 / 10

```
ROUND 1 (after)
Seen in one second: "Northfield Estates" and a dark slab: "This portal is free, forever. Payments never affect scores."
Idea: the console mirrors the public record. A developer edits evidence against the same card buyers read.
Live thing: the live buyer card. Fact, reason and evidence choices appear on it as you make them; submit and withdraw change it.
Layout words: overview=title + slab / projects=table / notice=countdown field / dispute=form + sticky preview / reply=form + preview / log=table / footer=slab.
Scores: design 7.5 · usability 8 · creativity 7 · content 8.5 → 7.55 → 7.5
Caps applied: none known (tables and inputs keep lines by rule).
```

### Remaining issues
1. The sidebar-plus-main frame still reads as a dashboard (it's the right frame for a console, but it caps the design score).
2. There are two previews of the same card (dispute and reply). One persistent card on the right for the whole page would be cleaner.
3. "Dispute a fact" appears three times (header, sidebar, notice CTA, which says "Submit factual correction").
4. Height is estimated (5250). The dispute form is the tallest block, at about 1,150px.
5. There's no mobile flow. The person with the evidence (a site engineer) is on a phone at the site.

### 10x ideas

| Idea | Why it's 10x | How it works | Feasibility | Main risk |
|---|---|---|---|---|
| **Location-verified site capture.** The portal sends a one-time link. The site engineer opens it on a phone inside the project's RERA footprint and takes photos that are GPS-fenced, time-stamped and hash-chained. They attach straight to the dispute, labelled "Captured on site · location verified" | It upgrades evidence from "developer-provided, unverified" to something we can trust quickly, cuts verification time, and builds a construction-progress dataset nobody else has | A camera web app with a geofence from the RERA site plan, device attestation and EXIF checks; hashes are published to our log. It reuses the app's camera-identify stack | M | GPS spoofing and staged photos. Keep "photos never move a score alone", and sample-audit with our own site visits |
| **Fix at the source, with automatic withdrawal.** When a notice cites a missing QPR, the portal shows exactly what is missing on HARERA, links to the filing, detects the filing within hours and withdraws the notice itself, logged publicly | It aligns incentives: the fastest way to a better score is to file on time. Buyers get fresher data and we get fewer disputes | Register polling (already every 6h) plus a rule engine that maps notice causes to the filings that clear them | M | It could look like we are coaching developers. It must be free, identical for everyone, and visible in the public log |
| **Path back: deterministic counterfactuals for developers.** "To return to Moderate on method v1.2: file the Jul–Sep QPR, then two quarters with construction ahead of sales." | It turns the portal from a complaint desk into a roadmap of real improvements, which is good for buyers too | The same counterfactual engine as on Methodology, scoped to the developer's projects, with no AI in the numbers | M | Gaming by cosmetic filings, so the QPR plausibility checks (v1.1) must stay strict |
| **A public SLA board for Plinth itself.** Acknowledged within 48h (100%), decided within 15 working days (94%), upheld rate (38%), median days to decision | It holds us to the same standard we hold developers to, and that symmetry makes the score defensible | Derived from the dispute log we already keep. Shown here and on Methodology | S | Our misses are public, which is the point, but it needs operational discipline from day one |

**Best single idea:** **location-verified site capture**. It turns developers into verifiable data providers without letting them pay or plead, and it moves "Developer says" towards "Records show" honestly.

---

## 4. Privacy: "Who has my number?"

### Before: 6.4 / 10

```
ROUND 0 (before)
Seen in one second: a narrow grey column of outlined lists; the headline is the only large thing.
Idea: a privacy settings page that could belong to any app.
Live thing: Revoke changes a row's text; "N parties can reach you now" is a 15px grey line under the headline.
Layout words: hero=statement / who=list box / consent=list box / masked=panel / data=list box / help=box (list box ×4).
Scores: design 5.5 · usability 7.5 · creativity 5.5 · content 8.5 → 6.4
Caps: glass header, outlined boxes and hairlines, numbered circles 1-2-3, breadcrumb above H1 (overall ≤ 6.5).
Top problems:
1. A 760px column with dead ground either side on a 1280 canvas, and four outlined list boxes in a row (fullness pass fails).
2. The signature is invisible: revoking has no consequence above the row you tapped.
3. Accent on avatars, dots, switches, links and states; 13–15px grey copy throughout; link-row footer.
```

### What changed
- **First screen:** "Who has my number?" at up to 88px and the promise lead. The breadcrumb, masked-number line and Hindi link moved *below* the lead. The list follows directly: "Who has it, and why?" with a filter tablist and party rows. Active rows sit on a tone field with ink avatars and an ink **Revoke** pill. Ended or revoked rows recede, the revoked status rises in, and **Undo** is an ink link.
- **Signature, revoke updates "who can reach you":** a **sticky ink slab** beside the list:
  - "Who can reach you right now", with a **160px digit that rolls** (3 → 2 → 1 → 0, using a transform odometer);
  - four party discs, where active discs are light and revoked discs scale back to 78% with a strike-through label;
  - a sentence that names who still can and who you cut off ("You revoked Larkspur Realty today; their relay stopped at once.");
  - the 30-day contact-limit meter (3 of 3, next slot 11 Nov 2026);
  - "We never sell your number." (moved here from a green tint box).

  Revoking Larkspur also flips the masked-call preview further down to "This relay no longer connects", and deleting the account rolls the count to 0.
- **Consent:** "What else can Plinth do?" (shortened to stay on two lines; the lead now opens "With your data, only what you switch on."). On a tone band, the five switch rows are ink, with consent references. An "on" row lifts onto white.
- **Masked number:** "How is my number masked?" The call card sits with an ink-on-white "What you see / What they see" toggle. The steps are an `<ol>` of bolded sentences ("You choose." "We relay." "It ends.") with no number circles.
- **Data:** "Can I take my data, or delete it?" is two open columns. The download progress bar now uses a transform. The ready state is a white field with the accent **Download**. The delete confirmation (acknowledge, then confirm) and restore are unchanged, set on a white field.
- **Help:** "Who do I contact if something goes wrong?" with **"Within 24 hours" and "Within 7 days" at 56px** and "Raise a grievance" as an ink pill. The rights sentence is kept.
- **Footer slab:** "We never sell your number. No developer pays us. Ever." Then the DPDP notice line, "every share on this page stands on a consent record with its own reference", the links, a live "N parties can reach you now", and "Plinth".

### After: 7.6 / 10

```
ROUND 1 (after)
Seen in one second: "Who has my number?" and a dark panel with a huge "3" that "can reach you now".
Idea: your number's reach, made countable. Every share is a person you can see and switch off.
Live thing: Revoke. The count rolls down, the disc steps back, the sentence and the call preview change.
Layout words: first screen=list + sticky slab instrument / consent=text + switch list / masked=card + steps / data=two columns / help=big numbers / footer=slab.
Scores: design 7.5 · usability 8 · creativity 7.5 · content 8.5 → 7.75 → 7.6 (rounded down; not rendered)
Caps applied: none known.
```

### Remaining issues
1. There are no pictures. That's acceptable for settings, but a single real photo (a phone showing a relay call) would warm the masked-number section.
2. "Download my data" is an unusual header action. "Stop all contact" (one tap, with undo) may be the more honest single action for this page.
3. The contact limit stays at 3 of 3 after a revoke, which is correct (shares, not reach), but needs user testing to confirm nobody reads it as a bug.
4. "Delete my account" sits beside "Download my data" at equal weight. The destructive path deserves its own quieter place, or a sheet.
5. Height is estimated (5550).

### 10x ideas

| Idea | Why it's 10x | How it works | Feasibility | Main risk |
|---|---|---|---|---|
| **Leak detector with canary relay numbers.** Every partner gets a unique relay number per buyer. If a buyer is called by someone who isn't on this list but cites the same project, one tap reports it and we trace which relay leaked. Partners carry a public "leak record", and leakers are dropped | Broker spam is the top pain in Indian property search. Proving *who* leaked turns "we never sell your number" from a promise into enforcement | Per-pair relay numbers (already the model), call-metadata matching, a one-tap report from WhatsApp, and a partner scorecard published on Methodology | M | False attribution and telephony cost. Needs an evidence standard and a partner appeal path |
| **Consent receipts: Plinth as the buyer's DPDP Consent Manager.** Every share becomes a signed receipt (purpose, party, expiry) the buyer holds and can revoke from anywhere, for example by replying "STOP LR" on WhatsApp | It makes Plinth the buyer's privacy agent across brokers, lenders and developers. That's a regulatory-grade moat and a reason to stay | DPDP consent-manager registration, a receipt schema, partner SDK checks before each call, and a WhatsApp command parser | L | The regulatory timeline and partner adoption. Start with our own partners as a closed network |
| **Call windows by purpose.** "Larkspur may call only Sat 10 am–1 pm, about the Kestrel visit." The relay rejects calls outside the window, and the partner sees it | It gives buyers control over *when*, not just *who*. Calls feel like appointments, not interruptions | Relay rules per consent; the window is shown on the partner's side; reminders before the window | S–M | Partner friction and missed urgent calls, so allow "buyer-initiated anytime" |
| **Go dark.** One switch revokes every relay, pauses alerts and auto-restores after N days, with a countdown on this page's slab | It is the panic button people want after a bad broker call, and it shows the controls are real | Batch revoke plus a scheduled restore. The odometer instrument here already animates the result | S | Accidental use, so keep a 10-second undo and a confirmation |

**Best single idea:** the **leak detector with canary relay numbers**. It is the first privacy feature in the category that can *prove* a leak rather than just promise there won't be one.

---

## Summary

| Screen | Before | After | Signature live thing | New height |
|---|---|---|---|---|
| Following | 6.3 | **7.6** | "What changed" reveal: the score moves from before to after on one instrument, with a replay toggle | 6700 (was 5040) |
| Methodology | 6.4 | **7.9** | Band picker: the 34px icon array sweeps row by row, with a quiet needle | 10500 (was 7000) |
| DevPortal | 6.3 | **7.5** | Dispute flow with a live buyer-card preview | 5250 (was 3840) |
| Privacy | 6.4 | **7.6** | Revoke rolls the "who can reach you" count and the party discs | 5550 (was 4080) |

Not done, and needed before code: one look at each artboard on the canvas to confirm the estimated heights and the two-line headlines at 1280, 768 and 390; generate `filingsStack`; then run `lint.mjs` and `inspect.mjs` in an environment where running them is allowed.
