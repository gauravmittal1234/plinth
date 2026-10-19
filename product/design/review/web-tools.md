# Web tools: taste pass and 10x review

Screens: `WebCompare`, `WebDeveloper`, `WebCostSheet`, `WebVisualise` (group "web-tools"), in `scratchpad/canvas/project/`.
Reviewer: principal product design. Date: 18 Oct 2026. Rules applied: DESIGN.md §0 (taste pass v1, including the borderless risk chip added today), then §2–§4c, §5 data only, §7 format.

**How it was judged.** The taste-skill scripts were not run. Each artboard was read once as if it were a screenshot and put through the 14 passes in `references/critique.md`. Scores use the Awwwards weighting (design 40%, usability 30%, creativity 20%, content 10%), and every cap in the critique applies. Every edited file passed four checks: an HTML tag-balance parse, a JS parse, a `renderVals()` smoke test in Day and Night across every step and state, and a check that each `{{hole}}` resolves.

---

## What changed on all four screens

| Area | Before | After |
|---|---|---|
| Header | Glass bar with backdrop blur, an outlined "Ask anything" search pill, an outlined "Ctrl K" key, an outlined theme button and a "Sign in" pill | A plain sticky bar on `t.bg`: wordmark, 4 text links (current page underlined) and a tone-filled theme button. The one action is **Follow**, wired to state on every page |
| Ground | Radial glow gradient behind the hero | Flat `t.bg`. The only gradient left is a neutral scrim under white text on photos |
| Boxes | 1px outlined cards, dashed drop zones, hairline dividers, outlined source chips | Tone fields (`t.track` or `t.panelSolid`, radius ≤ 8) and borderless filled chips. Real tables (the Compare grid, the Developer table view and the Cost ledger) keep their lines |
| Risk chip | Band fill with a 1px band-ink outline (Limited history was dashed) | **Borderless** band-fill pill with the mini meter. Limited history sits on `t.track` (DESIGN §0, new rule) |
| Media | Radius 16–28 | Square corners, larger, one dominant image per screen |
| Type | H1 56–64px, H2 48px, lead in grey `ink2` | Hero `clamp(44–56px, 7.5vw, 104–112px)`, questions `clamp(40px, 5vw, 64px)`, lead 22px in full `t.ink`. Each heading was checked against the two-line arithmetic (k≈0.55) at its own column width, and the ones that would have run to three lines were shortened |
| Eyebrows and numbers | "Your shortlist…" link and "Picture it furnished · beta" sitting above the H1; numbered stepper circles 1 2 3 | Moved into the lead or into a quiet line under the heading. Steppers are now an `<ol>` of text buttons: done shows a tick, current is underlined |
| Motion layer | Only the Compare needle and the Cost waterfall moved | Shared keyframes in `<helmet><style>`. The hero rises with a 90ms stagger, and the hero photo drifts slowly to 1.04 scale. Each section's heading, text and picture rise on scroll via `animation-timeline: view()` inside `@supports`, so content stays visible without support. Every control has press and hover feedback. All movement uses transform, opacity or clip-path; I converted the old `height`, `width` and `top` transitions to transforms. Under `prefers-reduced-motion: reduce`, everything is off |
| Footer | A sitemap row with a small "No developer pays us. Ever." | A designed **slab** (ink in Day, deep green in Night). "No developer pays us. Ever." is a 36px statement, followed by a sentence naming the records **this page stands on**, which carries the plinth idea. Then links and the live strip. **"Plinth" closes at full width** (`clamp(120px, 36vw, 520px)`), sitting on the bottom edge like a base course |

**New `$preview` heights.** Please mirror these in `canvas.json` (I did not edit it):

| Screen | Old | New |
|---|---|---|
| Compare | 2660 | **3400** |
| Developer | 4440 | **6860** |
| CostSheet | 4080 | **6900** (Result step; Upload and Reading set `min-height` 1900) |
| Visualise | 3220 | **4320** (Preview step; the other steps set `min-height` 1900) |

