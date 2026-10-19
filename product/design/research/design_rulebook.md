# Design rulebook (v1.0)

| | |
|---|---|
| **Product** | AI-first home-buying platform for Delhi NCR (Gurugram first). Web (Next.js), Android (Expo/React Native), WhatsApp. English-first (`en-IN`). |
| **Binds** | Every screen, component, chart and message, whether made by a designer or a coding agent. |
| **Precedence** | PRD principles and founder decisions → this rulebook → platform rules (Material 3, WCAG 2.2) → skill defaults. |
| **Notation** | **[J]** = our judgement. Sources are cited as S1–S8 and P1–P3 (§1, §4). All sources were accessed 18 Oct 2026. Quotes are short; everything else is paraphrase. |

---

## 1. Sources

### 1.1 What each source is and what we take from it

Star counts come from the GitHub API on 18 Oct 2026. Stars show popularity, not quality.

| # | Source | Credibility | Rules we adopt |
|---|---|---|---|
| S1 | **Anthropic `frontend-design`** (`anthropics/skills` and `claude-plugins-official`; identical files) | Official. **181.8k** and **42.1k** stars. Ranked #1 by third parties. Current version dated 3 Sep 2026 (earlier: Dec 2025, Jun 2026) | Ground the design in the subject. 1–2 deliberate typefaces. Structure encodes information. Plan tokens, then check the plan against five "AI-generated" clusters. "Spend your boldness in one place." Errors don't apologise |
| S2 | **Anthropic `design` plugin** (`knowledge-work-plugins` v1.2.0; 7 skills, from design-system to research-synthesis) | Official. **30.1k** stars | Token taxonomy. Every component's states documented. Critique dimensions. Error copy = what + why + fix. "Use tokens, not values" |
| S3 | **ui-ux-pro-max** (nextlevelbuilder) | Community. **137.0k** stars, the most-starred community design skill | 10 prioritised rule categories, accessibility and touch first. Tabular figures for prices. Bottom navigation of 5 items or fewer. No emoji icons. Exit animations faster than entries. Chart accessibility |
| S4 | **taste-skill** (Leonxlnx) | Community. **98.6k** stars | A dated register of "tells" (2023–26). The "warm editorial" fix has itself become a tell. Copy tells. Removing tells is not enough; a page also needs an idea |
| S5 | **Impeccable** (pbakaus, v4.6.0) | Community. **82.5k** stars | Surface modes (Operate, Read, Persuade). A "craft floor" of bans. Nielsen-heuristic critique. Android reference: Material 3 governs structure; 48 dp targets; edge-to-edge; one FAB |
| S6 | **Hallmark** (Nutlope) | Community. **30.3k** stars. A third-party test found it the only skill that avoided fabricated statistics | "Invented metrics" count as slop. `tabular-nums`. Silent success. Undo rather than a confirmation dialog. Spinner delayed 150 ms or held at least 300 ms. Focus rings never animate |
| S7 | **Emil Kowalski skills** | Community. **47.1k** stars. Author of the Sonner and Vaul libraries | Don't animate frequent actions. UI motion under 300 ms. Ease-out. Never animate from `scale(0)`. Reduced motion means gentler, not none |
| S8 | **Mobile Design System** (rikucherry1993/mobile-design-system-skill) | Public, but only **4 stars**, so low popularity. Structurally sound | Platform → guideline mapping. Every fill has an `on-*` partner. Contrast checked "with math, not by eye". A fixed Material 3 component checklist. No invented ratings or urgency |
| P1 | **Material 3 and M3 Expressive** (May 2025); Android 15/16 behaviour changes | Google says 46 studies with 18,000+ participants informed it (vendor claim) | Navigation bar with 3–5 destinations; the flexible bar is 64 dp, down from 80 dp. Navigation drawer deprecated in favour of the expanded rail. A FAB menu replaces stacked FABs. Spring motion. Edge-to-edge enforced at SDK 35, with no opt-out at SDK 36. Predictive back on by default at SDK 36 |
| P2 | **Apple HIG** (Accessibility) | Official | 44×44 pt default hit target (28 pt minimum). Text can scale to 200%. Respect Reduce Motion |
| P3 | **WCAG 2.2** (W3C, 5 Oct 2023) | Normative standard | New criteria include 2.4.11 Focus Not Obscured (AA), 2.5.7 Dragging (AA), 2.5.8 Target Size 24×24 px (AA) and 3.3.8 Accessible Authentication (AA). Criterion 4.1.1 was removed |

### 1.2 Where sources conflict, and what we decided

