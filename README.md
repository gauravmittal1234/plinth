# Plinth

A buyer-side, AI-first home-buying platform for Gurugram (Delhi NCR). Its core is a **Delivery Risk band** for under-construction projects (Low · Moderate · Elevated · High · Severe), built from public RERA records. **No developer pays us. Ever.**

## Where things are

| Path | What |
|---|---|
| `reports/` | Phase 1 research: market, opportunities, risk-scoring method |
| `product/PRD.md` | Product requirements (v1.1, §20 has the R1 scope decisions D11–D15) |
| `product/FOUNDER_QUESTIONS.md` | Open founder, legal and CA questions, plus decisions taken as acting PM |
| `DESIGN.md` | Design system "Daylight Live", taste rules, and **§5b, the canonical fictional data set** used by every screen and by the seed data |
| `product/design/artboards/` | All R1 screens (web, Android, WhatsApp) as Design-canvas artboards |
| `product/evaluation/` | Buyer, developer and broker evaluations and the gap tracker |
| `docs/engineering/` | Build plan, data model, API contracts, work breakdown, founder setup, decisions |
| `scripts/` | Image generation (Gemini) and artboard helpers; `scripts/ci/` holds the repo checks |
| `apps/web`, `apps/admin` | Next.js 16 (App Router): public site + buyer web, and the ops console |
| `apps/mobile` | Flutter (Android first) |
| `packages/` | `tokens`, `contracts`, `fixtures`, `web-ui`, `calc`, `config` (npm workspaces) |
| `supabase/` | Postgres 17 migrations, seed, pgTAP tests, Deno edge functions |
| `pipelines/` | Python 3.14: HARERA sources (fixtures only), scoring v1.2, publish |

Coding agents start with [AGENTS.md](AGENTS.md) and [OWNERSHIP.md](OWNERSHIP.md). The plan is [docs/engineering/BUILD_PLAN.md](docs/engineering/BUILD_PLAN.md); tasks are in [WORK_BREAKDOWN.md](docs/engineering/WORK_BREAKDOWN.md).

## Getting started

You need Node 22 (CI and Vercel; Node ≥ 20.11 works locally), npm 10, Flutter 3.47.5, Python 3.14 and Supabase CLI 2.118. Docker is optional: without it, the database tests run in CI.

```bash
npm ci                    # JS workspaces (one root package-lock.json)
npm run verify            # everything the local toolchain supports; skips the rest with a message
npm run py:setup          # once: pipelines/.venv for the Python checks
```

| Command | What it runs |
|---|---|
| `npm run verify` | Copy lint, secret guard, then lint + typecheck + test in every JS workspace, Flutter analyze + test, Python ruff + mypy + pytest, the DB and edge checks once they exist |
| `npm run gen` | Tokens, contracts and seed generation |
| `npm run db:check` | PGlite migration check (T04); pgTAP needs Docker and runs in CI |
| `npm run mobile:verify` | `flutter analyze` + `flutter test` |
| `npm run py:verify` | ruff, mypy and pytest for `pipelines/` |
| `npm run -w @plinth/<pkg> <script>` | One workspace's script, e.g. `npm run -w @plinth/web dev` |

Everything runs on the §5b fixtures with no accounts and no network: `PLINTH_DATA=fixtures npm run dev -w @plinth/web` for the web, `flutter run --dart-define=FIXTURES=true` in `apps/mobile` for the app. The clock is frozen at 18 Oct 2026, 12:00 IST.

## Secrets

Keys live in `.env.local`, which is gitignored and never committed. `.env.example` lists every variable name with no values. See `docs/engineering/SETUP_FOR_FOUNDER.md`.
