# Web core review: Home, Search, Project

Group **web-core**, 18 Oct 2026. Screens: `WebHome.dc.html`, `WebSearch.dc.html`, `WebProject.dc.html` (canvas working folder).

**Method.** I read each artboard's code as if it were a screenshot and applied the 14 passes and the weighted score from `taste-skill/references/critique.md` (design 40%, usability 30%, creativity 20%, content 10%, with caps). Then I did the taste pass from DESIGN.md §0. The inspector and lint scripts were not run (house rule), and no browser was opened. So every "after" score is a reading of the code, not of a render. Heights were estimated by summing section sizes. Each root ends in a `flex: 1` footer that absorbs any slack.

**Checks run on every edited file:** tags balanced, attributes quoted, the support.js line exact, `data-props` parses. On top of that: every `{{hole}}` resolves against `renderVals()` in Day and Night across 5–9 UI states, the logic runs in node, and the main interactions were simulated.

## Applies to all three screens

- **The idea is now on the page.** "A project's filings become the floors of its building" shows up as slab stacks and built-bars in accent, the only accent detail besides the primary action. The footer closes on **"Plinth" at full width, standing on an ink slab** (the plinth) that carries the legal line.
- **Removed:**
  - glass and backdrop blur (header, chips, panels, prompt pills);
  - the radial glow;
  - the floating pill bars (Home quick actions, Project toolbar);
  - shadows at rest (search pins, map controls, compare handle);
  - outlined and dashed boxes ("Developer says" is now a `claimBg` tone field with a speech icon);
  - hairline dividers;
  - number badges and "Step n" or "Chapter n" eyebrows;
  - green links (links are now ink with an underline).
- **Risk chip is borderless everywhere** (coordinator rule, DESIGN.md §0). It uses band fill in Day, `fillD` in Night, the mini meter and the name. Limited history sits on `t.track`, height 30.
- **Type and shape:**
  - Display headings are `clamp(56px, 7.5vw, 112px)` with masked line reveals.
  - Section questions are `clamp(40px, 4.7vw, 60px)`.
  - Body text is 19 px in full ink.
  - Media corners are square. Panels have a radius of 8 or less. Buttons and chips are tone-filled pills.
- **Motion layer.** It lives in helmet CSS; the `@keyframes` and reduced-motion rules sit under §0.
  - The hero photo drifts slowly (scale 1 to 1.04 over 26 s, alternating).
  - The first screen enters in a stagger: lines, then copy, then instrument.
  - Below the fold, sections enter on scroll with `animation-timeline: view()` inside `@supports`. Other browsers get static content, so nothing is ever left hidden.
  - Every control gets press feedback (scale .97) and hover feedback (brightness). Focus rings are kept.
  - All travel sits inside `prefers-reduced-motion: no-preference`, and the JS instruments jump to their final state when motion is reduced.

---

## 1. Home (`WebHome.dc.html`): 3,420 px → **5,040 px**

### Critique before

```
ROUND 0 (before)
Seen in one second: the aerial corridor photo and "Know before you book."
Idea (one sentence): stated in copy ("we read every filing") but not shown; no slabs, no plinth.
Live thing: the AI ask bar, but its answer panel only exists after you ask. Three instruments compete
  (ask, corridor tabs, 3-step player), none leads.
Layout words by section: hero=full-bleed / explore=split / how=split / money=split / footer=link columns
Scores: design 6.0 · usability 7.5 · creativity 6.0 · content 8.0 → overall 6.65 → capped 6.5
Caps applied: glass header, chips and panel; index numbers 1·2·3 and "Step 2 of 3"; floating pill bar;
  hairline list dividers; dashed "Developer says"; only 1 real picture visible (design ≤ 6.5).
Top three problems:
1. Three split sections in a row: after the hero the page turns into a template.
2. The first screen has no instrument; the signature only appears in a glass panel after interaction.
3. One visible photo, outlined pills and hairline rows make the page read as a kit.
```

### What changed

- **Signature live thing: type a project and its risk card builds.** An opaque card sits in the hero. As you type "Aurelia", "Kestrel", "cor" or "Halcyon" (project or developer prefixes), the card for that project builds itself:
  - the name lands;
  - the 5-segment meter fills one segment at a time;
  - the band name and confidence appear;
  - the frequency sentence follows;
  - the **10-slab stack rises to the built %**, with the sold slab outlined in band ink;
  - the all-in price, the source chips and Follow / Open arrive last.

  It assembles once for Aurelia on load. The AI answer and the QR scan now open *in the same slot* and close back to the card. Enter on a project name the AI can't answer rebuilds the card instead of giving the generic reply.
