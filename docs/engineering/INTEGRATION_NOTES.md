# Integration notes for the T07 gate and later tasks

Kept by the lead. Handoffs that cross task boundaries, collected from the wave-1 PRs (19 Oct 2026).

## Merge order
1. #1 T00 bootstrap → main
2. #3 docs, #8 design data (docs only; any order)
3. Retarget the wave-1 PRs to `main`, then merge #2 T01, #7 T02, #4 T04, #6 T03, T05, T06
4. T07 gate: run `npm run -w @plinth/fixtures gen` and commit `supabase/seed` (its files are "SKIPPED" headers until T04 is on main)

## Cross-task facts
- **Flags:** `api.flags()` returns `{schema: "plinth.flags/1", flags: {...}}` with 19 R1 flags. `bands_public` defaults off; the fixture seed turns it on. The AI kill switches (`ai_ask`, `ai_doc_check`, `ai_staging`) are off in the fixture world until M5.
- **Environment:** set in `ops.runtime_settings('env', ...)`, falling back to the `plinth.env` GUC. Never use ALTER DATABASE on hosted Supabase.
- **Dates:** precision columns use the domain `core.date_precision` (day | month).
- **Facts:** `core.facts.method` includes `rules`. `core.facts.corrections` is append-only jsonb.
- **Contracts:**
  - TS: `@plinth/contracts`. Validators: `@plinth/contracts/validators`, about 1 MB, server and tests only.
  - Dart: `plinth_contracts`.
  - Python: `plinth_contracts` (the `schema` field is `schema_`).
- **Web (T05):** may need `transpilePackages: ["@plinth/contracts", "@plinth/tokens"]`.
- **Developer replies (T12):** `ws.developer_replies` needs a signatory name and a scope (project or group). The group reply is seeded on Heron Point Ph 1.
- **Share card (T03b):** the old card points at Aurelia's v1.1 run of 2 Sep 2026 (Moderate).
- **Contract tests (T12/T13):** skip the `--facts-only` expected keys.
- **Canonical search:** returns Kestrel, Cedar Walk Ph 2, Sapphire and Juniper; 2 projects hidden (Aurelia, Heron Point Ph 2).

## From T05 (PR #9), for the T07 gate
- **Tokens:** after T01 merges, uncomment the tokens import line in `apps/web/app/globals.css`. Until then pages render unstyled.
- **React versions:** align them (root 19.3.1, `apps/web` 19.3.0); this removes the dual-React workaround in T05's test config. Integrator PR.
- **Turbo cache:** add `packages/config/eslint/**` to the lint and test inputs in `turbo.json`.
- **AGENTS.md:** remove the "workflows go in workflows-pending" rule; the token now has the `workflow` scope.
- **M0 exit, "Elevated chip on Aurelia":** decided. The T07 gate adds a minimal fixture read plus the risk chip on the Aurelia project route, kept to that one thing. T20a replaces it.
- **Load time:** the 2.5 s budget is a warning on stubs (2.4–2.8 s from the Next runtime plus five preloaded fonts). T20a makes it a hard check on the project page; consider preloading fewer font weights. JS headroom is about 11 KB.
- **For later tasks:**
  - T21: the home Ask box needs `id="ask"`.
  - T16: swap the placeholder types for `@plinth/contracts` and implement `call()`. Production must refuse an unset `PLINTH_DATA`.
  - T14: needs a `@source` line for `web-ui` in `globals.css`.
- **Compare route:** `/compare/[pair]`, not `[a]-vs-[b]`.

## Done at the T07 gate (PR #10, 19 Oct 2026)
Every item above under "From T05" is done, and `supabase/seed` is the real §5b seed. Status per item is in the PR body.

