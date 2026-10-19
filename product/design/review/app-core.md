# Design review: app-core (Android)

**Screens:** AppExplore, AppMap, AppProject, AppRisk and AppFollowing
**Reviewer:** principal mobile product designer, app-core group
**Date:** 18 Oct 2026
**Rules applied:** DESIGN.md §0 Taste Pass v1 first, then §2–§4c and §7. I also used taste-skill v2: the house rules and laws, the redesign audit, `critique.md` and `tells.md`, with the `motion.md` recipes adapted to the artboard runtime. Material 3 conventions are kept where they help: the 64 dp nav bar, bottom sheets and 48 dp targets.

Following DESIGN.md, I judged each screen by reading its code as if it were a screenshot. No taste-skill scripts were run and no browser was opened.

## How the screens are scored

Each screen gets two scores.

- **Taste score, out of 10.** This uses the weighting in `critique.md`: design 40%, usability 30%, creativity 20% and content 10%. The caps apply. In particular, any visible eyebrow, index number, decorative gradient, shadow at rest or decorative hairline limits the overall score to **6.5**. For calibration, real Awwwards Sites of the Day score about 7.5–8.
- **DESIGN §8 gate, out of 50.** Ten criteria, each scored 1–5. A screen ships at 40 or more, with no criterion below 3, and with evidence, accessibility and trust each at 4 or more.

## Summary

| Screen | Size (before → after) | Taste before | Taste after | §8 before | §8 after | Signature live thing |
|---|---|---|---|---|---|---|
| AppExplore | 390×844, unchanged | 6.5 (capped from 6.9) | **7.7** | 38 | **44** | Ask out loud: a voice question streams back a cited answer |
| AppMap | 390×844, unchanged | 6.5 (capped from 6.9) | **7.7** | 38 | **43** | One tap flips the price map to a risk map; pins re-label with a staggered pop |
| AppProject | 390×3500 → **390×4200** | 6.5 (capped from 7.5) | **8.0** | 41 | **46** | The replay tower: slabs build from the QPR filings as you drag through the quarters |
| AppRisk | 390×3200 → **390×3840** | 6.5 (capped from 7.1) | **8.1** (7.7 until `qprDesk` is generated) | 40 | **47** | The record, highlighted: a source opens its extract and the cited figure is wiped in with a highlighter |
| AppFollowing | 390×844, unchanged | 6.5 (capped from 6.8) | **7.5** | 37 | **41** | The band steps: Aurelia's meter fills from Moderate to Elevated in front of you |

## Changes shared by all five screens

These changes are identical in every file, so the five screens stay one system.

- **Motion layer.** Keyframes live in the helmet `<style>`, as §0 allows:
  - `pl-rise` is a staggered entrance, rising 22 px with opacity, 60–90 ms apart, once.
  - `pl-drift` is a single slow 1.04 scale drift over 16 s on each hero photo. It is the moving picture.
  - `pl-sheet` makes sheets rise from where they live.
  - `.pl-press:active { scale(.97) }` gives press feedback on every button and on key links and cards.
  - The existing `prefers-reduced-motion` rule turns off all animation and leaves the final state showing. Every animated element was written so that its resting style is the finished state; nothing stays hidden.
- **Glass removed.**
  - Every `backdrop-filter` is gone.
  - The `glass` token is now opaque: `#FFFFFF` for Day and `#111D19` for Night. Photo controls are solid circles.
  - The radial `glow` token and every `glowBg` use are deleted. This also fixed a latent `%%` CSS bug in AppProject: its glow string and the confidence-dot `border-radius:50%%` were invalid CSS.
- **No hairlines or outlines.**
  - The nav and bottom action bars drop `border-top`. They now sit on a tone step: `nav` is `#EFECE5` in Day and `#121D19` in Night.
  - List rows are separated by space.
  - Real data tables (the cost breakdown and the compare grid), form fields and the checkbox keep their lines.
- **Risk chip (S).** The chip loses its 1 px band-ink border, because the band fill already carries the band. Limited history now sits on `t.track` and keeps its dashed meter, since the dashes encode data. The meter, band name and confidence dots are unchanged, so the band reads the same everywhere.
- **Filter and choice pills (`pill()`).** Outlined pills become filled tone pills (`t.track`, or `t.bgSolid` on a track band). The selected pill is the inverse colours (ink fill, white text). This takes accent off filters.
- **Media.** All media corners are now square. The heroes run full-bleed, and the home and project heroes are taller. "Illustrative image" is plain 13 px white text on a neutral top scrim, not a glass pill; in lists it becomes one caption line.
- **Links.** Links are ink with an underline, not green. Accent is kept for the one primary action per screen (Follow, Ask out loud, Compare, Share risk card), for the nav indicator, and for data (built slabs).
- **New token.** `slabOff` (`#E2DED4` Day, `rgba(255,255,255,0.12)` Night) is used by the new slab bars.