- **Hero:**
  - display set to `clamp(56px, 7.5vw, 112px)` with a two-line masked reveal;
  - slow drift on `corridorAerial`;
  - the ask bar is a borderless white field, and the scan and mic buttons are tone pills;
  - the prompt chips are filled (no blur);
  - the promise is now a plain line instead of a 26 px badge.
- **Explore ("Which projects are on track?").**
  - The vertical corridor tabs are now tone rows; the accent count pill is gone.
  - The results became photo rows: square 128×96 thumbnails, with no hairlines and a tone hover.
  - **Real pictures visible went from 1 to 5.** The live strip moved to the footer.
- **How ("How does Plinth know?") was recomposed** as a stacked section: a heading row with the heading and lead at opposite ends, then a horizontal three-step strip (slab bars instead of numbered circles), then the stage beside a tall picture.
  - The **8 QPRs are drawn as 8 slabs, oldest at the bottom**. Late ones are hatched, and they light up bottom-up when you press Play.
  - The reason is now written "Finances: 72% of units sold, 41% built." in a tone field.
- **Money ("How do we make money?")** is now the page's one centred moment: a giant **₹0**, the sentence under it, and the four revenue lines as a figure strip (price over who over what). The "Never for sale" line sits in a tone field.
- **Footer.** The four link columns became one row of links, a 36 px promise statement, the live strip and the full-width **Plinth** on the ink slab.
- **New image slot `qprDesk`.** It shows a printed QPR on a desk and replaces the generic tower in "How". It is listed in `assets/requests_web-core.json`.

### Critique after

```
ROUND 1 (after, read from code)
Seen in one second: "Know before you book." over the corridor, with a risk card building beside it.
Idea: a project's filings become its floors: card slab stack, 8 QPR slabs, the name standing on a plinth.
Live thing: type a project or developer, and its risk card assembles from the records.
Layout words by section: hero=full-bleed + instrument / explore=split list with photos /
  how=stacked strip + stage + picture / money=centred statement + figure strip / footer=wordmark on slab
Scores: design 7.6 · usability 8.0 · creativity 8.0 · content 8.5 → overall 7.9
Caps applied: while the qprDesk slot is still empty, content ≤ 5 → 7.5. 7.9 once it is generated.
```

### Remaining issues

- **The hero is still busy:** a two-line display, a lead, the ask bar, a hint, three prompts, the promise line and the card. If a render confirms it, cut the hint line or the prompts.
- The footer wordmark size (35vw) and every section height are estimates. A real render must confirm that "Plinth" fills about 85–95% of the width without clipping.
- The phone layout is fluid, not composed. The card stacks under the copy, so the signature drops below the first phone screen.
- Golf Course Ext Rd and New Gurugram have 0–2 rows, so the 560 px list area leaves a rest at the bottom.

### 10x ideas

1. **"Forward the brochure": a truth-check of any broker WhatsApp forward.**
   - **Idea:** drop or forward a brochure PDF, a cost-sheet photo or a broker's message. Plinth returns it annotated line by line: what the records show against what the brochure says.
   - **Why 10x:** in Gurugram, discovery happens through WhatsApp forwards, not search boxes, so the buyer's real input is a brochure. Example: the brochure says "possession 2026", but the RERA date for Aurelia Heights Ph 2 is Dec 2027. It says ₹2.35 Cr, but the all-in is ₹2.74 Cr. It says 2,000 sq ft, but that is super area; carpet is 1,450 (38% loading).
   - **How:** OCR plus LLM extraction into a claim schema (dates, prices, areas, RERA number, amenities). Match on the RERA number or name. Compare field by field with QPRs, the registration and our cost rules. Render as an annotated overlay with source chips, labelled "Brochure says" and "Records show".
   - **Feasibility:** M.
   - **Main risk:** an extraction error would look like an accusation. Show confidence and a "check this" state, never verdict words. Also never republish the brochure.