**Image requests:** 6 empty slots were added, listed in `product/design/assets/requests_web-tools.json`. They are `ordersDesk` and `towerBSite` (Developer), `costSheetDesk`, `deedKeys` and `salesGallery` (Cost), and `phoneSiteVisit` (Visualise).

---

## 1. Compare: "How do these 3 compare?"

### Before: 6.4 / 10

```
ROUND 0 (before)
Seen in one second: a white bordered table under a text-only headline; nothing dominant.
Idea: none beyond "comparison table". It passes for any portal's compare page.
Live thing: "Highlight differences" switch, outlined, the same weight as "Ask AI" and "Share".
Layout words: hero=statement (text only) / compare=table / footer=link row.
Scores: design 5.5 · usability 7.5 · creativity 6 · content 8 → 6.45 → 6.4
Caps: eyebrow above H1, decorative radial glow, outlined boxes and hairlines (≤ 6.5); 3 real pictures at 120px (design ≤ 6.5).
Top problems:
1. No dominant image. Three 120px rounded thumbnails are the only pictures.
2. The page's one live idea is a small outlined switch competing with two other buttons.
3. Glow, outlined search pill, outlined table shell, dashed "add" box and a link-farm footer.
```

### What changed
- **Hero:** a full-bleed `corridorAerial` (Dwarka Expressway) at 560px with a slow drift. The H1 "How do these 3 compare?" is 104px white on a neutral scrim. A live names line reads "Aurelia Phase 2, Kestrel Park and Sapphire Grove: 3 BHK homes on the Dwarka Expressway, side by side." It drops the corridor clause when the set spans corridors and says "both" when there are two.
- **Signature, highlight differences:** it is now the page's primary action, a 60px accent switch whose knob moves with a transform. Next to it, a live 22px count reads "8 of 10 rows differ. 2 rows match across all 3, folded into one line under the table." Cell tints fade in over 320ms, folded rows re-enter with a short rise, and the summary line counts down as projects are added or removed. "Ask AI" and "Share with family" become tone buttons.
- **Table:** the outline is gone and the shell is a tone panel at radius 8, keeping its internal data lines. Column heads are now a **triptych**: 200px square-cornered project photos bleed to the cell edges. The "add" column is a tone field ("One more?") instead of a dashed box. Remove, suggestion and source chips are filled. The risk chip is borderless.
- **AI answer:** a tone field above the table. Streaming, citations that scroll to and highlight their row, and the human handoff are all unchanged.
- **Footer:** a slab listing this comparison's sources (Methodology v1.2, QPRs Apr–Jun 2026, HARERA registrations and orders, DTCP OC records, cost-sheet rules v2026.10), then "Plinth" at full width.
- **Header action:** Follow, labelled "Follow all 3", "Follow both" or "Following 3".

### After: 7.6 / 10

```
ROUND 1 (after)
Seen in one second: the expressway skyline under "How do these 3 compare?"; then a green switch over three square project photos.
Idea: a shortlist becomes one row of evidence per question, each row naming the record it stands on.
Live thing: highlight differences, with a live count of what differs and what folds away.
Layout words: hero=full-bleed photo / compare=instrument band (switch row + table) / footer=slab.
Scores: design 7.5 · usability 8 · creativity 7 · content 8.5 → 7.65 → 7.6
Caps: pass 14, because "highlight differences" exists on any spec-compare page, so creativity ≤ 7.
```

### Remaining issues
1. The page is essentially one very long instrument (a table about 1,600px tall). It reads as a tool, not a story. A phone composition (one project per swipeable card with sticky row labels) is still missing; on 390px the table scrolls sideways.
2. Inside the table there are still about 6 type sizes (22, 26, 19, 17, 15 and 14). Collapse the small ones to 15 and 17.
3. The column dials (88×51) are too small to carry the needle sweep. Either drop them for the chip alone or make the delivery-risk row the hero row of the table.
4. Opening the AI answer pushes the table down. A side drawer would keep the table anchored.

