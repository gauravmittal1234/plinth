# DESIGN.md: Plinth design system, "Daylight Live"

> Working name **Plinth** until the founder picks a brand (PRD D10).
> Chosen direction: **Daylight Live**, which evolves C · Daylight into an interactive, new-age platform: **Day theme by default with a Night toggle**. The interactive layer adds **voice + camera AI** and a **scroll-driven project story** (founder decisions, 18 Oct 2026).
> **Canonical reference artboard: `LiveDay.dc.html`.** Copy its theme token objects (`T` for Day and Night), riskometer, 3D tower, replay slider, EMI sliders, AI streaming answer and staging compare. Do not reinvent them.
> This file is the source of truth for every artboard in Phase 3 and for the Next.js / Expo code in Phase 4.
> Research behind it lives in `product/design/research/`: `design_rulebook.md`, `risk_trust_visualization.md`, `ui_reference_teardown.md` and `mobile_whatsapp_ai_patterns.md`.

## 0. TASTE PASS v1: house rules from taste-skill v2 (founder request, 18 Oct 2026). These OVERRIDE anything below.

Source: `product/design/skills/taste-skill/` (Leonxlnx/taste-skill, MIT). Read `SKILL.md` (house rules, laws), `redesign-skill/SKILL.md` (audit), `references/critique.md` (how to judge) and `references/tells.md`. **Do not run its scripts** (we don't execute third-party code); apply the rules by hand and critique by reading the code as if it were a screenshot.

**The idea (the subject, not the category):** *On Plinth, a project's own RERA filings become the floors of its building: every quarter is a slab, every claim carries its source.* The name: a plinth is the base course a building stands on, and our evidence is what a buyer's decision stands on. Carry this into every page, footer included.

| Rule | Replaces / overrides |
|---|---|
| **No glass, no backdrop blur, no radial glow, no gradient backgrounds.** The one exception is a neutral scrim under text on a photo. Data patterns (the hatched "uncertain range" in the icon array) are allowed because they encode data | §3.2b glass panels and glow |
| **No floating pill navigation or floating action pills.** Web: a plain sticky top bar with wordmark, 3–5 links and ONE action (Follow). Phone: a plain bottom action bar | §4a "slim floating pill" |
| **No shadows at rest.** Shadows only on things that truly float (menu, sheet, dialog, drawer) | — |
| **No 1px outlined boxes, hairline dividers or dashed boxes.** Separate with space or a tone step. **"Developer says"** becomes a distinct *tone field* (`claim-bg` Day `#F1ECE2` / Night `#1D2621`) with its label and a speech icon, not a dashed outline. Source chips become filled tone pills (`t.track`) with no border. Real form fields and real data tables may keep lines | §4 items 8, 9 and 13 |
| **No eyebrows.** No small label above a heading. Metadata ("data as of…", "v1.2") goes in a quiet line *below* the heading or in the sentence | — |
| **No index numbering visuals** ("1 · Finances", "01"). Use a real `<ol>`; show order by position. Write the factor group as part of the sentence: "Finances: 72% of units sold, 41% built." | Reason item, §4 item 8 |
| **Headlines are two lines or fewer** at every width (≈32 characters is safe). Statements set large are `<p>`, ≤ 36 px desktop, ≤ 25 words | — |
| **Type does the work: 2–3 visible sizes**, one very large. Public pages (Home, Project, Developer, Methodology): hero display `clamp(56px, 7.5vw, 112px)`, section questions 56–72 px, body 19 px. Tracking −0.03 to −0.045em on display, leading 0.92–1.0. Five sizes on a page at most | §3.3 scale (upsized) |
| **Running text in full `t.ink`** at ≥ 16 px. Grey (`t.muted`) only for genuinely secondary notes | — |
| **One ground, one ink, one accent.** Forest/mint appears on the primary action and at most one other detail. Links are ink with an underline, not green. The risk ramp is data, not accent | — |
| **Media has square corners**, the same treatment everywhere, and one dominant image per screen. Public pages carry **≥ 4 real pictures** (our generated images count). Buttons and chips stay fully round (pill); panels and tone fields are square or radius ≤ 8 | §3.4 radii for media and panels |
| **Neighbouring sections never share a composition.** Gaps between sections are 120–200 px on desktop and 64–88 px on phone. No rows of identical cards (lists of results are fine) | §4a spacing |
| **ONE signature live thing per page**, named in the page notes and built into the section that proves the claim. Other instruments stay but sit quietly (no competing motion; interactive on tap). Home: type a project name and its risk card assembles. Project: the replay tower. Cost: the all-in recalculates as you set buyer type and loan. Visualise: the before/after. Developer: the promised-vs-actual timeline | Founder still wants rich interactivity: keep it, but give each page one hero interaction |
| **Motion layer (required).** One signature move. Staggered entrance per section (heading → text → picture, 60–90 ms apart, rising 16–32 px with opacity, once). Press/hover/focus feedback on every control. One moving picture (slow 1.04 scale drift on the hero photo). Transform and opacity only, with a `prefers-reduced-motion` fallback. `@keyframes` and the reduced-motion `@media` rule may live in the `<helmet><style>` | — |
| **Risk chip is borderless everywhere:** band fill on a tone pill, a mini meter and the name, with no outline. Limited history sits on `t.track`. The same chip on web, app and WhatsApp | §4 item 4 (bordered chip) |
| **The footer is a designed close:** the name "Plinth" returns at full width, with "No developer pays us. Ever." | — |
| **Copy:** no stock phrases ("Unlock", "seamless", "Get started", "Learn more"). Every button is named for what it does | — |

**Why this, given the founder's "Web3 / new age" ask:** the new-age feel now comes from scale, real pictures, live instruments and motion, not from glass and glow, which the taste-skill study shows are the strongest "AI-generated" tells. Night mode stays as a full dark mode (flat dark ground, no glass).

**New images:** if a page needs a picture we don't have, add a slot (`<div data-slot="newName" ...></div>`, empty) and append `{"slot","aspect","prompt"}` to `product/design/assets/requests_<group>.json` (one file per design group). The lead generates it with Nano Banana Pro and swaps it in. Good subjects include: a printed HARERA QPR page on a desk; a construction hoarding with a RERA number board; slab casting at dawn; a Gurugram street at dusk; keys on a sale deed; an empty sales gallery.

## 1. Direction in one paragraph

**Daylight Live**: Daylight's calm, question-led structure, turned into living instruments. Every buyer question is answered by something you can touch:
- a riskometer whose needle sweeps to the band;
- a 3D tower that builds floor by floor from QPR filings, with the sold line glowing above it;
- a replay slider through every quarter;
- EMI sliders;
- an AI that streams cited answers and can be spoken to;
- a camera that recognises a project from its RERA QR code or the site you're standing at.

It uses a bento-grid layout, soft glass panels, one radial glow, and a light theme by default with a Night mode that feels like a premium instrument panel. It must feel unlike any Indian property portal, and still earn trust through evidence: sources, dates, confidence and the developer's reply on every claim.

Underlying principles from Daylight: photo-led, airy and calm, at Airbnb-level polish. Large soft surfaces, generous space, and one confident forest-green action colour. Every page leads with the buyer's question in plain English ("Will it be delivered on time?", "What will I really pay?", "How much is built?"), then answers it with evidence. Trust comes from the evidence components (sources, dates, confidence, the developer's reply), never from decoration.

## 2. Principles (apply to every screen)

1. **One screen, one question.** Each section heading is a buyer question. Show at most 4 reasons before "See all".
2. **Evidence is the interface.** Every fact gets a source chip and a date. "Records show" and "Developer says" always look different.
3. **Calm, not alarming; honest, not reassuring.** Never write "safe", "guaranteed", "clear title", "fraud", "scam", "avoid", "risky builder".
4. **Same score everywhere.** A band has one name, colour and meter position on web, app and WhatsApp.
5. **Consent is visible.** Numbers are masked, consent boxes start unticked, and a "who has my number" view exists.
6. **Show value before asking.** No login walls, gated brochures, exit pop-ups or fake urgency.
7. **India by default.** ₹ in lakh/crore, "18 Oct 2026" dates, English-first copy, fast on patchy 4G.

## 3. Tokens

### 3.1 Colour (light theme; dark theme comes later)

| Token | Hex | Use |
|---|---|---|
| `ground` | `#FFFFFF` | Page background |
| `surface-soft` | `#F4F2ED` | Tiles, panels, the risk panel background |
| `surface-sunk` | `#EEEBE4` | Empty icon-array cells, tracks |
| `line` | `#E7E3DA` | 1 px outlines (outlined cards, dividers) |
| `line-strong` | `#DCD8CF` | Inputs |
| `ink` | `#1B1A17` | Primary text, dark buttons |
| `ink-2` | `#3F3C36` | Secondary text on soft surfaces |
| `ink-3` | `#4A463F` | Body-secondary |
| `muted` | `#5E5A52` | Captions, metadata (≥ 4.5:1 on white and on `surface-soft`) |
| `accent` | `#1D5A44` | Primary buttons, links, active states (forest green) |
| `accent-hover` | `#12402F` | Hover/pressed |
| `accent-soft` | `#E9F1EC` | "What would change this" and info panels |
| `on-accent-soft` | `#133D2E` | Text on accent-soft |
| `claim-border` | `#9A958B` | Dashed border for the "Developer says" block |
| `focus` | `#1D5A44`, 2 px outline + 2 px offset | Focus ring |
| `error` | `#B42318` | System errors only. **Never a risk colour** |
| `ai-label-bg` / `ai-label-fg` | `#1B1A17` / `#FFFFFF` | "AI-generated" label on staged images |