2. **The risk-for-money frontier.**
   - **Idea:** for each corridor, one chart of all-in price against delivery risk. It shows which projects are *dominated*: paying more for more risk.
   - **Why 10x:** no portal says "you are paying ₹30 L more for a worse delivery record". Example: Aurelia Ph 2 (₹2.74 Cr, Elevated) sits beside Kestrel Park (₹2.44 Cr, Low, 63% built against 41%).
   - **How:** combine the cost-rules engine with the band, then run a Pareto frontier per BHK type. Users can re-weight by location or carpet area.
   - **Feasibility:** S.
   - **Main risk:** it reads as a recommendation. Label it "arithmetic on public records, not advice", and keep location and spec differences visible.
3. **Key-date odds and the double-payment meter.**
   - **Idea:** replace "possession Dec 2027" with the reference-class spread of real handover dates. Then turn that spread into money: enter your rent and pre-EMI, and see the expected cost of a delay.
   - **Why 10x:** the real pain in NCR is paying rent and EMI together for years. For Aurelia Ph 2: "Between 30 and 45 of 100 similar projects finished more than 12 months late." The meter makes that a ₹ figure for *your* rent.
   - **How:** use the calibrated delay distributions per band (212-project reference class for Aurelia), the user's own inputs, and natural-frequency copy. Nothing is stored without consent.
   - **Feasibility:** M.
   - **Main risk:** false precision, and drifting towards financial advice. Show ranges only, plus a calibration note.
4. **A verified allottee network per developer.**
   - **Idea:** people who own homes in Northfield's finished projects can answer buyers anonymously. Those projects are Cedar Walk, Wren Court, Opaline Residences and Linden Square, plus Heron Point Ph 1 and Aurelia Heights Ph 1, both delivered late.
   - **Why 10x:** buyers get lived delivery experience with the same developer, which today sits in closed RWA WhatsApp groups.
   - **How:** verify with an allotment-letter upload mapped to the RERA project. Answers are moderated, and the AI summarises themes with citations.
   - **Feasibility:** L.
   - **Main risk:** developer astroturfing and defamation. Verification and moderation are the product.
5. **"This week in filings": the home page as a newsroom.**
   - **Idea:** a calm weekly change log per corridor. For example: "Coral Towers: second extension granted", "Kestrel Park: QPR filed on time", "Laurel Residency: NCLT order still in force".
   - **Why 10x:** it is a reason to come back every week without buying anything, and nobody else has the diff.
   - **How:** we already ingest nightly, so this means diffing records and keeping a template sentence for each change type.
   - **Feasibility:** S.
   - **Main risk:** an alarming tone. Use the same verbs-only copy rules.

---

## 2. Search (`WebSearch.dc.html`): 1,620 px → **2,340 px**

### Critique before

```
ROUND 0 (before)
Seen in one second: a list of project cards beside a map.
Idea: "AI read your search as" chips are a real idea, but set at 16 px inside a tinted bubble.
Live thing: removable query tokens synced with filters, list and map pins.
Layout words: header / query bubble / filter row / split list + map / grey strip footer
Scores: design 6.0 · usability 8.0 · creativity 6.5 · content 8.5 → overall 6.95 → capped 6.5
Caps applied: shadows at rest on pins and map controls; ≥3 outlined pills plus a "Ctrl K" kbd box;
  dashed removed tokens; rounded 18–24 px media.
Top three problems:
1. The differentiator (the AI's reading of your search) is the smallest type on the page.
2. Everything is an outlined capsule: filters, Follow, map pin, More filters, kbd.
3. The footer is a grey strip; the idea never reaches it.
```

### What changed

- **Signature live thing: the search is a sentence you edit.**
  - The AI's reading is set at statement size (30 px): "AI read your search as **3 BHK** **Dwarka Expressway** **under ₹2.5 Cr all-in** **low delivery risk**".
  - Each word is a tone tile. Tap one to strike it through and drop it, and the count headline, the list, the "Hidden by your filters" panel and the map pins re-sort.
  - "Edit the words" opens the free-text editor.
- **Count headline:** "3 projects match" is now 80 px. The one accent action, "Save this search", sits on its baseline. A "No projects match" state was added.
- **Filters, Follow, map-pin and More filters are tone pills.** Active filters are ink. The kbd box became plain "Ctrl K" text, and the current page in the nav is a thick underline.
- **Results:**
  - rows with square 220×165 photos and a selected tone instead of the accent outline;
  - built-bars in accent, the only accent detail;
  - the selected project's photo drifts slowly (the screen's moving picture, in step with its pin).
