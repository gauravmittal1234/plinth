# Work breakdown: M0–M2, agent-sized tasks

Status: ready, 19 Oct 2026 · Read [BUILD_PLAN.md](BUILD_PLAN.md) §1 first. Contracts: [API_CONTRACTS.md](API_CONTRACTS.md). Tables: [DATA_MODEL.md](DATA_MODEL.md).

Each task is at most about one day of agent work. It owns its paths exclusively, lists its dependencies and inputs, and ends with acceptance tests that a reviewer (or CI) can run.

---

## 1. Rules for every task

1. **Ownership.** Edit only the paths under **Owns**. Read anything. If you need a change in someone else's path, write a "Handoff" note in your PR description and don't edit it. Ownership passes to a later task only when this document says so; that handover is always sequential, never parallel.
2. **Frozen shared files.** After T00 merges, these change only through a small integrator PR (the lead): root `package.json` dependencies, `package-lock.json`, `turbo.json`, `apps/mobile/pubspec.yaml` dependencies and `pubspec.lock`, `pipelines/pyproject.toml` and `uv.lock`. A workspace's own `package.json` **`scripts`** block belongs to that workspace's owner.
3. **Migrations.** Each DB task owns a timestamp prefix (table in §5). File names are `<prefix>HHMMSS_<task>_<what>.sql`. Never edit a merged migration; add a new one in your range.
4. **Stubs, then fill.** Skeleton tasks create placeholder files for every route, section and handler. A later task owns and replaces them. This is how routers and page compositions avoid parallel edits.
5. **Facts.** Use only DESIGN.md §5/§5b. Need a fact that isn't there? Propose it in your PR. The fixtures owner records it in `packages/fixtures/CONFLICTS.md`, and the lead adds it to §5b. Never invent a fact in code.
6. **Copy.** Risk copy comes from the server or fixture JSON. Layout copy comes from the artboard. The banned-word lint (BUILD_PLAN §12.11) must pass.
7. **Clock.** Frozen at `2026-10-18T12:00:00+05:30` in tests and fixture mode.
8. **Definition of done.** Acceptance commands pass locally (where the toolchain allows) and in CI. New behaviour has tests: fixture-mode for UI, pgTAP for SQL, Deno for edge functions, pytest for Python. No secrets in the diff. A PR `[Txx] title` on branch `task/Txx-slug`, squash-merged.
9. **Root commands** (defined by T00):

| Command | What it runs |
|---|---|
| `npm run verify` | All lint, typecheck and tests that the local toolchain supports |
| `npm run gen` | Tokens, contracts and seed |
| `npm run db:check` | PGlite migration check |
| `npm run mobile:verify` | `flutter analyze` + `flutter test` |
| `npm run py:verify` | ruff, mypy and pytest |
| `npm run -w @plinth/<pkg> <script>` | Any one workspace's script |

---

## 2. Screen → route → owner map

The artboards are in `product/design/artboards/` (T00 copies them in). In fixture mode, web state variants preview with `?state=` and Flutter variants with a debug-only state picker. Production state always comes from `RiskSummary.display`.

### 2.1 Web (`apps/web`, Next.js App Router)