### 3.2 Risk band ramp (never reuse these colours for anything else)

| Band | Step | Ink | Fill | Text colour for the band name |
|---|---|---|---|---|
| Low | 1 | `#4A90A4` | `#E6F2F5` | `ink` (the Low ink fails 4.5:1 for text) |
| Moderate | 2 | `#9E8300` | `#F7F0D2` | `ink` (same reason) |
| Elevated | 3 | `#A9480C` | `#FBE6D8` | `#A9480C` |
| High | 4 | `#94211C` | `#F8DFDD` | `#94211C` |
| Severe | 5 | `#4A1445` | `#F0E1EE` | `#4A1445` |
| Limited history | — | `#6B7079`, dashed meter | `#FFFFFF` | `ink-3` |
| Not scored | — | `#8C9199`, outlined meter | none | `ink-3` |

Dark-theme inks (Night theme and any dark surface): Low `#7CC0D2`, Moderate `#D9BC45`, Elevated `#F08A4B`, High `#F2706A`, Severe `#D58BD0`.

Low-confidence frequency ranges, as placeholders until calibration:

| Band | Range (of 100) |
|---|---|
| Low | 5–15 |
| Moderate | 15–30 |
| Elevated | 30–45 |
| High | 45–65 |
| Severe | 65–80, or set by a red-flag rule |

**Non-colour cues are mandatory:**
- the band name in text;
- a 5-segment meter, filled cumulatively left to right in the band ink, with the remaining segments white with a 1 px `#8C9199` border;
- confidence dots (●● high, ●○ low), drawn as CSS circles, not Unicode.

### 3.2b Night theme and the theme object (copy from `LiveDay.dc.html`)

Every artboard declares `"theme":{"editor":"enum","options":["Day","Night"],"default":"Day"}` and builds a token object `T` in `renderVals()`. Markup reads colours as `{{t.ink}}`, `{{t.panel}}` and so on.

**Day `T`:**
- Surfaces: bg `#FBFAF7`, bgSolid `#FFFFFF`, panel `#FFFFFF`, track `#F4F2ED`, photo `#E7E3DA`.
- Glass: overlay `rgba(255,255,255,0.80)`, chipBg `rgba(255,255,255,0.85)`, headerBg `rgba(251,250,247,0.85)`.
- Lines: line `#E7E3DA`, lineStrong `#C9C4B9`, claim `#9A958B`, wire `rgba(27,26,23,0.30)`.
- Text: ink `#1B1A17`, ink2 `#3F3C36`, muted `#5E5A52`.
- Accent: accent `#1D5A44`, onAccent `#FFFFFF`, accentText `#1D5A44`, accentSoft `#E9F1EC`, onAccentSoft `#133D2E`.
- Glow: `radial-gradient(900px 520px at 85% 0%, rgba(29,90,68,0.07), transparent 70%)`.
- Icon-array empty cells: emptyCell `#EEEBE4`, emptyBorder `#8C9199`.

**Night `T`:**
- Surfaces: bg `#0B1411`, panel `rgba(255,255,255,0.045)` with `backdrop-filter: blur(14px)`, track `rgba(255,255,255,0.07)`, photo `#1B2A24`.
- Glass: overlay `rgba(11,20,17,0.62)`, chipBg `rgba(11,20,17,0.55)`, headerBg `rgba(11,20,17,0.78)`.
- Lines: line `rgba(255,255,255,0.11)`, lineStrong `rgba(255,255,255,0.28)`, claim `#7E8C86`.
- Text: ink `#EEF3F0`, ink2 `#B9C6C0`, muted `#93A69D`.
- Accent: accent (mint) `#6EE7B7`, onAccent `#052E1F`, accentText `#6EE7B7`, accentSoft `rgba(110,231,183,0.12)`, onAccentSoft `#CFF7E6`.
- Glow: the same radial at `rgba(110,231,183,0.10)`.
- Risk inks switch to the dark ramp.

**Rules:**
- Allowed now, at the founder's request: glass panels with backdrop blur, one radial glow per page, and functional gradients (hatch patterns, before/after layers).
- Still banned: neon glows on text, multiple aurora blobs, gradient text and decorative gradient washes.

### 3.3 Typography

- **Display:** `Bricolage Grotesque` 800 (opsz axis). Headlines, big numbers, band names. `letter-spacing: -0.02em` (−0.03em at ≥ 48 px).
- **Text/UI:** `Mukta` 400 / 500 / 600 / 700. Body, labels, buttons, tables.
- **Google Fonts link:** `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Mukta:wght@400;500;600;700&display=swap`
- **Fallbacks:** `'Bricolage Grotesque', system-ui, sans-serif` and `'Mukta', 'Noto Sans', system-ui, sans-serif`.
- **Numerals:** `font-variant-numeric: tabular-nums lining-nums` on the root.

| Role | Web px / line height | Android sp |
|---|---|---|
| Display | 52 / 1.02 | 36 |
| H1 page | 40 / 1.08 | 30 |
| H2 section (question) | 34 / 1.1 | 26 |
| H3 | 24 / 1.2 | 20 |
| Big number | 30 (tiles) / 40 (risk card) | 26 / 32 |
| Lead | 21 / 1.4 | 18 |
| Body | 17 / 1.55 | 16 |
| Small | 15 / 1.45 | 14 |
| Caption | 14 / 1.4 (13 minimum anywhere) | 13 |

### 3.4 Space, radius, elevation

- **Spacing:** 4-px base, steps 4, 8, 12, 16, 20, 24, 32, 40, 56, 72. Section gap 40 (web) / 24 (app). Page gutters: 32 web, 16 phone.
- **Radii:**

  | Element | Radius |
  |---|---|
  | Buttons, inputs, chips, pills | 999 |
  | Large panels and the hero photo | 24 |
  | Tiles and list cards | 18–20 |
  | Small blocks | 12 |
  | Icon-array cells | 50% (circles) |

- **Elevation:** tone first (`surface-soft` on `ground`), or a 1 px `line` outline. **Never border plus shadow.** The only shadow is on bottom sheets and floating map controls: `0 8px 24px rgba(27,26,23,.12)`.
- **Max content width:** 1200 px. Reading measure: 65 ch.
- **Touch targets:** 44 px web and 48 dp app minimum. Primary buttons are 52 px tall.

### 3.5 Icons and imagery

- **Icons:** inline SVG, 1.5–2 px stroke, round caps, `currentColor`, 16/20/24 sizes. **No emoji, no Unicode glyphs as icons.** Icon-only buttons get an `aria-label`.
- **Photos:** placeholders until real photography exists. Use a `#E7E3DA` block with radius 24 and a white pill caption ("Photo placeholder · developer-provided"). Never fake photos.
- **AI images:** always carry the black "AI-generated" pill label, plus an "Original" toggle that is on by default (`mobile_whatsapp_ai_patterns.md` §3).

## 4. Components (copy these patterns exactly)

The canonical implementation of components 1–9 is `DirectionC.dc.html` on the canvas (a copy sits in the canvas working folder). Copy its markup.

1. **Header (web):** logo mark (forest rounded square with a white plinth line) + "Plinth" wordmark in Bricolage 800 at 23 px. Search pill 48 px tall, radius 999, `line-strong` border. Nav links: Following, Ask, plus a dark "Sign in" pill.
2. **Buttons:**
   - Primary: `accent` fill, white text, 52 px, radius 999, Mukta 600.
   - Secondary: `ink` 1 px outline on white.
   - Tertiary: text link in `accent`.
   - One primary action per screen.