## AppExplore

### Before: 6.5 (capped from 6.9) · §8 38/50

The critique below reads the code as a screenshot.

- **First impression:** a dark aerial photo with rounded bottom corners and a 33 px headline. A white outlined card overlaps it.
- **Tells:**
  - six glass and blur pills: the logo pill, the "Illustrative image" pill on the hero, the theme button, and the per-image pills on all four carousel cards;
  - a radial glow on the scroll ground;
  - an outlined ask card that floats over the hero;
  - outlined corridor pills;
  - hairlines between every list row and above the nav;
  - a decorative status dot on the live strip.
  - In the voice sheet: outlined source chips, an outlined "Stop reading" button and hairline result rows.
  - In the Scan view: a blurred segmented control, an outlined upload button, an outlined GPS ring and an outlined "Open project" button.
- **Type:** the hero is 33 px, which is not one very large size. The screen uses about 9 sizes.
- **Live things:** voice and scan compete for first place with equal weight.
- **Scores:** design 6.0, usability 7.5, creativity 7.0, content 8.0, giving 6.85. The glow and hairline caps bring it to 6.5.

### What changed

1. **Hero.**
   - Square and full-bleed at 468 px, with the slow drift. A neutral top scrim makes the plain white wordmark and controls readable.
   - The headline is 44 px at −0.04em: "Which home are you buying?". It was 38 characters and is now 26, two lines at every width. The supporting sentence and "No developer pays us. Ever." are kept at 17 px in full white.
   - The headline, sentence and ask block enter with a stagger.
2. **Ask block.**
   - It no longer overlaps the hero and has no outline. It is a filled tone field: "Ask about any project, in English or Hinglish".
   - Below it are one primary action, **Ask out loud** (accent, the signature), and a tone-filled **Scan RERA QR**. Both were renamed for what they do.
   - The live strip is now a quiet text line without the dot.
3. **"What changed in projects you follow?"**
   - The heading is 30 px on a full-bleed track band.
   - The link reads "See all 4", in ink with an underline.
   - New caption: "2 changes this month · images are illustrative".
   - Cards are 300×200, square, with no pills. The change line is 17 px in full ink.
4. **Slab bars replace the generic progress bars.** Each bar has 20 slabs, each 5% of the building, with an ink tick for the share of time used. It is the project-page tower laid flat (20 slabs, 5% each there too), so the idea "every quarter is a slab" now reaches the home screen. Thumbnails are 88 px and square. Corridor pills are filled. Rows are separated by space.
5. **Voice sheet.** It rises in. Source chips are filled tone pills. "Stop reading" is tone-filled. The rows have no hairlines and the mic area sits on a tone step. The heading is 26 px.
6. **Scan view.** No blur and no outlines: the segmented control and the upload button use a neutral 0.78 scrim, and the GPS ring is filled. The result sheet rises in, its list has no rules, "Open project" is tone-filled, and the following state is accent-soft rather than outlined.

### After: 7.7 · §8 44/50

- **First impression:** the expressway at golden hour and one big question.
- **Layout by section:** hero = full-bleed photo, ask = field + action, changes = drag row on a band, near you = list with instruments.
- **Scores:** design 7.6, usability 8.0, creativity 7.5, content 8.0. No caps apply.

### Remaining issues

- The theme toggle on the home hero is a design-review affordance. In production it belongs in You › Display.
- "What changed" partly duplicates the Following tab. Consider showing it only when there is an unread change.
- The voice sheet still opens with a sparkle icon. A plain mic or wave glyph would be less "AI-generic".
- There is no offline or "HARERA unreachable" state, and no skeleton state for the list.

### 10x ideas