- **Touch targets.** S2 lists "2.5.5, 44×44" as a WCAG 2.1 AA item, but 2.5.5 is **AAA**. The AA rule is 2.5.8, 24 px. **We use:** 48 dp on Android, 44 pt on iOS and 44 px on web for primary controls. 24 px is the floor for inline links only. [J]
- **Accessibility standard.** The PRD and S2 cite WCAG 2.1 AA. **We adopt WCAG 2.2 AA**, and the PRD's non-functional requirements should be updated to match. [J]
- **Black and white.** S6 bans pure `#000` and `#FFF`. S1 calls tinted near-black (`#111`) a tell. **Neither is our default:** ink is derived from the chosen direction and its contrast is verified. [J]
- **The category look.** S3's data recommends "Trust Blue + Gold", glassmorphism and Cinzel for real estate. That is the category default, so S1's test rejects it. **We don't use it.** [J]
- **M3 Expressive.** Bouncy springs and shape-morphing conflict with calm ₹1–5 Cr decisions. We adopt its structural changes, not its playful motion, on risk and money surfaces. [J]
- **Emoji.** S2's templates mark severity with emoji. We never do, in the UI or on WhatsApp. [J]

---

## 2. The rulebook

### (a) Design principles

1. **Evidence is the interface.** Every fact carries a source, a "data as of" date and a confidence state, built into the component. A design with no slot for the source is unfinished.
2. **One screen, one question.** Each screen answers one question, e.g. "Will this builder deliver?" or "What will I really pay?". Show at most four reasons before "See all".
3. **Calm, not alarming; honest, not reassuring.** Severity is shown through words, position and weight. No sirens, countdowns or confetti. Never say "safe", "guaranteed" or "clear title". [J]
4. **The same score everywhere.** A band has the same name, colour and meter position on web, Android, WhatsApp images and screenshots. This is why we don't use dynamic colour (§2k).
5. **Records and claims look different.** "Records show" and "Developer says" each have a fixed label, tone and icon, and they never share a style.
6. **Visible consent.** Masked numbers, unticked consents and "Who has my number" are first-class components.
7. **India by default.** Prices in lakh and crore, `en-IN` dates, a 360 dp Android phone on throttled 4G as the baseline, and WhatsApp as a real surface.
8. **Match ambition to the mode** (S5). Project, compare and alert screens are *Operate/Read* surfaces: aim for precision and restraint. Landing and SEO pages are *Persuade* surfaces: one bold signature element is allowed.

### (b) Choosing a visual direction

**Process** (once for the brand, then for each major surface):

1. **Ground it in the subject** (S1). Start from the materials of NCR home-buying: HARERA filings, QPR tables, site plans, cost sheets, stamp paper, construction progress, Gurugram concrete, the Aravalli ridge. Don't start from "real estate = blue and gold". [J]
2. **Write three directions as propositions** (S8): "For [buyer task], [treatment] makes [benefit] visible." Each pair must differ in at least two of: palette, type, geometry, elevation, imagery. Seeds to explore, not decisions [J]:
   - *Public record*: document-grade type, paper and ink, a civic accent.
   - *Site survey*: plan-drawing linework, used only over a real plan or map.
   - *Daylight*: photography-led, quiet chrome.
3. **Write a token plan for each** (S1): 4–6 named hex values, typefaces and their roles, an ASCII wireframe, alignment rules, and **one signature element**. Our candidate signature is the Delivery Risk card with its natural-frequency icon array. [J]
4. **Review each plan against the brief and the table below.** If a similar prompt would land in the same place, revise that part and say what changed and why (S1).
5. **Commit.** Record the chosen direction in `DESIGN.md` at the repo root; all later work derives from it. Before shipping, "remove one accessory" (S1).

**Banned unless a written brief asks for it:**

