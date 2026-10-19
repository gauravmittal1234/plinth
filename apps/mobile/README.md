# apps/mobile: Plinth for Android (Flutter)

Flutter 3.47.5 / Dart 3.13.4. Android first; iOS is R2.

```bash
flutter pub get
flutter analyze
flutter test
flutter run --dart-define=FIXTURES=true        # no accounts, no network
```

- Owned by T06 (skeleton), then per feature folder (see `/OWNERSHIP.md`).
- Dependency lines in `pubspec.yaml` are frozen after T00. Ask the lead for an integrator PR.
- Patterns come from the founder's Thapki app: see `/AGENTS.md` and BUILD_PLAN §5.3.
- App values go in `apps/mobile/.env.json` (gitignored) via `--dart-define-from-file`. Never commit it.