| Idea | Why it's 10x for a Gurugram buyer | How it works | Feasibility | Main risk |
|---|---|---|---|---|
| **Hoarding X-ray** (camera, on-device). Point the camera at *any* hoarding or brochure, not only the QR code. Plinth reads the project name or RERA number and pins its own labelled note next to the claim: the hoarding says "Possession 2027"; the note says "Original RERA date Dec 2027 · 41% built · Elevated". | Hoardings on Dwarka Expressway are the main way buyers discover projects. This puts the evidence exactly where the marketing is. | ML Kit on-device OCR plus fuzzy matching against the project index (6 projects today, about 1,000 later). ARCore anchors the label. A confirm step ("Is this Aurelia Heights, Phase 2?") comes before any band is shown. Falls back to the current QR mode. | M–L | Misidentifying a project. The confirm step and a "Not this project" link are mandatory, and the label is always our opinion with sources, never a verdict on the ad. |
| **Drive-by risk radar** (location + notification). Opt-in geofences around project boundaries. When you pass one: "You're passing Aurelia Heights, Phase 2 · Delivery risk Elevated · 41% built, 77% of time used." | Buyers scout by car on weekends. Plinth becomes the passenger who has read every QPR. | Android Geofencing API (up to 100 nearest boundaries), with boundary polygons from HARERA site plans. Matching happens on the device and location is never uploaded. At most one alert a day. | M | Permission fatigue and feeling watched. It must be off by default, with the copy "Location is checked on your phone only". |
| **Glanceable corridor widget.** A 4×2 home-screen widget shows your shortlist as slab bars, plus "Next QPR due 15 Jan 2027" and "synced 2 hours ago". | Evidence stays present every day without opening the app. The slab bar is a signature you can read at a glance. | Jetpack Glance, refreshed on each HARERA sync. A tap deep-links to that project's tower. | S–M | Looking stale. The sync time is always shown and turns grey after 24 h. |
| **Voice note in, voice note out on WhatsApp.** Forward a broker's voice note or brochure PDF to Plinth on WhatsApp. You get back a 30-second Hinglish voice answer plus the risk card image with numbered sources. | Gurugram buying runs on WhatsApp voice notes and family groups. This skips the install barrier. | WhatsApp Business API, speech-to-text, the existing cited-answer pipeline, text-to-speech, and a 1080×1350 card render. | M | Template costs and forwarded misinformation. The answer always cites sources and offers the human team. |
| **Family shortlist.** Share Explore's "near you" shortlist with up to 4 family members. Each sees it in their language, for example Hindi audio for parents in Lucknow, and can react. | In India a home is a family decision. Plinth becomes the shared table it is made at. | Invite by link with masked numbers, using the §5 consent pattern. Hindi text-to-speech of the risk sentence uses natural frequencies ("100 mein se 30 se 45"). | M | Consent and privacy. It needs a "Who can see this" view and the ability to revoke anytime. |

## AppMap

### Before: 6.5 (capped from 6.9) · §8 38/50

- **First impression:** a beige drawn map with white floating pills everywhere.
- **Tells:**
  - a floating pill search bar with a shadow;
  - floating outlined filter chips;
  - a floating "Search this area" pill with a shadow;
  - a floating segmented control and locate button, both with shadows;
  - white pins with shadows;
  - result images with 22 px rounded corners;
  - glass follow buttons and six glass "Illustrative image" pills;
  - a 2 px accent outline box marking the selected card;
  - a floating "Map" pill when the sheet is full.
- **Strength:** the Price | Risk toggle is the best idea on the screen, but it was a 15 px floating afterthought.
- **Scores:** design 6.0, usability 7.5, creativity 7.5, content 7.5, giving 6.9. The shadow-at-rest and floating-pill caps bring it to 6.5.

### What changed

1. **A plain top bar.** It is solid `t.bg` with no shadow. It holds back, a filled search field (52 px), voice, and one row of filled filter chips.
   - "Search this area" lives at the start of that row as an accent-soft chip, so it no longer floats over the map.
   - The map starts where the bar ends: a tone step, not a line.
2. **The signature move.** "Label pins by **Price | Delivery risk**" is a flat inverse segmented control at 52 px. Switching it re-labels every pin with a staggered pop. This works by alternating `pl-popA` and `pl-popB` so the animation restarts, with a 70 ms stagger by rank. Pins also pop in once on load.
   - The locate button is flat and inverse. No map control has a shadow.
3. **Pins.**
   - In price mode they are ink with white text, which reads clearly on a light map with no shadow.
   - In risk mode they use the band fill with the band-ink edge (data).
   - The selected pin is accent, so accent appears in one place.
4. **Sheet.** The sheet keeps its shadow, because it truly floats. Changes inside it:
   - The heading is 26 px.
   - The "Map" button moved into the sheet header, replacing the floating pill.
   - Cards are square. The follow buttons are solid with no glass, and the image pills are gone; the footnote already says "Images are illustrative".
   - Card titles are 22 px, and the price line is 17 px semi-bold in ink.
   - The selected card sits on a tone field instead of inside an outline.
   - "How results are ranked" is ink with an underline.