| Area | Banned defaults |
|---|---|
| Type | Inter, Roboto, Arial, Open Sans or system fonts as the web brand voice (S1 v1, S6). Recurring "safe-distinctive" picks such as Space Grotesk (S1). A single word of a headline set in italic or colour for emphasis (S1, S4). ALL-CAPS or tracked eyebrow labels (S1, S4, S5). Monospace as a "technical" costume (S1, S4, S5). Gradient text (S4–S6). Nine near-equal sizes (S4). Headlines longer than two lines (S4) |
| Colour | Purple or violet gradients, especially on white (S1 v1, S4, S6). Cream with a terracotta accent (S1, S4). Near-black with one acid or neon accent and a glow (S1, S4). Decorative gradient washes (S1, S8). Blue plus gold for real estate [J]. Red/amber/green risk lights [J] |
| Layout | The SaaS card kit: identical rounded cards, one radius everywhere, the same grey shadow (S1). Three icon-tile feature cards (S4, S6). Cards nested in cards (S5, S6). The hero-metric template (S1, S5). A full-viewport centred hero (S6). Broadsheet hairlines (S1, S4). 01/02/03 numbering for content that isn't a sequence (S1, S4, S5). Everything centred (S4) |
| Surfaces | **A coloured left or right border thicker than 1 px on a card** (S5, S6). Decorative glass or blur (S4–S6). A border plus a wide shadow, the "ghost card" (S5). Hard offset shadows; aurora blobs and orbs; grain or grid overlays with no real map underneath (S5, S6) |
| Icons and imagery | **Emoji or Unicode as icons or bullets** (S3–S6, S8). Mixed icon sets or stroke weights (S3, S6). Stock "AI illustration" (S6). Fake dashboards (S4). Unlabelled AI staging (PRD) |
| Template chrome | "A · B · C" metadata strings, "WORD — fragment" labels, "→" appended to buttons (S1). "New"/"Beta" pills above the hero; pulsing "live" dots (S4) |
| Motion | Fade-up on every section; hover-lift on every card (S1, S4, S6). Bounce or elastic easing (S6, S7). `transition-all`; blanket `hover:scale-105` (S6). Auto-rotating carousels (S6, WCAG 2.2.2) |
| Claims and copy | **Invented metrics or social proof** (S4, S6, S8). "Unlock", "seamless", "elevate", "not just X, it's Y" (S4). "Get started" and "Learn more" (S4). Celebratory toasts (S6) |

### (c) Typography

- **Families.** One, or two clearly distinct ones (S1). The reading face handles body, navigation, buttons, prices and tables (S8). A display face, if any, is used only for page titles and the Persuade hero.
- **Requirements for any face** [J]:
  - the ₹ glyph (U+20B9);
  - tabular lining figures (`tnum`, `lnum`);
  - at least 4 weights;
  - a licence (e.g. OFL) that allows embedding on web and in the app;
  - clean rendering at 14–16 px on low-DPI Android screens.

  Verify each one in the font file itself.
- **Shortlist** [J]. Test families from Indian foundries that have both Latin and Devanagari, so the voice survives a future Hindi UI, against two Latin candidates that aren't defaults. Test with real strings: "₹2.35 Cr", "3 BHK · 1,450 sq ft carpet", "41% built vs 78% of time elapsed".
- **Scale.**
  - 5–6 steps, far apart (S4). Web: 13 / 16 / 20 / 28 / 40 px, plus an optional display size of `clamp(40px, 6vw, 64px)`.
  - Android: map each step to the M3 roles (Label, Body, Title, Headline, Display) in **sp** (S5).
  - Body text at least 16 (S3). Line height 1.45–1.6 for body, 1.0–1.15 for display. Display tracking no tighter than −0.03 em.
  - Line length 45–75 characters. Left-aligned. Never justified.
- **Numerals.** `font-variant-numeric: tabular-nums lining-nums` on every price, table, compare column and count (S3, S6).
- **₹ format** [J]:

  | Value | Show | Screen reader |
  |---|---|---|
  | < ₹1 lakh | ₹85,000 | "85,000 rupees" |
  | ₹1 L to < ₹1 Cr | ₹95 L, ₹35.7 L (at most 1 decimal) | "95 lakh rupees" |
  | ≥ ₹1 Cr | ₹2.35 Cr (at most 2 decimals; trim trailing zeros) | "2.35 crore rupees" |
  | Exact amounts (cost sheets, payments) | ₹1,23,45,678 | full number |
  | Range | ₹1.8–2.2 Cr (one unit; en dash, no spaces). Never "₹95 L–1.1 Cr"; write "₹0.95–1.1 Cr" | "1.8 to 2.2 crore rupees" |
  | Rate | ₹12,500/sq ft (carpet). Always say carpet or super area | — |

- **One formatter.** `Intl.NumberFormat('en-IN')` gives "₹1,23,45,678" and, in compact notation, "95L" and "1.23Cr" (checked in Node, ICU 78.2). Hermes may differ, so all formatting goes through one unit-tested `@pkg/format` module. [J]
- **Probabilities** are written as natural frequencies ("38 of 100"), never "0.38".
- **Dates and times.** "18 Oct 2026". Never all-numeric dates. Times as "4:30 pm IST". Quarters as months ("Apr–Jun 2026"), never FY codes. Relative times only within 7 days, with the absolute date one tap away. Every score shows "Data as of …" (PRD). [J]

### (d) Colour

- **Three tiers** (S2, S3, S8): primitives (`teal-600`) → semantic roles (`surface`, `on-surface`, `primary`, `outline`, `error`) → component tokens (`riskCard.meter.track`). A raw hex value in a component fails lint.
- **Roles.** Start from the M3 roles: primary, secondary and tertiary with their containers, the surface and surface-container levels, outline, inverse, scrim and error. Then add domain roles:
  - `risk.1`–`risk.5`
  - `risk.limited-history`, `risk.not-scored`
  - `evidence.record`, `evidence.claim`
  - `ai-label`, `consent`, `stale`