- **Map:** square corners, no shadows on pins or controls (tone contrast instead), opaque labels.
- **Rows enter in a stagger.** The footer gets the full-width Plinth on its slab, with "Rank order is never for sale."

### Critique after

```
ROUND 1 (after, read from code)
Seen in one second: "3 projects match", then the editable sentence.
Idea: your search is a sentence; every project carries its built-bar; the name closes on the plinth.
Live thing: drop a word from the AI's reading and watch the list, the map and the hidden list re-sort.
Layout words: statement header / tone filter strip / split list + full-height map / wordmark close
Scores: design 7.4 · usability 8.5 · creativity 7.5 · content 8.5 → overall 7.9
Caps applied: the stylised map is a labelled placeholder (content ≤ 5) → 7.5 until real tiles land.
```

### Remaining issues

- **The filter pills and the sentence tiles control the same state.** Consider removing the bhk, budget and risk pills and keeping only Possession and More filters.
- At 390 px the sentence wraps to 4–5 lines, so the phone needs its own version: horizontal-scrolling tiles or a "3 filters" summary.
- "Sign in" (ink) and "Save this search" (accent) are two strong buttons in the first 200 px.
- The 0-results state has a headline but no guidance yet. It should say "Drop *low delivery risk* to see Aurelia Heights" and similar.
- The map is still a drawing.

### 10x ideas

1. **Search by your life deadline, not by filters.**
   - **Idea:** "I need keys before Apr 2028, when my daughter starts school, under ₹2.5 Cr all-in." The AI turns this into tiles, including **a deadline tile scored against delay odds, not the developer's date**.
   - **Why 10x:** every buyer has a real deadline, and portals filter on the promised date. Kestrel Park (Jun 2027, Low, about 10 of 100 late) fits with room to spare. Sapphire Grove Ph 1 (Mar 2028, Moderate, about 20 of 100 more than 12 months late) is flagged "one month of slack".
   - **How:** LLM parsing into the existing token model, then the reference-class delay distribution applied per band. A commute tile can come from a routing API.
   - **Feasibility:** M.
   - **Main risk:** false precision. Always show odds as natural frequencies and keep the tile removable.
2. **The safer twin.**
   - **Idea:** every result shows its nearest-price alternative with a lower band, as a one-tap swap.
   - **Why 10x:** buyers anchor on one project; the twin turns a list into a decision. Aurelia Ph 2 at ₹2.74 Cr, Elevated, has the twin Kestrel Park: ₹30 L less all-in, Low, and 22 points more built.
   - **How:** the cost engine and band plus a nearest-neighbour search over price, carpet area and corridor, using a published rule.
   - **Feasibility:** S.
   - **Main risk:** it reads as steering or as paid placement. Publish the rule and keep "No paid placement" beside it.
3. **Radar alerts on a saved sentence.**
   - **Idea:** a saved search watches the *records*, not just new listings. "Tell me if anything on Dwarka Expressway under ₹2.5 Cr all-in moves to Low", "…if Juniper Enclave files its first QPR", "…if a hidden project's all-in drops under my budget".
   - **Why 10x:** buyers watch for months, and the trigger that matters is a filing.
   - **How:** the nightly diff (Home idea 5) joined to saved token sets, delivered on WhatsApp.
   - **Feasibility:** S to M.
   - **Main risk:** alert fatigue. Send a weekly digest by default and instant alerts only for band changes.
4. **The land-risk layer on the map.**
   - **Idea:** colour sectors, not just pins, by what the land and its surroundings show. That means licence status, NCLT red flags in the group (Laurel Residency, Sector 92), historical delay rates and civic readiness (sector roads, water and sewer connections from GMDA/DTCP records).
   - **Why 10x:** in New Gurugram, a tower can be on time and still be unliveable without roads or sewers. Nobody maps that.
   - **How:** licence and LC-IV data, GMDA works orders and our delay history, aggregated per sector.
   - **Feasibility:** L.
   - **Main risk:** data quality and fairness to new developers. Show only the layers that are sourced.

---

## 3. Project (`WebProject.dc.html`): 6,300 px → **8,320 px**

### Critique before