### After: 7.7 · §8 43/50

- **First impression:** a map of dark price tags, and one obvious switch to see it by risk.
- **Layout:** the bar, the map with instruments, then a sheet holding a list.
- **Scores:** design 7.4, usability 8.0, creativity 8.0, content 7.5.

### Remaining issues

- The drawn SVG map stands in for real tiles. Production needs a custom Maps style that matches the palette, with blocks in the `t.track` family.
- Evidence on the cards is thin: only the band chip and "data as of". Each card could carry its one strongest fact, such as "72% sold, 41% built".
- "Search this area" shows before the map has moved, which is a limit of the simulated state.
- At real density the pins will collide and need clustering. A cluster pill could show a mini band histogram.

### 10x ideas

| Idea | Why it's 10x for a Gurugram buyer | How it works | Feasibility | Main risk |
|---|---|---|---|---|
| **Risk weather.** A third map mode shades each sector by the share of under-construction units rated Elevated or worse ("4 of 9 projects"). A quarter slider then replays 2022–2026 so risk moves across New Gurugram like weather. | It shows where delivery problems cluster at corridor level, which no portal shows. It also feeds "where should I even look". | Projects are aggregated into H3 hexagons or sector polygons, with counts on tap. The replay reuses the QPR quarter array. | M | Stigmatising a sector. It shows counts and facts only, no adjectives, and a minimum of 3 projects before shading. |
| **Time-to-keys rings.** Each pin grows a ring showing the realistic possession window: the promised date, plus the "30–45 of 100 similar finished >12 months late" spread. It combines with a commute line from your office in Cyber City. | Buyers trade price against waiting years, and this makes the wait visible on the map. | The routing API supplies today's drive time. Rings are drawn from the band's frequency range. Infrastructure promises carry their own source chips. | M | Infrastructure dates are uncertain too, so each one is labelled with its source and date. |
| **Lasso alerts.** Draw an area and say "anything under ₹2.5 Cr all-in, Low–Moderate only". You get a push when a new RERA registration or a band change lands inside it. | Early, evidence-backed notice of new launches, before the brokers' calls start. | A polygon is stored with the filters and matched on each HARERA sync. At most one alert a day. | S–M | Alert fatigue. A weekly digest is the default. |
| **Walk the boundary** (on site). At a site, the map switches to the approved site plan with tower footprints and tells you which tower you're facing, plus its latest slab: "Tower A · slab 9 cast · Mar 2026". | The sales gallery is where buyers are sold. Plinth becomes the independent guide in the room. | GPS plus the compass heading against digitised site plans, with QPR tower-level notes. | L | Digitising site plans, and accuracy. The fallback is "You're inside the site boundary". |

## AppProject

### Before: 6.5 (capped from 7.5) · §8 41/50

- **First impression:** a tall photo hero with rounded corners and five glass objects on it: back, the image pill, share, more, and a glass RERA card.
- **Tells:**
  - an eyebrow, "Gurugram · Dwarka Expressway · Sector 37D", above the headline;
  - the risk instrument in a glass panel with a 1 px border;
  - a glow band, which was also broken CSS;
  - hairlines between the Built, Sold and Time numbers and above the quarter note;
  - outlined style pills, an outlined secondary button and an outlined follow state;
  - an icon tile in the follow sheet;
  - outlined prompt and source chips in the Ask sheet.
- **Motion:** two competing moves on load, the needle sweep and the slab build.
- **Footer:** a shield icon and a line of text, not a designed close.
- **Type:** the hero is 38 px, the tower is small (124 px) and the all-in figure is 46 px.
- **Scores:** design 6.5, usability 8.0, creativity 8.0, content 8.5, giving 7.45. The eyebrow, hairline and glow caps bring it to 6.5.

### What changed

1. **Hero.**
   - 620 px, square, with the drift. Its controls are solid circles.
   - The headline is 46 px: "Aurelia Heights, Phase 2", two lines.
   - The eyebrow is folded into the line under the title: "by Northfield Estates · Sector 37D, Dwarka Expressway, Gurugram · 3 and 4 BHK · 1,450–2,100 sq ft carpet". The summary line is 18 px semi-bold.
   - The glass RERA card became a plain underlined RERA button inside the text block, so nothing floats on the sky.
2. **Will it be delivered on time?** The heading is 34 px and the answer text is in full ink. The instrument sits directly on the band with no panel, border or blur.
   - **The dial is now quiet:** the needle rests at its band with no sweep, so the tower is the one signature move.
   - The band name is 46 px. The link is ink with an underline. The live line has no dot.