### 10x ideas
1. **Risk-adjusted all-in: "same money, different futures."** Turn the delivery band into rupees on the same axis as price.
   - **How it works:** for each project, show the natural-frequency spread of possession dates from its reference class, then price each month of delay with the buyer's own rent and pre-EMI interest. For example, Aurelia Phase 2 shows "Between 30 and 45 of 100 similar projects finished 12+ months late", and the row reads "₹2.74 Cr all-in, plus about ₹X if late"; Kestrel Park shows "About 10 of 100".
   - **Why 10x:** the Gurugram buyer paying rent in Sector 56 while EMIs start is exactly who gets hurt by delay. Today no portal prices risk.
   - **Data and AI:** band reference classes (QPRs + OC dates), user inputs, simple expected-cost arithmetic with ranges.
   - **Feasibility:** M. **Risk:** false precision, and it reads as advice. It must show ranges and the label "arithmetic, not advice".
2. **The family decision room.** "Share with family" opens a live link, not a PDF.
   - **How it works:** each relative sets what matters (delivery date, all-in, commute, school) on sliders. Rows re-order by the family's combined weights, and the room shows disagreement ("Papa weights delivery 3x more than you"). It still never names a winner.
   - **Why 10x:** in India the home is a family decision made over WhatsApp forwards.
   - **Data and AI:** weights per link, no login, masked identities; an AI summary of where the family disagrees.
   - **Feasibility:** M. **Risk:** drifting into recommendation, and privacy of family members.
3. **"What would move the band": a forward-looking compare.**
   - **How it works:** under each band, show the smallest public event that would change it. For Aurelia: "If the Apr–Jun 2027 QPR shows ≥ 55% built, the band would move to Moderate." Following a project then means following its trigger.
   - **Why 10x:** compare stops being a snapshot and becomes a watch-list.
   - **Data and AI:** sensitivity analysis of model v1.2 features per project.
   - **Feasibility:** M/L. **Risk:** developers gaming QPR filings, so QPR claims need verification (site photos, satellite).
4. **Your-life rows.**
   - **How it works:** enter your office (Cyber City), your children's school and your parents' sector. The table gains "peak-hour drive" and "nearest metro/RRTS" rows per project, labelled as estimates.
   - **Why 10x:** Dwarka Expressway versus New Gurugram is a commute decision as much as a price decision.
   - **Feasibility:** M. **Risk:** maps API cost; these are not public-record facts, so they need a distinct style.
5. **Hoarding-to-column.**
   - **How it works:** on a site visit, scan the RERA QR on a hoarding and that project drops straight into your compare as a fourth column, with its band.
   - **Feasibility:** S/M (camera identify already exists). **Risk:** mismatched or forged QR codes, so show "matched by RERA number" first.

---

## 2. Developer: "Northfield Estates"

### Before: 6.5 / 10 (capped from 6.8)

```
ROUND 0 (before)
Seen in one second: a construction photo with "Northfield Estates"; then five look-alike split sections.
Idea: a developer profile. The timeline is strong but sits at half width as one of three equal instruments.
Live thing: none dominant (timeline hover, company graph, complaint bars, all equal).
Layout words: hero=full-bleed / record=split / companies=split / complaints=split / reply=split / follow=split / footer=line. Sameness ×5.
Scores: design 6 · usability 7.5 · creativity 6.5 · content 8.5 → 6.8
Caps: floating pill action bar, glass header and caption, dashed "Developer's response" box, hairlines (≤ 6.5); 1 real picture (design ≤ 6.5); still page (design ≤ 7).
Top problems:
1. Five identical split sections in a row; the signature instrument is not given the page.
2. Floating pill bar and glass: the strongest generated tells.
3. Only one picture; grey running text; a sitemap footer.
```