3. **Question tile:** `surface-soft`, radius 20, padding 22, min-height 150. A question line (15 px, `ink-3`), the answer in Bricolage 30 px, then a caption.
4. **Risk chip (S):** pill height 28, band fill background, 1 px band-ink border, mini 5-segment meter (each segment 6×10, 2 px gap), band name in Mukta 600 at 14 px. Used in cards, map pins, compare and chat.
5. **Risk header (M):** 5 × 16×12 meter, band name in Bricolage 30, caption "Delivery risk · low confidence · 14 Oct 2026".
6. **Band scale (L):** 5 pills in a grid. The current band is a 22 px bar in band ink with a 2 px `ink` outline at 3 px offset; the others are 12 px bars in band fill with a band-ink border. Labels sit underneath.
7. **Icon array:** 10×10 circles at 18 px with a 4 px gap. Filled = band ink. Hatched (45°, band ink on band fill) = uncertain range. Empty = `surface-sunk` with a `#8C9199` border. Blocks fill row-major. Always shown next to the sentence "Between X and Y of 100 similar … projects finished more than 12 months after their original RERA date. The rest finished within 12 months." plus a reference-class caption.
8. **Reason item:** outlined card (radius 18): number badge (36 px, `surface-soft`, radius 12), factor group in 14 px muted, a fact sentence, and a source chip link with a document icon.
9. **Developer says block:** 1 px **dashed** `claim-border`, radius 18. Label "Developer says · not yet verified · [date]". Shown next to the green "What would change this" panel.
10. **Disclaimer line:** "Our opinion, based on public records. Not a credit rating. Not issued by any RERA." plus links (Report an error, How we make money). ≥ 14 px; never collapsed.
11. **Fact tile:** `surface-soft`, radius 18; `dt` 14 px muted, `dd` 22 px bold.
12. **Cost table:** a `dl` grid of label and value, values right-aligned, an "All-in" total row above a 1 px `line`, then "17% more than quoted · ₹/sq ft carpet".
13. **Verified-Available badge:** pill with a check icon: "Available · confirmed 12 Oct 2026". The tier shows in a tooltip or sheet; expired = grey "Not reconfirmed since …".
14. **Transferability status:** Ready / Needs documents / Blocked as a pill with a text label (never colour alone), then a checklist with done, missing and not-checked states.
15. **Consent and contact:** "Masked number" pill; a contact sheet listing who will receive the number (max 3) with unticked checkboxes; a "Who has my number" log.
16. **Android:**
    - Navigation bar (64 dp) with 4 tabs: **Explore · Following · Ask · You**.
    - Top app bar.
    - Bottom sheet for map results with peek (112 dp), half and full heights.
    - Sticky bottom action bar on detail screens. No FAB on project screens.
    - Edge-to-edge layout, but never draw a fake status bar.

### 4a. LAYOUT: a guided story, NOT a dashboard (founder feedback, 18 Oct 2026; overrides any bento layout)

The bento grid in `LiveDay.dc.html` felt scattered and dashboard-like. **Keep its instruments, drop its layout.** Pages read like an Apple product page or an Airbnb listing.

1. **One question per full-width section**, in reading order, for example on the project page: Hero → Will it be delivered on time? → How much is built? (scroll story) → What will I really pay? → Picture yourself here → What do the records show? → Ask anything.
2. **Sections are bands, not boxes.**
   - Full-bleed background bands alternate between `t.bg` and `t.track`.
   - Space between sections is 112–144 px on web and 56–72 px on phone.
   - **No bento grids, no mosaics of equal cards, no card-in-grid layouts.** At most ONE contained panel per section (the instrument itself), and borderless where possible.
3. **Section anatomy (web).**
   - A text column (≈ 440–480 px) holds an eyebrow-free question headline (Bricolage 800, 48–56 px), a one-to-two-sentence plain answer (21 px), and one link or button.
   - The instrument column holds a single big instrument.
   - The sides alternate left and right by section. Phone stacks text, then instrument.
4. **At most 1 instrument and 1 short paragraph visible per section.** Details sit behind progressive disclosure ("See the 4 reasons", "Show sources", "Full breakdown") as expanders or drawers.
5. **Hero.**
   - A full-bleed photo (image slot, ≥ 560 px tall on web), with a bottom gradient scrim for legibility.
   - Title in display 56–64 px.
   - **One plain summary line**: "Delivery risk: Elevated · All-in ₹2.74 Cr · 41% built · Original completion Dec 2027".
   - One primary button (Follow) and one secondary (Ask).
6. **A slim sticky action bar.** Web: a floating pill bottom-centre after the hero, with Follow · Ask · Share. Phone: a bottom bar.
7. **Bigger, calmer type.** Body 19 px web / 17 sp phone. Line-height 1.6. Generous whitespace. Fewer chips and pills per screen.
8. **Motion lives inside sections** (needle sweep, slab build, number transitions, scroll story), never as layout chrome.
9. The live data strip becomes one quiet line in the footer or near the risk section, not page chrome.

### 4c. Image slots (AI imagery is generated separately with Nano Banana; do not draw fake photos)

Every photo spot is an EMPTY placeholder element that we swap for a real `<img>` later. Exact form:
`<div data-slot="SLOT_NAME" role="img" aria-label="DESCRIPTION" style="...size/position... background: #E7E3DA; border-radius: ...;"></div>`

- The element must have **no children**. Put captions and scrims in sibling elements layered with absolute positioning.
- Show "Illustrative image" as a small caption pill nearby.
- **Slot names:**

| Slot | Content |
|---|---|
| `heroAurelia` | Aurelia Heights exterior |
| `heroKestrel`, `heroSapphire`, `heroCoral`, `heroLaurel`, `heroJuniper` | Exteriors of the other fictional projects |
| `siteProgress` | Tower under construction with cranes |
| `corridorAerial` | Dwarka Expressway skyline, for the home hero |
| `roomBare` | Empty 3 BHK living room |
| `roomModernIndian`, `roomMinimal`, `roomWarmWood` | `roomBare` staged in each style |
| `cameraSite` | Viewfinder view of a construction hoarding |

### 4b. Live components (interactive, the signature of the product)

