# Bundled fonts

Three SIL Open Font License (OFL-1.1) families, bundled so the app has real
glyphs on first launch with no network call. Each family's `OFL.txt` sits
alongside its font file; `pubspec.yaml`'s `fonts:` block registers them, and
`PlinthType` (packages/tokens/dart) and `AppTheme` name them.

FOUNDER_QUESTIONS P10 (20 Oct 2026, `product/design/review/benchmark-thapki.md`):
Figtree for all text, buttons and labels; Bricolage Grotesque at 700 for
display, title and section headings only; Noto Sans as the fallback for Hindi
(Devanagari). Mukta is retired from the app UI.

All three are variable fonts registered once each: Flutter drives the `wght`
axis from `TextStyle.fontWeight`, so a role's weight (400–700) renders as set.

| Family | Files | Source |
|---|---|---|
| Figtree | `figtree/Figtree-Variable.ttf` (variable: wght 300–900). Copied from the founder's Thapki app (`pet_app/app/assets/fonts/Figtree-VariableFont_wght.ttf`) and renamed to match the other families; content is unchanged. | https://github.com/google/fonts/tree/main/ofl/figtree |
| Bricolage Grotesque | `bricolage-grotesque/BricolageGrotesque-Variable.ttf` (variable: opsz, wdth, wght axes; used at weight 700). Renamed on download from upstream's `BricolageGrotesque[opsz,wdth,wght].ttf` — Flutter's asset bundler cannot load a filename containing `[`/`]`; content is unchanged. | https://github.com/google/fonts/blob/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz%2Cwdth%2Cwght%5D.ttf |
| Noto Sans | `noto-sans/NotoSans-Variable.ttf` (variable: wdth, wght axes). Renamed on download from upstream's `NotoSans[wdth,wght].ttf`, same reason as above; content is unchanged. | https://github.com/google/fonts/blob/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf |

Licence: SIL Open Font License 1.1 for all three families. See each
subfolder's `OFL.txt`:

- `figtree/OFL.txt` (Thapki's `OFL-Figtree.txt`) — https://github.com/google/fonts/blob/main/ofl/figtree/OFL.txt
- `bricolage-grotesque/OFL.txt` — https://github.com/google/fonts/blob/main/ofl/bricolagegrotesque/OFL.txt
- `noto-sans/OFL.txt` — https://github.com/google/fonts/blob/main/ofl/notosans/OFL.txt