### What changed
- **Hero:** `siteProgress` at 680px with a drift and a neutral scrim. "Northfield Estates" is set at 112px. The one-line summary becomes a sentence: "A developer group of 9 linked companies. 2 of its 6 finished projects got OC more than 12 months late. 3 are under construction." Follow is the primary action, with "Ask about Northfield" as a white underlined link and Share as a text button. The breadcrumb and "Records as of 14 Oct 2026 · model v1.2" move *below* the actions, so nothing sits above the headline. The floating pill bar is deleted and its Share moved here.
- **Signature, the promised-vs-actual timeline,** now runs **full width**. The answer "2 of 6…" and the 9 outcome glyphs (now 30px) sit opposite the question on one baseline.
  - **Scrub:** a "Replay 2017 to today" control and an "as it stood in…" slider (quarterly, Jan 2017 to Oct 2026). The vertical ink rule walks through time, projects fade in at registration, and the promise ring appears.
  - **Overdue bars:** a late bar grows past the promise with a live "+N m, no OC yet" label until the OC shape lands.
  - **Encoding and motion:** "under construction" is a striped bar, matching its legend glyph, instead of a dashed line. Bars draw on scroll.
  - **Detail panel:** a tone field with 22px facts and filled source chips. The table view is kept.
- **Who is Northfield?** (companies) is a split with the diagram on the left. Nodes are tone pills with no outlines, and the dashed spoke still encodes "common directors only". The detail sits under the text with no divider rule.
- **Are buyers going to HARERA?** (complaints) is a stack. The heading sits opposite a giant "7" ("decided against the group in Jan–Jun 2025, up from 2"), and the bar chart drops its gridlines because values sit on the bars. A new picture slot `ordersDesk` fills the right column.
- **What does Northfield say?** (reply) is a split with a picture on the left: new slot `towerBSite`, captioned honestly as what "structure complete" looks like, not as the developer's photo. "Developer says · not yet verified…" is a `claimBg` tone field with a speech icon. "Records show" is a solid panel.
- **Want alerts on Northfield?** (follow) is a half-bleed composition with `heroAurelia` running to the right edge.
- **Footer:** a slab listing what this page stands on (HARERA registrations, QPRs, complaint orders, DTCP OC orders, MCA filings, IBBI/NCLT), then the disclaimer and "Plinth".

### After: 8.0 / 10 once the 2 requested pictures land (capped at 6.5 until then: two grey slots)

```
ROUND 1 (after)
Seen in one second: "Northfield Estates" in huge white type over a drifting site photo; then one full-width record of 9 projects.
Idea: a developer's own RERA dates become a ruler: each promise a ring, each OC a mark, the gap between them is the record.
Live thing: replay or scrub 2017 → today and watch the promises come due.
Layout words: hero=full-bleed / record=wide instrument / companies=split (diagram left) / complaints=stack (figure + chart + photo) / reply=split (photo left) / follow=half-bleed / footer=slab.
Scores: design 8 · usability 8 · creativity 8 · content 8.5 → 8.05 → 8.0
Caps today: 2 of 4 pictures are empty slots (design ≤ 6.5, content ≤ 5 until generated).
```

### Remaining issues
1. **Phone:** the timeline's 240px name column and the absolutely positioned company graph do not work at 390px. They need a phone composition: one row per project with its bar below the name, and the graph as a list.
2. The page is now 6,860px. The complaints and reply sections could merge into one "Buyers vs Northfield" dialogue to cut about 900px.
3. The "on time" outcome uses mint/forest (`accentText`) as data. It is the only place where the accent hue doubles as data.
4. The hero's accent Follow button sits on the photo scrim; check its contrast against the real generated image.

### 10x ideas
1. **The promise ledger.**
   - **How it works:** a public, append-only record of every completion date Northfield has ever stated, plotted on the same timeline as "said vs did". Sources are RERA original and extended dates, brochure dates, and buyer-submitted sales WhatsApps (screenshot-hashed and verified). Each entry shows who said it and when, with Northfield's right of reply.
   - **Why 10x:** broken possession promises are *the* Gurugram pain, and informal promises are where buyers are misled. Nobody aggregates them.
   - **Data and AI:** OCR plus dedupe of uploads, LLM extraction of dates and claims, moderation queue.
   - **Feasibility:** M/L. **Risk:** defamation, so publish only documented claims, with the reply alongside and a dispute log; moderation load.
