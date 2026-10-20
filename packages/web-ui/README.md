# @plinth/web-ui

React components shared by `apps/web` and `apps/admin`. Owner: **T14**. Inputs: DESIGN.md §0 (taste rules, which override the rest), §4 items 1–16, §4a (guided story), §4b (live instruments) and the artboards (`WebProject.dc.html`, `WebProjectStates.dc.html`, `LiveDay.dc.html`).

**Rules the kit keeps**

- Props are typed from `@plinth/contracts`. **No component writes a word.** Risk copy (band names, frequencies, reasons, lines) comes from the payload; layout copy (headings, button names, legend names, "Close evidence") comes from the page, which takes it from the artboard. A test fails if a component holds JSX text or a literal `aria-label`.
- Colours are tokens only: Tailwind classes from `@plinth/tokens/theme.css`, or `var(--pl-…)`. Band colours are set per element as `--ui-band-ink/fill/text` (pointing at `--pl-risk-<band>-…`), so Day and Night follow `data-theme` on any ancestor with no re-render. `plinth/no-hex-colour` runs in lint and in the tests.
- No glass, glow, outlines, eyebrows or floating pills. Shadows only on what floats (`Sheet`, `Toast`). The risk chip is borderless everywhere.
- Every instrument puts its final state in the markup; motion only decorates the way there and stops under `prefers-reduced-motion` (tokens zero every duration; each animated utility sets `animation: none`).

## Use

```css
/* the app's global CSS */
@import "tailwindcss";
@import "@plinth/tokens/theme.css";
@import "@plinth/web-ui/styles.css"; /* @source for the kit, the hatch, keyframes, the night: variant */
```

```tsx
import { RiskChip, RiskHeader, IconArray, ReasonList, EvidenceDrawer } from "@plinth/web-ui";

<RiskChip chip={risk.chip} srPrefix="Delivery risk: " />
<IconArray frequency={risk.frequency} band={risk.band?.code}
  legend={{ late: "More than 12 months late", within: "Within 12 months" }} />
```

## Components

| Group | Component | Notes |
|---|---|---|
| Risk | `RiskChip` | `chip` from any payload. `surface="track"` on a track band |
| | `Meter` | 5 segments, filled cumulatively to `meter_filled` (or a band's step). Dashed for Limited history, outlined for Not scored, plain for withheld. Sizes s 6×10, m 16×12, l 20×15 |
| | `RiskHeader` | Meter + band name (or the chip's label when unscored), the red-flag rule's line, then confidence on its own line |
| | `BandScale` | `bands` = `Methodology.bands`; a real `<ol>` with `aria-current` on the band |
| | `ConfidenceDots` | CSS circles (●● high, ●○ low) with `confidence.line` |
| | `IconArray` | 10×10 from `frequency.icon_array`, hatched uncertain range, named by `frequency.sentence` |
| | `Riskometer` | Five arcs, needle sweep 1.4 s once; final angle always in the markup |
| Evidence | `ReasonList` | A real `<ol>` of ≤ 4 reasons, factor first, source chips. `onOpenSource` makes chips buttons; otherwise they link to `evidence_url` |
| | `SourceChip` | Filled tone pill, no border. Button, link or text |
| | `EvidenceDrawer` | `Evidence` in a `Sheet`; field names come in `labels` |
| | `DeveloperSaysField` | Claim tone (`claim-bg`) with a speech mark; `compact` or `full` |
| | `FromDeveloperBlock` | "From the developer · not verified by Plinth": current price list + payment plan; `flagStage` marks a stage (slab 12) |
| | `PendingFact` | The fact, its marker line and the developer's claim. Never a proposed band |
| | `DisclaimerLine` | `meta.disclaimer_line`, never collapsed, with the page's links |
| Data | `FactTile`, `FactTiles` | A `<dl>` of tiles; `emphasis` accent or band |
| | `CostTable` | `CostBreakdown` lines, tags named by the page, the all-in row |
| | `TowerStack` | CSS 3D, one slab per floor, sold outline in the band ink, 45 ms stagger. `slabsFromPct()` for phase-level QPRs. `aria-hidden`: pair it with `FactTiles` |
| | `ReplaySlider` | Native range + Earlier/Later buttons (`aria-disabled` at the ends, so focus stays). Controlled |
| Primitives | `SectionBand` | Full-bleed band, `bg` or `track`, 1264 px column |
| | `Pill` | Tag, or a toggle button (`as="button"`, `pressed`) |
| | `Button` | primary (accent) / secondary (tone fill) / tertiary (ink underline); `asChild` for links |
| | `Sheet` | Radix Dialog as a side sheet (bottom sheet on a phone); non-modal by default; focus returns to the opener |
| | `Toast` | Always-present polite live region; leaves after 3.2 s |

On the story's dark stage, wrap the tower and its tiles in `data-theme="night"`: every token takes its Night value.

## Commands

```sh
npm run -w @plinth/web-ui test        # fixtures × components × Day/Night with jest-axe, behaviour, reduced motion, tokens only
npm run -w @plinth/web-ui lint        # ESLint incl. plinth/no-hex-colour
npm run -w @plinth/web-ui typecheck
```

The tests render every component on the Aurelia, Laurel, Juniper and Aurelia facts-only fixtures (`packages/fixtures/expected`), check that every class rendered exists in the tokens' Tailwind theme, and that every `--pl-` variable the kit reads is declared in `dist/tokens.css`. jsdom has no layout, so colour contrast is held by `@plinth/tokens`' WCAG tests and the Playwright axe runs in `apps/web`.

## Showcase

`apps/web/app/__kit/` composes the kit like the project page, with a fixture and Night switch. Next treats `_`-prefixed folders as private, so it is not routed on its own (and never reaches a production build); a dev-only route re-exports it (see the T14 PR's handoff).