**Contracts ↔ fixtures (T02 ↔ T03).** T02's schemas and T03's expected outputs met for the first time here: 37 of 39 payloads failed validation. The rule used: the schema stays the source of truth in code (API_CONTRACTS header), and it is widened only to describe what §5b and the artboards already put in the fixtures. Additions are optional, so older examples stay valid. T12 builds the RPCs to these shapes; T16, T17 and the page tasks read them.
- **Fixtures changed (generator `packages/fixtures/src/author/expected.mjs`):** `flags` uses T04's envelope `{schema, flags}`; `PreReraItem` is `{name, line, sources[]}`; `how_buyers_find_you` is `{rules[]}`; methodology factors use `factor`, not `code`; about and methodology `meta` carry `data_as_of`.
- **Schemas widened (optional fields):**
  - search results: `query`, `legend_line`, `hidden[]` (HiddenProject), `meta`; ProjectCard `chip_note`, `progress_line`, `built_pct`, `time_used_pct`, `config_line`; SearchFilters `name`, `place`;
  - compare: column `locality_line`, `developer_name`, `price_line`, `image_url`; row `source_line`, `developer_says[]`; `meta`;
  - evidence: `fact_id`;
  - developer page: `summary_line`, `facts_only` (FactsOnlyNotice), `claim_explainer_line`; ongoing `state`, `price_line`, `progress_line`;
  - cost breakdown: `edc_idc_line`, `area_line`;
  - afford the wait: `inputs`, `loan`, `delay_options[]`, series `paid_out_pct`;
  - common: `BaseRate`.
- **Schemas relaxed (nullable):** `phase.short_code` (only Aurelia has one), `latest_qpr.age_days` (filing date unknown), `group.linked_companies`, `track_record.finished/late/line` (no finished RERA project), `insolvency_line`, `progress.towers`, `from_developer`, configuration lanes. `what_would_change` is null only when bands are not public: limited-history and not-scored phases keep their §5b line.
- **Schemas reshaped to the fixture (M1 pages, no live consumer yet):** `about` and `methodology` follow the WebAbout and WebMethodology payloads; project page `NextStep {heading, body}`, `BookingTopic {title, sub, paras[]}`, `EvidenceSummary.chip`, `PriceList.published_on`, `rooms[]` and `getting_around.items[]` as finished lines, `ReportedIncident {reported_on, line}`.
- **Examples:** the about, methodology and project-page valid examples are now the fixture payloads; the §2.1 RiskSummary example is unchanged apart from the round-2 signatory.