2. **Group stress map: follow the money, not the org chart.**
   - **How it works:** MCA charges (secured loans), related-party transactions in annual filings, director exits and land-holding companies (e.g. NF Land Holdings) become alerts like "a new ₹X Cr charge on Northfield Buildtech".
   - **Why 10x:** Laurel Residency's red flag came from a *group* company's insolvency (NCLT, 12 Mar 2023). Stress spreads across a group.
   - **Data and AI:** paid MCA data, filing parsers, anomaly rules.
   - **Feasibility:** L. **Risk:** data cost, over-reading normal financing, and the "not a credit rating" boundary.
3. **QPR-day report card on WhatsApp, with a 30-second Hinglish voice note.**
   - **How it works:** after every QPR deadline (next due 15 Jan 2027), followers get "Northfield filed 2 of 3 QPRs on time; Aurelia Phase 2 is now X% built, Y points behind time used", with the timeline image.
   - **Why 10x:** followers don't revisit pages; WhatsApp is where they live.
   - **Feasibility:** S/M (the alerts pipeline exists). **Risk:** template approval, accuracy, fatigue.
4. **Ask the developer, on the record.**
   - **How it works:** buyers post a question publicly; Northfield's verified account answers against an SLA, and unanswered questions show a counter ("12 days unanswered").
   - **Why 10x:** it turns the reply box into a public accountability channel and makes silence itself a signal.
   - **Feasibility:** M. **Risk:** non-participation (acceptable, since that is shown) and moderation.
5. **The price of this track record.**
   - **How it works:** for each past late project, compute what its buyers paid while waiting (rent in that sector plus pre-EMI interest over the delay). For example, Heron Point Phase 1's 27 months becomes "≈ ₹X per family".
   - **Why 10x:** delay in rupees beats delay in months.
   - **Feasibility:** M. **Risk:** assumptions, so show the inputs and frame it as arithmetic.

---

## 3. Cost sheet: "What will I really pay?"

### Before: 6.5 / 10 (capped from 6.65)

```
ROUND 0 (before)
Seen in one second: a 112px "₹2.74 Cr" under a numbered stepper and a centred heading (a good focal point).
Idea: quoted vs all-in, the category default for calculators.
Live thing: the owner choice and its stamp-duty tween sit four screens down; the hero number never moves.
Layout words: hero=centred stack / where=split / area=split / own=split / negotiate=split / tds=split / footer=lines. Sameness ×5.
Scores: design 5.5 · usability 7.5 · creativity 6.5 · content 9 → 6.65
Caps: numbered stepper, glow, glass header, outlined owner cards, dashed upload box, hairlines (≤ 6.5); 0 real pictures (design ≤ 6.5); a "document" drawn from grey bars in the Reading step.
Top problems:
1. The live instrument is buried; the hero number is static.
2. Zero pictures; the Reading step fakes a document with grey bars.
3. Five identical splits; centred hero stack; grey lead text.
```

### What changed
- **Signature, the live all-in, in the hero.** The split is "What will I really pay?" (104px) and a **152px all-in** on the left, with `heroAurelia` (4:5, drifting) on the right. Under the number sits a tone instrument:
  - **Who will own it?** A segmented choice (A man / A woman / Jointly) drives the existing stamp-duty tween, so the big number counts between ₹2.74 Cr and ₹2.69 Cr.
  - **Loan sliders, new, per the §4b Live EMI spec:** down payment 10–40% and rate 7.50–9.75%, over 20 years.
  - **Live outputs:** *EMI a month* (₹1,78,015 at the defaults), *Cash before the loan starts* (down payment plus stamp duty and registration: ₹68.9 L) and *Paid over 20 years* (₹4.96 Cr, of which ₹2.22 Cr is interest), framed as "Arithmetic, not advice".
  - Share with family remains the primary accent; Save is a tone button.
