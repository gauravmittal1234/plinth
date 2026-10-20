# apps/mobile: Plinth for Android (Flutter)

Flutter 3.47.5 / Dart 3.13.4. Android first; iOS is R2.

```bash
flutter pub get
flutter analyze
flutter test                                    # widget tests, every route, goldens
flutter run --dart-define=FIXTURES=true         # no accounts, no network
flutter build apk --debug --dart-define=FIXTURES=true
```

## Modes

- **FIXTURES** (`--dart-define=FIXTURES=true`, or any build without `SUPABASE_URL`): no Supabase, no Firebase, the clock frozen at 18 Oct 2026, 12:00 IST, and every repository swapped for a fixture one (`lib/fixtures/fixture_mode.dart` → `lib/data/fixture_providers.dart`, T17). `--dart-define=START_PATH=/gurugram/projects/aurelia-heights-phase-2` opens a fixtures build on any screen; `?state=severe` on a project path previews an AppProjectStates variant.
- **Live**: `flutter run --dart-define-from-file=.env.json` with `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `apps/mobile/.env.json` (gitignored; never commit it). There are no default values. Crash reports and push start only here, guarded so the app opens without Firebase.

## Layout (pet_app patterns, BUILD_PLAN §5.3)

| Path | What | Owner |
|---|---|---|
| `lib/main.dart` | Edge to edge, Supabase only when configured, guarded crash reports and push, `UncontrolledProviderScope` | T06 |
| `lib/app/` | `PlinthApp`, `routerProvider` (go_router, `refreshListenable` on sign-in), the 4-tab shell, route table, placeholders, Day/Night mode | T06 |
| `lib/core/config/env.dart` | `--dart-define` values, no defaults | T06 |
| `lib/core/theme/app_theme.dart` | Material 3 Day/Night. T07 swaps its palette for the `PlinthTokens` ThemeExtension | T06, then T07 |
| `lib/core/widgets/` | Widget kit | T15 |
| `lib/core/push/` | Push (stub here) | T48 |
| `lib/data/` | Repositories, `session.dart` (stub here), `fixture_providers.dart`, SyncQueue | T17 |
| `lib/features/<f>/` | One folder per screen group; each starts as an `ArtboardPlaceholder` | WORK_BREAKDOWN §2.2 |
| `test/<mirror of lib>/` | Tests mirror features (`test/features/<f>/`) | Each folder's owner |

Routes (WORK_BREAKDOWN §2.2): tabs `/explore` (+ `/explore/map`), `/following` (+ `/following/family`), `/ask`, `/you` (+ `/you/privacy`); full screen `/welcome`, `/gurugram/projects/:slug` (+ `/risk`), `/j/:code`, `/scan`, `/check/claims` (+ `/:id`), `/check/cost-sheet`, `/check/before-you-pay`, `/check/pay-as-built`, `/visits/:id`, `/visualise` (+ `/:id`). Browsing never asks anyone to sign in; signed out, `/you/*` opens the You tab with the sign-in sheet. `test/app/router_test.dart` pumps every route and fails when a new route has no sample.

Android App Links: `https://plinth.in` paths `/gurugram/projects/`, `/following`, `/j/` (see `AndroidManifest.xml`; add a prefix only with its screen).

## Goldens

Tagged `golden` (`dart_test.yaml`). Goldens are rendered and compared on **Linux only** (ci-mobile), because a Mac anti-aliases glyph edges differently (about 3% of a text-heavy screen). On a Mac the golden tests still pump their screens but skip the pixel comparison and refuse `--update-goldens` (`test/flutter_test_config.dart`). To re-render: on Linux, `flutter test --tags golden --update-goldens`; otherwise run ci-mobile by hand (`gh workflow run ci-mobile.yml --ref <branch> -f update_goldens=true`) and commit the PNGs from its `goldens-linux` artifact, or take `*_testImage.png` from a failed run's `golden-failures` artifact. Linux tolerance is 0.1%. Fonts listed in `pubspec.yaml` are loaded for tests automatically; until the brand fonts are bundled, text renders as the test font's boxes.

## Rules

- Dependency lines in `pubspec.yaml` and `pubspec.lock` are frozen after T00: ask the lead for an integrator PR.
- No secrets: only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (public by design) reach the app.
- Copy: layout copy from the artboards (`python3 scripts/artboard_text.py product/design/artboards/App<Name>.dc.html`), risk copy from the server or fixture JSON; the copy lint runs on `lib/`.
