# Bundled fonts

Three SIL Open Font License (OFL-1.1) families, downloaded from the official
Google Fonts GitHub repository (`google/fonts`, `main` branch) so the app has
real glyphs on first launch with no network call. Each family's `OFL.txt`
sits alongside its font files; see T06's `pubspec.yaml` `fonts:` block for
how they are registered (`PlinthType` in `packages/tokens/dart` and
`AppTheme` name them: Bricolage Grotesque for display, Mukta for text, Noto
Sans as the text fallback).

| Family | Files | Source |
|---|---|---|
| Bricolage Grotesque | `bricolage-grotesque/BricolageGrotesque[opsz,wdth,wght].ttf` (variable: opsz, wdth, wght axes; used at weight 800) | https://github.com/google/fonts/blob/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz%2Cwdth%2Cwght%5D.ttf |
| Mukta | `mukta/Mukta-Regular.ttf` (400), `mukta/Mukta-Medium.ttf` (500), `mukta/Mukta-SemiBold.ttf` (600), `mukta/Mukta-Bold.ttf` (700) | https://github.com/google/fonts/tree/main/ofl/mukta |
| Noto Sans | `noto-sans/NotoSans[wdth,wght].ttf` (variable: wdth, wght axes) | https://github.com/google/fonts/blob/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf |

Licence: SIL Open Font License 1.1 for all three families. See each
subfolder's `OFL.txt`:

- `bricolage-grotesque/OFL.txt` — https://github.com/google/fonts/blob/main/ofl/bricolagegrotesque/OFL.txt
- `mukta/OFL.txt` — https://github.com/google/fonts/blob/main/ofl/mukta/OFL.txt
- `noto-sans/OFL.txt` — https://github.com/google/fonts/blob/main/ofl/notosans/OFL.txt