- **Stepper:** text steps only (tick when done, underline when current); no numbered circles.
- **Upload step:** a split with a tone drop field (no dashes) and a new `costSheetDesk` picture showing what a good photo looks like.
- **Reading step:** the paper now shows the **actual cost-sheet lines** ("Base price ₹2,35,00,000", …) re-typed and highlighted as each is read, instead of grey bars. The scan line and progress bar move by transform.
- **Where does ₹39 L go?** A split-chart: text and a photo on the left, the waterfall on the right. The waterfall bars are wider (64px) and grow with `scaleY`. Gridlines are removed, connectors are solid tone, the base bar is ink and the **all-in bar is the accent** (the one other accent detail). The ledger keeps its table lines; chips are filled.
- **How much of it can you use?** A **strip** composition: one full-width, to-scale bar shows 1,450 carpet in ink and 550 shared in hatch, with "38%" at 104px opposite the heading.
- **Who will own the flat?** A list composition: three tone rows with 30px stamp figures, the live totals at 44px and a new `deedKeys` picture.
- **What can you negotiate?** A half-bleed with a new `salesGallery` photo. The two negotiable charges are tone fields, and their switches use ink with a transform knob.
- **Is TDS an extra cost?** The page's one centred statement, a 30px sentence, sits over the full-width 99/1 bar.
- **Footer:** a slab stating "This all-in stands on two things: your cost sheet dated 2 Oct 2026… and Haryana rules, Oct 2026", then "Plinth".
- **Fix:** amounts of ₹1 Cr or more now print in crore (₹1.03 Cr, not ₹102.6 L).

### After: 7.8 / 10 once the 3 requested pictures land (capped at 6.5 until then)

```
ROUND 1 (after)
Seen in one second: "What will I really pay?" over a giant ₹2.74 Cr, the Aurelia tower beside it.
Idea: the developer's cost sheet is re-typed line by line into one honest number, and that number moves with your life (who owns it, how you borrow).
Live thing: the all-in and the loan figures recalculate as you set the owner and the loan.
Layout words: hero=split (instrument + photo) / where=split-chart / area=strip / owner=list + photo / negotiate=half-bleed / tds=centred statement / footer=slab.
Scores: design 7.5 · usability 8 · creativity 7.5 · content 9 → 7.8
Caps today: 3 of 4 Result pictures are empty slots (design ≤ 6.5, content ≤ 5 until generated).
```

### Remaining issues
1. The hero instrument is dense: a number, a segmented choice, two sliders, three figures, a note and two buttons. Watch for it reading as a dashboard. A "Set your loan" disclosure could hold the sliders collapsed on phone.
2. The owner choice now appears twice (hero and section). Both are bound to the same state, but the section could become read-only explanation.
3. **Loan model simplification:** the loan is on the price with GST, there are no processing fees, and stamp duty is never financed. Real Gurugram banks lend about 75–90% of the agreement value. The copy says so, but product should confirm the basis.
4. `costSheetDesk` appears twice (Upload, and the waterfall section). Request a second crop if the lead wants variety.

### 10x ideas
1. **What others in this tower were quoted: anonymised price transparency.**
   - **How it works:** every uploaded sheet (opt-in, anonymised, normalised for floor and facing PLC) builds a distribution. For example: "Your ₹11,750/sq ft super base is above 7 of 10 sheets we've read for Aurelia Phase 2 3 BHK this quarter."
   - **Why 10x:** Gurugram prices are negotiated behind a desk, and this is the single most valuable number at that desk. It is also a data moat that compounds with every upload.
   - **Data and AI:** the existing two-reader OCR, normalisation rules, and k-anonymity (only after ≥ 5 sheets).
   - **Feasibility:** M. **Risk:** confidentiality clauses and developer pushback, poisoned uploads, re-identification. It needs strict thresholds and legal review.
2. **From breakdown to negotiation brief.**
   - **How it works:** after reading, Plinth drafts the buyer's own message to the sales manager. For example: "Please waive the park-facing PLC (₹2,50,000) and club membership (₹1,50,000), or confirm any change in the allotment letter." It cites why these are developer-set, the buyer sends it themselves, and Plinth tracks the reply on the project page.
   - **Why 10x:** information becomes ₹4 L of potential savings.
   - **Feasibility:** S. **Risk:** tone; Plinth must never message on the buyer's behalf.
