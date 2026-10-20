# @plinth/fixtures

DESIGN.md §5b as data, the seed of every surface. Owners: **T03** (catalogue, evidence, scoring, expected reads, vectors) and **T03b** (people, consent, family, workspace, WhatsApp payloads).

- `canonical/`: §5b as JSON. `expected/<fn>/<key>.json`: golden API outputs.
- `vectors/`: calculator and format vectors shared by SQL, TS and Dart.
- `recorded/`: AI and Meta payloads. `seedmap/` -> `supabase/seed/*.sql` (generated, never hand-edited).
- `dart/`: the same JSON as Flutter assets for FIXTURES mode.