3. **How much is built?** This is the signature section (`data-signature="replay-tower"`).
   - The tower stage grows from 270 to 360 px and the footprint from 124 to 164 px, with 10 px slab spacing. Slabs still build with a 45 ms stagger on load and on every scrub.
   - Built, Sold and Time are 34 px with no dividers. The quarter readout is 34 px.
   - The source is a filled tone pill.
4. **What will I really pay?** "₹2.74 Cr" is set at 72 px, the one very large figure. "Hide the breakdown" is an ink link with an underline. The breakdown table keeps its rule because it is a real data table.
5. **What would it look like furnished?**
   - The compare is full-bleed (390×260) and square.
   - "Original photo" uses the same solid black label as "AI-generated preview". The glass "Illustrative image" pill moved into the hint line.
   - Style pills and "Try it on your room · beta" are filled.
6. **Footer.** A designed close: "Plinth" at 128 px across the width, "No developer pays us. Ever." at 26 px, the disclaimer in full ink, and underlined links. The shield icon is gone.
7. **Bottom bar and sheets.**
   - The bar is plain on a tone step. "Following" is accent-soft, not outlined. "Ask about this" is tone-filled.
   - The follow sheet rises in and drops its icon tile; its heading is 30 px.
   - In the Ask sheet, the "About" pill became the subtitle, the prompts are filled (inverse when selected), source chips are filled, and the input row sits on a tone step.

### After: 8.0 · §8 46/50

- **First impression:** the building, its name in two big lines, and one sentence holding the band, the all-in price, the build share and the date.
- **Layout by section:** hero = full-bleed photo, risk = instrument on the ground, built = staged tower on a band, pay = one giant figure, furnish = full-bleed compare on a band, footer = wordmark close.
- **Scores:** design 7.8, usability 8.0, creativity 8.2, content 8.5.
- **Capture height:** changed from 3500 to **4200**. This is estimated from the content stack; the footer flex absorbs any slack.

### Remaining issues

- The page now carries four instruments: the dial, the tower, the cost bar and the compare. Only the tower moves, but the dial and the 100-projects toggle could move to the Risk card, leaving a single band sentence here.
- "Records show" and "Developer says" don't appear on this page. The Northfield reply belongs under the risk answer as a claim tone field, the same pattern as AppRisk.
- The compare handle keeps a 1 px dark ring (drawn as `box-shadow`) so it stays visible on white walls. That is a functional contrast ring, not a resting shadow.
- 4200 px is long for a phone. Consider sticky section tabs (Risk · Built · Pay · Furnish) inside the plain bar.

### 10x ideas

| Idea | Why it's 10x for a Gurugram buyer | How it works | Feasibility | Main risk |
|---|---|---|---|---|
| **Site-visit co-pilot** (on-device listening). Turn on Visit mode in the sales gallery. Plinth listens on the device for claims such as "possession by Dec 2026", "OC applied" or "pay 20% now", and taps your wrist with a card: "Records show: original completion Dec 2027 · 41% built. Ask for the CA escrow certificate." | It puts the evidence in the room at the moment of pressure, which is the most expensive five minutes of the purchase. | On-device speech recognition (Android offline SpeechRecognizer or a small on-device model) and claim-matching rules against the project record. Nothing is uploaded; the transcript stays on the phone. A visible "Listening" indicator and a one-tap stop. | M–L | Consent and etiquette when recording. The app never stores audio, says so on screen, and starts off. False alarms must be rare, so it matches only a short list of claim types. |
| **Your payment plan on the tower.** Enter the builder's plan, for example construction-linked with 10% on booking and 20% on slab 5. The tower then shows how much of your money would be paid before each slab exists at the QPR pace: "At the current pace you'd have paid 60% by Jun 2027 with about 55% built." | The real loss in Gurugram is paying ahead of construction. This makes that exposure visible before the cheque. | Plan milestones are mapped to slabs and projected with the project's QPR build rate. It is shown as arithmetic with its assumptions. | M | Reading as advice. Framed as "arithmetic from records, not advice", with every assumption editable. |
| **Neighbours' notebook.** Verified Phase 1 owners post dated, geotagged site photos in a timeline beside the QPR claims: photo against filing, quarter by quarter. | Ground truth next to the filing. A photo that disagrees with a QPR is the strongest evidence a buyer can see. | Owner verification by allotment letter. EXIF and GPS must fall inside the boundary. Photos and dates only, with no free-text claims. | M | Moderation and defamation. Photos only, a takedown flow, and the developer reply right beside them. |
| **Ask the developer, on record.** One tap sends a structured question to Northfield through the reply portal. Unanswered questions show publicly: "Asked 18 Oct 2026 · no reply yet (12 days)". | Silence becomes a signal, and buyers stop asking the same questions alone. | The existing developer reply portal plus a public question log with service-level timers. | S–M | Spam and legal pushback. Questions come from templates, and the developer's replies are published in full. |
| **Tower in your room** (ARCore). Place the replay tower on the dining table, scrub the quarters with the sold line hovering, and share a 10-second clip with the sources burned in. | The family conversation happens over a phone at dinner. This makes the evidence the thing people pass around. | ARCore plane anchor, the same 20-slab model, and the clip rendered with a source chip and the "data as of" date. | M | Gimmick risk. It is only allowed with sources in the frame. |

