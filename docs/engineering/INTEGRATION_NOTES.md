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