- **Contrast.** Every fill ships with its `on-*` partner (S8).
  - Text needs 4.5:1, or 3:1 for large text.
  - Icons, borders, focus rings and chart marks need 3:1 (P3).
  - Check light and dark themes, and the selected, disabled and image-overlay states.
  - A CI test on the token file enforces this. [J]
- **Hierarchy.** One dominant interaction colour family. Accents are for meaning only. Backgrounds are flat fills (S8).
- **Dark theme.** Designed alongside light, not inverted. Tonal, desaturated variants, tested separately (S3, S5).
- **Risk bands are an ordinal scale** [J]:
  - Use a single-hue (or two adjacent hues) sequential ramp with lightness changing steadily from Low to Severe, so the order survives greyscale and colour-vision deficiency. No traffic lights.
  - Colour is never the only signal (WCAG 1.4.1). Every band always shows its **name**, its **position on a 5-segment meter**, and a fill pattern for High and Severe.
  - *Limited history* and *Not scored* use neutral grey with a hollow or dashed meter, outside the ramp.
  - **System-error red is never a risk colour.**
  - Before sign-off, check the ramp in deuteranopia, protanopia and tritanopia simulators and in greyscale.
- **AI images.** One high-contrast label token on every AI-staged image (PRD; IT Rules).

### (e) Spacing, layout and grid

- **Spacing.** A 4 px base on an 8 px rhythm: 4, 8, 12, 16, 24, 32, 48, 64 (S3, S8).
  - Semantic gaps: `gap-related` 8, `gap-group` 16, `gap-section` 24–32, `gap-major` 48. Related items always sit closer than groups do.
  - More space above a heading than below it (S5).
- **Breakpoints.** M3 window classes on web and in the app: compact < 600, medium 600–839, expanded 840–1199, large 1200–1599, extra-large ≥ 1600.
  - Gutters: 16 on compact, 24 on medium, 32 above.
  - App content up to about 1200 px wide; reading text up to 65 ch. [J]
- **Alignment.** Left-aligned, with at most one centred moment per page (S4). One primary action per screen (S3). On mobile it goes in a sticky bottom bar inside the safe area.
- **Containers.**
  - Choose elevation once: border, tone or shadow, never border plus shadow (S5).
  - One card radius. Pills only for small controls. No nested cards.
  - Use cards only for units the user acts on (e.g. search results). Otherwise group with space and tone. [J]
- **Stability.** Reserve space for late content (CLS < 0.1). Use a z-index scale (0/10/20/40/100), never `9999` (S3, S6). No horizontal page scroll; compare tables scroll inside their own container [J]. PRD budget: < 150 KB JS, LCP < 2.5 s on 4G.

### (f) Components and states

- **Base catalogue.** The M3 component checklist (S8): buttons, icon buttons, segmented buttons, chips, text fields, lists, cards, sheets, dialogs, snackbars, tabs, search, navigation bar and rail, progress and loading indicators, badges, tooltips, selection controls.
- **Domain components (P0)** [J]:
  - Risk: `RiskCard`, `BandMeter`, `NaturalFrequencyArray`, `ReasonRow` (fact, source, date), `TruthPanel`, `ConfidenceTag`, `DataAsOf`, `DeveloperResponse`, `RecordVsClaim`
  - Money and comparison: `AllInCostBreakdown`, `CompareTable`
  - AI, consent and sharing: `AiImageLabel`, `ConsentToggle`, `MaskedNumber`, `FollowButton`, `WhatsAppShareCard`

**A component isn't finished until every relevant state below is specified (S2, S5):**

| State | Rule |
|---|---|
| Hover / focus / pressed / selected | Never rely on hover alone (S3, S6). Focus appears **instantly** as a 2 px ring at 3:1 and is never hidden by sticky bars (WCAG 2.4.11). Pressed feedback within 100 ms, with no layout shift (S3) |
| Disabled | Use the semantic `disabled` attribute; M3 content at 38% opacity. Prefer an enabled control that explains what's missing over a silently disabled primary button [J] |
| Read-only | Looks and behaves differently from disabled (S3) |
| Loading | A skeleton when the layout is known. Otherwise a spinner shown after 150 ms and kept for at least 300 ms (S6). After 3 s, say what's happening ("Reading 40-page cost sheet…"). Skeletons stay static under reduced motion [J] |
| Empty | What this is, why it's empty, the next action (S2). Never blank chart axes (S3) |
| Error | What happened, why, how to fix it. No apology, never vague (S1, S2). Keep the user's input. Offer a retry. Field errors are linked with `aria-describedby`. When there are several, focus an error summary (S3) |
| Offline | "You're offline. Showing data saved [time]." Followed projects stay readable (PRD). Queued actions show their status [J] |
| Stale / low confidence | A staleness flag after 120 days (PRD). A "Low confidence" tag with a wider range |
| Limited history / Not scored | Neutral, with a one-line reason. Never styled as a penalty (PRD) |
| Success | Silent if the result is visible. A snackbar only for async work. Undo for reversible actions; a dialog only for irreversible ones (S6) |
| Permission denied | Say what's lost, offer an alternative, link to settings |