## AppRisk

### Before: 6.5 (capped from 7.1) · §8 40/50

- **First impression:** a photo with rounded corners, then "Elevated" at 52 px under a small grey label.
- **Tells:**
  - an eyebrow above the hero headline (project name and RERA number);
  - an eyebrow above the band ("Delivery risk, our opinion");
  - 36 px index badges "1 2 3 4" on the reasons, which are banned;
  - a grey factor label above each fact (an eyebrow pattern);
  - outlined source chips;
  - a **dashed** "Developer says" box, which is banned;
  - hairlines between the reasons;
  - a glow band;
  - glass hero controls;
  - in the evidence sheet: an eyebrow and an outlined archive button;
  - an outlined card and QR box in the share sheet.
- **Strength:** content is excellent. The frequencies are natural, the reference class is explicit, and the evidence sheet has an extract, a reading method and corrections.
- **Scores:** design 6.0, usability 8.0, creativity 7.0, content 9.0, giving 7.1. The index-numbering, eyebrow, dashed-box and hairline caps bring it to 6.5.

### What changed

1. **Hero.** Square at 360 px, with the drift and solid controls. The headline is 37 px and stays two lines; this question is the longest on the screen, so the band carries the scale instead. The eyebrow moved below: "Aurelia Heights, Phase 2 · RERA GGM/673/405/2022/117".
2. **The band is the poster.** "Elevated" is set at **80 px**, −0.055em. The eyebrow became a sentence below it: "Delivery risk, our opinion." followed by the confidence dots and "Low confidence: limited filings". The band scale is unchanged (data) and its labels are 14 px.
3. **Bands re-ordered so tones alternate cleanly.** The order is band (track), how often (ground), why (track), what would change (ground), footer (track). This puts the developer's claim field on the ground tone, where it reads clearly.
4. **Why Elevated?**
   - It is a real `<ol>` with no visible numbers; order is shown by position.
   - Each reason is one sentence with the factor group written in, for example "**Finances:** 72% of units sold, 41% built."
   - Source chips are filled tone pills.
   - New picture: an empty `qprDesk` slot (full-bleed 390×220), a printed QPR on a desk, which shows that the reasons are lines in a real public record.
   - Reasons enter one after another.
5. **What would change this?** "Developer says" is now a claim tone field (`claimBg` `#F1ECE2` Day, `#1D2621` Night) with radius 8, a speech icon and its label. No dashed outline.
6. **Footer close.** "Plinth" at 128 px, then "No developer pays us. Ever.", the disclaimer, and underlined links.
7. **Evidence sheet (the signature move).**
   - The heading comes first and "Evidence for reason 1 of 4" sits below it.
   - "Records show" is a tone label.
   - The fact is set at 26 px display.
   - In the extract, the cited figure (for example "72%") gets a **highlighter wipe** 0.45 s after the sheet opens: an accent-soft bar scales from left to right behind the text. Under reduced motion it is simply highlighted.
   - "Our archived copy" is filled.
8. **Share sheet.** The preview card is a tone field with no border, the QR sits on solid white, and "Copy link" is filled.

### After: 8.1 · §8 47/50

The score drops to 7.7 while `qprDesk` is still a grey placeholder.

- **First impression:** one word, "Elevated", in its band colour, then the scale.
- **Layout by section:** hero = photo, band = giant word plus scale, frequency = 100-dot array, why = record photo plus list, change = claim field, footer = wordmark.
- **Scores:** design 7.8, usability 8.2, creativity 8.0, content 9.0.
- **Capture height:** changed from 3200 to **3840**, estimated.

### Remaining issues

