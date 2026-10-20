# UI benchmark: Plinth app vs Thapki (the real running app)

Lead, 20 Oct 2026. The founder asked for Plinth's UI to be better than Thapki's, using Thapki as the benchmark for cleanliness, font, font size, icons and interactive elements.

**Method.** Both apps were built from source and run on the same Android emulator (`thapki_test`, 1080×2400):
- Thapki in its demo mode (`--dart-define=DEMO=true`), from `~/code/pet_app/app` at 2d490a6;
- Plinth in fixture mode (`--dart-define=FIXTURES=true`), from `main` at 48bd3e3.

Screens compared: Thapki's Today, Pets and the task action sheet, against Plinth's Explore, project page and You. Play Store marketing images were not used.

## Scorecard

| Area | Thapki (actual app) | Plinth (actual app) | Verdict |
|---|---|---|---|
| **Font family** | One family, Figtree (variable), weights 400–700 | Bricolage Grotesque 800 for every heading, Mukta for text | Plinth's heavy 800 display face on every heading reads like a print magazine, not an app. Mukta looks thin and uneven at 13–14 sp. |
| **Type scale** | display 28/34·700, screen title 24/30·700, section 18/23·700, row title 16/21·600, body 16/23, meta 14/19, button 16·700 | display 36·800, h1 30·800, h2 26·800, h3 20·800, body 16/1.55, small 14, caption 13 | Plinth has **no section-header style and no semibold row-title style**. Section headings use h2 (26·800), so "Will it be delivered on time?" is as loud as the page title. |
| **Spacing** | Gutter 20, row min-height 64, section gap ~32 | Gutter 16, section gap 64–88 | Plinth's You screen is mostly empty space between two cards. |
| **Shape** | Cards 20, buttons 16, sheet 28, icon tiles about 12 | Panels 8, pills 999, sheet 28 | Plinth cards look boxy, and pills on large buttons look clumsy. |
| **Icons** | One set: Material *rounded*, at 24 dp and 20 dp | A handful of outlined Material icons; most actions have none | Plinth's "Scan RERA QR" and "Map" buttons have no icons, and lists have no leading icons. |
| **Buttons** | Primary 52–56 high, icon + label on one line, 16 radius; tonal secondary with icon; trailing check circle on rows | Primary 52, but the action bar's "Ask Plinth" **wraps to two lines**; plain grey pills without icons | Plinth has a visible defect (wrapped labels) and weaker affordances. |
| **Inputs** | Ask composer: 56 high, filled, round mic button | Search field about 36 high, very low contrast | Plinth's main entry point looks disabled. |
| **Lists and rows** | Row: coloured left accent bar, title 16·600, subtitle 14 with an inline status in colour ("35 min late"), trailing action; inset hairlines | Cards with stacked lines; no chevron or tap affordance; no visual anchor | Plinth cards are dense and flat. |
| **Chips** | Single-line, horizontally scrolling | Wraps onto two lines ("New Gurugram" alone on line 2) | Fix. |
| **Navigation** | Floating rounded nav bar (76) plus a separate round primary action | Flat full-width bar (64), thin outline icons | Thapki looks more finished. |
| **Sheets** | Grabber, avatar and title, tinted hint row with icon tile, one 56-high primary, grouped list with icon tiles and chevrons | Basic | Adopt Thapki's pattern. |
| **Imagery** | Illustrated pets everywhere; avatars anchor every row | Project hero is a flat grey box; no thumbnails in lists | The app should use the same illustrative images the web already ships. |
| **Toggles** | Segmented controls | Day and Night are two separate pills far apart | Use one segmented control. |

**Where Plinth must stay ahead of Thapki:**
- data instruments (the risk meter, the replay tower);
- sources on every fact;
- a real Night theme;
- strict contrast and 48 dp targets.

Keep all of them.

## Founder decision (20 Oct 2026, FOUNDER_QUESTIONS P10)

**Fonts:**
- **Figtree** (OFL) for all text, buttons and labels, on app and web;
- **Bricolage Grotesque** only for `display`, `title` and `section`, at 700;
- **Noto Sans** stays as the fallback for Hindi (Devanagari).