### (g) Motion

- **When.** Motion answers an action or shows what changed (S1, S7). Frequent actions barely animate. Keyboard-triggered actions never do (S7).
- **Duration tokens.** `fast` 120 ms (press, tooltip), `base` 200 ms (menus, crossfades), `slow` 300 ms (sheets, dialogs, page transitions). Stay at 300 ms or under (S7). Exits take about 60–70% of the entry time (S3).
- **Easing.**
  - Strong ease-out for entering; ease-in-out for moving; linear only for progress.
  - No ease-in, bounce or elastic. No `scale(0)`: start at 0.95–0.97 plus opacity.
  - Animate only transform and opacity (S3, S6, S7).
- **Android.** Use M3's *standard* spring scheme, with no overshoot on risk or money screens. Support predictive back and "Remove animations" (P1, S5). [J]
- **One signature moment** [J]. The icon array fills once, under 600 ms, when a RiskCard first appears, and never again on revisits. Band changes never animate.
- **Reduced motion.** Keep opacity and colour changes; drop movement (S7, P2).

### (h) Data-dense UI and charts

- **Order.** Answer (band, all-in cost) → up to 4 reasons → evidence → methodology. Never open on a dashboard (PRD).
- **Chart choice** (S3):
  - trend → line;
  - comparison → bar (horizontal on mobile);
  - proportion with 5 or fewer parts → stacked bar, never a pie;
  - built % vs time elapsed → paired bars or a slope line, not gauges. [J]
- **Natural frequencies** [J]. A 10×10 icon array: the highlighted count in the band colour, the rest neutral. Next to it: "About **38 of 100** similar NCR projects finished more than 12 months late." That sentence is also the alt text. No percentage gauges.
- **Uncertainty.** Show ranges as bands, e.g. P50/P80 ("Likely Mar 2028; 1 in 5 chance after Dec 2028", PRD). With low confidence, widen the band and say so.
- **Every chart has** (S3): direct labels with units; bars from zero; faint gridlines; no 3D, gradients or shadows; a **source and date line**; a **one-sentence summary**; a **table view**; tap- and keyboard-reachable tooltips; skeleton, error and empty states.
- **Compare.** 2–4 projects (PRD); attributes as rows; sticky first column; tabular, decimal-aligned figures. Mark differences with words or icons plus tone, never colour alone. [J]
- **Density.** Get density by using fewer containers, not smaller type. Secondary text no smaller than 13 px (S4); body text no smaller than 16 px.

### (i) UX writing

- **Voice.** Calm, factual, plain English. Sentence case, active voice, short sentences. Write as the interface, not a persona. No exclamation marks on Operate screens. [J]
- **Words.**
  - Use buyers' words: "possession date", "all-in cost", "carpet area", "builder".
  - One term per concept, everywhere (S2).
  - Keep the action name through the flow: "Follow project" becomes "Following" (S1).
  - Expand acronyms on first use on each screen: "QPR (quarterly progress report)". [J]
- **Claims.** Every fact links to its source, and "Records show" stays separate from "Developer says" (PRD). Bands always use their exact names.
  - Banned words [J]: *safe, risk-free, guaranteed, clear title, credit rating, AAA, best, hot deal, dream home, luxury, unlock, seamless*. Use *verified* only when the badge criteria are met.
- **CTAs.** Start with a verb and name the result: "Compare 3 projects", "Send cost sheet on WhatsApp", "Mask my number". Never "Submit", "OK", "Get started" or "Learn more" (S1, S2, S4).
- **Errors.** What happened, why, how to fix it (S2). E.g. "We couldn't read page 7 of the cost sheet. The scan is blurred. Upload a clearer photo or type the amounts." No "Oops" and no apology (S1).
- **Empty states.** E.g. "No projects followed yet. Follow a project to get alerts when its QPR is filed or missed."
- **Confirmations.** Name the action and its consequence: "Stop sharing your number with 2 brokers? They won't be able to call you." Buttons: "Stop sharing" / "Keep sharing" (S2).
- **Numbers.** Follow §2c. Never show more precision than the data has. [J]
- **AI.** Disclose AI on every AI answer and image. Every number in an AI answer must come from a tool result (PRD). Staged-image label: "AI-staged: furniture added. Walls, windows and floors unchanged." with "View original" as the first action. [J]
- **No dark patterns.** These are the CCPA *Dark Patterns Guidelines, 2023* (notified 30 Nov 2023; confirm with counsel): false urgency, basket sneaking, confirm shaming, forced action, subscription trap, interface interference, bait and switch, drip pricing, disguised ads, nagging, trick questions, SaaS billing, rogue malware. On top of these (PRD): no login walls, gated brochures, exit pop-ups or countdowns; consents start unticked; every score page says "No developer pays us".
- **WhatsApp.** Plain text, one idea per message, numbers per §2c. Always link to the full card. Utility templates only. No decorative emoji. [J]

