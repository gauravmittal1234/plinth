# @plinth/fixtures

DESIGN.md §5/§5b as data: the seed of every surface. Owners: **T03** (catalogue, evidence, scoring, developer content, expected reads, vectors) and **T03b** (people, consent, family, workspace, agents, checks, WhatsApp payloads). Facts come only from §5/§5b; gaps and disagreements are in [CONFLICTS.md](CONFLICTS.md).

## Layout

| Path | What | Made by |
|---|---|---|
| `src/author/*.mjs` | The facts, written once, with a `source` on every record | hand (T03) |
| `canonical/{catalogue,evidence,scoring,developer_content}.json` | §5b as tables (DATA_MODEL §1–§4) | `npm run author` |
| `expected/<fn>/<key>.json` | Golden API outputs (API_CONTRACTS §2, §4); `_requests.json` holds each key's RPC args | `npm run author` |
| `vectors/*.json` | Golden numbers for SQL, TS and Dart: cost, afford the wait, 10% cap, time used, Late12, formatting | `npm run author` |
| `media/` | Hero images and the 3 BHK floor plan referenced by `image_url` (`/media/<file>`) | copied from `product/design/assets` |
| `seedmap/*.mjs` | canonical → SQL, one file per seed | hand |
| `../../supabase/seed/*.sql` | The seed `supabase db reset` loads | `npm run seed` |
| `dart/` | Flutter package `plinth_fixtures`: the same JSON as assets + `loadPlinthExpected()` | `npm run sync-dart` |

Generated files are committed and never hand-edited. `npm run -w @plinth/fixtures gen` regenerates all three (author → seed → Dart); `check:generated` fails on drift.

## Fixture keys

| Function | Keys |
|---|---|
| `risk_summary`, `project_page` | the 8 phase slugs, plus `aurelia-heights-phase-2--facts-only` (a design state, CONFLICTS C-23) |
| `developer_page` | the 6 group slugs, plus `northfield-estates--facts-only` |
| `search_projects` | `canonical`, `zero-results`, `unknown-project`, `outside-coverage`, `all-gurugram` (args in `_requests.json`) |
| `compare` | slugs joined by `_` in request order (Aurelia, Kestrel, Sapphire; and the same + Coral) |
| `evidence` | the fact id (the 4 facts behind Aurelia's reasons) |
| `methodology`, `about` | `default` |
| `flags` | `anon` |

Contract tests (T12/T13) call the function with `_requests.json` args and deep-compare, ignoring ids and `meta.generated_at`. Keys ending `--facts-only` need Northfield's `facts_only_since` set and are skipped against the normal seed.

## Conventions

- **Clock:** 18 Oct 2026, 12:00 IST (`FIXED_NOW`). Data as of 14 Oct 2026, model v1.2.
- **Ids:** UUID v5 of `https://plinth.in/fixtures/<kind>/<key>` in the URL namespace, so the seed, the expected files and the Dart assets share them.
- **Dates:** month-precision dates are the 1st of the month. `learned_at` defaults to the `as_of` date at 00:00 IST when §5b gives no time.
- **Copy:** risk copy is final in the expected files (clients never compose it). Apostrophes are ASCII, as in API_CONTRACTS §2.1.
- **Seed `requires`:** a seedmap is emitted only when a migration file name contains each marker (`20261020` = T04; `20261101`/`20261102` = T12/T13). Otherwise its SQL file holds a "SKIPPED" header. Preview everything with `node scripts/build-seed.mjs --all --out <dir>`.

## Commands

```sh
npm run -w @plinth/fixtures gen               # author + seed + Dart assets
npm run -w @plinth/fixtures validate          # structural checks; JSON Schema once packages/contracts/schemas exists (T02)
npm run -w @plinth/fixtures test              # vectors, sources, consistency, no drift
npm run -w @plinth/fixtures check:generated   # CI drift check
```

Loaders: `@plinth/fixtures` (constants, keys) and `@plinth/fixtures/node` (`loadExpected`, `loadRequests`, `loadCanonical`, `loadVector`). In Flutter: `package:plinth_fixtures/plinth_fixtures.dart`.