Mukta is retired from the UI. In the type table below, "text font" means Figtree.

## Spec: app UI v2 (implements the benchmark)

### Tokens (`packages/tokens/tokens.json`, then regenerate)

**Type roles (app and web):**

| Role | Font | Size / line height | Weight | Tracking |
|---|---|---|---|---|
| `display` | Bricolage | 30/34 | 700 | −0.5 |
| `title` (screen titles) | Bricolage | 26/31 | 700 | −0.4 |
| `section` (new) | Bricolage | 20/25 | 700 | −0.2 |
| `rowTitle` (new) | text font | 16/21 | 600 | |
| `body` | text font | 16/23 | 400 | |
| `meta` | text font | 14/19 | 400 | |
| `caption` | text font | 13/17 | 500 | |
| `button` (new) | text font | 16/21 | 700 | |
| `label` (new) | text font | 13/16 | 600 | |

- Numbers keep tabular figures.
- Bricolage is only for `display`, `title` and `section`, at 700, never 800 in the app.

**Radius:**
- `card` 20 (new, replaces `panel` 8 for cards);
- `button` 16;
- `tile` 12 (icon tiles, thumbnails);
- `field` 16;
- `sheet` 28 (unchanged);
- `pill` 999 only for chips and badges.

**Spacing:**
- phone gutter 20;
- section gap 32–40 (from 64–88);
- row min-height 64;
- card padding 16–20.

**Sizes:**
- primary button 56;
- secondary 48;
- field 56;
- nav 72 (floating, with a 16 margin and radius 28);
- icon 24, small 20, tile 40.

### Components (app T15 kit; mirror in the web UI kit later)

1. **Buttons:**
   - icon + label, always a single line (`maxLines: 1`, the label scales down rather than wrapping);
   - primary is filled accent; secondary is tonal with an icon; text buttons have a chevron where they navigate.
2. **Search field:** 56 high, filled `track`, radius 16, leading search icon, `ink2` placeholder that clears AA.
3. **Filter chips:** one horizontally scrolling row, 40 high; selected is filled `inverse`.
4. **Project list row/card:**
   - radius 20, with the illustrative thumbnail (56, radius 12) at the left;
   - name in `rowTitle`, then locality in `meta`;
   - the risk chip, and the price line in `rowTitle` weight;
   - the status line as icon + colour (e.g. the "QPR 187 days old" icon in warning colour);
   - a left accent bar in the band colour, for hard states only;
   - the whole card is tappable, with a trailing chevron.
5. **Action bar** (project page): Follow (primary, icon), Ask (tonal, icon), Share (icon button). Never wrap.
6. **Segmented control** for Day/Night and other two-to-three-way choices.
7. **Bottom sheet:**
   - grabber, header (thumbnail + title + meta);
   - a tinted hint row with an icon tile;
   - one primary button (56);
   - a grouped list with icon tiles, chevrons and inset dividers.
8. **Navigation:** a floating rounded bar with selected icons filled; rounded Material icons only.
9. **Icons:** Material Icons *rounded* everywhere (`Icons.*_rounded`), at 24 dp in navigation and buttons and 20 dp inline. No mixing with outlined or sharp.
10. **Imagery:** the project hero and list thumbnails use the illustrative images already in `apps/web/src/features/home/assets` (bundle them for the app). Keep the "Images on this page are illustrative" caption. Never show a flat grey box.

### Screens to update first

1. **Explore:** title, search, chips, Scan and Map buttons with icons, cards as above.
2. **Project page:** hero image, section headings in `section`, action bar.
3. **You and Privacy:** tighter sections, segmented control, list rows with icon tiles.
4. **Bottom sheets:** Ask, evidence and follow type.

### Acceptance

- Re-render Linux goldens for all changed screens.
- Day and Night both pass AA contrast.
- Labels never wrap at 360 dp width. Add a widget test at a 360 × 640 size.
- Copy lint passes, and no screen loses a fact, source or disclaimer.
