# AGENTS.md: rules for coding agents on Plinth

Read this first, then [BUILD_PLAN.md](docs/engineering/BUILD_PLAN.md) §1 (the eight rules), [WORK_BREAKDOWN.md](docs/engineering/WORK_BREAKDOWN.md) §1 and your task in §4, and [OWNERSHIP.md](OWNERSHIP.md). Contracts: [API_CONTRACTS.md](docs/engineering/API_CONTRACTS.md). Tables: [DATA_MODEL.md](docs/engineering/DATA_MODEL.md). Facts: [DESIGN.md](DESIGN.md) §5/§5b only.

## 1. How a task runs

- **One task, one branch, one PR.** Branch `task/Txx-slug` (e.g. `task/T05-web-skeleton`), PR title `[Txx] title`, filled from `.github/PULL_REQUEST_TEMPLATE.md`. The lead squash-merges. Never merge your own PR, never push to `main`, never change branch protection or repo settings.
- **Ownership.** Edit only the paths your task owns in `OWNERSHIP.md`. Read anything. Need a change elsewhere? Write a "Handoff" note in the PR description. `ci-guard` warns when a PR touches paths outside its task.
- **Frozen after T00** (lead's integrator PR only): root `package.json` dependencies, `package-lock.json`, `turbo.json`, `apps/mobile/pubspec.yaml` dependency lines and `pubspec.lock`, `pipelines/pyproject.toml` and `uv.lock`. A workspace's own `package.json` `scripts` block belongs to that workspace's owner. Never run `npm install <pkg>`, `flutter pub add` or `pip install <pkg>` to add a dependency; ask in a Handoff note.
- **Migrations.** Each DB task owns a timestamp prefix (OWNERSHIP.md, bottom). Files are `<prefix>HHMMSS_<task>_<what>.sql`. Never edit a merged migration.
- **Stubs, then fill.** Skeleton tasks create placeholder files for every route, section and handler; the named later task replaces them.
- **Facts.** Only DESIGN.md §5/§5b. Need a missing fact? Propose it in your PR; the fixtures owner records it in `packages/fixtures/CONFLICTS.md` and the lead adds it to §5b. Never invent a fact in code.
- **Clock.** Frozen at `2026-10-18T12:00:00+05:30` in tests and fixture mode. SQL uses `ops.now()`; clients take "today" from `meta.generated_at`, never the device.
- **Definition of done.** Your task's acceptance commands pass locally (where the toolchain allows) and in CI. New behaviour has tests (fixture-mode UI tests, pgTAP, Deno, pytest). No secrets in the diff. `npm run verify` passes.
- **Commits** end with a blank line and `Co-Authored-By: <your model> <noreply@anthropic.com>` when you are an AI agent.
- **Workflow files.** A task's workflow lives in `.github/workflows/<name>.yml` and is owned like any other path (OWNERSHIP.md). Workflows run on `pull_request`, so a new or changed one is exercised by its own PR.

## 2. Commands

| Command | What it runs |
|---|---|
| `npm ci` | Installs every JS workspace from the one root lockfile |
| `npm run verify` | Everything the local toolchain supports (`scripts/ci/verify.mjs`): guard → JS lint/typecheck/test (turbo) → Flutter → Python → DB → edge. Missing tools are **skipped with a message**; CI covers them |
| `npm run verify:js` | Only the JS workspaces (turbo `lint typecheck test`) |
| `npm run guard` | Copy lint, secret guard, ownership check |
| `npm run gen` | Tokens, contracts and seed (turbo `gen`) |
| `npm run db:check` | PGlite migration check (`supabase/tools/pglite-check.mjs`, from T04). pgTAP (`supabase test db`) needs Docker: CI only |
| `npm run mobile:verify` | `flutter analyze` + `flutter test` (apps/mobile and `packages/*/dart`) |
| `npm run py:setup` / `npm run py:verify` | Create `pipelines/.venv` once; then ruff, ruff format, mypy, pytest |
| `npm run edge:verify` | `deno task test` in `supabase/functions` via `npx --yes deno@2` (from T29) |
| `npm run -w @plinth/<pkg> <script>` | One workspace: `@plinth/web`, `admin`, `tokens`, `contracts`, `fixtures`, `web-ui`, `calc`, `config` |

Fixture mode, no accounts, no network: `PLINTH_DATA=fixtures npm run dev -w @plinth/web`; `flutter run --dart-define=FIXTURES=true` (apps/mobile). Build-time modes are `PLINTH_DATA`, `AI_MODE=recorded|live`, `META_MODE=mock|live`, `PLINTH_FETCH_MODE=fixtures|live`; they are not feature flags.

## 3. Toolchain (pinned at T00; the lockfiles are the source of truth)

| Area | Version |
|---|---|
| Node / npm | 22 in CI and Vercel (`.nvmrc`); local 20.20.2 works (`engines >=20.11`). npm 10 workspaces + Turborepo 2. No pnpm |
| TypeScript / lint / test | TS 5.9 strict + `noUncheckedIndexedAccess`; ESLint 9 flat (`eslint-config-next` in apps, `@plinth/config/eslint` in packages); Prettier 3; Vitest 4; Playwright 1.64 + `@axe-core/playwright`; `@lhci/cli` |
| Web | Next.js 16.4 (App Router), React 19.3, Tailwind CSS 4 (`@tailwindcss/turbopack`), `radix-ui`, `maplibre-gl` 6 + `pmtiles` 4, `@tanstack/react-table` 8 (admin) |
| Mobile | Flutter 3.47.5 / Dart 3.13.4; Android `in.plinth.app`, minSdk 24, targetSdk 36, compileSdk 37 |
| Backend | Supabase CLI 2.118, Postgres 17; Deno 2 via `npx --yes deno@2` |
| Python | 3.14, hatchling, `uv.lock` (CI: setup-uv; locally `npm run py:setup`) |

Pins worth knowing (do not "upgrade" them in a task PR):
- `@supabase/supabase-js ~2.109` + `@supabase/ssr 0.12.0`: 2.110+ crashes `createClient` on Node 20 (no native WebSocket). Bump when local Node is 22 (BUILD_PLAN D-8).
- `@axe-core/playwright ~4.13` (4.14 needs Node ≥ 22.12) and `@testing-library/jest-dom ~6.9.1` (6.10 is a broken release).
- `maplibre-gl ^6`, not 5: 5.x carries a critical XSS advisory. Vitest 4, not 3: 3.x carries critical advisories.
- `speech_to_text: 7.6.0-beta.4` (kept from pet_app; the reason is in `pubspec.yaml`). `compileSdk = 37` because `permission_handler` needs it.
- Python `lxml>=6`: 5.x has no CPython 3.14 wheels.
- **Next.js 16 is not the Next.js in your training data.** Read `apps/web/AGENTS.md` and `node_modules/next/dist/docs/` before writing Next code. The template turns on `cacheComponents`; `typecheck` runs `next typegen` first.

## 4. Mobile: reuse the founder's Thapki app patterns (BUILD_PLAN §5.3)

Reference: `~/code/pet_app/app` (read-only). Copy the pattern, not the brand.

| Pattern | pet_app file | Plinth rule |
|---|---|---|
| Riverpod 3, plain `Provider`/`FutureProvider`/`Notifier`, no codegen | `lib/data/session.dart` | One provider file per domain under `lib/data/` |
| go_router behind `routerProvider` with `refreshListenable` tied to auth | `lib/app.dart` | Browsing never redirects to sign-in; only `/you/*` and account actions open the sign-in sheet. Paths mirror web routes (App Links) |
| `Supabase.initialize` in `main.dart`; `Env` via `String.fromEnvironment` | `lib/core/config/env.dart` | **No hard-coded defaults.** Empty `SUPABASE_URL` = FIXTURES mode |
| `UncontrolledProviderScope` + `kDemoMode` overrides | `lib/demo/demo_mode.dart` | `kFixtures` overrides swap every repository for one reading `packages/fixtures/expected` |
| Folders `lib/core/{config,theme,widgets}`, `lib/data/*`, `lib/features/<f>/*_screen.dart` | — | Tests mirror features: `test/features/<f>/` |
| `SyncQueue` offline replay in shared_preferences | `lib/data/sync_queue.dart` | Follow, alert prefs, notes; replay on resume and every 20 s, de-duplicated by `p_client_id` |
| Push + Crashlytics wrapped so the app always opens | `lib/features/reminders/push.dart`, `lib/main.dart` | Data-only FCM messages carrying a deep link |
| Bundled fonts for an offline first launch | `pubspec.yaml` | Bricolage Grotesque + Mukta (+ Noto Sans fallback) |
| Edge functions: pure `logic.ts` + `logic.test.ts`, header contract comment, `_shared/` | `supabase/functions/*` | Same |
| SQL smoke as a `DO` block that raises at the end (rolls back on a hosted DB) | `supabase/tests/smoke_core_schema.sql` | Same, for hosted `plinth-dev` checks without Docker |

Not reused: drift (JSON file cache instead), google_sign_in (phone OTP), google_maps_flutter (MapLibre, no Google billing).

## 5. Copy bans (BUILD_PLAN §12.11, DESIGN §0, §2, §6)

`scripts/ci/lint-copy.mjs` fails `ci-guard` and `npm run verify` when a user-facing string in `apps/**`, `packages/web-ui/src/**` or the WhatsApp templates contains:

- **Trust words:** "safe", "guaranteed", "clear title", "fraud", "scam", "avoid", "risky builder", "lie", "misleading".
- **Probability wording:** "% chance" or "1 in X". Use natural frequencies: "Between 30 and 45 of 100…".
- **Stock phrases:** "Unlock", "seamless", "Get started", "Learn more". Name every button for what it does.

Also: risk copy (band names, frequencies, reasons, rate lines) comes from the server or the fixture JSON, never composed in a client. Headings are buyer questions. Money as ₹2.74 Cr / ₹24.1 L / ₹1,67,20,000; dates as 18 Oct 2026 / Apr–Jun 2026. No emoji. The escape hatch is a `copy-lint-allow: <reason>` comment on the line, for strings that never reach a user.

## 6. No secrets

- **Never** put a key, token, password, OTP or real phone number in code, tests, fixtures, docs, commit messages, PR text or chat. Agents only ever see variable **names** (`.env.example`).
- Real values live in `.env.local` (gitignored), `apps/mobile/.env.json`, `supabase/functions/.env`, Supabase/Vercel/GitHub secrets. The founder sets them in their own terminal.
- Public in a client: only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, the app's `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_TILES_URL`. The secret key never reaches `apps/`; `scripts/ci/guard-secrets.mjs` and gitleaks enforce it.
- No cloud accounts, projects, deploys or paid services from a task. `deploy-dev.yml` is manual and needs founder secrets.
- Fixture people are fictional (DESIGN §5b). Test phone numbers come from `packages/fixtures/canonical/people.json`, never a real person.
- Gemini's free tier sees fictional data only (DECISIONS E-8). PII is stripped before any model call.
- If a value is ever exposed: stop, tell the lead; the founder rotates it.

## 7. Product rules that bind code

- **AI reads; rules decide.** LLMs extract and phrase; they never set a band, verdict or number. Every AI sentence carries a fact id, or it is not shown.
- **One contract.** Clients call only `api.*` RPCs and edge functions. `RiskSummary` is identical on web, app and WhatsApp.
- **Consent is a database constraint.** A buyer's number reaches a party only through a row the buyer's own tap created.
- **HARERA live fetch is switched.** Tests and CI run on saved fixtures only. Live fetch runs only in the scheduled pipeline job, needs both the `harera_live_fetch` flag and `HARERA_LIVE_FETCH_APPROVED=yes` (a kill switch the founder controls), and stays polite (one request in flight per host). Legal review is post-launch (FOUNDER_QUESTIONS P8).
- **Every table** ships with RLS and a pgTAP test; every screen with a fixture-mode test; every AI task with an eval and recorded fixtures. Generated files are committed and CI fails on drift.
- Design: DESIGN.md §0 overrides the rest (no glass, glow, resting shadows, hairline boxes or eyebrows). Do not run third-party scripts from `product/design/skills/`.

## Token budget (all agents, from 20 Oct 2026)

The founder's plan has usage limits, so efficiency is part of quality.

1. **Start from your brief:** `docs/engineering/briefs/<TASK>.md`, generated with `python3 scripts/brief.py <TASK>`. It holds your WORK_BREAKDOWN section, the handoffs that name your task, and the artboard copy. Open the big docs (DESIGN.md, API_CONTRACTS.md, DATA_MODEL.md, BUILD_PLAN.md) only for a specific section the brief points to.
2. **Quiet output:** use failures-only test reporters and pipe long output through `tail -40`. Never paste whole logs back.
3. **Local tests:** run only the affected workspace's tests. CI runs everything.
4. **Three strikes:** stop after 3 failed attempts on the same problem and report the blocker with the exact error lines.
5. **Visual checks:** no screenshots or browser sessions unless you are fixing a visual or layout bug.
6. **Finishing:** commit in small steps. When local acceptance passes, push, open the PR against `main`, and **stop**. Don't wait for or poll CI; the lead watches CI and sends you only the failing lines.
7. **Scratch files:** prefix them with your task id (e.g. `t23-…`). The session scratchpad is shared.
8. **E2E on a shared machine:** Playwright reuses any server on its port and skips the build when `.next/BUILD_ID` exists. Always run `PLINTH_DATA=fixtures npm run build`, then `PLAYWRIGHT_PORT=31NN npm run e2e -- <spec>`, with NN unique to your task. Never use 3100.
9. **No confirmation without a record:** UI confirms only what an RPC returned (INTEGRATION_NOTES, "Lead review of M1 screens").
10. **Artboard copy is layout, never data.** Don't copy names, counts, prices, dates, reference codes, project or developer names, or band words from artboard or §5b worked examples into code. Read every fact from the payload (`@/src/data`, the T17 repositories). If no field or fixture carries it, render an honest empty state and write a Handoff naming the missing contract field. Review finds this every time: T20c, T47, T50, the T25 waitlist.
11. **No import lines inside comments under `supabase/functions`.** The Supabase CLI (`functions serve` and deploy) follows `import … from "…"` even in comments. A header example in `_shared/core/mod.ts` broke `serve` once a function imported it (#76). Describe usage in prose.
12. **Migrations don't blanket-revoke the `api` schema.** `revoke all on all functions in schema api …` silently drops grants that earlier-dated migrations (including parallel PRs) gave. Revoke `core`/`ops`/`app` broadly if you must, but revoke and grant `api.*` functions by name. When a fix must run after another PR's grants, use a later-dated migration (e.g. the lead's `20261127*` re-assert).