| Component | What it does | Spec |
|---|---|---|
| **Riskometer dial** | Semicircle of 5 arcs in band inks; the current arc is 30 px wide at full opacity, the others 20 px at 42%. On mount, the needle sweeps from −90° to the band angle (−72, −36, 0, 36, 72°) over 1.4 s with ease-out | A "Dial / 100 projects" segmented toggle swaps in the icon array. `role="img"` with the full sentence. Copy the `arcs` and `needleStyle` code |
| **3D tower** | 20 slabs stacked in CSS 3D (`perspective: 1000px`; `rotateX(58deg) rotateZ(-42deg)`; slab k at `translateZ(k*9px)`). Built slabs are solid accent; the rest are dashed wireframe; the slab at the sold level gets a 2 px outline in band ink | Slabs fill in with a 45 ms stagger on mount and whenever the data changes. Always paired with Built / Sold / Time-used number tiles (the visual is `aria-hidden`) |
| **Replay slider** | `input type=range` over the QPR quarters. Tower, bars, "band then" chip and an "On record that quarter" line all update | Use the shared `Q` data array (8 quarters, Jun 2023–Jun 2026) |
| **Scroll story** | A pinned panel inside an internal scroll container (`overflow-y: auto`, fixed height about 620 px, `onScroll` computes progress 0–1 and maps it to quarter 0–7). The tower stays pinned while 5 chapter cards scroll past: Registered · Foundations · Sales race ahead · Late filings · Today | Chapter text is factual, with source chips. Provide "Skip story" and a reduced-motion path (the static replay slider) |
| **Live EMI** | Down-payment (10–40%) and interest (7.50–9.75%) sliders, 20-year tenure. Shows EMI and "+1% rate" stress, with `toLocaleString('en-IN')` formatting | Framed as arithmetic, not advice |
| **AI answer** | Prompt chips plus an input. The answer streams word by word (45 ms), then numbered source chips appear | Label: "AI answer · checked against our records before showing". It always discloses that it's AI and offers a human handoff |
| **Voice** | A mic button in the Ask bar and in the app. States: idle → listening (live waveform bars plus partial transcript) → thinking → speaking (the answer streams as text and is read aloud). Card results appear under the text | English-first and understands Hinglish. Shows "Recording only while the mic is on". A tap stops it |
| **Camera identify** | App plus web upload. Two modes: **Scan RERA QR** (on hoardings and brochures) and **Where am I?** (GPS within a project's footprint). The result sheet shows the project, risk chip, truth-panel highlights and Follow | Ask for permission just in time. If nothing matches: "We couldn't match this. Search by name instead." |
| **Picture it furnished** | Before/after `clip-path` compare with a drag slider, style chips with a furnishing budget range, and an "AI-generated preview" label baked into the image | The original shows first. Structure is never altered; "Items are illustrative" |
| **Live strip** | "HARERA synced 2 hours ago · 17,938 orders read · next QPR due 15 Jan 2027" with a static dot (no pulsing) | — |

Motion: purposeful only, meaning needle sweep, slab build, number transitions and streaming text. Honour `prefers-reduced-motion` (in code: no sweep, final state shown). Never bounce or play confetti.

## 5. Fictional data set (use only these; never real developer names with bands)

| Project | Developer (fictional) | Location | Band (confidence) | Key numbers |
|---|---|---|---|---|
| Aurelia Heights, Phase 2 | Northfield Estates | Sector 37D, Dwarka Expressway | **Elevated** (low) | 3 BHK ₹2.35 Cr quoted; all-in ₹2.74 Cr; ₹18,900/sq ft carpet; 1,450 sq ft carpet / 2,000 super (38% loading); 72% sold, 41% built, 77% time used; registered Dec 2022; original completion Dec 2027; 14 complaints (median 3); RERA GGM/673/405/2022/117 |
| Kestrel Park | Orbis Land | Sector 113, Dwarka Expressway | **Low** (high) | 3 BHK ₹2.10 Cr; all-in ₹2.44 Cr; 63% built, 58% time used; registered Nov 2023; original completion Nov 2028 |
| Sapphire Grove, Phase 1 | Meridian Habitat | Sector 106, Dwarka Expressway | **Moderate** (high) | 3 BHK ₹1.95 Cr; all-in ₹2.27 Cr; 48% built, 55% time used; original completion Mar 2028 |
| Coral Towers | Vantage Buildcon | Sector 89, New Gurugram | **High** (low) | 3 BHK ₹1.62 Cr; all-in ₹1.90 Cr; 22% built, 70% time used; 2 extensions |
| Laurel Residency | Elmstone Developers | Sector 92, New Gurugram | **Severe**: red-flag rule (group company admitted to insolvency, NCLT order 12 Mar 2023) | 3 BHK ₹1.48 Cr |
| Juniper Enclave | Halcyon Homes (new developer) | Sector 102, Dwarka Expressway | **Limited history** | 3 BHK ₹2.25 Cr; registered May 2025 |

Additional agreed figures (set during Phase 3; use these everywhere):
- **Kestrel Park:** 1,400 sq ft carpet; ₹17,400/sq ft carpet all-in; 2 complaints in 24 months; Orbis Land had 1 of 9 finished projects late.
- **Sapphire Grove Ph 1:** 1,400 sq ft carpet; ₹16,200/sq ft carpet all-in; 5 complaints; Meridian Habitat had 2 of 11 late.
- **Coral Towers:** 1,240 sq ft carpet; ₹15,300/sq ft carpet; original completion Aug 2028.
- **Juniper Enclave:** original completion Dec 2029; 9% built, 31% of time used.
- **Laurel Residency:** original completion Jun 2026 (already past it); 34% built.
- **Northfield finished projects:** Cedar Walk, Aurelia Heights Ph 1 (late), Wren Court, Opaline Residences, Heron Point Ph 1 (late), Linden Square.
- **Northfield ongoing projects:** Cedar Walk Ph 2 (Moderate), Heron Point Ph 2 (Not scored).
- **High-confidence frequency copy:** "About 10 of 100" (Low) and "About 20 of 100" (Moderate).

Northfield Estates group (fictional): 6 finished RERA projects, 2 got OC more than 12 months late; 9 linked companies; no insolvency found (checked 14 Oct 2026).

Today in all mock-ups is **18 Oct 2026**. Data as of **14 Oct 2026**, model **v1.2**.

### 5b. CANONICAL TIMELINE: the single source of truth for every screen (added 18 Oct 2026 after evaluation)

Today is **18 Oct 2026**. Data is as of **14 Oct 2026**. Model **v1.2**. Every artboard must agree with this list. If a screen needs a fact that is not here, add it here first.

**Aurelia Heights, Phase 2 (Northfield Estates) · RERA GGM/673/405/2022/117**
- **Registered and promised:** registered Dec 2022. Original completion Dec 2027. No extensions so far. Tower A has 20 floors.
- **Quarterly progress (QPR quarter → sold / built / time used):**

  | QPR quarter | Sold | Built | Time used | Notes |
  |---|---|---|---|---|
  | Apr–Jun 2023 | 24% | 6% | 10% | |
  | Oct–Dec 2023 | 38% | 12% | 20% | |
  | Apr–Jun 2024 | 49% | 19% | 30% | |
  | Oct–Dec 2024 | 58% | 26% | 40% | |
  | Apr–Jun 2025 | 64% | 31% | 50% | |
  | Oct–Dec 2025 | 68% | 36% | 60% | |
  | Jan–Mar 2026 | 70% | 38% | 65% | Tower A slab 9 cast |
  | **Apr–Jun 2026** | **72%** | **41%** | 70% | Filed **15 Jul 2026, on time**. Tower A at slab 9. Today = 77% time used |

- **Late QPRs:** 3 of the last 8 quarters (Jul–Sep 2024 to Apr–Jun 2026):
  - Jul–Sep 2024: filed 12 days late.
  - Jan–Mar 2025: filed 41 days late.
  - Oct–Dec 2025: filed 38 days late.

  Earlier quarters were all filed on time. (Corrected 18 Oct; earlier drafts said Apr–Jun 2024 was 41 days late.)
- **Blanket extension:** the MoHUA advisory of 31 Jul 2026 adds 4 months to completion dates on or after 28 Feb 2026. So Aurelia's "more than 12 months late" line = Dec 2027 + 4 months + 12 months = **Apr 2029**.
- **Consent references used in screens:** C-1012-04 (Orbis site visit), C-1012-05 (Larkspur agent of record), C-1015-02 (Meridian Habitat site office, Sapphire Grove visit), C-0902-01 (Meridian price list, ended).
- **Pending public fact (show to buyers NOW):** the Jul–Sep 2026 QPR was due 15 Oct 2026 and is **not on HARERA as of 18 Oct 2026**. Developer says (claim, not verified): "filed on 12 Oct 2026".
- **Band history:**
  - **Moderate** from first scoring until **2 Oct 2026**, then **Elevated** (low confidence) since 2 Oct 2026. The trigger was the Apr–Jun 2026 QPR together with new complaint orders.
  - Replays and timelines must NOT show Elevated before 2 Oct 2026.
- **Pending band change:** a private 7-day notice went to Northfield on 18 Oct 2026. Elevated → High would take effect **25 Oct 2026** if the Jul–Sep QPR is still missing. Buyers see the missing-QPR fact now; the band change waits for the notice.
- **Complaints:** 14 decided against the promoter in the last 24 months (median for similar projects: 3). The latest order is dated **9 Oct 2026**. Normalised: 2.8 per 100 units (500 units).
- **Cost sheet (dated 2 Oct 2026, 3 BHK, 1,450 sq ft carpet / 2,000 super):**

  | Item | Amount |
  |---|---|
  | Base | ₹2.35 Cr |
  | PLC (park-facing) | ₹2.9 L |
  | Club | ₹1.5 L |
  | Parking | ₹3.5 L |
  | IFMS | ₹1.3 L |
  | **Charges total** | **₹9.2 L** |
  | GST 5% | ₹12.2 L |
  | Stamp duty + registration | ₹17.6 L |
  | **All-in** | **₹2.74 Cr** (₹18,900/sq ft carpet) |

  Often negotiable: PLC and club (₹4.4 L).
- **Configurations:** 3 BHK, 1,450 sq ft carpet, from ₹2.35 Cr. 4 BHK, 2,100 sq ft carpet, from ₹3.38 Cr. Towers A–C. 500 units.
- **Payment plan:** construction-linked. **Demand letter dated 10 Oct 2026 for "Tower A slab 12"**, while the latest QPR shows slab 9. This is the Pay-as-built example.
- **Homes, price list and payment stages (added 18 Oct 2026, buyer fix pass; "From the developer" unless marked):**
  - Room sizes (brochure plan, 2 Oct 2026). 3 BHK: living + dining 22′ × 13′, master 14′ × 14′ with dress and toilet, bedroom 2 12′ × 14′, bedroom 3 12′ × 12′, kitchen 10′ × 11′, utility 12′ × 8′, 3 toilets, balcony 22′ × 5′. 4 BHK: living + dining 27′ × 15′, master 14′ × 16′, bedrooms 13′ × 15′, 13′ × 13′ and 12′ × 14′, kitchen 9′ × 12′, utility, store, 4 toilets. Super area is known for the 3 BHK only (2,000 sq ft); there is no 4 BHK cost sheet, so no 4 BHK all-in.
  - Amenities: clubhouse with pool and gym; central park (park-facing homes pay the PLC); covered parking on two basement levels; power back-up for lifts and common areas.
  - Getting around (Plinth estimate, road distance, Oct 2026): Dwarka Expressway 0.8 km; Cyber City 18 km, 35–55 min at 9 am; IGI Airport T3 22 km, 30–45 min; 3 schools within 3 km; no metro within 5 km.
  - Price list dated 2 Oct 2026: 3 BHK from ₹2.35 Cr (₹16,207/sq ft carpet), 4 BHK from ₹3.38 Cr (₹16,095/sq ft carpet). Earlier lists: 1 Apr 2026 ₹2.24 Cr / ₹3.22 Cr; 1 Jul 2025 ₹2.03 Cr / ₹2.92 Cr; launch, Jan 2023 ₹1.58 Cr / ₹2.27 Cr.
  - Stages: booking 10% · registered agreement (within 45 days) 10% · foundation 10% · slabs 3, 6, 9, 12, 15, 18 and 20 (top) 7.5% each · brickwork and plaster 7.5% · flooring and finishing 5% · offer of possession 5%. On record today: foundation and slabs up to 9, so a buyer booking now pays 52.5% by registration.
  - **RERA collection account (Records show, HARERA registration, checked 14 Oct 2026):** Aurelia Heights Ph 2 RERA Collection Account, Northfield Estates Pvt Ltd, Peepal Bank, Golf Course Road, Gurugram, account ending 4417 (full 50200071824417), IFSC PEPL0000418. The "Before you pay" mismatch example is a WhatsApp message naming Northfield Realty Services LLP, account 919020045118082, IFSC MRGL0000912 (Marigold Bank).
  - 10% cap example: 10% of ₹2.44 Cr (base plus charges) = ₹24.4 L. EOI example ₹11,00,000, receipt dated 18 Oct 2026, UTR ending 7731.
  - Afford-the-wait defaults: take-home ₹4,50,000 a month, rent ₹55,000, 20% down, 8.50%, 20 years. Rent + pre-EMI ₹1,18,077 now, ₹2,00,563 by Dec 2027; a 12-month delay costs ₹24.1 L, 24 months ₹48.1 L. Full EMI after keys ₹1,90,227.
- **Visit pass:** Sat 24 Oct 2026, 11 am, sales gallery. Code 4821.
- **Claims vs records example:** a broker flyer says "Possession Dec 2026 · ₹11,999/sq ft all-inclusive". Records: original RERA completion Dec 2027, 41% built, all-in ₹18,900/sq ft carpet.
  - **The sample broker flyer** (`brokerFlyer`; WebClaims, WaClaims, AppClaims), top to bottom. Headline "AURELIA HEIGHTS · PHASE 2" (not a claim). It makes 7 claims, and **4 of 7 differ from the records**:
    - "POSSESSION DEC 2026" · Differs: original completion Dec 2027, no extensions, 41% built.
    - "Structure up to 12th floor" · Can't check: slab 9 at the Apr–Jun 2026 QPR; the Jul–Sep QPR is not on HARERA (Developer says "filed 12 Oct 2026", not verified).
    - "ONLY 20 FLATS LEFT" (sticker) · Differs: 72% of 500 units booked at the last filing, so about 140 unbooked.
    - "₹11,999/sq ft ALL-INCLUSIVE*" · Differs: all-in ₹18,900/sq ft carpet; the base alone is ₹11,750/sq ft super; the flyer's fine print says "Stamp duty and registration extra."
    - "3 BHK · 2,000 SQ FT" · Differs: 1,450 sq ft carpet as registered; 2,000 is the super area.
    - "40,000 sq ft clubhouse" (amenity caption) · Not in records.
    - "RERA No. GGM/673/405/2022/117" (fine print) · Matches.
    - Not claims: the captions "Infinity pool", "Gym", "Central park" and the fine print "*Images are artistic impressions. Conditions apply."
  - **The sample hoarding** (`hoardingClaim`; AppClaims camera, WebClaims): "AURELIA HEIGHTS · PHASE 2 · POSSESSION DEC 2026" · Differs; "3 BHK FROM ₹2.35 CR*" · Matches the developer's price list of 2 Oct 2026 (all-in ₹2.74 Cr); "RERA No. GGM/673/405/2022/117" · Matches. **1 of 3 differs.**

**Other projects:**
- **Kestrel Park:** the Jul–Sep 2026 QPR was filed on time on 12 Oct 2026.
- **Sapphire Grove Ph 1:** the Apr–Jun 2026 QPR was filed 27 Jul 2026, 12 days late.
- **Coral Towers:**
  - Original completion Aug 2028.
  - Extension 1 (Jan 2026) moved it to Feb 2029.
  - **Extension 2 was granted 14 Oct 2026** and moved it to Aug 2029.
- **Laurel Residency:** Severe. A red-flag rule applies (a group company was admitted to insolvency by NCLT order on 12 Mar 2023). It is past its original date of Jun 2026 and stalled: no QPR progress for 4 quarters (34% built in each QPR from Jul–Sep 2025 to Apr–Jun 2026; 106% of the promised time used today). 3 BHK quoted ₹1.48 Cr; no cost sheet, so no all-in.
- **Juniper Enclave:** Limited history (new developer). Registered May 2025; original completion Dec 2029; 9% built, 31% of time used; 3 BHK quoted ₹2.25 Cr, no all-in.
- **Heron Point, Phase 2 (Not scored):** Heronstone Projects, a Northfield Estates group company. Sector 104, Dwarka Expressway. RERA GGM/902/634/2026/12. Registered Apr 2026 (less than 6 months ago); original completion Apr 2031. No price list or cost sheet with us. This is the "just registered" example on the hard-state page.

**Who has my number (buyer "Rohan"; identical on web and app):**

| Party | Detail | Pays us? |
|---|---|---|
| Orbis Land site office | Kestrel Park site visit, shared 12 Oct 2026, consent C-1012-04, access until 11 Nov 2026 | Developer · pays us nothing |
| Larkspur Realty | Your agent of record for Kestrel Park (you added them; shared by your tap after the visit, 12 Oct 2026) | Agent · paid by the developer or you, never by Plinth |
| Meridian Habitat site office | Sapphire Grove Ph 1 site visit, shared 15 Oct 2026, consent C-1015-02, access until 14 Nov 2026 | Developer · pays us nothing |
| Meridian Habitat sales office | Price list, Sep 2026 | **Ended** |

Count: **3 parties can reach you**.

**Copy rule:** your number is **never shared without your tap**. The relay stays alive while a deal is active.

**Loans are R2 (PRD F-13, decided 18 Oct 2026).** No R1 screen shows a lender party, a loan referral or a lender fee as live. Loan copy in R1: "Loan checks arrive in 2027". Pro is sold as "12 months of written updates", not "alerts": alerts are always free.

**Consent references:** always `C-MMDD-NN` (for example C-1012-04). Never use any other format. A visit consent (e.g. Rohan's C-1018-11) covers the first name, the visit time and only the questions the buyer chooses to send ahead. Rohan booked the Aurelia visit at 9:15 am on 18 Oct 2026 on every surface.

**Developer workspace (Northfield Estates; added 18 Oct 2026):**
- **Heads-up:** sent 30 Sep 2026 for the 2 Oct Moderate → Elevated change, 48 hours before buyers saw it.
- **Pending notice:** Elevated → High, effective 25 Oct 2026 unless the Jul–Sep QPR is on record before then. The missing QPR is already a public fact.
- **Team (fictional):** Ananya Rao (Admin, authorised signatory) · Vikram Sethi (Sales) · Neha Kapoor (Compliance) · Arjun Mehta (Marketing) · Pradeep Yadav (Site, Sector 37D sales gallery).
- **Inbox:**

  | Buyer | Record | Agent | Consent |
  |---|---|---|---|
  | Rohan | Aurelia visit, Sat 24 Oct, 11 am, code 4821 | none | C-1018-11 |
  | Aman | Aurelia visit, Sat 24 Oct, 3 pm, code 5190 | — | C-1017-03 |
  | Nisha | Cedar Walk Ph 2 visit, Sun 25 Oct, 4 pm, code 3376 | Bluegate Homes | C-1017-05 |
  | Ishita | 3 BHK price-list enquiry, 17 Oct | Larkspur Realty | C-1017-06 |
  | Farah | Cedar Walk payment-plan enquiry, 16 Oct | — | C-1016-04 |
  | Kabir | Visited 16 Oct; shared his number by his own tap | — | C-1016-08 |
  | Dev | 4 BHK enquiry, 15 Oct; replied 16 Oct | — | C-1015-07 |

- **Disputes:**
  - CL-201 (6 Oct, "Tower A shown with 21 floors"): fixed 7 Oct, our error.
  - D-118: the Apr–Jun 2026 QPR was marked late; upheld, because it was filed 15 Jul, on time.
  - Quota: 6 disputes per scored phase, so 12 for Northfield.
- **Developer reply** published 15 Oct 2026; Plinth checks it by 5 Nov.
- **Live Record:**
  - Short link `plinth.in/r/AH2`.
  - Placement codes AH2-H1 (hoarding), AH2-B3 (brochure) and AH2-W (website), with 214, 61 and 138 scans in October.
  - Brand-use terms accepted 2 Sep 2026.
- **Aurelia price history (3 BHK / 4 BHK):**
  - Launch, Jan 2023: ₹1.58 / 2.27 Cr
  - 1 Jul 2025: ₹2.03 / 2.92 Cr
  - 1 Apr 2026: ₹2.24 / 3.22 Cr
  - 2 Oct 2026: ₹2.35 / 3.38 Cr

  The Cedar Walk Ph 2 price list is dated 12 Jun 2026.

**Project pages, round 2 (added 18 Oct 2026, fix-project2; buyer gaps G-08 to G-41):**
- **Aurelia, progress by tower (Records show, from the QPRs).** Towers A, B and C have 20 floors each. Northfield's QPRs give slabs by tower from Oct–Dec 2024; earlier QPRs report Phase 2 as a whole.

  | QPR quarter | Tower A | Tower B | Tower C |
  |---|---|---|---|
  | Apr–Jun 2023 to Apr–Jun 2024 | phase only | phase only | phase only |
  | Oct–Dec 2024 | slab 4 | slab 3 | slab 1 |
  | Apr–Jun 2025 | slab 6 | slab 4 | slab 2 |
  | Oct–Dec 2025 | slab 8 | slab 6 | slab 4 |
  | Jan–Mar 2026 | slab 9 | slab 6 | slab 4 |
  | Apr–Jun 2026 | slab 9 | slab 7 | slab 5 |

  Slab stages in the payment plan follow the buyer's tower. Booking today, due by registration: Tower A 52.5% (slabs 3, 6 and 9 on record), Tower B 45% (slabs 3 and 6), Tower C 37.5% (slab 3). The 10 Oct 2026 demand is for Tower A slab 12.
- **Late line:** on every Aurelia screen, "more than 12 months late" means an OC **after Apr 2029** (see Blanket extension). "After Dec 2028" is wrong.
- **Confidence copy:** the band name never carries "low confidence". A separate line reads "We're less certain about this one: Northfield has only 6 finished RERA projects to learn from, so we show a range, not one number." Limited history reads "Not enough history to score", never "too early to score".
- **Gurugram base rate** (the WebAbout backtest; illustrative until the first published backtest): 76 of 212 past Gurugram projects got their OC more than 12 months late, about **36 of 100**. Low and Moderate sit below it, Elevated around it, High and Severe above it.
- **Lower band nearby** (published rule: same corridor, lower band, all-in within 20%): for Aurelia, Kestrel Park (Low, ₹2.44 Cr all-in) and Sapphire Grove, Phase 1 (Moderate, ₹2.27 Cr). Nobody pays to appear.
- **Reported waterlogging, Sector 37D** (news reports; reported, not verified): the Dwarka Expressway service road at the Sector 37D turn, news report of 28 Jul 2026; the Sector 37C–37D dividing road, news report of 21 Aug 2025. No report names the Aurelia site itself.
- **Northfield before RERA** (court orders and news; never counted in a band; coverage may be incomplete, as there was no public register of promised dates before May 2017):
  - Northfield Greens, Sector 52: promised Dec 2011, OC Mar 2014, about 27 months late. Haryana State Consumer Commission order, Aug 2015 (delay compensation for 38 buyers); news report, Feb 2013.
  - Alder Court, Sector 49: promised Jun 2013, OC Sep 2013 (DTCP OC record); news report, Oct 2013.
  - Larch Enclave, Sector 21 (2004): no court order or news found. Absence is not proof.
- **Lenders** (Developer says, brochure of 2 Oct 2026, not verified): "approved by major banks". No lender is named on R1 screens (see "Loans are R2"); buyers are told to ask their own bank, in writing, whether it has approved the project.
- **Transfer before possession** (From the developer, transfer policy of 2 Oct 2026, not verified): ₹150 per sq ft of super area, so ₹3.0 L on the 2,000 sq ft 3 BHK; all dues to date paid first; no transfer before the agreement for sale is registered.
- **Later features, as buyers see them:** loans use the R1 copy "Loan checks arrive in 2027" (see "Loans are R2"); resale and transfer checks R2, planned for Apr–Jun 2027; help at possession (OC, final demand, delay interest) R3, planned for Jul–Sep 2027 (both as on WebAbout).
- **Sapphire Grove Ph 1, re-scoring example:** the Jul–Sep 2026 QPR was filed 15 Oct 2026 (on time), appeared on HARERA 16 Oct 2026, and was fetched 16 Oct 2026 at 7:40 pm. The re-score is due by 19 Oct 2026, 7:40 pm (72 hours). Until then the page shows Moderate from the Apr–Jun 2026 QPR and no figures from the new filing.
- **Coral Towers, stale-data example:** the newest QPR on HARERA is Jan–Mar 2026, filed 14 Apr 2026 (22% built). On 18 Oct 2026 that is 187 days old, past the 120-day stale line. The Apr–Jun 2026 (due 15 Jul) and Jul–Sep 2026 (due 15 Oct) QPRs are not on HARERA. Its orders are fresh (Extension 2, 14 Oct 2026).
- **Claim status on project pages** (fix-dev2 G20): every Gurugram developer in scope got the S1 invitation on 24 Nov 2025. Claimed: Northfield Estates (2 Dec 2025, which covers Heronstone Projects), Halcyon Homes, Meridian Habitat. Not yet claimed: Elmstone Developers and Vantage Buildcon, shown as "invited 24 Nov 2025 · not yet claimed". A claimed page reads "claimed developer page, replies here".
- **Facts-only example** (as WebDeveloper's `mode = Facts-only`): Aurelia Heights Ph 2 shows "Band withheld pending review, from 18 Oct 2026", with the line "We're not showing a band for this project while a court considers an application about our bands for the Northfield Estates group." The band, its reasons and the "of 100" figure are withheld; sourced facts stay. This is a design state, not a current fact: today Aurelia is scored (Elevated).
- **Complaint rate:** wherever Aurelia's complaints appear, the count carries the rate: "14 complaints · 2.8 per 100 units" (500 units). "Median 3" is a median count.

**Agents (broker layer; added 18 Oct 2026; the agent-number format is a placeholder to confirm):**
- **Larkspur Realty** (principal Priya Khanna):
  - RC/REA/HARERA/GGM/2023/487, valid to 21 Jun 2028, office in Sector 102.
  - Verified since 6 Apr 2026; badge held since 1 Sep 2026; 17 verified reviews.
  - Closings: Cobalt Square 2 BHK on 14 Jul 2026 (found on Plinth; Plinth's 20% share ₹31,000). Larchwood Residency 3 BHK on 28 Aug 2026 (desk deal: 1% of ₹2.24 Cr; Larkspur 75% = ₹1,68,000; paid 3 Sep).
- **Other agents:**
  - Kabir Malhotra (individual): GGM/2024/1187, verified 18 Oct 2026.
  - Arora Estates: GGM/2026/1342. Mandate on Amberwood Greens T4-902 (3 BHK, 1,210 sq ft carpet, ₹2.45 Cr), owner OTP 18 Oct 2026, valid to 16 Jan 2027.
  - Bluegate Homes: GGM/2022/233, not a partner.
  - Northgate Realtors: registration ended 30 Jun 2026.
  - Meadowline Realty: UP RERA.
- **Larkspur's briefs:**
  - Ishita, Aurelia: C-1017-09.
  - Rohan, Kestrel: C-1012-04/05.
  - Meera, Cobalt Square: C-1007-04; visit 9 Oct, window to 8 Dec 2026.
  - Tanvi, Sapphire Grove: C-1002-02; ended 14 Oct 2026.
- **Resale societies (fictional):**
  - Amberwood Greens (66), Wrenfield Towers (65), Palisade Court (62), Saffron Crest (70A).
  - Cobalt Square (104), Larchwood Residency (109).
  - Marigold Enclave (82), Hollybrook Residency (49).
- **Split rules v1 are a draft** (founder, lawyer and CA to confirm). No broker money flows before counsel signs off and Plinth is HARERA-registered.

**Developer onboarding and capture (added 18 Oct 2026):**
- **Ashgrove Realty / Ashgrove Meadows Ph 1:** invited 16 Oct 2026, not yet claimed (the onboarding example).
- **Northfield:** invited 24 Nov 2025, claimed 2 Dec 2025.
- **Complaint rate:** Northfield group, 24 complaints in 24 months = 0.7 per 100 units. Aurelia: 14 complaints = 2.8 per 100 units. Always show the count and the rate together.
- **Cedar Walk Ph 3:** a private draft, not registered.
- **Formal-notice intake:** LN-031, SLA 48 h / 5 / 15 working days. **Buyer signals:** k ≥ 20.

**Site-visit co-pilot and Pay-as-built (added 18 Oct 2026, B3: F-91, F-92, F-94 on WhatsApp; screens AppVisitPass, WaVisitPass, WebPayAsBuilt, AppPayAsBuilt, WaBeforePay):**
- **Rohan's visit pass, 5 questions from the records** (record line → question; source):
  - Latest QPR shows Tower A at slab 9 → "Can I see slab 9, and the floor you're casting now?" (QPR Apr–Jun 2026)
  - The Jul–Sep QPR was due 15 Oct and isn't on HARERA → "Can I see the HARERA receipt for the Jul–Sep 2026 QPR?" (QPR register, 18 Oct 2026) · **sent ahead**
  - HARERA lists one collection account for Phase 2 → "Can you give me the RERA collection account in writing?" (HARERA registration)
  - Original completion Dec 2027, 41% built → "Which completion date will my agreement carry?" (registration; QPR Apr–Jun 2026)
  - The cost sheet adds ₹9.2 L in charges → "Which charges on the cost sheet are optional?" (cost sheet, 2 Oct 2026) · **sent ahead**
  - The two "sent ahead" questions are the ones WebDevInbox shows on Rohan's record (same consent, C-1018-11). Agent of record: none. Pass copy: "You don't have to give your number at the gate."
- **Visit messages:** booked 18 Oct 2026, 9:15 am (as WebDevInbox). Reminders Fri 23 Oct 6 pm and Sat 24 Oct 9 am. Recap prompt Sat 24 Oct 2 pm (2 hours after the slot ends).
- **Visit-day frames (illustrative, Sat 24 Oct 2026)** assume no new filing since 18 Oct: the Jul–Sep QPR is still not on HARERA and the band is still Elevated (the pending change is 25 Oct). App: "Where am I?" check-in 10:52 am; photo checklist of 5 (RERA board, Tower A from the gate, sample flat, the cost sheet they hand over, bank details on the booking form); recap recorded 12:25 pm, 1 min 12 s, audio deleted after transcription. WhatsApp: voice note 2:04 pm.
- **Recap check ("They said / Records show", 5 items):** possession Dec 2026 → **Differs** (original completion Dec 2027, no extensions, 41% built) · Tower A at slab 12 → **Can't check yet** (slab 9 at the last filing) · Jul–Sep QPR filed 12 Oct → **Can't check yet** (not on HARERA; same as the developer's public claim) · 3 BHK from ₹2.35 Cr → **Matches** the developer's price list of 2 Oct 2026 (label "Price list shows"; all-in ₹2.74 Cr) · PLC and club waived if booked this week → **Not in records** (an offer: get it in writing; PLC + club = ₹4.4 L). Headline: "1 of 5 things they told you differs from the records." Saved privately as "Developer says · sales office · unverified · 24 Oct 2026"; never published, never moves the band.
- **Pay-as-built example allottee:** Kavya Nair (fictional; not the Meera of the broker and family examples), unit A-1104 (Tower A, floor 11), 3 BHK, 1,450 sq ft carpet. Booked at launch (Jan 2023); agreement for sale registered Feb 2023; price ₹1,67,20,000 (base ₹1,58,00,000 + charges ₹9,20,000). Paid to date (booking, agreement, foundation, slabs 3, 6, 9): 52.5% = ₹87,78,000 plus GST.
- **The demand letter:** ref NE/AH2/A-1104/12, dated 10 Oct 2026, "On casting of Tower A slab 12". Instalment 7.5% = ₹12,54,000; GST 5% = ₹62,700; total ₹13,16,700; due by 30 Oct 2026; pay to the Aurelia Heights Ph 2 RERA Collection Account (Peepal Bank, ending 4417). Check: stage **Can't check yet** (the latest filing, as of 30 Jun 2026, shows Tower A at slab 9, 3 slabs below); plan, amount and payee **Match**. Headline: "The latest filing shows slab 9. This letter asks for the slab 12 instalment." Actions: ask for the architect's or engineer's certificate; write to Northfield (a draft the buyer copies and sends); pay on time if the stage is reached (RERA s.19(6); interest for delay, s.19(7)). Never "don't pay".
- **Before you pay on WhatsApp:** the forwarded payment request (18 Oct 2026, 10:14 am) asks for the EOI of ₹11,00,000 to Northfield Realty Services LLP, A/c 919020045118082, IFSC MRGL0000912, Marigold Bank: 0 of 3 match (shown as "ending 8082" vs "ending 4417"). ₹11,00,000 is within the ₹24.4 L limit before a registered agreement. The booking-form case matches 3 of 3.

**Discovery, cost and Ask Plinth (added 18 Oct 2026, fix-tools2; buyer gaps G-21 to G-39):**
- **Price display:** all-in first, quoted second, on every card, list row and compare cell: "₹2.74 Cr all-in · quoted ₹2.35 Cr". Map pins show the all-in alone ("₹2.74 Cr") under a legend "Pins show all-in prices". With no cost sheet: "Quoted ₹2.25 Cr · all-in not known yet" (Juniper; Laurel ₹1.48 Cr). Heron Point Ph 2: "No price list with us".
- **Homes, size and units in the other projects** (From the developer, price lists of Oct 2026, not verified; super areas from cost sheets):

  | Project | Configurations (carpet, from) | 3 BHK super | Loading | Units |
  |---|---|---|---|---|
  | Aurelia Ph 2 | 3 BHK 1,450 sq ft from ₹2.35 Cr · 4 BHK 2,100 sq ft from ₹3.38 Cr | 2,000 | 38% | 500 |
  | Kestrel Park | 2 BHK 1,050 sq ft from ₹1.58 Cr · 3 BHK 1,400 sq ft from ₹2.10 Cr | 1,880 | 34% | 420 |
  | Sapphire Grove Ph 1 | 3 BHK 1,400 sq ft from ₹1.95 Cr · 3 BHK + study 1,620 sq ft from ₹2.26 Cr | 1,960 | 40% | 360 |
  | Coral Towers | 2 BHK 980 sq ft from ₹1.28 Cr · 3 BHK 1,240 sq ft from ₹1.62 Cr | 1,750 | 41% | 640 |
  | Juniper Enclave | 3 BHK, carpet not in our records yet, quoted ₹2.25 Cr | — | — | 280 |

  Aurelia is the only Dwarka Expressway project here with a 4 BHK (the WebSearch zero-results example).
- **Complaints, count and rate together** (24 months, decided against the promoter): Aurelia 14 · 2.8 per 100 units; Kestrel Park 2 · 0.5 per 100 units; Sapphire Grove Ph 1 5 · 1.4 per 100 units; similar projects' median 3. Coral Towers and Juniper: not in our records yet.
- **Getting around** (Plinth estimate, road distance, Oct 2026; Cyber City at 9 am · IGI Airport T3): Aurelia 18 km, 35–55 min · 22 km, 30–45 min. Kestrel Park 19 km, 35–50 min · 13 km, 20–30 min. Sapphire Grove Ph 1 20 km, 40–60 min · 16 km, 25–40 min. Coral Towers 24 km, 45–70 min · 27 km, 40–60 min. Juniper Enclave 19 km, 40–55 min · 15 km, 25–35 min.
- **Facts-only state in search and compare** (pairs with WebDeveloper `mode = Facts-only`): Northfield projects show a neutral chip "Band withheld · facts only" (no risk colour, no meter fill) and the link "Facts only: see why" to the explainer (`#facts-only`). They stay in risk-filtered results, listed with Not scored projects, never hidden.
- **Request a project:** any Gurugram project with a RERA number. Plinth adds it within 14 days or says why not, in writing. A request made 18 Oct 2026 reads "We'll add it by 1 Nov 2026 or tell you why not." Reference format `R-MMDD-NN`; the example is R-1018-07 for "Indigo Terraces, Sector 79", a fictional project not in our records. Published reasons for "not": no RERA registration, outside Gurugram, registration lapsed.
- **Coverage:** Gurugram today. Golf Course Ext Rd planned for Dec 2026 (Notify me). Noida and Greater Noida West: R3, planned for Jul–Sep 2027, with a waitlist that sends one WhatsApp message when it opens and nothing else. Answers never guess about places we don't cover.
- **Ask Plinth** is the AI's only name on every surface. Disclosure line: "Ask Plinth is an AI. It answers from public records like HARERA and shows its sources." The human handoff is "Talk to a Plinth adviser · paid by you, never by developers" (WhatsApp button: "Talk to an adviser"): free to ask, Mon–Sat 10 am–7 pm, usually within 4 working hours; advisers explain records and don't sell, book or negotiate.
- **Ask Plinth edge answers:**
  - "Should I buy?": never yes or no. "I can't tell you whether to buy. That's your call, and no developer pays us to steer it. Here's how to decide:" then four checks: can you carry a 12–24-month delay (Afford the wait); read the 4 reasons and what would change the band; look at the lower-band projects nearby (Kestrel Park, Sapphire Grove Ph 1); before paying anything, check the payee against the RERA collection account (Before you pay).
  - Unknown project: "I can't find Indigo Terraces in our records. If it has a Gurugram RERA number, we'll add it by 1 Nov 2026 or tell you why not." Action: "Request it".
  - Outside coverage: "We don't cover Noida yet, so I won't guess. Plinth covers Gurugram today. Noida and Greater Noida West are planned for Jul–Sep 2027." Action: "Join the Noida waitlist".
  - HARERA unreachable (example state): "HARERA's website hasn't answered since 7:10 am today. This answer uses our last full read, 17 Oct 2026, 11:40 pm. We retry every 30 minutes." Sources keep their dates; nothing is shown as fresh.
  - Offline (app): "You're offline, so I can't check records. Saved on this phone: Aurelia Heights Ph 2 and Kestrel Park, as of 14 Oct 2026. I'll send your question when you're back."
- **Before you negotiate (Aurelia):**
  - Channel partners: some pass part of their commission back to the buyer as a discount. Plinth can't, and never will: no developer money reaches us (D1). Going direct, ask the developer for the same discount.
  - EDC and IDC: inside the base price on the 2 Oct 2026 cost sheet; the amount isn't shown. The draft agreement for sale (From the developer, 2 Oct 2026, not verified) lets Northfield bill each buyer a share of any later government increase, by super area.
  - Get in writing, in the agreement for sale or a signed addendum (not a WhatsApp message or a side letter): the final price; any PLC or club waiver; the EDC/IDC amount inside the base and who pays an increase; the payment stages for your tower; your parking slot; the RERA completion date, Dec 2027.
- **Move-in number (Aurelia 3 BHK; Plinth estimate, not on the cost sheet; paid around the offer of possession):** maintenance advance, 24 months × ₹5 per sq ft super × 2,000 sq ft plus 18% GST, ₹2.8 L; IFMS already in the all-in (₹1.3 L), so ₹0 more; utility connections and deposits (electricity meter and load, water and sewer, piped gas) ₹0.9–1.4 L; fit-outs (kitchen, wardrobes, lights, fans, ACs, curtains) ₹8–14 L, your choice. **About ₹12–18 L on top of the ₹2.74 Cr all-in.**
- **Cost-sheet photo in the app:** the Aurelia 3 BHK cost sheet of 2 Oct 2026, 2 pages, photographed 18 Oct 2026; lines as in the cost sheet above. Tags match WebCostSheet and WaCost: "Often negotiable" on PLC (₹2.9 L) and club (₹1.5 L); "Set by law" on GST, stamp duty and registration; EDC and IDC "Included in the base"; IFMS "Refundable deposit". Retention, one rule everywhere: "We keep this file for 30 days, then delete it, unless you save it to your account."
- **Relay lifetime (D13):** "The relay stays alive while a deal is active, and ends 30 days after your last message unless you renew." A deal is active from your first visit to registration.
- **Rohan's consent history (AppYou, WebPrivacy):** 18 Oct 2026 C-1018-11, Aurelia visit Sat 24 Oct, 11 am, code 4821: the site office gets your first name and a relay number, not your number. 15 Oct 2026 C-1015-02, Meridian Habitat site office (Sapphire Grove Ph 1 visit): number shared, until 14 Nov 2026. 12 Oct 2026 C-1012-05, Larkspur Realty, agent of record for Kestrel Park: number shared by your tap after the visit. 12 Oct 2026 C-1012-04, Orbis Land site office (Kestrel Park visit): number shared, until 11 Nov 2026. 2 Sep 2026 C-0902-01, Meridian Habitat sales office (price list): ended 2 Oct 2026. The count stays **3 parties can reach you** (a relay doesn't count).
- **Download my data:** one ZIP with a readable PDF and a JSON file (follows, alerts, saved cost sheets, questions to Ask Plinth, consent history, who had your number). Ready within 24 hours; the link works for 7 days and opens only after your sign-in code.
- **Money lines (WebHome, AppYou):** Pro "₹999 per project · 12 months of written updates" (alerts always free); loans "Loan checks arrive in 2027" (no lender pays us in R1); agents "a published fee split, only when you choose them"; never from developers.
- **Share cards:** English, at most 3 short lines plus a source-and-date line; no acronym without its meaning ("QPR, the quarterly progress report"); a band always with its natural frequency; ends "Plinth · No developer pays us. Ever."
- **Visualise:** under construction → start from the brochure floor plan (slot `floorPlan3bhk`; 3 BHK living + dining 22′ × 13′) or your own photo of the sample flat. Bare-room staging from your own photo stays for ready and resale flats. Every staged image carries "AI-generated illustration".

**Following, digest and family (added 18 Oct 2026):**
- **Rohan's follows:** he has followed 4 projects since 1 Jul 2026. Last look was 14 Oct 2026 at 8:40 am, so 5 changes are unread.
- **Sapphire Grove Ph 1 price list, 16 Oct 2026:** 3 BHK ₹1.89 Cr → ₹1.95 Cr (all-in ≈ ₹2.27 Cr). Kestrel's Jul–Sep QPR: built 59% → 63%. Aurelia complaints: 13 → 14.
- **Family circle:**
  - Meera joined 6 Oct 2026, with the same alerts on all 4 projects and the right to add notes.
  - Meera's father was invited 18 Oct 2026 to Aurelia Heights Ph 2.
  - Invite links: `plinth.in/j/AH2-7KQ` (Aurelia) and `plinth.in/j/RC4-2MW` (all 4). Each link works for one person for 7 days (to 25 Oct) and carries no phone number. The relative's own WhatsApp "JOIN AH2-7KQ" is the opt-in.
  - Payment alerts, follow type, cost sheets, visit passes and "who has my number" stay private to Rohan.
- **Weekly digest:** Sundays at 9 am. Rohan chose weekly, and the next digest is Sun 25 Oct. Rohan's WhatsApp alerts and digest are ON on every surface.
- **Old card example:** data as of 26 Jun 2026, model v1.1, showing Moderate.
- **Shared shortlist:** Kestrel Park, Sapphire Grove Ph 1 and Aurelia Heights Ph 2, with dated notes from 12–17 Oct.

**Engineering fixture decisions (19 Oct 2026):**
- **Kestrel Park:** registered Nov 2023, original completion **Nov 2028** (was Jun 2027, which implied registration in Nov 2025 and contradicted 63% built).
- **Laurel Residency:** registered Nov 2020.
- **Heron Point Ph 2:** registered 28 Apr 2026.
- **Afford the wait:** the all-in is rounded to the nearest lakh (₹2,74,00,000) before any calculation.
- **Clock:** fixtures freeze it at 18 Oct 2026, 12:00 IST.
- **Consent refs:** displayed as `C-MMDD-NN`. Stored as year + display ref + a sequence; the sequence widens past 99 in display ("C-1018-104").
- **Relay in R1:** a WhatsApp text relay. A call-masking vendor is decided at M5.

## 6. Copy rules (short form)

- Headings are questions. Sentences are ≤ 20 words. One fact per sentence, number first.
- Verbs: *shows, filed, granted, extended, decided, admitted*. No judgement adjectives.
- Probabilities are natural frequencies ("Between 30 and 45 of 100…"), never "%" chance and never "1 in X".
- Money: ₹85,000 · ₹95 L · ₹2.35 Cr · ₹1,23,45,678 for exact amounts · ranges in one unit (₹1.8–2.2 Cr) · always "carpet" or "super".
- Dates: "18 Oct 2026", "Apr–Jun 2026".
- AI: disclose it ("I'm Plinth's AI assistant…"), cite sources, offer a human handoff.
- Brand promise line, where relevant: **"No developer pays us. Ever."**

## 7. Canvas artboard format (for anyone writing `.dc.html` files)

- Each artboard is one self-contained file: `<!doctype html>` … `<head>` with `<meta charset>`, `<title>` and EXACTLY `<script src="./support.js"></script>` … `<body><x-dc><helmet>` (Google Fonts `<link>` plus a `<style>` with `body{margin:0}` and `a`/`a:hover` colours only) `</helmet>` markup `</x-dc>`, then `<script type="text/x-dc" data-dc-script data-props='{…"$preview":{"width":W,"height":H}}'>class Component extends DCLogic { renderVals(){ return {…}; } }</script></body></html>`.
- **Inline styles** for everything visual. Close every element and quote every attribute. Never build UI from script; all UI is markup.
- Holes `{{path}}` are dotted lookups only (compute in `renderVals`). Loops: `<sc-for list="{{items}}" as="it" hint-placeholder-count="3">`. Conditionals: `<sc-if value="{{flag}}" hint-placeholder-val="{{true}}">`. Events: `onClick="{{handler}}"`, with the handler returned from `renderVals` and state via `this.setState`.
- **Web screens are PAGES:** fluid root (no px width), `max-width: 1200px` container, `flex-wrap` / `repeat(auto-fit, minmax(min(Npx,100%),1fr))` grids. Canvas entry `"expand":"fill"`, `w` 1280, `h` = the page height.
- **Phone screens are fixed:** root `width: 390px; height: 844px` (or taller for a scrolling capture, e.g. 390×1400), `overflow: hidden`. No fake status bar or keyboard. A 48 px top safe area may be left empty.
- **Accessibility as drawn:** real `<button>`, `<a href>`, `<input>` + `<label>`; `aria-label` on icon-only buttons; decorative SVG `aria-hidden="true"`; text contrast ≥ 4.5:1.
- **Banned:** emoji; gradient washes (functional hatch patterns are fine); left-border accent cards; border + shadow; Inter/Roboto/Arial; ALL-CAPS eyebrows; fake stats; lorem ipsum; `<iframe>`.
- `data-props` tweaks are levers only. Every artboard has a `theme` (Day/Night, default Day) tweak; risk screens also have a `band` tweak. Copy stays literal in the markup.
- **Runtime tips (learned):**
  - Initial state goes in `constructor(props){ super(props); this.state = {...}; }`.
  - Timers start in `componentDidMount` and are cleared in `componentWillUnmount`.
  - Inputs are controlled (`value="{{x}}"` with `onChange="{{onX}}"`, reading `e.target.value`).
  - **No `<form onsubmit>`**; use a `<div>` with a button.
  - Per-item handlers are attached in `renderVals` (`items.map(... pick: () => this.setState(...))`).
  - Style holes like `style="{{x.style}}"` are fine for computed, state-driven or theme values. Interpolated strings like `style="background: {{t.panel}}; color: {{t.ink}}"` also work.
  - In nested `<sc-for>` loops, don't reuse a loop variable name that shadows a top-level value you still need.

## 8. Design critique gate (rulebook §l)

Score every screen 1–5 on 10 criteria:
1. question clarity
2. evidence
3. hierarchy
4. readability
5. accessibility
6. trust and honesty
7. India-fit
8. consistency with this file
9. states
10. delight

Ship at ≥ 40/50, with no score < 3, and evidence, accessibility and trust each ≥ 4.