## Wave 2 (M1) decisions by the lead (19 Oct 2026)
- **Stacking:** wave-2 PRs are built on `task/T07-m0-gate` (PR #10) and target it. After #10 merges, retarget them to `main`. A wave-2 integration PR (T39 gate) may combine them, the same way #10 combines wave 1.
- **Scratch files:** agents share the session scratchpad, so every scratch file is task-prefixed (`t16-pr-body.md`). A generic `pr-body.md` collision briefly put T14's text on PR #11; it was restored.
- **T12 → T13 and the bands-off copy:**
  - Confirmed: when `bands_public` is off, the chip is `kind: "withheld"` with the copy "Facts only · bands not published yet".
  - T13 adds the optional `p_slug` to `api.evidence`, so a shared group fact names the reason for the phase being viewed.
  - T13 re-creates `core.risk_price` once `ws.cost_sheets` exists. That restores Aurelia's "park-facing" in `price.basis_line`.
- **T03 / T03b:** the claims and replies seedmap requires only 20261101 and inserts `signatory_name` and `scope`.
- **T11 (PR #14) handoffs:**
  - T10 registers `add_score_parser` in `plinth/cli.py`. The import tolerates the module being absent, so T10 works on its own branch before T11 merges.
  - T12 and T13: the published band is the latest run with `published_on <= today`. A `pending_notice` run (Aurelia's High) never surfaces. Frequency fields are null for red-flag and unscored phases.
  - T13: methodology weights and calibration figures come from `pipelines/plinth/scoring/models/v1.2.yaml`.
  - **Reason codes (decision):** the scoring engine's codes in `canonical/scoring.json` are canonical. At the T39 gate the integrator aligns `packages/contracts` `reason_codes.json` to them and regenerates.
  - **OWNERSHIP:** `.github/workflows/ci-scoring.yml` belongs to T11; added at the T39 gate.
  - **Replay gap (T03b):** the replay audit re-computes 6 of the 10 earlier runs. To reach 10, add the complaint-count history, Sapphire's QPRs before Jul 2026, and Coral's stale QPR state on 15 Jul. Facts come from §5b, and the lead adds any missing ones.
- **T14 (PR #13) handoffs, done at the T39 gate:**
  - Add `@import "@plinth/web-ui/styles.css";` after the tokens import in `apps/web/app/globals.css`.
  - Add the web-ui lint, typecheck and test steps to `ci-web.yml`.
  - Expose the kit showcase at a dev-only route (`app/(dev)/kit/page.tsx`, hidden in production), with a `screens.test.ts` row.
  - Optionally add `@plinth/fixtures` to the web-ui devDependencies.
  - Screen tasks (T20a–T28): layout copy comes from the artboards and band names from `Methodology.bands`. T20a replaces `src/m0/risk-chip.tsx` with `RiskChip`. T27's OG images use `riskVar` or the tokens, not Tailwind.
- **T15 (PR #12) handoffs:**
  - **Contract gap:** `ProjectCard` has no confidence level, so app cards can't show confidence dots. Add `confidence` to ProjectCard (T02 schema, plus T13 and the fixtures) at the T39 gate.
  - **Band names:** T17 exposes a provider for `Methodology.bands`; `BandScale` and `Riskometer` need all five names.
  - T31a uses `Riskometer(sweep: false)`, because the tower is that page's one animation. T30's map sheet is `PeekSheet`.
  - Once the fonts are bundled, re-run the ci-mobile `update_goldens` dispatch.
- **gitleaks:** an old T12 commit was flagged as a false positive; T12 rewrote it out of its branch. A stale red check on PR #12 passed on re-run. Rename fixture "key" fields in scripts if gitleaks flags them again.
- **T16 (PR #15) handoffs:**
  - **OWNERSHIP:** add `apps/web/test/data/**` to T16's row. T05's stub `test/data.test.ts` is deleted.
  - **Screens (T20a–T28):**
    - Import only from `@/src/data`. On `isDataError(e, "not_found")`, call `notFound()` before the first Suspense boundary streams.
    - Design states: pass `{fixtureState: "facts_only"}`.
    - T20a replaces `src/m0/fixture-risk.ts` with `riskSummary(slug)`. T21's `suggest("aure")` returns Aurelia first.
    - T22/T24: a query without a fixture key gives `fixture_missing`; new keys come from the fixtures owner.
  - **T13:** SQL defaults on every `api.search_projects` argument.
  - **T41/T47:** `proxy.ts` with `refreshSession`.
  - **T42/T43:** post `phase:<slug>` tags to `/api/revalidate`.
- **T10 (PR #16) handoffs:**
  - **DB (T39 gate or the next DB task):**
    - Create `ops.job_runs`; pipelines log to JSONL until it exists.
    - Grant `pipeline_writer` read access to the flag (`harera_live_fetch`); today it reads as off, which is the safe default.
  - **Live HARERA fetching:** stays off. It needs the `harera_live_fetch` flag, `HARERA_LIVE_FETCH_APPROVED=yes`, and a contact email, and it is always refused in CI and tests. The founder approves this only after the legal memo.
  - **T18:** add `plinth/sources/harera/cli.py` with `add_harera_parser`. Fixtures go in `tests/fixtures/harera/manifest.json`. Parse only snapshots that changed. Facts use `key_fields=("quarter",)`.
  - **Commit author:** T10's commits carry the auto-detected identity `macbook`. Squash-merging sets the author, so nothing needs rewriting.
- **Stacking for wave 3:** T13 builds on T12's branch, and T18 builds on T10's. Screen tasks (T20+) need T14 and T16 together, so they start from a wave-2 integration branch the lead creates once T17, T29 and T03b finish.
- **T29 (PR #18) handoffs:**
  - **Integrator:**
    - `config.toml` `[functions.health] verify_jwt = false`.
    - `.env.example` gains `PLINTH_ENV` (hosted dev = `fixture`) and `PLINTH_HASH_SALT`.
    - `.prettierignore` gains `supabase/functions/`.
    - A DB hook copies `x-request-id` into `plinth.request_id` for the audit log.
  - **T02:** add the `internal` (500) error code. `validators.d.ts` imports `./types.ts` with the extension, so `deno.json` can drop `sloppy-imports`.
  - **T41:**
    - Create `ops.rate_limits` and `api.rate_limit_hit` (service-role only); the SQL is in the header of `_shared/core/ratelimit.ts`.
    - Verify Auth hooks with `readStandardWebhook`.
    - OTP rate limits use `onStoreError: "deny"`.
  - **T42–T46:**
    - Wrap every function in `createHandler`.
    - Dispatch uses `verifyDispatchSecret`; T44's Meta signature check uses `hmacSha256`/`timingSafeEqual`.
    - Gate WhatsApp functions with `flagsReader(...).require(...)`.
    - `META_MODE` defaults to `mock`.
  - **M5 AI:** `parseBody(req, "AskRequest")`. `require("ai_ask")` and the other AI flags answer `flag_off` until M5. `AI_MODE` defaults to `recorded`, and tests refuse `live`.

## Round-3 fixture decisions (20 Oct 2026; DESIGN.md §5b, C-30 to C-41)
- **T11 and fixtures:** flip Coral's v1.0 run of 15 Jul 2026 to `stale: false`, in `fixture_world/ledger.yaml` and `src/author/scoring.mjs` together. Add the replay inputs from §5b C-30.
- **T02:** add an optional `records_label` to `DocCheckRow`; the verdict label is "Can't check yet".
- **T40:** the number-holder cap counts distinct active recipients. Notice version: "Privacy notice v1.0, 1 Oct 2026".
- **T42/T44:** outbound SMS and WhatsApp adapters refuse the test block `+91 99000 003NN` in every environment.
- **T45a/T45b:** define the result schemas for `saved_search_save`, `request_project`, `family_join`, `consent_history`, `me`, `link_whatsapp_follows`, `data_export_request` and `account_delete_request`.
- **T43b:** the following feed lists changes newest first. **T49:** add the `/guides/booked-buyer` route.
- **`main` is the integration branch** (#10 merged 20 Oct). `task/T07-m0-gate` is retired.

## Lead review of M1 screens (20 Oct 2026)
- **No confirmation without a record (all UI tasks).** A UI confirms only what an RPC confirmed.
  - References (R-, C-, CL-…) are shown only from an RPC result, never as literals.
  - Without a backing RPC, say "nothing was saved" (FOUNDER_QUESTIONS P6).
  - Fixed in #36 (Request it; home and search waitlists) and #38 (About).
- **`api.request_project`:**
  - It has no consent parameter, so "Also tell me on WhatsApp" stays off.
  - T45a/T45b: add WhatsApp consent when the result schema is defined.
  - Fixtures: add `expected/request_project/` for §5b's Indigo Terraces example.
- **Waitlists:** there is no RPC. Proposal: `api.waitlist_join(p_area, p_whatsapp_consent)` (M2, T45a), pending the founder's decision.
- **SEO routes: no soft 404s.**
  - `not_found` → `notFound()`. A fixture gap renders, but with `robots: noindex`.
  - Titles name the entity, with a canonical URL (#35).
  - T20a's project route still needs the same treatment; T20b was asked to fix it.
- **`evidence(p_fact_id, p_slug)`:** the SQL overload exists (T13), but `src/data` `evidence()` doesn't pass `p_slug`. Fix it after T20b lands; the call site is `features/project/page/evidence.ts`, and fixture `_requests` need slug variants.
- **Stub tests:** filling a stub may break T06/T07 tests that assert placeholder text (`test/gates/m0_test.dart`, `test/app/router_test.dart`, `shell_test.dart`). The filling task updates them minimally and lists them in its PR.