### (j) Accessibility checklist (WCAG 2.2 AA)

- [ ] **Contrast.** Text 4.5:1 (3:1 if large). Icons, borders, focus rings and chart marks 3:1. Both themes, all states (1.4.3, 1.4.11).
- [ ] **Not colour alone (1.4.1).** Bands show a name, a meter and a pattern. Passes colour-vision simulators and greyscale.
- [ ] **Targets.** 48 dp, 44 pt or 44 px for primary controls; never under 24 px (2.5.8); 8 dp spacing between targets.
- [ ] **Keyboard (web).** Everything reachable, in visual order. A skip link. No focus traps. Escape closes sheets (2.1.1, 2.4.3).
- [ ] **Focus.** Visible, instant, and never fully hidden by sticky bars or banners (2.4.7, 2.4.11).
- [ ] **Screen readers** (TalkBack, VoiceOver, NVDA).
  - Name, role and state on every control (4.1.2). Decorative icons hidden.
  - A RiskCard reads as one sentence: "Delivery risk: Elevated. About 38 of 100 similar projects were more than 12 months late. Data as of 12 Oct 2026."
  - ₹ amounts are spoken in words.
- [ ] **Status messages.** Recomputes, offline and upload progress are announced in polite live regions, without moving focus (4.1.3).
- [ ] **Scaling.** Web: 200% zoom and 320 px reflow (1.4.4, 1.4.10). Android: 200% font scale with no clipping. iOS: Dynamic Type (R2).
- [ ] **Motion.** Reduced motion respected; nothing auto-rotates (2.2.2).
- [ ] **Dragging alternatives.** Map selection, sliders and compare reorder all work without dragging (2.5.7).
- [ ] **Forms.**
  - Visible labels; errors linked to their fields (3.3.1, 3.3.2).
  - Nothing asked twice (3.3.7).
  - OTPs can be pasted and autofilled; no puzzle CAPTCHAs (3.3.8).
  - OTP timeouts can be extended (2.2.1).
- [ ] **Consistent help.** The WhatsApp/help entry stays in the same place on every page (3.2.6).
- [ ] **Images and charts.** Alt text (AI-staged images say so). Every chart has a text summary and a table.

### (k) Android / Material 3

- **Theming.** M3 sets structure and interaction. Brand comes through M3 theming (colour roles, type scale, shape), never iOS-style controls (S5).
- **Navigation bar.**
  - Use the **flexible navigation bar** (64 dp): 3–5 destinations, icon plus label, and badges only where needed (P1, S3).
  - Proposed tabs [J]: **Explore** (search and map), **Following** (alerts, Project Watch), **Ask** (concierge), **You** (documents, consent, settings). Compare opens from a selection, not a tab.
  - At 600 dp and wider, switch to a navigation rail. No navigation drawer: M3 Expressive deprecates it.
- **Top app bar.** Context and Back; extra actions in an overflow menu.
- **Bottom sheets.** For filters, "Where is this from?", sharing and consent details.
  - Modal, with a scrim, a drag handle **and** a close button. Back closes them.
  - At most 640 dp wide. Never used for primary navigation or long forms.
- **FAB.** None on project, compare or alert screens; "Follow project" sits in a sticky bottom bar. If a FAB is used anywhere (e.g. "Ask" on Explore), there is only one. Use a FAB menu rather than stacked FABs (P1, S5). [J]
- **Edge-to-edge.** Mandatory: enforced at SDK 35, with no opt-out at SDK 36. Handle status bar, navigation bar, cutout and keyboard (IME) insets with `react-native-safe-area-context`. Check three-button navigation, which adds a translucent scrim (P1).
- **Predictive back.** On by default at SDK 36. Never intercept Back, except to confirm discarding unsaved input (P1).
- **Dynamic colour: off.** Wallpaper-derived colour would recolour the risk scale and break "the same score everywhere". Ship static light and dark schemes. [J]
- **Dark theme.** First-class. Elevation through M3 tonal surface levels.
- **Feedback.** Snackbars for transient messages; dialogs only for decisions that must interrupt (S5). Haptics only to confirm an action (follow, upload).
- **M3 Expressive, selectively** [J]. Adopt the flexible navigation bar, button and split-button groups where they fit, and the loading indicator for waits under 5 s. On risk and money screens, skip shape-morphing, spring overshoot and oversized emphasised type.
- **Test matrix** [J]. A 360×800 dp phone with 3–4 GB RAM on throttled 4G; font scale 1.0 and 2.0; light and dark; gesture and three-button navigation. Screenshots come from a device, not a browser (S5).
- **iOS (R2).** Same tokens, with HIG idioms: tab bar, edge-swipe back, 44 pt targets, Dynamic Type (P2).