- `qprDesk` must be generated (requested). Until then the grey block caps content at 5.
- "Ask why" and "Share risk card" are both in the bar. Ask could move into the reasons section, leaving one action.
- The icon array is static. That is correct for the "one signature" rule, but a tap on a dot could open the matching reference-class project ("Cedar Walk, OC 14 months late"). That would make the frequency tangible.

### 10x ideas

| Idea | Why it's 10x for a Gurugram buyer | How it works | Feasibility | Main risk |
|---|---|---|---|---|
| **Watch the condition.** "What would change this" becomes live checkpoints: "Two consecutive quarters with construction ahead of sales: 0 of 2 met · next QPR due 15 Jan 2027". Each new QPR ticks it or not, with a push that carries the extract. | The band turns from a verdict into a falsifiable forecast. Buyers know exactly what to watch, and developers know exactly what to fix. | The model already knows each band boundary. A small rule engine runs per QPR, and the result shows on the card and in Following. | S–M | Developers gaming filings. The check reads physical progress plus the CA certificate, not filing dates alone. |
| **Proof pack for your bank and lawyer.** One tap exports a dated evidence pack: the four reasons, archived extracts with the figures highlighted, source URLs, content hashes and the model version. | Plinth's evidence becomes a working document in the deal: the home-loan legal check, the lawyer's file, the family chat. | A server-rendered PDF from the archived copies, with SHA-256 hashes and a "verify" link that checks the hashes against our archive. | S–M | Liability. Every page carries "Our opinion, based on public records. Not a credit rating." |
| **Explain it like my father would hear it.** A 45-second Hindi or Hinglish voice read-out of the card. The 100-dot array fills in sync with the words ("100 jaise projects mein se 30 se 45…"). | The decision is a family one, and many parents prefer Hindi audio. It is also the most accessible form of the risk card. | Scripted from the data (no free generation) and played with on-device text-to-speech, with captions. | S | Translating probabilities. The copy keeps natural frequencies and is reviewed by a person once per template. |
| **Rich band-change alerts.** When a band moves, the Android notification expands to show the record extract image with the figure highlighted, plus "Open original". | The alert is the proof, not just a claim, so trust is earned in the notification tray. | A BigPicture notification rendered from the archived extract. | S | Legibility in a small image. The figure gets an enlarged crop. |

## AppFollowing

### Before: 6.5 (capped from 6.8) · §8 37/50

- **First impression:** a 36 px title over a grey utility list.
- **Tells:**
  - hairlines on every row (4 rows plus the footer);
  - 76 px thumbnails with rounded corners;
  - grey 15 px change lines, where running text should be in full ink;
  - 44 px icon tiles in rounded squares in the Updates tab, an "icon-topped" tell;
  - outlined filter pills;
  - accent used for unread dots, both badges and the selected pills;
  - a hairline above the compare tray;
  - a glow on the ground.
- **Live thing:** the compare tray works, but nothing on the screen feels alive.
- **Scores:** design 6.0, usability 8.0, creativity 6.0, content 7.5, giving 6.75. The hairline and glow caps bring it to 6.5.

### What changed

1. **Header.** "Following" is set at **56 px**, −0.05em. The subtitle is 17 px in full ink.
2. **Projects list.** Rows have no hairlines. Thumbnails are 88 px and square, titles 18 px, and the change line 16 px in full ink.
3. **Signature: "the band steps"** (`data-signature="band-step"`).
   - On Aurelia's row (whose band changed on 2 Oct), the meter shows two segments. The third fills in once, 1.1 s after load, with "Was Moderate until 2 Oct 2026" beside it.
   - The same stepping chip now appears inside the Updates row "Delivery risk changed: Moderate → Elevated".
   - It is built as an overlay that only fades out, using opacity only, so the resting state is correct under reduced motion.
4. **Updates.**
   - Icon tiles became plain 24 px ink glyphs aligned to the first line.
   - Rows have no hairlines. Titles are 18 px and the context line is 16 px ink.
   - Filters are filled pills, inverse when selected. "Mark all as read" is an ink link with an underline.
   - Unread dots are ink.
5. **Accent discipline.** The unread badges on the segmented control and the nav are inverse (ink). Accent remains on **Compare** (the primary action), the ticked checkboxes and the nav indicator.
6. **Tray and sheet.** The compare tray joins the nav as one plain bottom block on the same tone. The compare sheet rises in with a 28 px heading. Its grid keeps its row rules because it is a real data table.

### After: 7.5 · §8 41/50

- **First impression:** "Following" in big type, then four projects, one of which visibly steps up a band.
- **Layout:** header = title plus segmented control, list = image rows, bar = tray plus nav.
- **Scores:** design 7.3, usability 8.0, creativity 7.2, content 7.5.

