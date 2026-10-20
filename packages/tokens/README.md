# @plinth/tokens

Design tokens for web, admin and the app. Owner: **T01**. Inputs: DESIGN.md §0 (overrides the rest), §3.1–§3.5, §3.2b and §4 items 4–7, plus `product/design/review/app-core.md` ("Changes shared by all five screens") and the post-taste-pass artboard theme objects.

`tokens.json` (DTCG format) is the only file you edit. Style Dictionary 4 resolves it, and custom formats in `scripts/build.mjs` write the outputs. They are committed, and CI fails on drift.

| Output | Use |
|---|---|
| `dist/tokens.css` | CSS custom properties. Day on `:root`, Night on `[data-theme="night"]` (any subtree). Includes a `prefers-reduced-motion` block that zeroes durations and distances |
| `dist/theme.css` | Tailwind CSS v4 `@theme inline`. Imports `tokens.css`. Resets the default palette, fonts, text sizes, radii, shadows, blur and easing so only Plinth values exist |
| `dist/tokens.ts` | Typed constants (`color`, `risk`, `typography`, `space`, `layout`, `radius`, `motion`, `elevation`, `component`, `pattern`) and `cssVar` references; re-exported by `src/index.ts` with WCAG helpers (`contrastRatio`, `toArgb`) |
| `dart/lib/plinth_tokens.dart` | Flutter: `PlinthTokens` (`ThemeExtension`, `day`/`night`, `lerp`, `copyWith`, `of(context)`), `PlinthRisk`, `PlinthBandColors`, `PlinthRiskKey`, `PlinthType`, `PlinthSpace`, `PlinthRadius`, `PlinthLayout`, `PlinthMotion`, `PlinthComponents` |
| `dart/lib/plinth_token_values.dart` | The same values in pure Dart (no Flutter), for `dart test` and tools |

## Commands

```sh
npm run -w @plinth/tokens build      # regenerate everything (also `npm run gen`)
npm run -w @plinth/tokens test       # fresh outputs, CSS ↔ Dart parity, WCAG, no glass, Tailwind compile
cd packages/tokens/dart && dart analyze && dart test   # pure-Dart checks (test/values)
cd packages/tokens/dart && flutter test                # also the ThemeExtension tests (test/flutter)
```

## Using them

Web (Tailwind v4), in the app's global CSS:

```css
@import "tailwindcss";
@import "@plinth/tokens/theme.css";
```

Then `bg-track text-ink`, `bg-risk-elevated-fill`, `text-question font-display`, `rounded-pill`, `shadow-sheet` (floating surfaces only), `max-w-content`. Night: `<html data-theme="night">`. In SVG or inline styles use `cssVar.risk.elevated.ink` (`var(--pl-risk-elevated-ink)`), which follows the theme.

Flutter:

```dart
ThemeData(extensions: const [PlinthTokens.day]);   // or PlinthTokens.night
final t = PlinthTokens.of(context);
Text('…', style: PlinthType.body.copyWith(color: t.ink));
```

The app must bundle the fonts under the family names `Bricolage Grotesque` and `Figtree` (fallback `Noto Sans`). `PlinthType.textFamily` is whichever stack the app's text roles use: `font.family.ui` (Figtree) since FOUNDER_QUESTIONS P10. The web keeps `font.family.text` (Mukta) until its follow-up.

## Rules the tokens encode

- **No glass, glow or gradients.** Every colour is opaque or fully `transparent`. The two documented exceptions are `scrim` (neutral scrim under text on a photo) and the `sheet` shadow (floating surfaces only). Night values that were translucent in the artboards are flattened over the surface they sit on; each one's `$description` says which.
- **Risk ramp** (`risk.{day,night}.{low…severe,limited,notScored}.{ink,fill,text}`): never reused for anything else. On Day, Low and Moderate names use `ink` because their inks fail 4.5:1. Limited history sits on `track` with a dashed meter. Band names, frequencies and reasons are server copy, not tokens.
- **Type:** `typography.web` (px, emitted as rem; `hero` and `question` are fluid `clamp()`s from §0) and `typography.app` (sp). Letter spacing is in em; Flutter gets px. App roles follow app UI v2 (`product/design/review/benchmark-thapki.md`): Bricolage 700 for `display`, `title` and `section` only; Figtree for `rowTitle`, `body`, `meta`, `caption`, `button`, `label` and the rest. `h1`, `h2` and `small` are legacy aliases of `title`, `section` and `meta`.
- **Radius:** media `none`, panels and tone fields `panel` (8), chips and badges `pill`. App UI v2 adds `tile` (12, icon tiles and thumbnails), `button` and `field` (16), `card` (20) and `sheet` (28); the web adopts them in a follow-up.

## Artboard name → token name

Most names match the artboards' `T` object. These differ:

| Artboard | Token |
|---|---|
| `panelSolid` (and the old glass `panel`) | `panel` |
| `headerBg` | `header` |
| `navInd` | `navIndicator` |
| `glassInk` | `onGlass` (`glass` itself is now opaque) |
| `segOn` | `segmentOn` |
| `segOff`, `segEmpty` | `meterOff` |
| `slab`, `onSlab`, `onSlab2`, `slabOff` | unchanged |
| `overlay`, `chipBg`, `glow`, `hatch`, `shadow`, `claim` | dropped (glass, glow, gradient or dashed border); the hatch is built from the band ink, and the shadow is `elevation.sheet` |

Values used by only a few artboards (verdict colours, chat bubbles, map styling, switch colours) are not tokens yet. A task that needs one asks for it in a Handoff note.