### (l) Design critique rubric

Use this on every screen before handoff and again before release. It combines S2's critique dimensions, S5's heuristic scoring, S1's check against defaults, and our domain rules. Score each criterion **1–5**: 1 = blocks users or breaks a rule; 3 = acceptable but with gaps; 5 = nothing to fix. Most real screens score about 3 (S5).

| # | Criterion | What a 5 looks like |
|---|---|---|
| 1 | **Single job** | In 2 seconds a buyer can say what the screen answers and what to do next. The eye lands on the right thing first |
| 2 | **Evidence and honesty** | Every fact has a source, date and confidence. No invented numbers. Records and claims are separate. Uncertainty is shown |
| 3 | **Hierarchy** | A clear reading order. Emphasis from size, weight and space. One primary action |
| 4 | **Distinctiveness** | Nothing from the §2b banned list. The `DESIGN.md` direction is recognisable |
| 5 | **Consistency** | Tokens and library components only. The same concept looks the same everywhere |
| 6 | **States** | Every relevant §2f state is designed |
| 7 | **Accessibility** | Every §2j item passes, including 200% scale, a screen-reader run and a colour-vision check |
| 8 | **Copy and numbers** | Voice per §2i. ₹, dates and units per §2c. Verb-first CTAs |
| 9 | **Platform and performance** | M3 rules followed. Web works at 360/768/1280. WhatsApp variant exists. Budgets met |
| 10 | **Trust and consent** | No CCPA patterns. Consent is visible and reversible. Money disclosure present. No gating before value |

**To ship a screen:**
- a total of **at least 40/50**;
- **no criterion below 3**;
- criteria **2, 7 and 10 at 4 or above**.

**Report format:**
1. Score table.
2. First impression, in 1–2 sentences.
3. What works.
4. Top 3 fixes, each labelled Critical, Moderate or Minor in words (no emoji), with why and how. Suggest alternatives, not only problems (S2).

### (m) Handoff (Next.js + Expo/React Native + Tailwind)

- **Source of truth.** `packages/design-tokens/tokens.json` in W3C DTCG format, in three tiers. A build step (e.g. Style Dictionary) outputs [J]:
  - CSS variables plus a Tailwind v4 `@theme` block for web;
  - a typed TypeScript theme for React Native (used via NativeWind or `StyleSheet`);
  - JSON for Figma variables.
- **Naming.**
  - Tokens: `color.on-surface`, `color.risk.3.fill`, `space.gap-section`, `radius.card`, `motion.duration.base`, `type.title-m`.
  - CSS: `--color-on-surface`. TypeScript: `theme.color.onSurface`.
  - Components are PascalCase: `RiskCard.tsx` for shared logic, `RiskCard.web.tsx` and `RiskCard.native.tsx` for rendering.
  - Props follow M3/MUI: `variant="filled|tonal|outlined|text"`, `size="sm|md|lg"` (S8).
  - Figma names, token names and code names match one-to-one.
- **Tailwind.**
  - Theme tokens only; arbitrary values such as `p-[13px]` and `bg-[#…]` fail lint.
  - No `transition-all` (S6).
  - Dark mode through CSS variables.
  - `font-display: swap`; preload only critical weights (S3).
- **Packages** [J]:
  - `design-tokens`
  - `format` (₹, dates, units, screen-reader strings; unit-tested)
  - `ui-web` (accessible headless primitives)
  - `ui-native`
  - `icons` (one SVG set, one stroke)
- **Component spec template** (S2, S8): purpose; anatomy; props and defaults; variants; states table (§2f); tokens used; content rules (character limits, truncation, long builder names); edge cases (missing data, Limited history, offline); behaviour per window class; motion table; accessibility (role, keyboard, screen-reader text, focus order); rationale; do/don't.
- **Checks.** Storybook (web and React Native) showing every state. Visual regression in light, dark and 2.0 font scale. axe and the Android Accessibility Scanner, plus a manual screen-reader pass, because automated tools catch only about 30% of issues (S2). CI runs the contrast test and the dark-pattern checklist (PRD F-89).
- **Rules for coding agents.**
  - Read `DESIGN.md` and this rulebook first.
  - Never invent a token, colour, font or metric. Ask, or leave a labelled placeholder such as "metric to confirm" (S6).
  - Run §2l and attach the score table to the PR.