### Remaining issues

- Evidence is the weakest criterion (3/5). Update rows say "HARERA order · 14 Oct 2026" but can't be opened as a record. Each row needs a source chip that opens the same evidence sheet as AppRisk.
- Two empty states are missing: zero projects followed, and the "WhatsApp alerts off" consent status.
- The list has no picture-led moment. A first-row "this week" card with a site photo would give the screen one dominant image.
- The checkbox squares are real controls, but they still read as outlines beside the filled language elsewhere.

### 10x ideas

| Idea | Why it's 10x for a Gurugram buyer | How it works | Feasibility | Main risk |
|---|---|---|---|---|
| **Your money against their build.** Import the allotment letter and payment receipts (PDF or a photo, parsed on the device). Each followed project then shows your exposure on its slab bar: "You've paid ₹47 L (20%) · 41% built · next demand at slab 12". | After booking, the only question that matters is whether your money is ahead of the building. Nobody shows that today. | On-device document parsing (ML Kit text recognition plus templates), stored locally and encrypted. It is overlaid on the QPR slab data. SMS reading is avoided because Play policy restricts it; the user imports receipts. | M | Sensitive financial data. It stays on the device by default, with optional encrypted backup, and is framed as arithmetic, not advice. |
| **QPR due-day live update.** On 15 Jan 2027, an ongoing notification tracks the filing: "Aurelia Ph 2 QPR due today · not filed yet". Later: "Filed 16:42 · 44% built (+3) · band unchanged". | Filing day is when the truth lands. Being there live is the habit loop, and it is honest rather than engagement bait. | Android ongoing or live-update notifications, with polling on HARERA during the due window. | S–M | Portal latency and outages. It shows "HARERA not reachable, we'll keep checking" rather than going silent. |
| **Family circle.** Share Following with up to 4 people. Each gets alerts in their language (for example Hindi on WhatsApp for parents) and can vote on the compare tray. | Indian homes are bought by families. This makes Plinth the family's shared source of truth. | Invites with masked numbers, the §5 consent pattern, a per-member language setting, and the WhatsApp templates that already exist. | M | Consent and privacy. It needs a "Who gets these alerts" view and the ability to revoke anytime. |
| **Exit-options card.** If a followed project crosses a threshold (two band steps up, or NCLT admission), a card explains the buyer's options under RERA s.18, with refund-plus-interest arithmetic, and offers a lawyer handoff. | It turns bad news into a next step at the moment it matters most. | A rule engine on band and red-flag events, a templated explainer, and the interest computed from the buyer's own payments. | M | The line between information and legal advice. It is information only, and it is reviewed by counsel. |

## New image requests

Requests are in `product/design/assets/requests_app-core.json`.

| Slot | Aspect | Used in | Prompt summary |
|---|---|---|---|
| `qprDesk` | 16:9 | AppRisk, "Why Elevated?", full-bleed at 390×220 | A printed government quarterly progress report on a light-wood desk in morning light. Pencil, reading glasses and chai beside it. Very shallow depth of field so no text or numbers are legible. |

## Notes for the lead

- **Canvas sizes to update in `canvas.json`** (I did not edit it): AppProject is now **4200** tall (was 3500) and AppRisk **3840** (was 3200). Both heights are estimated from the content stack; if a capture shows slack at the bottom, trim it.
- **Cross-group consistency.** These changes affect other groups' screens:
  - The risk chip lost its 1 px band-ink border, and Limited history now sits on `t.track`.
  - `pill()` is filled, and inverse when selected.
  - `nav` is a tone step instead of a hairline.

  If other groups keep the bordered chip, the same band would look slightly different on web and app (§2.4, "Same score everywhere"). I recommend adopting the borderless chip everywhere.
- **Copy changes made to fit the rules:**
  - Explore h1, "Which home are you thinking of buying?" → "Which home are you buying?" (two-line rule at 44 px).
  - "Speak" → "Ask out loud", and "Scan" → "Scan RERA QR" (buttons named for what they do).
  - "See all" → "See all 4".
  - New caption: "2 changes this month · images are illustrative" (derived from the data: Aurelia on 2 Oct, Coral on 14 Oct).
  - The Risk "Why" intro: "Each one is a line in a public record; tap a source to read it."
- **Checks run on every edited file:**
  - The HTML parses with balanced tags and no unquoted attributes.
  - `node --check` passes on the logic block.
  - `renderVals()` was executed in Day, in Night, and in an "everything open" state. Every `{{hole}}` resolved, with no `undefined` or `NaN`.