| Artboard | Route | Code (route folder + feature folder) | Task | M |
|---|---|---|---|---|
| WebHome | `/` | `app/(public)/page.tsx`, `src/features/home/` | T21 | M1 |
| WebSearch | `/search` | `app/(public)/search/`, `src/features/search/`, `src/features/map/` | T22 | M1 |
| WebProject | `/gurugram/projects/[slug]` | `app/(public)/gurugram/projects/[slug]/`, `src/features/project/` | T20a, T20b | M1 |
| WebProjectStates | same route (Severe, Stalled, Limited history, Not scored, Stale, Re-scoring, Facts-only) | `src/features/project/states/` | T20c | M1 |
| WebDeveloper | `/gurugram/developers/[slug]` | `app/(public)/gurugram/developers/[slug]/`, `src/features/developer/` | T23 | M1 |
| WebCompare | `/compare?p=a,b,c` and `/compare/[a]-vs-[b]` | `app/(public)/compare/`, `src/features/compare/` | T24 | M1 |
| WebMethodology | `/methodology` | `app/(public)/methodology/`, `src/features/trust/methodology/` | T25 | M1 |
| WebAbout | `/about` | `app/(public)/about/`, `src/features/trust/about/` | T25 | M1 |
| WebPricing | `/pricing` | `app/(public)/pricing/`, `src/features/pricing/` | T26 | M1 |
| (share cards) | `/cards/*`, `/c/[code]` | `app/cards/`, `app/c/`, `src/features/cards/` | T27 | M1 |
| WebSignIn | `/sign-in?next=` | `app/(auth)/sign-in/`, `src/features/auth/` | T47 | M2 |
| WebFollowing | `/following` | `app/(account)/following/`, `src/features/following/` | T49 | M2 |
| WebPrivacy | `/privacy` | `app/(account)/privacy/`, `src/features/privacy/` | T51 | M2 |
| (family opt-in, relative's page) | `/j/[code]` | `app/j/[code]/`, `src/features/family/` | T52 | M2 |
| WebCostSheet | `/check/cost-sheet` | `app/(public)/check/cost-sheet/` | — | M3 |
| WebClaims | `/check/claims`, `/check/claims/[id]` | `app/(public)/check/claims/` | — | M3 |
| WebBeforePay | `/check/before-you-pay` | `app/(public)/check/before-you-pay/` | — | M3 |
| WebPayAsBuilt | `/check/pay-as-built` | `app/(public)/check/pay-as-built/` | — | M3 |
| WebDevOnboarding | `/workspace/claim` | `app/(workspace)/workspace/claim/` | — | M4 |
| WebDevPortal | `/workspace` (anchors `#legal`, `#signals`, `#path-back`) | `app/(workspace)/workspace/` | — | M4 |
| WebDevInbox | `/workspace/inbox` | `app/(workspace)/workspace/inbox/` | — | M4 |
| WebDevLiveRecord | `/workspace/live-record` (+ `/r/[code]`) | `app/(workspace)/workspace/live-record/`, `app/r/` | — | M4 |
| WebDevFacts | `/workspace/facts?tab=` | `app/(workspace)/workspace/facts/` | — | M4 |
| AppDevCapture (**phone web, not Flutter**) | `/capture/[token]` | `app/capture/[token]/` | — | M4 |
| WebVisualise | `/visualise` | `app/(public)/visualise/` | — | M5 |
| WebForAgents | `/agents` | `app/(public)/agents/` | — | M5 |
| WebAgentProfile | `/agents/[slug]`, `/agents/[slug]/briefs` | `app/(public)/agents/[slug]/` | — | M5 |
| WebBrokerCheck | `/check/broker` | `app/(public)/check/broker/` | — | M5 |

### 2.2 Android (`apps/mobile`, go_router; paths mirror the web so App Links open the same URL)

| Artboard | go_router path | Code | Task | M |
|---|---|---|---|---|
| AppOnboarding | `/welcome` (first run), sign-in sheet | `lib/features/onboarding/` | T48 | M2 |
| AppExplore | `/explore` (tab 1) | `lib/features/explore/explore_screen.dart` | T30 | M1 |
| AppMap | `/explore/map` | `lib/features/explore/map_screen.dart` | T30 | M1 |
| AppProject | `/gurugram/projects/:slug` | `lib/features/project/` | T31a | M1 |
| AppProjectStates | same path (7 states) | `lib/features/project/states/` | T31b | M1 |
| AppRisk | `/gurugram/projects/:slug/risk` | `lib/features/risk/` | T32 | M1 |
| AppFollowing | `/following` (tab 2) | `lib/features/following/` | T50 | M2 |
| AppFamily | `/following/family`; deep link `/j/:code` | `lib/features/family/` | T50 | M2 |
| AppYou | `/you` (tab 4), `/you/privacy` | `lib/features/you/` | T51 | M2 |
| AppVoice (Ask Plinth) | `/ask` (tab 3) | `lib/features/ask/` (placeholder until M5) | — | M5 |
| AppScan | `/scan` (RERA QR · Where am I? · Check claims) | `lib/features/scan/` | — | M5 |
| AppClaims | `/check/claims`, `/check/claims/:id`; share-sheet intake | `lib/features/checks/claims/` | — | M3 |
| AppCostSheet (*artboard pending*) | `/check/cost-sheet` | `lib/features/checks/cost_sheet/` | — | M3 |
| AppBeforePay | `/check/before-you-pay` | `lib/features/checks/before_pay/` | — | M3 |
| AppPayAsBuilt (*artboard pending*) | `/check/pay-as-built` | `lib/features/checks/pay_as_built/` | — | M3 |
| AppVisitPass | `/visits/:id` | `lib/features/visits/` | — | M5 |
| AppVisualiseCapture / AppVisualiseResult | `/visualise`, `/visualise/:id` | `lib/features/visualise/` | — | M5 |

### 2.3 WhatsApp (`supabase/functions/wa-webhook`, `wa-flows`, outbox templates)

| Artboard | Handler and template files | Templates / Flows | Task | M |
|---|---|---|---|---|
| WaRisk | `wa-webhook/handlers/risk_card.ts`, `handlers/card_changed.ts` | Session card + replies | T46a | M2 |
| WaAlerts | `handlers/prefs.ts`; `_shared/wa/templates/{band_change_alert,filing_alert,login_code}.ts` | `band_change_alert`, `filing_alert`, `login_code`; visit Flow M5 | T46b (+T41 login) | M2 |
| WaDigest | `handlers/digest.ts`, `handlers/family_join.ts`; `templates/{weekly_digest,daily_digest,family_removed}.ts` | `weekly_digest` (Sun 9 am), `daily_digest` | T46b | M2 |
| WaCost | `handlers/cost.ts` | Session card + list | — | M3 |
| WaClaims | `handlers/claims.ts` | Session card + confirm buttons | — | M3 |
| WaBeforePay (*artboard pending*) | `handlers/before_pay.ts` | Session card | — | M3 |
| WaDevAlerts | `handlers/dev.ts`; `templates/dev_*.ts`; `wa-flows/flows/dev_receipt.ts` | `dev_*`, `developer_replied` | — | M4 |
| WaVisitPass | `handlers/visit.ts`; `wa-flows/flows/visit_booking.ts` | `visit_*` | — | M5 |
| WaAgentOnboarding | `wa-flows/flows/agent_onboarding.ts` | `agent_verified` | — | M5 |

---

## 3. Waves

```text
Wave 0 (solo)      T00 Repo bootstrap
Wave 1 (M0, ×6)    T01 Tokens · T02 Contracts · T03 Fixtures A · T04 DB core · T05 Web skeleton · T06 Mobile skeleton
Gate               T07 M0 integration gate
Wave 2 (M1, ×9)    T03b Fixtures B · T10 Pipelines core · T11 Scoring v1.2 · T12 API reads A · T14 Web UI kit
                   T15 App widget kit · T16 Web data layer · T17 App data layer · T29 Edge foundation
Wave 3 (M1, ×14)   T13 API reads B · T18 HARERA parsers · T20a WebProject core · T21 WebHome · T22 WebSearch
                   T23 WebDeveloper · T24 WebCompare · T25 Methodology+About · T26 Pricing · T27 Cards
                   T28 SEO · T30 AppExplore+Map · T31a AppProject · T32 AppRisk
Wave 3b (M1, ×3)   T20b WebProject sections · T20c WebProjectStates · T31b AppProjectStates
Gate               T39 M1 exit gate
Wave 4 (M2, ×11)   T40 DB people+consent · T41 Auth · T42 Outbox · T43a Events · T44 WA infra · T54 Admin shell
                   T47 WebSignIn · T49 WebFollowing · T50 AppFollowing+Family · T51 Privacy (web+app) · T52 /j/ page
Wave 5 (M2, ×7)    T43b Fan-out+digest+feed · T45a Buyer RPCs · T45b Privacy RPCs · T46a WaRisk · T48 AppOnboarding+push
                   then T46b WaAlerts+Digest (after T45a) · T53 DPDP edge functions (after T45b)
Gate               T59 M2 exit gate
```

The wave-4 UI tasks (T47, T49–T52) build and pass in **fixture mode**. Their live wiring is checked in T59, once the wave-5 RPCs exist.

---

## 4. Tasks

Format: **Owns** · **Depends** · **Inputs** · **Build** · **Accept**.

### Wave 0

#### T00 · Repo bootstrap (solo, first)
- **Owns:**
  - root files: `package.json`, `package-lock.json`, `turbo.json`, `.nvmrc` (22), `.editorconfig`, `.gitignore`, `.env.example`, `README.md`, `AGENTS.md`, `OWNERSHIP.md`, `.github/PULL_REQUEST_TEMPLATE.md`;
  - workflows: `.github/workflows/{ci-guard,nightly,deploy-dev}.yml`;
  - docs: `docs/adr/**`, `docs/runbooks/README.md`;
  - `product/design/artboards/**` (copy-in only);
  - initial placeholders of every workspace (handed over in wave 1).
- **Depends:** none.
- **Inputs:** BUILD_PLAN §4–§5, §8; this document §1–§2; the canvas in the session scratchpad (`…/scratchpad/canvas/project/*.dc.html` + `canvas.json`).
- **Build:**
  1. **Copy all artboards into the repo first.**
  2. `git init`, connect `origin` (github.com/gauravmittal1234/plinth), and protect `main` with `gh api`.
  3. Create the npm workspaces (`apps/web`, `apps/admin`, `packages/*`) via `create-next-app` for web and admin.
  4. Run `flutter create --org in.plinth --project-name plinth --platforms android apps/mobile`, with **every R1 pub dependency** from BUILD_PLAN §5.3, plus path dependencies on `packages/{tokens,contracts,fixtures}/dart` (empty placeholder packages).
  5. Run `supabase init`. In `config.toml`: `api.schemas = ["api"]`, `[db.seed] sql_paths = ["./seed/*.sql"]`, auth phone enabled with test OTP placeholders.
  6. Create `pipelines/pyproject.toml` with all R1 Python dependencies, plus `uv.lock` (via a temporary venv-installed uv).
  7. Write the standard `scripts` in every workspace and add root `verify`, `gen`, `db:check`, `mobile:verify`, `py:verify`.
  8. `AGENTS.md`: the rules of §1, the commands, the pet_app patterns (BUILD_PLAN §5.3), the copy bans and "no secrets".
  9. `OWNERSHIP.md`: the path → task table from §4.
  10. `.env.example`: every name in SETUP_FOR_FOUNDER.md.
  11. `ci-guard.yml`: gitleaks, secret-pattern greps and the copy lint.
- **Accept:**
  - `npm ci && npm run verify` passes on the empty skeleton;
  - `cd apps/mobile && flutter pub get && flutter analyze`;
  - `find product/design/artboards -name '*.dc.html' | wc -l` ≥ 57;
  - `ci-guard` is green on the bootstrap PR;
  - `gh api repos/:owner/:repo/branches/main/protection` returns protection.

### Wave 1 (M0, run in parallel right after T00)

#### T01 · Design tokens
- **Owns:** `packages/tokens/**` (incl. `dart/`), `.github/workflows/ci-tokens.yml`.
- **Depends:** T00.
- **Inputs:**
  - DESIGN §0, which overrides the rest (no glass/glow/resting shadows; `claim-bg` #F1ECE2 / #1D2621; type sizes);
  - §3.1–§3.5, §3.2b (Day/Night `T`), §4 items 4–7 (chip, meter, scale, icon array);
  - app-core.md "Changes shared…" (opaque `glass`, `nav` #EFECE5/#121D19, `slabOff`).
- **Build:**
  - `tokens.json`:
    - colour.day/night;
    - risk.day/night × 5 bands (ink, fill, text) plus Limited history and Not scored;
    - type families (Bricolage Grotesque 800, Mukta 400–700), web px and app sp scales;
    - space (4-px steps), radius, motion (rise 16–32 px, stagger 60–90 ms, needle 1.4 s), sheet elevation.
  - Style Dictionary 4 formats:
    - `dist/tokens.css` (CSS vars; `[data-theme=night]`);
    - `dist/theme.css` (Tailwind v4 `@theme`);
    - `dist/tokens.ts`;
    - `dart/lib/plinth_tokens.dart` (`PlinthTokens extends ThemeExtension` with `day`/`night` + `lerp`, `PlinthRisk`, `PlinthType`, `PlinthSpace`, `PlinthRadius`).
- **Accept:**
  - `npm run -w @plinth/tokens build` leaves zero git diff;
  - `npm run -w @plinth/tokens test`:
    - every colour is identical in the CSS and Dart outputs;
    - text pairs meet WCAG ≥ 4.5:1 (Low and Moderate names use `ink`);
    - no token contains `blur`, `gradient` or `rgba(…)` glass values except the documented scrim;
  - `cd packages/tokens/dart && dart analyze && dart test`.

#### T02 · Contracts and codegen
- **Owns:** `packages/contracts/**` (schemas, openapi, catalogues, examples, scripts, `gen/`, `dart/`, `python/`), `.github/workflows/ci-contracts.yml`.
- **Depends:** T00.
- **Inputs:** API_CONTRACTS §1–§5; DATA_MODEL §0 enums; BUILD_PLAN §10 (flags), §11 (events), §14 (AI tasks).
- **Build:**
  - JSON Schema 2020-12 for every type in API_CONTRACTS §2 and §4: RiskSummary and sub-objects, ProjectPage, SearchResults, DeveloperPage, Compare, Evidence, Methodology, About, Flags, Follow, FollowingFeed, AlertPrefs, WhoHasMyNumber, FamilyInvite(+Preview), ShareCard, DocCheck, CostBreakdown, AffordTheWait, PayeeCheck, AskAnswer, Error.
  - Catalogues: `flags.json`, `events.json`, `reason_codes.json`, `wa_templates.json`, `ai_tasks.json`, `purposes.json`, `ref_formats.json` (C-MMDD-NN regex `^C-(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])-\d{2,}$`, plus R-, CL-, D-, EV-, LN-, E-, G-).
  - `openapi/plinth.yaml` covering RPC paths and edge functions.
  - `scripts/gen.mjs` → TS types + ajv standalone validators, Dart package `plinth_contracts` (quicktype, null-safe), Python package `plinth_contracts` (Pydantic v2).
  - `examples/` with ≥ 1 valid and 1 invalid example per schema. The Aurelia RiskSummary from API_CONTRACTS §2.1 is verbatim.
- **Accept:**
  - `npm run -w @plinth/contracts gen` leaves zero diff;
  - `npm run -w @plinth/contracts test`: every schema compiles; valid examples pass and invalid ones fail; the ref regex accepts `C-1018-11` and rejects `PLN-C-261017-0623`;
  - `cd packages/contracts/dart && dart analyze`;
  - `pip install -e packages/contracts/python && python -c "import plinth_contracts"`.

#### T03 · Fixtures A: catalogue, evidence, scoring, expected reads, vectors
- **Owns:**
  - `packages/fixtures/canonical/{catalogue,evidence,scoring,developer_content}.json`;
  - `packages/fixtures/expected/{risk_summary,project_page,developer_page,search_projects,compare,evidence,methodology,about,flags}/**`;
  - `packages/fixtures/vectors/**`, `packages/fixtures/media/**`, `packages/fixtures/seedmap/{catalogue,evidence,scoring,developer_content}.mjs`;
  - `packages/fixtures/scripts/{build-seed,validate,sync-dart}.mjs`, `packages/fixtures/dart/**` (assets copy), `packages/fixtures/CONFLICTS.md`;
  - `supabase/seed/**` (generated).
- **Depends:** T00. Soft: T02 (validate against schemas once merged; until then author to API_CONTRACTS), T04 (table names per DATA_MODEL).
- **Inputs:** DESIGN §5 and **all of §5b**; API_CONTRACTS §2 and §4; DATA_MODEL §1–§4; artboards AppRisk and WebProject for evidence copy.
- **Build:**
  - **Canonical JSON:**
    - 8 phases + Northfield's 6 finished phases;
    - groups with claim state;
    - towers and unit types;
    - registrations with collection accounts;
    - 14 Aurelia filing rows (progress only on the 8 §5b quarters);
    - tower slabs, extensions, the MoHUA blanket extension, orders/complaints with units bases, Elmstone's insolvency;
    - snapshots and facts with extracts and read notes;
    - models v1.0–v1.2, runs, reasons (exact texts), band history, notices (heads-up 30 Sep; 7-day 18 Oct → 25 Oct), the illustrative calibration;
    - price lists, plans, the Aurelia cost sheet;
    - Sapphire re-score and Coral stale facts.
  - **Expected outputs** for every M1 read and key:
    - `risk_summary` ×8;
    - `project_page` ×8, including `afford_default`;
    - `developer_page` ×6 groups;
    - `search_projects` ×5 canonical queries, incl. zero results;
    - `compare` (aurelia, kestrel, sapphire);
    - `evidence` ×4 Aurelia reason facts;
    - `methodology`, `about`, `flags`.
  - **Vectors:** cost (Aurelia; waiving PLC + club), Afford the wait (defaults; 12/24 months), 10% cap, time used (Aurelia quarters → 10…70%, 77% today), Late12 (Apr 2029), formatting (₹ and dates).
  - **Seed:** `build-seed.mjs` emits `supabase/seed/10_catalogue.sql`, `20_evidence.sql`, `30_scoring.sql`, `35_developer_content.sql`. It skips any seedmap whose `requires` marker isn't present in `supabase/migrations`.
  - **CONFLICTS.md:** registration months derived from time used, flagging Kestrel (Nov 2025 vs 63% built); Heron Point registered 28 Apr 2026; Laurel registered Nov 2020; the all-in rounding convention (BUILD_PLAN D-6).
- **Accept:**
  - `npm run -w @plinth/fixtures validate`: all expected JSON validates against the schemas once T02 is merged;
  - `npm run -w @plinth/fixtures test`: the seed builds deterministically (stable hash); the vectors are internally consistent (₹2,74,00,400 → "₹2.74 Cr"; ₹1,18,077; ₹24.4 L);
  - every §5b number used appears in a canonical file with a `source: "DESIGN §5b"` note.

#### T04 · Database core schema and RLS baseline
- **Owns:** `supabase/migrations/20261020*`, `supabase/tests/{rls,core}/**`, `supabase/tests/shim/**`, `supabase/tools/pglite-check.mjs`, `.github/workflows/ci-db.yml`.
- **Depends:** T00.
- **Inputs:** DATA_MODEL §0–§3, the §10 tables `ops.audit_log`, `ops.ref_counters` and `ops.feature_flags`, and §12 invariants 1, 3 and 6; BUILD_PLAN §9 (clock), §12.
- **Build:**
  - Extensions: postgis, vector, pg_trgm, pgcrypto, pg_cron, pg_net, pgmq.
  - Schemas `core`, `ws`, `app`, `comms`, `pii`, `ops`, `api`, with privileges revoked from `public`/anon/authenticated. Role `pipeline_writer`.
  - Domains: band, lane, factor, score_state, verdict.
  - Helpers:
    - `ops.now()` (fixed clock only when `plinth.env` ∈ test, fixture);
    - `ops.next_ref(prefix)` (IST; widens NN past 99);
    - audit and immutability trigger functions;
    - `ops.has_role()`;
    - formatters `ops.fmt_inr_short/exact`, `ops.fmt_date`, `ops.fmt_month`, `ops.fmt_quarter`, tested against the vectors.
  - All §1–§3 tables with indexes and RLS enabled. `api.flags()` with seeded flag rows.
  - `ci-db.yml`: `supabase db start` → `db reset` → `test db` → `npm run -w @plinth/fixtures test:api` (a no-op until T12) → `db lint --level error`, plus a PGlite job using the shim.
- **Accept:**
  - `npm run db:check` (PGlite) passes locally;
  - CI: migrations + seed apply on PG17;
  - pgTAP:
    - `anon`/`authenticated` get permission denied on every table;
    - update/delete on snapshots, facts and audit fails;
    - `ops.next_ref('C')` gives `C-1018-01` under the fixed clock;
    - `ops.fmt_inr_short(27400400) = '₹2.74 Cr'`;
    - `pipeline_writer` cannot select `ws`, `app` or `pii`;
  - `supabase db lint` is clean.

#### T05 · Web skeleton (fixture mode)
- **Owns:** `apps/web/**` (feature and route folders pass to the tasks named in §2.1), `packages/config/**`, `.github/workflows/ci-web.yml`.
- **Depends:** T00. Soft: T01 (import `@plinth/tokens/css`).
- **Inputs:** BUILD_PLAN §5.2; §2.1 of this doc; DESIGN §0, §4 (header/footer), §4a; WebHome and WebMethodology artboards for the shell.
- **Build:**
  - Next 16 App Router with route groups `(public)`, `(account)`, `(auth)`, `(workspace)` and **a stub route file for every row of §2.1**, each rendering `<Placeholder artboard="…"/>`.
  - Root layout: fonts, Day default with a Night toggle (`data-theme`), tokens CSS. Shell header (wordmark, 3–5 links, one action) and footer slab ("Plinth", "No developer pays us. Ever.").
  - `src/data/index.ts` with **signatures** for every M1–M2 function in API_CONTRACTS §3.1–§3.2, returning fixture JSON (T16 implements them).
  - `/.well-known/assetlinks.json` and `/api/health`.
  - Vitest and Playwright configs; a route smoke test over every §2.1 path; Lighthouse CI config.
  - ESLint: no hex literals outside tokens. `scripts/lint-copy.mjs` for banned words.
- **Accept:** with `PLINTH_DATA=fixtures`, `npm run -w @plinth/web lint && npm run -w @plinth/web typecheck && npm run -w @plinth/web test && npm run -w @plinth/web build && npm run -w @plinth/web e2e:smoke`. Every route returns 200 and shows its artboard name. The copy lint passes.

#### T06 · Mobile skeleton (pet_app patterns)
- **Owns:** `apps/mobile/**` except dependency lines in `pubspec.yaml`, plus `.github/workflows/ci-mobile.yml`. Ownership of `lib/core/widgets/` passes to T15, `lib/data/` to T17 and `lib/features/<f>/` to the tasks in §2.2.
- **Depends:** T00. Soft: T01 (`plinth_tokens`).
- **Inputs:** BUILD_PLAN §5.3 (pet_app reuse table); `~/code/pet_app/app/lib/{main.dart,app.dart,data/session.dart,demo/demo_mode.dart,core/config/env.dart}`; §2.2 of this doc.
- **Build:**
  - `main.dart`: edge-to-edge; `Supabase.initialize` only when `SUPABASE_URL` is set; otherwise FIXTURES mode; push and Crashlytics init wrapped in try/catch.
  - `lib/app/{app.dart,router.dart,shell.dart}`: `routerProvider` + `refreshListenable`. **All §2.2 paths registered** to placeholder screens inside each feature folder. The 4-tab shell: Explore · Following · Ask · You.
  - `lib/core/config/env.dart` (no default keys). `lib/core/theme/app_theme.dart` (Material 3 + the `PlinthTokens` extension, Day/Night).
  - `lib/fixtures/fixture_mode.dart` (`kFixtures`) wiring a `fixtureOverrides` list defined in `lib/data/fixture_providers.dart` (an empty file here; T17 owns it).
  - `test/flutter_test_config.dart` (loads bundled fonts; golden tag). Android App Links intent filters for `plinth.in` paths.
- **Accept:**
  - `flutter analyze` is clean;
  - `flutter test` passes, including a test that pumps every registered route;
  - `flutter build apk --debug --dart-define=FIXTURES=true` succeeds;
  - CI uploads the debug APK artifact.

### Gate

#### T07 · M0 integration gate (lead or one agent, ~½ day)
- **Owns:** `supabase/tests/seed/**`, `apps/web/e2e/gates/m0.spec.ts`, `apps/mobile/test/gates/m0_test.dart`.
- **Depends:** T01–T06.
- **Build:**
  - pgTAP seed assertions: phase count; Aurelia 72 / 41 / 77 and the late filings; band history (no Elevated before 2 Oct 2026); Laurel's red flag; notice dates.
  - Web gate: the Aurelia route shows "Elevated" and Kestrel shows "Low" from the expected JSON.
  - App gate: Explore lists the seeded phases.
- **Accept:** every workflow is green on `main`, and the M0 exit list in BUILD_PLAN §3 is ticked in the PR body.

### Wave 2 (M1)

#### T03b · Fixtures B: people, consent, family, workspace, agents, checks, WhatsApp payloads
- **Owns:**
  - `packages/fixtures/canonical/{people,consents,family,workspace,agents,visits,checks}.json`;
  - `packages/fixtures/expected/{following_feed,who_has_my_number,family_invite_preview,alert_prefs,share_card,doc_check,cost_breakdown,afford_the_wait,payee_check}/**`;
  - `packages/fixtures/recorded/wa/**`;
  - `packages/fixtures/seedmap/{people,consents,family,comms}.mjs` (`requires` markers `m2_people`, `m2_comms`).
- **Depends:** T03.
- **Inputs:** DESIGN §5b (Who has my number, consent history, Following/digest/family, workspace, agents, visit pass, Pay-as-built, Before you pay, claims examples); fix-since-family.md; fix-claims.md.
- **Build:**
  - Rohan:
    - 4 follows since 1 Jul;
    - last look 14 Oct 08:40;
    - prefs (WhatsApp on, weekly Sun 9 am);
    - 5 consents with C-MMDD-NN refs;
    - 3 number holders + 1 relay;
    - his circle: Meera joined 6 Oct, her father invited 18 Oct with `AH2-7KQ` / `RC4-2MW`, expiring 25 Oct.
  - Kavya's booking and demand letter. The flyer's 7 claims and the hoarding's 3. The payment request (0 of 3).
  - The Northfield team, the 7 inbox records and disputes. Agents.
  - **Recorded Meta payloads:** text "aurelia", RERA number, "JOIN AH2-7KQ", "STOP", image, audio, button replies, a status callback.
  - The seed bumps `ops.ref_counters` to the highest seeded NN per prefix and day (C-1018-11 → the next is C-1018-12), so live refs never collide with fixture refs.
- **Accept:** `npm run -w @plinth/fixtures validate && npm run -w @plinth/fixtures test`. The expected `following_feed` shows exactly **5** changes and the summary line from fix-since-family; `who_has_my_number` gives "3 parties can reach you".

#### T10 · Pipelines core
- **Owns:** `pipelines/**` except `pipelines/plinth/{scoring,sources}/**` and `pipelines/tests/{scoring,sources}/**`; `.github/workflows/ci-pipelines.yml`.
- **Depends:** T00, T02 (`plinth_contracts`), T04 (tables).
- **Inputs:** platform_architecture §4.1–§4.3; BUILD_PLAN §1 rule 8, §12.5.
- **Build:**
  - `plinth/core`:
    - config and modes;
    - frozen clock;
    - httpx fetcher: 1 request per 3–5 s per host, UA with a contact email, robots check, backoff on 429/5xx, **live mode refused unless `harera_live_fetch` and `HARERA_LIVE_FETCH_APPROVED=yes`**;
    - fixtures fetcher;
    - snapshot store (sha256, local dir or Storage; DB row as `pipeline_writer`);
    - facts writer with supersede chains;
    - PII stripper;
    - `ops.job_runs` logging.
  - The CLI `plinth-pipe` (argparse).
- **Accept:**
  - `pytest pipelines/tests/core`: live is refused without both keys; limiter timing; snapshot idempotent by hash; supersede chain intact; "+91 98…" and emails stripped;
  - `ruff check pipelines && mypy pipelines/plinth/core`.

#### T11 · Scoring engine v1.2 (reproduces §5b)
- **Owns:** `pipelines/plinth/scoring/**` (incl. `models/v1.0.yaml`, `v1.1.yaml`, `v1.2.yaml`), `pipelines/tests/scoring/**`.
- **Depends:** T03 (canonical facts), T02. It runs on canonical JSON with no DB, so it can run alongside T10.
- **Inputs:** BUILD_PLAN §7.1 (**every row is a test**); PRD §6.2; the risk report's "Recommended v1" (weights 30/30/20/15/5, red flags, confidence, natural frequencies).
- **Build:**
  - **Features:** sold − built; month-based time used; late filings in the last 8; complaints per 100 units; group track record; extensions; stale age; stall.
  - **Scorecard:** WoE bins → logistic → p(Late12) → band thresholds.
  - **Rules:** red flags RF1–RF4; confidence; limited history (< 3 finished); not scored (< 6 months).
  - **Outputs:** frequency (point or range from the calibration); reasons ranked by contribution, using the catalogue texts; what would change (smallest band-crossing change); Late12 with blanket extensions.
  - **Runs:** band-history replay over v1.0/1.1/1.2 cutoffs; notice proposal (25 Oct); 72-hour re-score window.
  - `plinth-pipe score --fixtures --as-of 2026-10-14 --emit json`.
- **Accept:**
  - `pytest pipelines/tests/scoring`: all §7.1 cases plus the hypothesis properties;
  - `plinth-pipe score --fixtures --as-of 2026-10-14 --emit json | diff - packages/fixtures/canonical/scoring.json` produces no output;
  - `mypy --strict pipelines/plinth/scoring`.

#### T12 · API reads A: `risk_summary`, `evidence`
- **Owns:** `supabase/migrations/20261101*`, `supabase/tests/api/{risk_summary,evidence}*.sql`, `packages/fixtures/scripts/api-contract-test.mjs`.
- **Depends:** T04, T03, T02.
- **Inputs:** API_CONTRACTS §2, §4.1, §4.6; DATA_MODEL §12 invariants 2 and 8; `ws.developer_claims` and `ws.developer_replies` (created here).
- **Build:**
  - `api.risk_summary(p_slug)`:
    - published runs only;
    - chip and display state, honouring `bands_public`, facts-only and the state;
    - pending facts with Developer says (never `to_band`);
    - `late12`, complaints rate, price from the seeded all-in fact (M3 swaps in `core.all_in()`), `share` block.
  - `api.evidence(p_fact_id)`.
  - A contract-test runner comparing live output with `expected/` (ignoring ids and `generated_at`).
- **Accept:**
  - `supabase test db`: grants; `bands_public=false` nulls band, frequency and reasons; facts-only nulls them; a pending notice's band never appears;
  - `npm run -w @plinth/fixtures test:api -- --only risk_summary,evidence`: all 8 summaries and 4 evidence items deep-equal.

#### T14 · Web UI kit (`packages/web-ui`)
- **Owns:** `packages/web-ui/**`, `apps/web/app/__kit/**` (a dev-only showcase route, excluded from production builds).
- **Depends:** T01, T02, T05.
- **Inputs:** DESIGN §0, §4 (1–16), §4b live components; LiveDay.dc.html (riskometer arcs and needle, 3D tower, replay, icon array).
- **Build:**
  - Risk: `RiskChip`, `RiskHeader`, `BandScale`, `Meter`, `ConfidenceDots`, `IconArray` (with hatch), `Riskometer` (needle sweep with a reduced-motion final state).
  - Evidence: `ReasonList` (a real `<ol>`), `SourceChip`, `EvidenceDrawer` (Radix Sheet), `DeveloperSaysField` (claim tone), `FromDeveloperBlock`, `PendingFact`, `DisclaimerLine`.
  - Data and instruments: `FactTile`, `CostTable`, `TowerStack` (CSS 3D, 20 slabs, sold outline), `ReplaySlider` (+ arrow step buttons).
  - Primitives: `SectionBand`, `Pill`, `Button` (primary/secondary/tertiary), `Sheet`, `Toast`.
  - Props are typed from `@plinth/contracts`; no copy is composed inside components.
- **Accept:** `npm run -w @plinth/web-ui test`:
  - each component renders the Aurelia, Laurel, Juniper and facts-only fixtures;
  - jest-axe finds no violations;
  - the meter fills `step` segments;
  - reduced motion renders the final state;
  - lint finds no hex literals.

#### T15 · App widget kit
- **Owns:** `apps/mobile/lib/core/widgets/**`, `apps/mobile/test/core/widgets/**`, `apps/mobile/test/goldens/widgets/**`.
- **Depends:** T01, T02, T06.
- **Inputs:** as T14, plus DESIGN §4.16 (Android nav, bottom sheet heights 112 dp / half / full, sticky action bar, no FAB).
- **Build:** Flutter equivalents of T14's components (`Riskometer` and `IconArray` as `CustomPainter`; `TowerStack` with a `Transform` 3D), plus `BottomActionBar` and `PeekSheet`. Semantics labels, e.g. "Delivery risk Elevated, step 3 of 5".
- **Accept:** `flutter test test/core/widgets`. Linux CI goldens for every widget × Day/Night × the 5 bands + Limited history / Not scored / withheld. A semantics test for the chip and meter.

#### T16 · Web data layer
- **Owns:** `apps/web/src/data/**`, `apps/web/src/lib/supabase/**`, `apps/web/app/api/revalidate/**`.
- **Depends:** T02, T05.
- **Inputs:** API_CONTRACTS §1, §3.1–§3.2 (M1–M2 rows).
- **Build:**
  - Implement every signature T05 declared, behind two adapters:
    - **fixtures:** reads `packages/fixtures/expected`; holds writes in an in-memory session;
    - **supabase:** `schema('api').rpc`, with cookie sessions from `@supabase/ssr`.
  - ajv validation in dev and test; error-code mapping; ISR tags (`phase:<slug>` …); `POST /api/revalidate` with the secret.
- **Accept:** `npm run -w @plinth/web test -- data`:
  - every read returns schema-valid data for every expected key in fixture mode;
  - the supabase adapter sends `Content-Profile: api` and `p_` args (mocked fetch);
  - revalidate rejects a wrong secret.

#### T17 · App data layer
- **Owns:** `apps/mobile/lib/data/**` (incl. `fixture_providers.dart`), `apps/mobile/test/data/**`.
- **Depends:** T02, T06.
- **Inputs:** API_CONTRACTS §1, §3; pet_app `data/session.dart` and `data/sync_queue.dart`.
- **Build:**
  - Repositories (Project, Search, Developer, Compare, Evidence, Flags, Follow, Alerts, Family, Privacy, Auth), each with Fixture and Supabase implementations and Riverpod providers.
  - A JSON file cache of followed projects for offline use, showing "as of".
  - `SyncQueue` for follow, prefs and notes.
  - `fixtureOverrides`.
- **Accept:** `flutter test test/data`:
  - fixture repositories return contract models for every key;
  - SyncQueue replays in order and de-duplicates by `p_client_id`;
  - the offline cache returns the last payload with its date;
  - Supabase repositories call the right `api` function names (fake client).

#### T29 · Edge foundation
- **Owns:** `supabase/functions/_shared/{core,testing}/**`, `supabase/functions/health/**`, `supabase/functions/deno.json`, `.github/workflows/ci-edge.yml`.
- **Depends:** T00, T02.
- **Inputs:** BUILD_PLAN §11–§12; pet_app `supabase/functions/*` style (header contract comment, `logic.ts` + `logic.test.ts`).
- **Build:**
  - Shared modules: env loader; JSON logger with request id; error/response helpers (contract error codes); a supabase client factory (anon, user and secret variants); dispatch-secret and Standard-Webhooks verification; rate-limit helper (`ops.rate_limits`); ajv validation of bodies.
  - The `health` function. Test helpers (a fake Request, a frozen clock).
- **Accept:** `npx --yes deno@2 task test` (or `deno test`) passes. `ci-edge` is green. `health` returns `{ ok: true }` under `supabase functions serve` in CI.

### Wave 3 (M1)

#### T13 · API reads B: `project_page`, `developer_page`, `search_projects`, `suggest`, `compare`, `methodology`, `about`
- **Owns:** `supabase/migrations/20261102*`, `supabase/tests/api/{project_page,developer_page,search,compare,methodology,about}*.sql`.
- **Depends:** T12.
- **Inputs:** API_CONTRACTS §3.1, §4.2–§4.5; DATA_MODEL §1–§4 (it creates `ws.price_lists`, `price_list_items`, `payment_plans`, `payment_plan_stages`, `cost_sheets`, `cost_sheet_lines`, `developer_documents` and `core.cost_rule_sets`, plus `core.all_in()` and `core.afford_the_wait()`).
- **Build:**
  - The listed functions: per-tower progress, homes, "From the developer", next steps with the lower-band-nearby rule (same corridor, lower band, all-in within 20%), `afford_default`, before-booking blocks ("Loan checks arrive in 2027").
  - Search: deterministic query parsing (BHK, budget "2.5 cr", corridor synonyms, typos via pg_trgm), "Low keeps Low and Moderate" with the hidden count, facts-only phases kept in results.
- **Accept:**
  - `npm run -w @plinth/fixtures test:api -- --only project_page,developer_page,search_projects,compare,methodology,about` all deep-equal;
  - pgTAP: `core.all_in(aurelia) = 27400400`, and the Afford-the-wait vectors match exactly.

#### T18 · HARERA parsers on fixtures
- **Owns:** `pipelines/plinth/sources/harera/**`, `pipelines/tests/sources/harera/**`, `pipelines/tests/fixtures/harera/**`.
- **Depends:** T10.
- **Inputs:** `research_notes/Developer and project risk scoring/ncr_risk_data_sources.md`; the risk report's HARERA section; platform_architecture §4.2–§4.3.
- **Build:**
  - **Synthetic** fixtures shaped like HARERA (registered list HTML, Form A-H, QPR POST response, corrigendum JSON, judgments index) for the §5b phases, including dirty cases (negative collections, "31/06/2026").
  - Parsers → records → facts with page refs. Validators. Missing-QPR detection by due date. Heartbeat when the hash is unchanged.
  - `fixtures/harera/real/` is reserved for ≤ 10 pages hand-saved by the founder; tests skip if it's empty.
- **Accept:**
  - `pytest pipelines/tests/sources/harera` golden outputs pass;
  - `plinth-pipe harera run --fixtures --as-of 2026-10-14 --emit facts` equals the canonical Aurelia QPR and filing facts (the **pipeline ↔ seed equivalence** test).

#### T20a · WebProject: page composition, hero, risk, next steps, built (replay signature), records
- **Owns:** `apps/web/app/(public)/gurugram/projects/[slug]/**`, `apps/web/src/features/project/{page,sections/hero,sections/risk,sections/next,sections/built,sections/records}/**`, `apps/web/e2e/project.spec.ts`. It creates **stubs** for `sections/{homes,developer,cost,wait,booking,prerera,picture,ask}/` and `simple/` (→ T20b) and `states/` (→ T20c).
- **Depends:** T14, T16.
- **Inputs:** WebProject.dc.html; fix-project2.md §1 (G-08, G-18, G-23, G-27, G-33); fixpass-buyer.md §1; web-core.md §3; DESIGN §4a.
- **Build:**
  - Guided story with alternating bands and a sticky "On this page" rail with scroll-spy.
  - Hero: one summary line, Follow and Ask, the claim line.
  - Risk answer: riskometer/icon-array toggle, confidence line, Late12 line, "OC is not the keys", pending fact + Developer says + marker, 4 reasons with evidence, what would change, developer response.
  - "So what do we do now?".
  - **Replay tower** with the tower picker and step buttons (the signature).
  - Records + evidence drawer.
  - `generateMetadata`, ISR tags, `notFound` handling.
- **Accept:** `npm run -w @plinth/web e2e -- project.spec.ts` (fixtures):
  - "Elevated", "Between 30 and 45 of 100" and "after Apr 2029" are visible;
  - the replay never shows Elevated before the Jun 2026 stop, and "Elevated since 2 Oct 2026" shows at today;
  - picking tower A shows "Tower A, slab 9 of 20";
  - the evidence drawer opens with "Filed 15 Jul 2026";
  - axe is clean; the Lighthouse budget passes.

#### T21 · WebHome
- **Owns:** `apps/web/app/(public)/page.tsx`, `apps/web/src/features/home/**`, `apps/web/e2e/home.spec.ts`.
- **Depends:** T14, T16.
- **Inputs:** WebHome.dc.html; web-core.md §1; fixpass-consistency WebHome; fix-broker BG-12 (money list row for partner agents); §5b money lines.
- **Build:**
  - Hero signature: type a project name and its risk card assembles (`api.suggest` → `risk_summary`).
  - "This week in filings" from fixtures. Coverage and request-a-project. The money ledger: Pro "₹999 per project · 12 months of written updates"; "Loan checks arrive in 2027"; agents line; never developers.
  - Footer close.
- **Accept:** e2e: typing "aure" shows the Aurelia card with Elevated and "₹2.74 Cr all-in · quoted ₹2.35 Cr". No lender is named anywhere (a grep test). axe is clean.

#### T22 · WebSearch (+ shared map component)
- **Owns:** `apps/web/app/(public)/search/**`, `apps/web/src/features/{search,map}/**`, `apps/web/e2e/search.spec.ts`.
- **Depends:** T14, T16.
- **Inputs:** WebSearch.dc.html; web-core.md §2; §5b discovery facts (price display, pins "Pins show all-in prices", zero results, facts-only in results).
- **Build:**
  - List and map (maplibre-gl, no basemap in fixtures; PMTiles when `map_tiles` is on). Filters. A natural-language box.
  - Hidden-count note, zero-results guidance, request a project (R-MMDD-NN), sort line "Order never follows money."
- **Accept:** e2e: the canonical query shows Kestrel with "₹2.44 Cr all-in · quoted ₹2.10 Cr" and "1 project hidden by your filter"; "4 BHK" on Dwarka Expressway returns only Aurelia; the map renders the pins.

#### T23 · WebDeveloper
- **Owns:** `apps/web/app/(public)/gurugram/developers/[slug]/**`, `apps/web/src/features/developer/**`, `apps/web/e2e/developer.spec.ts`.
- **Depends:** T14, T16.
- **Inputs:** WebDeveloper.dc.html; web-tools.md §2; fix-dev2.md G08, G11, G18, G20.
- **Build:** the promised-vs-actual timeline (signature); the complaints chart with Count / Per 100 units modes; the claim line (claimed / not yet claimed); the facts-only mode explainer `#facts-only`; "How do buyers find Northfield's projects?"; pre-RERA; reply.
- **Accept:** e2e: "24 decided against the group, or 0.7 per 100 units" is shown; the facts-only fixture shows "Band withheld · facts only" on every project chip; the not-claimed fixture shows "invited 24 Nov 2025 · not yet claimed".

#### T24 · WebCompare
- **Owns:** `apps/web/app/(public)/compare/**`, `apps/web/src/features/compare/**`, `apps/web/e2e/compare.spec.ts`.
- **Depends:** T14, T16.
- **Inputs:** WebCompare.dc.html; web-tools.md §1; fixpass-consistency WebCompare (pending-fact block).
- **Build:** a 2–4 column compare with add/remove, the pending block, "Band withheld" cells, and the `/compare/[a]-vs-[b]` SEO route. The AI answer stays hidden while `ai_ask` is off (M5).
- **Accept:** e2e: adding Coral shows "progress 187 days old"; the Aurelia cell shows the pending QPR line; the URL state round-trips.

#### T25 · WebMethodology + WebAbout
- **Owns:** `apps/web/app/(public)/{methodology,about}/**`, `apps/web/src/features/trust/**`, `apps/web/e2e/trust.spec.ts`.
- **Depends:** T14, T16.
- **Inputs:** WebMethodology.dc.html, WebAbout.dc.html; web-trust.md §2; fix-trust.md (WebAbout); §5b base rate.
- **Build:**
  - Methodology: factor weights, red-flag rules, confidence states, changelog v1.0–v1.2, a link to the calibration.
  - About: the identity register (founder placeholders, never AI faces), the calibration table signature with the "Illustrative numbers" pill, the response-time board, coverage today/next with Notify me.
- **Accept:** e2e: the calibration shows 36 of 100 (76/212) and Moderate 31 against 15–30; the placeholder text "A real photo, supplied by the founder" is present.

#### T26 · WebPricing
- **Owns:** `apps/web/app/(public)/pricing/**`, `apps/web/src/features/pricing/**`, `apps/web/e2e/pricing.spec.ts`.
- **Depends:** T14, T16.
- **Inputs:** WebPricing.dc.html; fix-trust.md (WebPricing); §5b money lines.
- **Build:** the Free/Pro switch on the Aurelia sample (signature; the left half never changes), "Never on a Plinth paywall", refunds. The buy button raises the "Sample only: nothing was charged" toast while `pro_paywall` is off.
- **Accept:** e2e: toggling Free/Pro changes only the right half (a DOM snapshot of the left half is unchanged); no countdown or pre-ticked box exists.

#### T27 · Share cards
- **Owns:** `apps/web/app/{cards,c}/**`, `apps/web/src/features/cards/**`, `apps/web/test/cards/**`.
- **Depends:** T16, T01.
- **Inputs:** whatsapp.md "card system"; fix-since-family.md (WaDigest header, the changed-since card); §5b share-card rules.
- **Build:**
  - `next/og` cards: risk (1080×1350), cost (1080×1350), digest header (1080×570, one floor per project), changed-since card.
  - Embedded fonts, square media, the signature footer with a QR code. At most 3 lines + a source line; ends "Plinth · No developer pays us. Ever."
- **Accept:** `npm run -w @plinth/web test -- cards`: PNG dimensions are exact; snapshot hashes match within tolerance; the card alt text equals `RiskSummary.share.card_alt`.

#### T28 · SEO plumbing
- **Owns:** `apps/web/app/{sitemap.ts,robots.ts}`, `apps/web/src/seo/**`.
- **Depends:** T16.
- **Inputs:** PRD F-33; platform_architecture §2.1.
- **Build:** a sitemap of phase, developer and compare pairs; JSON-LD builders (BreadcrumbList, Place/Residence with the RERA number, Organization); canonical URLs; OG images pointing at `/cards`; `noindex` on account and workspace pages.
- **Accept:** unit tests validate the JSON-LD shape; `/robots.txt` disallows `/following`, `/privacy`, `/workspace` and `/capture`.

#### T30 · AppExplore + AppMap
- **Owns:** `apps/mobile/lib/features/explore/**`, `apps/mobile/test/features/explore/**`.
- **Depends:** T15, T17.
- **Inputs:** AppExplore.dc.html, AppMap.dc.html; app-core.md (AppExplore, AppMap); §5b price display.
- **Build:**
  - Explore: search, corridor chips, list cards (all-in first), a scan entry (→ `/scan` placeholder).
  - Map: `maplibre_gl` with a no-basemap style in fixtures (verify PMTiles support; if missing, file a Handoff note), all-in pins, a peek/half/full bottom sheet, the legend.
- **Accept:** widget tests and goldens (Day/Night). Tapping the Aurelia card navigates to `/gurugram/projects/aurelia-heights-phase-2`. Pins show "₹2.74 Cr".

#### T31a · AppProject
- **Owns:** `apps/mobile/lib/features/project/**` except `states/`, and `apps/mobile/test/features/project/**` except `states/`. It creates a `states/` stub (→ T31b).
- **Depends:** T15, T17.
- **Inputs:** AppProject.dc.html; fix-project2.md; fixpass-buyer.md §2.
- **Build:** Hero → Risk → So what now → Before booking (collapsed) → Built (tower picker, step buttons) → Homes (plan, 3/4 BHK) → Pay (static cost) → Afford the wait (static `afford_default`) → Furnish link. A bottom action bar (Follow / Ask / Share) and Simple view.
- **Accept:** widget tests: the Late12 line reads "after Apr 2029"; picking Tower A shows "slab 9 of 20"; the Simple view's read-aloud steps through its 6 blocks (a fake TTS). Goldens Day/Night.

#### T32 · AppRisk
- **Owns:** `apps/mobile/lib/features/risk/**`, `apps/mobile/test/features/risk/**`.
- **Depends:** T15, T17.
- **Inputs:** AppRisk.dc.html; app-core.md (AppRisk); fix-project2.md §2(d).
- **Build:** the dial / 100-projects toggle; 4 reasons with the evidence sheet (dates, extract, read note, "View on HARERA"); what would change; Developer says; the pending fact; so what now; the pre-RERA expander; sharing the card URL via share_plus.
- **Accept:** widget tests: the evidence sheet for reason 2 lists "Jul–Sep 2024 (12 days late), Jan–Mar 2025 (41 days) and Oct–Dec 2025 (38 days)". Goldens for the 5 bands.

### Wave 3b (M1)

#### T20b · WebProject sections: homes, From the developer, cost, wait, before booking, pre-RERA, picture, ask, Simple view
- **Owns:** `apps/web/src/features/project/{sections/homes,sections/developer,sections/cost,sections/wait,sections/booking,sections/prerera,sections/picture,sections/ask,simple}/**`.
- **Depends:** T20a.
- **Inputs:** WebProject.dc.html; fixpass-buyer.md §1 (homes, wait); fix-project2.md (G-14, G-15, G-16, G-17, G-27, G-35, G-40, G-41).
- **Build:** the SVG floor plans (3/4 BHK) with lanes; waterlogging reports; the "From the developer · not verified by Plinth" block with slab 12 flagged; the static cost table; the Afford-the-wait chart from `afford_default` (inputs disabled until M3's `calc_live`); the before-booking explainers ("Loan checks arrive in 2027"); pre-RERA; Simple view with read-aloud.
- **Accept:** e2e: "No 4 BHK cost sheet, so no all-in yet" appears; the wait section shows ₹1,18,077 and ₹2,00,563; no lender name appears; Simple view renders at 24 px body.

#### T20c · WebProjectStates
- **Owns:** `apps/web/src/features/project/states/**`, `apps/web/e2e/project-states.spec.ts`.
- **Depends:** T20a.
- **Inputs:** WebProjectStates.dc.html; fixpass-buyer.md §4; fix-project2.md §2(b)(c) and the facts-only row.
- **Build:** the Severe (rule field), Stalled (4 slabs + overdue bar), Limited history, Not scored, Stale (age bars against the 120-day line), Re-scoring (step track) and Facts-only states, each with "If you've already booked here" and the I've-booked toggle.
- **Accept:** e2e over the 6 phase fixtures plus the facts-only fixture: Laurel shows "set by red-flag rule 1, not our model" and no "of 100"; Juniper shows "Not enough history to score · no penalty"; Sapphire shows "by 19 Oct 2026, 7:40 pm".

#### T31b · AppProjectStates
- **Owns:** `apps/mobile/lib/features/project/states/**`, `apps/mobile/test/features/project/states/**`.
- **Depends:** T31a.
- **Inputs:** AppProjectStates.dc.html; fix-project2.md §2(b).
- **Build:** the 7 states as in T20c, for the phone.
- **Accept:** goldens × 7 states × Day/Night, with the same text assertions as T20c.

### Gate

#### T39 · M1 exit gate (lead)
- **Owns:** `apps/web/e2e/gates/m1.spec.ts`, `apps/mobile/test/gates/m1_test.dart`, `supabase/tests/gates/m1.sql`.
- **Depends:** all of waves 2, 3 and 3b.
- **Accept:** the BUILD_PLAN §3 M1 list. The live-mode web build against CI's seeded DB gives the same HTML text for Aurelia as fixture mode (a diff of the extracted text).

### Wave 4 (M2: backend + fixture-mode UI)

#### T40 · DB: people, follows, alerts, consent ledger, contact shares, relay, family
- **Owns:** `supabase/migrations/20261110*` (file names include the `m2_people` marker), `supabase/tests/{people,consent,family}/**`.
- **Depends:** T04.
- **Inputs:** DATA_MODEL §5–§6 and §12 invariants 4, 5 and 7.
- **Build:**
  - The §5–§6 tables (`app.profiles` and its trigger on `auth.users`; follows; alert subscriptions; devices; saved searches; project requests; family circles and members; shortlist notes; data requests; purposes; notice versions; consents insert-only; consent withdrawals; contact shares; relay sessions) with RLS.
  - **Trigger 1**: number_shared requires the buyer's JWT and a tap event.
  - **Trigger 2**: ≤ 3 holders in 30 days.
  - Withdrawal triggers end the share and close the relay.
- **Accept:** `supabase test db`:
  - a service-role insert of `number_shared=true` fails;
  - a 4th holder within 30 days fails;
  - withdrawal ends the share;
  - a circle member cannot read the owner's consents, follow type or bookings placeholder;
  - Rohan's seed loads (via T03b's seedmaps) and shows 3 holders.

#### T41 · Auth: phone OTP, access-token hook, Send-SMS hook
- **Owns:** `supabase/migrations/20261111*`, the `[auth]` sections of `supabase/config.toml` (handed over from T00), `supabase/functions/auth-sms-hook/**`, `supabase/functions/_shared/otp/**`, `supabase/tests/auth/**`.
- **Depends:** T04, T29. Soft: T40 (roles table).
- **Inputs:** API_CONTRACTS §5.4; fix-trust.md (OTP rules: 10 min, resend 30 s, sender "PLINTH"); platform_architecture §2.4.
- **Build:**
  - `ops.custom_access_token_hook` (`plinth_roles`, `org_roles`).
  - The `auth-sms-hook` with adapters `mock` (logs only in local), `whatsapp` (the `login_code` template via Graph) and `msg91` (DLT).
  - Test OTP numbers for the fixture personas. Rate limits per number and IP.
- **Accept:** pgTAP: the hook adds claims for a seeded admin and developer member. Deno tests: signature verification; adapter selection; the WhatsApp body matches the template catalogue; in prod mode the OTP is never logged.

#### T42 · Outbox and notify router
- **Owns:** `supabase/migrations/20261112*` (`comms.outbox`, `comms.templates` and the pg_cron jobs, file names include `m2_comms`), `supabase/functions/outbox-dispatch/**`, `supabase/functions/_shared/outbox/**` (incl. `fcm.ts` copied from pet_app), `supabase/tests/outbox/**`.
- **Depends:** T04, T29.
- **Inputs:** BUILD_PLAN §13, §15; API_CONTRACTS §5.2, §5.5.
- **Build:**
  - Dispatcher: claims due rows; routes push, then WhatsApp template/session, then email (mock); honours quiet hours (`not_before`), dedupe and the 24-hour window via `pii.wa_contacts` (read at runtime).
  - Retries with backoff. `META_MODE=mock` writes `mock_sent`. FCM HTTP v1 (data-only + deep link). pg_cron every 10 s plus an insert trigger via pg_net with the Vault secret.
- **Accept:** Deno tests:
  - a quiet-hours row is deferred to 08:00;
  - a duplicate dedupe key is suppressed;
  - outside 24 h → template, inside → session;
  - the FCM payload is shaped correctly;
  - pgTAP: only `service_role` can read the outbox.

#### T43a · Event engine (core)
- **Owns:** `supabase/migrations/20261113*`, `supabase/tests/events/**`.
- **Depends:** T04, T12.
- **Inputs:** DATA_MODEL §2 (`core.events`, `core.share_cards`); fix-since-family.md §1–§2; §5b event dates.
- **Build:** functions and triggers deriving `core.events` from published runs (band_changed), filings (filed / late / missing at the due date + 1 via cron), extensions, orders, price lists, developer replies and re-score starts. Also `core.share_cards` issue and lookup, and a perceptual-hash column.
- **Accept:** pgTAP: from the seed with the frozen clock, events between 14 Oct 08:40 and 18 Oct for Rohan's 4 phases are exactly the 5 in fix-since-family (1 extension, 1 on-time filing, 2 missing, 1 price list); the 2 Oct band change exists with `before = moderate` and `after = elevated`.

#### T44 · WhatsApp webhook infrastructure
- **Owns:** `supabase/migrations/20261114*` (`pii.wa_contacts`, `comms.wa_messages`, `comms.wa_sessions`), `supabase/functions/wa-webhook/{index.ts,router.ts,logic.ts,logic.test.ts}`, `supabase/functions/wa-flows/**` (skeleton with crypto), `supabase/functions/_shared/wa/{verify,graph,mock,session}.ts`, `supabase/tests/wa/**`. It creates **stubs** for `wa-webhook/handlers/{risk_card,card_changed,prefs,digest,family_join,ask_fallback}.ts` (→ T46a, T46b).
- **Depends:** T29.
- **Inputs:** API_CONTRACTS §5.1–§5.3; whatsapp.md "limits audit".
- **Build:**
  - GET verify; POST HMAC check; idempotent insert; contact upsert with `last_inbound_at`; a fast 200 + `waitUntil`; the intent router (first match wins) to the handler registry; a session state machine; the status callbacks; a sweeper.
  - `wa-flows`: RSA-OAEP / AES-GCM decrypt and encrypt with a test keypair.
  - The Graph client with a mock mode.
- **Accept:** Deno tests on T03b's recorded payloads:
  - a bad signature returns 403;
  - a duplicate message id is processed once;
  - "JOIN AH2-7KQ" routes to `family_join`, "aurelia" to `risk_card`, "STOP" to `prefs`;
  - the Flows crypto round-trips;
  - interactive limits are enforced (≤ 3 buttons, ≤ 20 chars).

#### T54 · Admin shell
- **Owns:** `apps/admin/**`, `supabase/migrations/20261126*` (the `admin_*` read RPCs for ops), `.github/workflows/ci-admin.yml`.
- **Depends:** T14, T29. Soft: T41 (MFA).
- **Inputs:** BUILD_PLAN §11; platform_architecture §4.5 (review queue later).
- **Build:** email OTP + TOTP MFA (`aal2` required); `/ops` (outbox counts and failures, mock WhatsApp and email viewer, source freshness, flags editor through `admin_flag_set`). Placeholders for `/queue`, `/disputes`, `/notices` and `/inbox` (M3–M4).
- **Accept:** `npm run -w @plinth/admin build test`. Without `aal2`, every admin RPC returns `forbidden` (pgTAP). The mock outbox rows render.

#### T47 · WebSignIn and account linking (fixture mode)
- **Owns:** `apps/web/app/(auth)/sign-in/**`, `apps/web/src/features/auth/**`, `apps/web/e2e/sign-in.spec.ts`.
- **Depends:** T14, T16.
- **Inputs:** WebSignIn.dc.html; fix-trust.md (WebSignIn, the 4 states, international codes).
- **Build:**
  - Phone → code (6 cells over one `one-time-code` input, resend countdown, SMS fallback) → "We found your WhatsApp follows" (Bring them here / Not now; nothing pre-ticked) → "One account, three places" with the merge animation.
  - The value card stays open. "Not now, keep reading".
- **Accept:** e2e in fixture mode: a 9-digit number shows the validation copy; Bring them here merges 2 follows; no checkbox starts ticked.

#### T49 · WebFollowing (Since you last looked)
- **Owns:** `apps/web/app/(account)/following/**`, `apps/web/src/features/following/**`, `apps/web/e2e/following.spec.ts`.
- **Depends:** T14, T16.
- **Inputs:** WebFollowing.dc.html; fix-since-family.md §2 (WebFollowing table); web-trust.md §1.
- **Build:**
  - The hero "What changed since 14 Oct?" with the replay: jump chips always, the slider behind `since_replay_slider`.
  - Project rows (follow type, family faces, freshness lines); "Have you booked any of these?"; "Who's deciding with you?" (shortlist notes); the record before 14 Oct; saved searches; "What lands every Sunday?" digest preview; alert settings (Daily 8 am / Weekly Sunday 9 am / Off); the number line.
- **Accept:** e2e: the summary sentence matches fix-since-family; replay to 1 Jul shows the band mark on 2 Oct; "Mark these as seen" zeroes the unread count; no lender appears.

#### T50 · AppFollowing + AppFamily
- **Owns:** `apps/mobile/lib/features/{following,family}/**`, `apps/mobile/test/features/{following,family}/**`.
- **Depends:** T15, T17.
- **Inputs:** AppFollowing.dc.html, AppFamily.dc.html; fix-since-family.md §2.
- **Build:**
  - Following: opens on Updates with the same block as the web; follow-type sheet; family faces.
  - AppFamily: Your circle (invite on WhatsApp via share intent with the `/j/` link), the relative opt-in screen (opens WhatsApp with "JOIN AH2-7KQ" prefilled via `wa.me`), the revoke sheet with Undo.
- **Accept:** widget tests: 5 unread; Invite produces the `plinth.in/j/AH2-7KQ` link; Remove → Undo restores the member. Goldens.

#### T51 · Privacy: WebPrivacy + AppYou
- **Owns:** `apps/web/app/(account)/privacy/**`, `apps/web/src/features/privacy/**`, `apps/mobile/lib/features/you/**`, `apps/mobile/test/features/you/**`, `apps/web/e2e/privacy.spec.ts`.
- **Depends:** T14, T15, T16, T17.
- **Inputs:** WebPrivacy.dc.html, AppYou.dc.html; web-trust.md §4; app-ai.md (AppYou); §5b Who has my number, consent history, download my data, relay lifetime.
- **Build:** Who has my number (3 parties; relay not counted; family line), consent history with C-MMDD-NN refs, one-tap withdraw with consequences, download my data (24 h, 7-day link), delete account, money lines. AppYou alert toggles default to §5b (WhatsApp and digest **on**).
- **Accept:** e2e and widget tests: withdrawing C-1012-04 changes the count to 2; every ref matches the regex; no lender party appears.

#### T52 · Family opt-in page `/j/[code]` (web)
- **Owns:** `apps/web/app/j/**`, `apps/web/src/features/family/**`, `apps/web/e2e/family.spec.ts`.
- **Depends:** T14, T16.
- **Inputs:** AppFamily.dc.html (Relative opt-in screen); fix-since-family.md §3 item 6.
- **Build:** the invitation sentence, the RERA number, "What you'll get", the choice of WhatsApp (a `wa.me/<number>?text=JOIN%20AH2-7KQ` link) or the app, "Not now" ("We don't have your number, and Rohan won't be told"), and expired or unknown code states.
- **Accept:** e2e: AH2-7KQ renders Rohan's invite and the link text includes `JOIN AH2-7KQ`; an expired fixture shows the expiry state; the page has no input that asks for a phone number.

### Wave 5 (M2: wiring)

#### T43b · Alert fan-out, digests and `following_feed`
- **Owns:** `supabase/migrations/20261122*`, `supabase/tests/feed/**`.
- **Depends:** T40, T42, T43a.
- **Inputs:** API_CONTRACTS §4.8–§4.9, §5.5; fix-since-family.md (the digest is a utility template; saved-search matches stay out of it).
- **Build:**
  - `ops.fan_out(event)` → outbox rows per subscription, channel, quiet hours and consent; the developer heads-up/notice ordering respected.
  - `ops.enqueue_digests('weekly_sun_9am'|'daily_8am')` with pg_cron (Sun 03:30 UTC = 09:00 IST).
  - `api.following_feed`, `api.mark_following_seen`.
- **Accept:**
  - `npm run -w @plinth/fixtures test:api -- --only following_feed` deep-equals;
  - pgTAP: advancing the clock to Sun 25 Oct 09:00 enqueues Rohan's weekly digest only; advancing to 25 Oct with the QPR still missing and running publish produces push + WhatsApp-template outbox rows for followers and **no** row for the circle's private kinds.

#### T45a · Buyer RPCs: follow, alerts, family, notes, requests, WhatsApp follow linking
- **Owns:** `supabase/migrations/20261120*`, `supabase/tests/buyer_api/**`.
- **Depends:** T40, T41.
- **Inputs:** API_CONTRACTS §3.2 and §4.7, §4.9, §4.11.
- **Build:** `api.follow/unfollow/set_follow_type`, `alert_prefs_get/set`, `saved_search_*`, `family_*` (incl. `ops.family_join_by_code` for WhatsApp), `shortlist_note_add`, `request_project` (R-MMDD-NN, due +14 days), `link_whatsapp_follows`, `device_register`, `me`. All idempotent on `p_client_id`, all audited.
- **Accept:** contract tests for `alert_prefs` and `family_invite_preview`; pgTAP: a replayed `p_client_id` gives one row; an expired code returns a neutral not-found; a member can add a note only with `can_add_notes`.

#### T45b · Privacy RPCs
- **Owns:** `supabase/migrations/20261121*`, `supabase/tests/privacy_api/**`.
- **Depends:** T40.
- **Inputs:** API_CONTRACTS §4.10; BUILD_PLAN §13.
- **Build:** `api.who_has_my_number`, `consent_history`, `consent_withdraw` (writes the withdrawal, ends the share, enqueues the partner deletion request), `relay_renew`, `data_export_request`, `account_delete_request`.
- **Accept:** `test:api -- --only who_has_my_number` deep-equals; pgTAP: withdrawing gives a count of 2 and a queued deletion request; another user's ref returns not_found.

#### T46a · WhatsApp: WaRisk and returned cards
- **Owns:** `supabase/functions/wa-webhook/handlers/{risk_card,card_changed,ask_fallback}.ts` and their tests.
- **Depends:** T44, T12, T27, T43a.
- **Inputs:** WaRisk.dc.html; whatsapp.md (WaRisk); fix-since-family.md (WaDigest returned card).
- **Build:**
  - Name, RERA number or link → `api.risk_summary` → a session image (`share.card_url`) + caption + replies "Why this band" · "Follow project" · "Ask".
  - "Why this band" → the reasons text with sources. "Follow project" → the opt-in.
  - A returned old card (pHash) → "Changed since this card was sent: band Moderate → Elevated (2 Oct)".
  - Unknown text → a templated Ask fallback (§5b edge answers).
- **Accept:** Deno snapshot tests: each recorded inbound produces the expected Graph body; caption and button limits hold; a Noida query returns the outside-coverage copy.

#### T46b · WhatsApp: WaAlerts, WaDigest, JOIN, STOP
- **Owns:** `supabase/functions/wa-webhook/handlers/{prefs,digest,family_join}.ts`, `supabase/functions/_shared/wa/templates/**`, and their tests.
- **Depends:** T44, T42, T45a.
- **Inputs:** WaAlerts.dc.html, WaDigest.dc.html; whatsapp.md (WaAlerts); fix-since-family.md (WaDigest); API_CONTRACTS §5.2 template catalogue.
- **Build:**
  - Template renderers: `band_change_alert`, `filing_alert`, `weekly_digest` (header image `/cards/digest`), `daily_digest`, `family_removed`, `export_ready`, `login_code`.
  - JOIN (family join + the "You'll get the same alerts" session reply). STOP / Stop weekly / Turn weekly on. "See changes" lists the 5 changes.
- **Accept:** Deno snapshot tests for every template (variables, buttons ≤ 20 chars, utility category). "JOIN AH2-7KQ" from a new contact creates a member (integration test against CI's DB). "Stop weekly" keeps band-change alerts on.

#### T48 · AppOnboarding, sign-in and push
- **Owns:** `apps/mobile/lib/features/onboarding/**`, `apps/mobile/lib/core/push/**`, `apps/mobile/test/features/onboarding/**`.
- **Depends:** T15, T17, T41.
- **Inputs:** AppOnboarding.dc.html; fix-trust.md (AppOnboarding, 8 steps); pet_app `features/reminders/push.dart`.
- **Build:**
  - The 8-step first run: the card builds; what you're buying (nothing preselected); location just in time; sign in; code (WhatsApp one-tap autofill); follow your first project; alerts (utility only, quiet hours, WhatsApp box unticked); done.
  - FCM init guarded; token registration via `api.device_register`; data-only messages → go_router deep link; App Links verified.
- **Accept:** widget tests walk Welcome → Done in fixture mode; a push payload `{deep_link: "/gurugram/projects/aurelia-heights-phase-2"}` navigates there; the app opens with Firebase absent.

#### T53 · DPDP edge functions
- **Owns:** `supabase/functions/{export-data,delete-account,retention-sweep}/**`, `supabase/migrations/20261125*` (storage bucket policies and lifecycle), `supabase/tests/dpdp/**`.
- **Depends:** T45b, T42, T29.
- **Inputs:** BUILD_PLAN §13 retention table; §5b "Download my data"; pet_app `delete-account`.
- **Build:**
  - Export: a ZIP of a readable PDF + JSON (follows, alerts, saved cost sheets, Ask questions, consent history, who had your number), a signed 7-day link that requires a fresh OTP.
  - Delete with legal-hold rules.
  - Daily sweep: uploads past 30 days unsaved, voice at 24 h, exports at 7 days, messages past 24 months anonymised.
- **Accept:** Deno and pgTAP: Rohan's export contains his 5 consent refs; the sweep with the clock advanced 31 days deletes an unsaved upload and keeps a saved one; delete removes the profile and keeps consent proof rows anonymised.

### Gate

#### T59 · M2 exit gate (lead)
- **Owns:** `apps/web/e2e/gates/m2.spec.ts`, `apps/mobile/test/gates/m2_test.dart`, `supabase/tests/gates/m2.sql`.
- **Depends:** waves 4 and 5.
- **Accept:** the BUILD_PLAN §3 M2 list, in live mode on CI's seeded DB: sign in with test OTP → Following shows 5 → JOIN via a recorded payload → advance the clock → outbox rows → mock WhatsApp body snapshot.

---

## 5. Ownership summary for shared areas

**Migration prefixes:**

| Prefix | Task | Prefix | Task |
|---|---|---|---|
| 20261020 | T04 | 20261114 | T44 |
| 20261101 | T12 | 20261120 | T45a |
| 20261102 | T13 | 20261121 | T45b |
| 20261110 | T40 | 20261122 | T43b |
| 20261111 | T41 | 20261125 | T53 |
| 20261112 | T42 | 20261126 | T54 |
| 20261113 | T43a | ≥ 20261201 | M3+ (assigned per task) |

**Shared areas and their owners:**

| Area | Owner (then) |
|---|---|
| `supabase/config.toml` | T00 → T41 (`[auth]`) → the lead |
| `supabase/seed/**` | Generated (T03 / T03b) |
| `supabase/functions/_shared/core` | T29 |
| `supabase/functions/_shared/wa` | T44 (templates: T46b) |
| `supabase/functions/_shared/outbox` | T42 |
| `apps/web/src/data` | T16 |
| `apps/web/src/shell` + layouts | T05 |
| `packages/web-ui` | T14 |
| `apps/mobile/lib/app` | T06 |
| `apps/mobile/lib/core/widgets` | T15 |
| `apps/mobile/lib/data` | T17 |
| `packages/contracts` | T02 (new schemas in M3+ go to that milestone's API task) |
| `packages/fixtures` | T03 / T03b (expected files for M3+ go to that milestone's fixtures task) |
| `.github/workflows/*` | One file per owner (BUILD_PLAN §8) |

---

## 6. After M2 (planned, broken down at each milestone kickoff)

| Milestone | Planned tasks |
|---|---|
| **M3** | `doc-check` pipeline + AI gateway + recorded AI fixtures + evals; `packages/calc` (TS) + Dart calc (vector-tested); cost/afford/payee RPCs; WebClaims, WebCostSheet, WebBeforePay, WebPayAsBuilt; AppClaims (share-sheet intake), AppCostSheet\*, AppBeforePay, AppPayAsBuilt\*; WaCost, WaClaims, WaBeforePay\*; admin review queue. (\* the artboard must be drawn first) |
| **M4** | Workspace claim and verify; inbox and check-in; Live Record + `/r/`; facts editor; three lanes; notice workflow + heads-up; facts-only admin switch; signals; capture page; WaDevAlerts; legal intake; admin disputes and notices queues |
| **M5** | Visit booking Flow + web/app booking; visit pass + co-pilot questions + recap; agent of record + cap; WebForAgents, WebAgentProfile, WebBrokerCheck, WaAgentOnboarding; Ask Plinth (`ask`, AppVoice, web Ask, WhatsApp); AppScan; Visualise beta (WebVisualise, AppVisualiseCapture/Result) |
| **M6** | Live HARERA (after the legal memo), Cloud Run jobs, backfill, entity resolution, real calibration, S1/S2 gates, performance and security hardening, the Play release workflow, runbooks |