3. **Payment plan against construction reality.**
   - **How it works:** map each construction-linked instalment to the project's *actual* pace from QPRs. For example: "At Aurelia's current pace, the 'casting of the 20th slab' instalment is likely to fall due about 5 months later than the plan shows." Then overlay the buyer's rent plus EMI to show the double-outgo months.
   - **Why 10x:** it joins two things only Plinth has (the cost sheet and the QPR pace).
   - **Feasibility:** M. **Risk:** forecast error, so show ranges.
4. **Rule-change watch.**
   - **How it works:** when Haryana revises circle rates, stamp duty or GST treatment, every saved all-in recalculates and followers get a WhatsApp diff ("Your all-in changed by +₹48,000: circle rates in Sector 37D were revised").
   - **Feasibility:** S. **Risk:** parsing notifications correctly; a human must check each rule change.
5. **Move-in number.**
   - **How it works:** extend the horizon to the keys. All-in + Picture-it furnishing budget (₹8–12 L for Modern Indian) + maintenance advance + IFMS + moving, as "₹2.74 Cr to buy, ≈ ₹2.86 Cr to live in".
   - **Feasibility:** S. **Risk:** mixing quotes with estimates, so style estimates distinctly.

---

## 4. Visualise: "Picture it furnished"

### Before: 6.5 / 10 (capped from 6.9)

```
ROUND 0 (before)
Seen in one second: a rounded 16:9 room photo under a centred heading with an eyebrow.
Idea: before/after of your own photo, honestly labelled (good).
Live thing: the auto-gliding before/after (good, but boxed and rounded).
Layout words: hero=centred stack / variants=3 identical cards / items=split list / trust=split icon list / footer=lines.
Scores: design 6 · usability 8 · creativity 6.5 · content 8 → 6.9
Caps: eyebrow, glass caption pills with blur, glow, numbered stepper, shadowed handle, row of identical cards, icon-in-rounded-square list (≤ 6.5).
Top problems:
1. The best thing on the page (the reveal) is shrunk into a rounded card.
2. Template sections: 3 identical cards, then an icon list.
3. Glass, blur and shadow on labels and the handle.
```

### What changed
- **Signature, the before/after, is the hero, full bleed:** 100% width, up to 760px tall, square corners.
  - **Entrance:** the frame opens like a **shutter** (clip-path from the top) while both layers settle from 1.08 scale together, so they stay aligned. Then the existing **auto-glide** sweeps the AI layer in from the right.
  - **Labels:** "AI-generated preview" and "Furniture added · structure unchanged" now clip *with* the AI layer, so the label only ever sits on AI pixels. Caption pills are solid with no blur, and the handle (56px) and divider have no shadows.
- **Headline:** "Does it feel like home?" sits opposite a lead sentence on the same baseline: "Your living room at Aurelia Heights, Phase 2, furnished in Modern Indian by AI. The original comes first…". The eyebrow is gone.
- **Filmstrip:** the three variants become a radiogroup strip under the instrument, replacing the card row. The selected one gets an ink underbar, the others sit at 72% opacity, and the image scales slightly on hover. **Choosing a style re-runs the curtain sweep** (`reveal(240)`).
- **What's in the picture?** A giant budget figure (104px) beside a priced list made of tone rows, not hairlines.
- **Can you trust this picture?** A half-bleed with a new `phoneSiteVisit` photo. The three icon tiles become three statements ("Structure locked.", "Labelled for good.", "Original first.").
- **Other steps:**
  - **Room:** a tone drop field; room and storage choices are tone pills with ink for the selected one.
  - **Style:** borderless rows with ink rings and plain swatches.
  - **Generating:** a solid panel instead of glass, and the progress bar moves by `scaleX`.
- **Header and theme:** a theme toggle (it previously had none) and Follow.
- **Footer:** a slab: "This preview stands on your own photo…", then "Plinth".

### After: 7.9 / 10 (the trust picture is pending, so content is capped at 5 until it lands; the 4-picture floor is already met)