```
ROUND 0 (before)
Seen in one second: the tower photo and "Aurelia Heights, Phase 2".
Idea: present (the replay tower story) but held in a 300 px column mid-page.
Live thing: the scroll-story tower, competing at equal weight with dial, EMI, compare and AI.
Layout words: hero=full-bleed / risk=split / story=split / cost=split / picture=split / records=split / ask=split
Scores: design 6.5 · usability 8.0 · creativity 7.5 · content 9.0 → overall 7.4 → capped 6.5
Caps applied: radial glow behind the risk section; glass sticky nav; floating pill toolbar with shadow;
  number badges 1–4; "Chapter n · …" eyebrows; dashed claim boxes; hairlines; 2 visible pictures.
Top three problems:
1. Seven splits in a row with alternating sides: the template showing.
2. The signature tower is small and visually equal to everything around it.
3. Three navigation systems: header, sticky anchor bar and floating toolbar.
```

### What changed

- **Chrome:**
  - **One plain sticky bar:** the wordmark, then the project name and a borderless band chip, then 5 anchors (Delivery risk, Built, Cost, Records, Ask), the theme control and **Follow** as the single action.
  - The second header, the global search and the floating Follow/Ask/Share toolbar are gone. Share became a text button in the hero, and the toast stays.
- **Hero:** 760 px, slow drift, a masked two-line `clamp(56–112px)` title, and opaque chips (no blur). The actions are Follow (accent), "Ask about it" (white tone) and "Share the live page".
- **Risk:**
  - the glow is gone;
  - the band name is set at question size beside a larger meter;
  - the reasons are a real `<ol>` with no badges, written "**Finances:** 72% of units sold, 41% built.";
  - "Developer says" is a claim tone field with a speech icon;
  - the source chips are filled tone pills.
- **Signature, the replay tower,** got a stage of its own.
  - The story header is now a split of copy and a new **`siteProgress` photo** captioned "The tower below is drawn only from the filings".
  - Below it, the instrument runs **full width (1,200 × 640) on a dark stage in both themes**.
  - The 20 slabs are now 190 px and rise 10 px per floor, lit in mint as you scroll the quarters. The sold slab is outlined in band ink, and the chapter progress is drawn as 5 slabs.
  - The chapter eyebrows are gone; the date now sits under each title.
- **Cost, recomposed as a figure:**
  - a 96–112 px **₹2.74 Cr**;
  - a full-width **composition bar** (₹2.35 Cr base, then ₹9.2 L, ₹12.2 L and ₹17.6 L) with a legend;
  - then the EMI instrument as a tone strip (EMI, sliders, +1% stress).

  The breakdown disclosure keeps every source chip. The carpet-versus-super bar lost its dashed outline.
- **Picture yourself here, now full width:**
  - the compare image is 1,200 × 640 with square corners;
  - the view toggle and the style pills are tone pills, with the selected one in ink;
  - the compare handle has no shadow.
- **Records** stay a split, but the hairlines are gone. The timeline is drawn in ink on a tone field.
  - A new **`cameraSite`** picture carries a real site-visit check: "its RERA number should read GGM/673/405/2022/117. Scan its QR with Plinth".
- **Ask, recomposed as a console:** a rail of question prompts on the left and the conversation on the right. The voice wave and the send button are ink; the mic is a tone circle.
- **Evidence drawer:**
  - radius 8, with the shadow kept because it truly floats;
  - the hash sits in `<code>`;
  - "View on HARERA" is an ink pill;
  - "Developer says" is a tone field.
- **Footer:** "No developer pays us. Ever. This page stands on 14 public filings.", then the links and Plinth on its slab.
- **Real pictures visible went from 2 to 4,** plus 3 AI-staged rooms.

### Critique after

```
ROUND 1 (after, read from code)
Seen in one second: the project name at display size over the photo, and Follow.
Idea: the filings build the tower: a dark stage where each quarter lights a slab; the page closes on the plinth.
Live thing: the replay tower (scroll story, slider fallback, reduced-motion path).
Layout words: hero=full-bleed / risk=split with dial / story=split header + full-width dark instrument /
  cost=figure (number, bar, EMI strip) / picture=full-width compare / records=split with list + photo /
  ask=console / footer=wordmark on slab
Scores: design 7.8 · usability 8.3 · creativity 8.5 · content 9.0 → overall 8.2
Caps applied: none expected; render still to confirm.
```

### Remaining issues