---

## 3. Quick card: Do / Don't

| Do | Don't |
|---|---|
| Ground the design in NCR filings, plans and cost sheets; one direction in `DESIGN.md`; one signature element | Blue and gold, skyline heroes, glass, effects everywhere |
| 1–2 faces chosen for this brief, with ₹ and `tnum` checked | Inter, Roboto or Arial as the web voice; ALL-CAPS eyebrows; gradient text |
| ₹2.35 Cr · ₹95 L · ₹1,23,45,678 · 18 Oct 2026, in tabular figures | ₹23,500,000 · "2.35 crores" · 10/11/26 · jittering digits |
| Semantic tokens with `on-*` pairs; contrast checked in CI | Raw hex, `p-[13px]` |
| A 5-step single-hue risk ramp, plus name and meter; "About 38 of 100…" | Traffic lights, gauges, a 300–900 number, "safe builder" |
| Source, date and confidence on every fact; records styled apart from claims | Unsourced claims, invented stats, developer copy styled as fact |
| Skeletons, offline and stale states, Limited history | Blank screens, flashing spinners, silent failures |
| Errors: what happened, why, how to fix. Verb-first CTAs | "Oops!", apologies, "Submit", "Get started" |
| One vector icon set | Emoji or Unicode icons |
| Motion ≤ 300 ms, ease-out, one signature moment | Fade-up everywhere, bounce, `transition-all`, carousels |
| Flexible nav bar, rail at ≥ 600 dp, edge-to-edge, static colour scheme | Drawer, stacked FABs, dynamic colour on the risk scale |
| 48 dp / 44 pt / 44 px targets, 200% font scale, a TalkBack pass | Tiny icon buttons, text in px, meaning carried by colour alone |
| Unticked consent, masked numbers, value before login, labelled AI images | Login walls, countdowns, confirm-shaming, unlabelled AI imagery |
| Score every screen with §2l; ship at ≥ 40/50, no criterion below 3 | Shipping without a critique table |

---

## 4. Sources (all accessed 18 Oct 2026)

**Skills**
- **S1.**
  - Current version (commit 41bbe19, 3 Sep 2026): https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md
  - Plugin copy: https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/frontend-design/skills/frontend-design/SKILL.md
  - Earlier versions: https://raw.githubusercontent.com/anthropics/skills/00756142ab/skills/frontend-design/SKILL.md and https://raw.githubusercontent.com/anthropics/skills/2235be7c60/skills/frontend-design/SKILL.md
- **S2.** https://github.com/anthropics/knowledge-work-plugins/tree/main/design (README plus seven SKILL.md files)
- **S3.** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (`.claude/skills/ui-ux-pro-max/SKILL.md`, `references/quick-reference.md`, `references/pro-rules.md`, `data/*.csv`)
- **S4.** https://github.com/Leonxlnx/taste-skill (`skills/taste-skill/references/tells.md`, `type.md`)
- **S5.** https://github.com/pbakaus/impeccable (`.agents/skills/impeccable/SKILL.md`, `reference/craft-floor.md`, `android.md`, `critique.md`)
- **S6.** https://raw.githubusercontent.com/Nutlope/hallmark/main/skills/hallmark/references/anti-patterns.md
- **S7.** https://raw.githubusercontent.com/emilkowalski/skills/main/skills/review-animations/STANDARDS.md
- **S8.** https://github.com/rikucherry1993/mobile-design-system-skill (`SKILL.md`, `references/design-principles.md`, `component-checklist.md`, `ds-architecture.md`)

**Popularity**
- GitHub REST API repository metadata.
- Paralect, "Top design skills for Claude Code in 2026": https://www.paralect.com/skills/top-design-skills
- Awesome lists: https://github.com/travisvn/awesome-claude-skills and https://github.com/ComposioHQ/awesome-claude-skills

**Platform**
- **P1.**
  - Material Android docs: https://github.com/material-components/material-components-android/blob/master/docs/components/BottomNavigation.md (also `BottomSheet.md`, `FloatingActionButton.md`)
  - Android Developers: https://developer.android.com/develop/ui/compose/designsystems/material3, https://developer.android.com/develop/ui/views/layout/edge-to-edge, https://developer.android.com/about/versions/16/behavior-changes-16
  - M3 Expressive: https://9to5google.com/2025/05/14/material-3-expressive-navigation/, https://supercharge.design/blog/material-3-expressive, https://x.com/GoogleDesign/status/1923045713006518563
- **P2.** https://developer.apple.com/design/human-interface-guidelines/accessibility
- **P3.** https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

**Project.** `product/PRD.md` (v1.0) and `product/BRIEF.md`. The CCPA list was cited from knowledge, not fetched this session; confirm it with counsel.