```
ROUND 1 (after)
Seen in one second: a full-width room; the furnished half sweeps across it.
Idea: your own site-visit photo is the canvas. AI may add furniture, never move a wall, and the original always comes first.
Live thing: drag the before/after; pick a style and the curtain sweeps again.
Layout words: hero=full-bleed instrument / variants=filmstrip / items=split list + figure / trust=half-bleed / footer=slab.
Scores: design 8 · usability 8 · creativity 7.5 · content 8 → 7.9
```

### Remaining issues
1. "Does it feel like home?" is warm but generic. A headline carrying the room and the project would pass the competitor test better (it must stay at or under about 32 characters).
2. On a phone, the hidden full-frame range input covers vertical scroll gestures on the image. Restrict dragging to the handle area on touch.
3. The budget is for a whole 3 BHK while the items are for one room. Show both, or explain the jump.
4. The filmstrip repeats the hero image three times. It is honest, but the first variant duplicates what is already on screen.

### 10x ideas
1. **Sample-flat honesty check.**
   - **How it works:** on the site visit, the buyer photographs the developer's sample flat. AI compares what it sees with the specifications annexure in the builder-buyer agreement and flags what is *probably not included*: false ceiling, modular kitchen, wardrobes, premium tiles, the AC. For example: "6 items in this sample flat aren't in your spec sheet, worth about ₹6–9 L." Northfield gets a reply slot.
   - **Why 10x:** sample flats in Gurugram are famously over-specified, and this prevents the possession-day shock. It also moves Visualise from decoration into Plinth's truth lane.
   - **Data and AI:** vision detection of fittings plus parsing of the spec annexure.
   - **Feasibility:** M. **Risk:** vision errors, so say "possibly", show the evidence and allow the reply.
2. **Will my furniture fit? Measure-true layouts on the RERA plan.**
   - **How it works:** place the buyer's real sofa (2.1 m) and bed (queen) to scale on the approved 1,450 sq ft carpet plan, and flag clearances ("the master bedroom fits a king bed with 0.6 m to spare").
   - **Why 10x:** carpet-area anxiety becomes something you can see and use.
   - **Data and AI:** digitised floor plans from RERA filings or annexures, and monocular depth for scale from the user's photo.
   - **Feasibility:** M/L. **Risk:** plan accuracy; show tolerances.
3. **Light and view study from your floor.**
   - **How it works:** using the tower orientation, the chosen floor and the sun path, re-light the user's own photo at 8 am and 5 pm in May and December. Mark how the neighbouring plot's *approved* tower (from HARERA approvals) will block the "park-facing" view.
   - **Why 10x:** buyers pay PLC for orientation and view they can't verify.
   - **Feasibility:** L. **Risk:** implied certainty; label as a simulation.
4. **Furnishing joins the all-in.**
   - **How it works:** the chosen style's budget flows into the Cost page's "move-in number" and the loan view (a top-up loan option, framed as arithmetic).
   - **Feasibility:** S. **Risk:** treating ranges as quotes.
5. **Family style vote on WhatsApp.**
   - **How it works:** share the before/after; relatives reply 1, 2 or 3; Plinth shows the family's pick and the spread.
   - **Feasibility:** S. **Risk:** novelty wears off, and privacy of the room photo (it is shared only with the AI label and the original link).

---

## Scorecard

| Screen | Before | After (with requested images) | After today (slots empty) | Signature live thing |
|---|---|---|---|---|
| Compare | 6.4 | **7.6** | 7.6 | Highlight differences, with a live "8 of 10 rows differ" count |
| Developer | 6.5 (capped) | **8.0** | 6.5 cap (2 empty slots) | Replay or scrub 2017 → today on the promised-vs-actual timeline |
| Cost sheet | 6.5 (capped) | **7.8** | 6.5 cap (3 empty slots) | All-in plus EMI, cash and 20-year total, recalculating with owner and loan |
| Visualise | 6.5 (capped) | **7.9** | content ≤ 5 until `phoneSiteVisit` lands | Full-bleed before/after; picking a style re-runs the sweep |

**Best single 10x bet across the group:** the **promise ledger** on the Developer page. It is the one feature that turns Plinth's evidence model ("every claim carries its source") into something no portal paid by developers can copy.