- **The page is long (8,320 px).** If it needs cutting, Picture yourself here could become a link to the Visualise page.
- The tower column is fixed at 420 px, so the story needs a phone composition (tower above, chapters as a swipe row).
- In Night the dark stage (#132019) sits close to the page ground (#0B1411). A render may show it needs a lighter edge tone.
- The sticky bar holds a name, a chip, 5 anchors and Follow; it will wrap below about 1,100 px.
- The 28–36 px sub-sizes (h3, stage date, footer statement) should be unified to one value after a render.

### 10x ideas

1. **Pay-as-built guard.**
   - **Idea:** upload the payment schedule and the builder's demand letters. Plinth lays each instrument (one payment due) over the filed slab timeline and flags any demand that runs ahead of what the filings show.
   - **Why 10x:** paying ahead of construction is the single biggest way NCR buyers lose money, and no one checks demands against filings. For Aurelia Ph 2 the check would say "Slab 12 instalment demanded; latest QPR shows Tower A slab 9 cast (Jan–Mar 2026)". The RERA s.13 10% cap is already in our evidence set.
   - **How:** OCR the schedule into milestones, map them to QPR progress fields and the s.13 rules, and show a calm verdict with sources, a "questions to send" draft and a reminder before each due date.
   - **Feasibility:** M.
   - **Main risk:** it edges into legal advice, and schedules vary. Frame it as "records show / your schedule says" and offer advocate handoff (Verified Flat Check).
2. **Escrow cash-flow X-ray.**
   - **Idea:** a third instrument beside built and sold. Money collected against money spent against construction, plus "cost to complete versus receivables still due".
   - **Why 10x:** the real failure mode is cash diverted to other projects. Example: 72% sold against 41% built means most of the cash is in while most of the cost is ahead. This is the credit analyst's view, made legible to a buyer.
   - **How:** parse Form 3 and the CA certificates on escrow withdrawals plus the QPR financial schedules, and estimate cost to complete from carpet area and stage. Show confidence dots.
   - **Feasibility:** M to L (disclosure quality varies).
   - **Main risk:** incomplete filings. Show ranges and "not disclosed", never a single number.
3. **Site-visit co-pilot and buyer-observed slabs.**
   - **Idea:** on a site visit, Plinth matches the hoarding QR and then guides a 5-minute checklist. You count the slabs on Tower A and photograph the hoarding. Dated, geofenced photos from many buyers build a **"buyer-observed" layer on the tower** between quarterly filings, shown distinctly from "Records show".
   - **Why 10x:** it fills the 3-month blind spot and deters inflated QPRs. A buyer standing in Sector 37D finally knows what to look at.
   - **How:** QR or geofence match, EXIF date, a vision model that counts floors, and human review before anything shows.
   - **Feasibility:** L.
   - **Main risk:** wrong counts, site safety, privacy and manipulation by rival developers. Publish observations only when several of them agree.
4. **Delay remedies, priced from orders.**
   - **Idea:** next to the risk band, show what HARERA has actually ordered in delay cases like this one: interest for delay, refunds, median time to an order. Link each to the orders we read, and show the "14 complaints decided against the promoter" behind Northfield's band.
   - **Why 10x:** it turns a scary band into a known downside and tells buyers what protections exist before they sign.
   - **How:** extract HARERA orders by project type and relief granted, and compute medians per band and per developer.
   - **Feasibility:** M.
   - **Main risk:** outcomes vary case to case. Present it as history, not a promise, with an advocate handoff.
5. **An allottee bloc with one voice.**
   - **Idea:** followers can opt in to a verified allottee group. When a QPR is more than 30 days late or the band moves, Plinth drafts a collective query to the developer through the Reply portal, and if it goes unanswered, a HARERA complaint template.
   - **Why 10x:** it turns 500 isolated buyers into one counterparty. The developer's reply then shows publicly on the page as "Developer says".
   - **How:** the existing Follow list plus verification, triggered by the record diffs, with drafting by AI and sending by the user.
   - **Feasibility:** M.
   - **Main risk:** it positions Plinth as an activist and strains developer relations. The "No developer pays us. Ever." promise is what makes it credible.

---

## Image requests

`product/design/assets/requests_web-core.json` holds one request: **`qprDesk`** (2:3), a printed quarterly progress report on a desk with all text illegible, for the Home "How does Plinth know?" stage. The slot is an empty `div` until it is generated.

Existing generated images placed in new positions (no request needed):
- `siteProgress` in the Project story header;
- `cameraSite` in Project Records;
- `heroKestrel`, `heroSapphire`, `heroAurelia`, `heroJuniper`, `heroCoral` and `heroLaurel` as Home corridor thumbnails.
