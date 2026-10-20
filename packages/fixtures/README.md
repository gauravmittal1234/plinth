# @plinth/fixtures

DESIGN.md §5/§5b as data: the seed of every surface. Owners: **T03** (catalogue, evidence, scoring, developer content, expected reads, vectors) and **T03b** (people, consent, family, workspace, agents, checks, WhatsApp payloads). Facts come only from §5/§5b; gaps and disagreements are in [CONFLICTS.md](CONFLICTS.md).

## Layout

| Path | What | Made by |
|---|---|---|
| `src/author/*.mjs` | The facts, written once, with a `source` on every record | hand (T03) |
| `canonical/{catalogue,evidence,scoring,developer_content}.json` | §5b as tables (DATA_MODEL §1–§4) | `npm run author` |
| `canonical/{people,consents,family,workspace,agents,visits,checks}.json` | T03b: people and test numbers, Rohan's follows, alerts and dated changes, the consent ledger and ref counters, the family circle, Northfield's workspace, agents, visits and checks (DATA_MODEL §4–§9) | `npm run author` |
| `recorded/wa/*.json` | T03b: raw WhatsApp webhook bodies (API_CONTRACTS §5.1); `_index.json` gives each one's sender and expected route | `npm run author` |
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
| `following_feed`, `who_has_my_number`, `alert_prefs` | `rohan` (`alert_prefs` answers `api.alert_prefs_get`); after a withdrawal, `consent_withdraw/<ref>` gives the new count |
| `family_invite_preview` | `AH2-7KQ`, `RC4-2MW` |
| `share_card` | `aurelia-old-card` (the v1.1 card of 30 Sep 2026; `p_code` in `_requests.json`) |
| `doc_check` | `flyer`, `flyer--confirm-project`, `hoarding`, `demand-letter`, `payment-request`, `booking-form`, `visit-recap` |
| `cost_breakdown`, `afford_the_wait` | `aurelia-heights-phase-2`, plus `--waive-plc-club` and `--delay-24` |
| `payee_check` | `aurelia-eoi-whatsapp` (0 of 3), `aurelia-booking-form` (3 of 3); answers `api.before_you_pay_check` |
| M2 writes: `follow`, `unfollow`, `mark_following_seen`, `alert_prefs_set`, `family_invite_create`, `family_invite_cancel`, `family_member_remove`, `family_member_undo`, `shortlist_note_add`, `consent_withdraw` | What each write returns in the fixture world (idempotent on `p_client_id`) |
| T45a: `set_follow_type` | `<slug>--booked`, `<slug>--watching` for Rohan's 4 follows |
| T45a: `family_circle`, `saved_searches` | `rohan` (his circle: Meera and the two open invites; no saved search in §5b, so an empty list) |
| T45a: `request_project` | `indigo-terraces` (R-1018-07; a replay of Rohan's request, whose `p_client_id` `54_buyer_api.sql` seeds) |
| T45a: `link_whatsapp_follows` | `preview` (`p_accept: false`), `confirmed` (`true`): WebSignIn's Bring step. `"seeded": false`: not reachable from the seed, so the contract runner skips them |

Buyer calls carry `"as": {"user", "user_id"}` in `_requests.json`: the contract runner sets that user's JWT claims before calling. `"rpc"` names the function when it differs from the folder. Requests with a `"state"` are design states (not reachable from the seed) and are skipped like `--facts-only`; so are requests marked `"seeded": false`, which clients still serve by their `p_` args.

Contract tests (T12/T13) call the function with `_requests.json` args and deep-compare, ignoring ids and `meta.generated_at`. Keys ending `--facts-only` need Northfield's `facts_only_since` set and are skipped against the normal seed.

## Conventions

- **Clock:** 18 Oct 2026, 12:00 IST (`FIXED_NOW`). Data as of 14 Oct 2026, model v1.2.
- **Ids:** UUID v5 of `https://plinth.in/fixtures/<kind>/<key>` in the URL namespace, so the seed, the expected files and the Dart assets share them.
- **Dates:** month-precision dates are the 1st of the month. `learned_at` defaults to the `as_of` date at 00:00 IST when §5b gives no time.
- **Copy:** risk copy is final in the expected files (clients never compose it). Apostrophes are ASCII, as in API_CONTRACTS §2.1.
- **Seed `requires`:** a seedmap is emitted only when a migration file name contains each marker (`20261020` = T04; `20261101`/`20261102` = T12/T13; `m2_people` = T40; `m2_comms` = T42; `20261114` = T44). Otherwise its SQL file holds a "SKIPPED" header. Preview everything with `node scripts/build-seed.mjs --all --out <dir>`.
- **T03b seed:** consents and number shares are inserted with the buyer's own JWT claims and a tap event id, as the product writes them, so T40's triggers need no seed exception. `51_consents.sql` bumps `ops.ref_counters` to the highest seeded ref per prefix and IST day (C-1018-11, so the next live ref is C-1018-12). Values §5b does not give are written as `default`.
- **Test phone numbers** live only in `canonical/people.json` (block `+91 99000 003NN`; CONFLICTS C-31) and the recorded payloads. They are never displayed except masked.

## Commands

```sh
npm run -w @plinth/fixtures gen               # author + seed + Dart assets
npm run -w @plinth/fixtures validate          # structural checks; JSON Schema once packages/contracts/schemas exists (T02)
npm run -w @plinth/fixtures test              # vectors, sources, consistency, no drift
npm run -w @plinth/fixtures check:generated   # CI drift check
```

Loaders: `@plinth/fixtures` (constants, keys, `WRITE_FUNCTIONS`, `RECORDED_WA`) and `@plinth/fixtures/node` (`loadExpected`, `loadRequests`, `loadCanonical`, `loadVector`, `loadRecordedWa`, `loadRecordedWaIndex`). In Flutter: `package:plinth_fixtures/plinth_fixtures.dart`.
