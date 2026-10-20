# @plinth/contracts

The one contract (BUILD_PLAN §1 rule 2). Owner: **T02**; new schemas in M3+ go to that milestone's API task. The human version is `docs/engineering/API_CONTRACTS.md`; when the two disagree, the schema wins and the doc is fixed.

## Layout

| Path | What | Edited by hand? |
|---|---|---|
| `schemas/*.schema.json` | JSON Schema 2020-12, one file per payload; sub-objects are named `$defs` | Yes: the source of truth |
| `schemas/ai/*.schema.json` | AI reader-output schemas (T61, M3): the gateway (`supabase/functions/_shared/ai`) validates a model's raw answer against these directly, as a task's `response_schema` in `catalogues/ai_tasks.json`. No `plinth.<type>/1` envelope (`NO_ENVELOPE` in `scripts/lib/schemas.mjs`); still a top-level type, still exported, still needs `examples/<type>/{valid,invalid}/` | Yes: the source of truth |
| `catalogues/*.json` | `flags`, `events`, `reason_codes`, `wa_templates`, `ai_tasks`, `purposes`, `ref_formats` (shape: `catalogue.schema.json`) | Yes |
| `examples/<type>/{valid,invalid}/` | ≥ 1 valid and ≥ 1 invalid example per exported type, §5b facts only | Yes |
| `scripts/gen.mjs`, `scripts/lib/` | Codegen | Yes |
| `gen/ts/` | `types.ts` (json-schema-to-typescript), `validators.js` + `.d.ts` (ajv standalone) | **Generated** |
| `dart/lib/` | Dart package `plinth_contracts` (quicktype, null-safe) | **Generated** (`dart/test/examples_test.dart` is hand-written) |
| `python/plinth_contracts/` | Python package `plinth_contracts` (Pydantic v2, datamodel-code-generator) | **Generated** (`python/tests/` is hand-written) |
| `openapi/plinth.yaml` | OpenAPI 3.1 for the RPC paths and edge functions (`scripts/lib/endpoints.mjs`) | **Generated** |
| `src/` | The TS entry point: re-exports, catalogues, `validate()` | Yes |

Generated files are committed. `ci-contracts` regenerates and fails on any diff.

## Commands

```bash
npm run -w @plinth/contracts gen         # regenerate everything (Python needs `npm run py:setup` once)
npm run -w @plinth/contracts gen:check   # exit 1 if a generated file is stale
npm run -w @plinth/contracts test        # schemas compile, examples, catalogues, TS/Dart/OpenAPI drift
npm run -w @plinth/contracts test:dart   # dart analyze + round-trip tests
pipelines/.venv/bin/python -m pytest packages/contracts/python/tests
```

## Using it

- **TypeScript:** `import type { RiskSummary } from "@plinth/contracts"`; `validate("RiskSummary", data)`, `validatePayload(data)` (picks the type from `schema`), `isRef("C", "C-1018-11")`, `catalogues.flags`. Plain `.mjs` scripts: `import { VALIDATORS, validatorForPayload } from "@plinth/contracts/validators"`. The validators module is large (one function per type): import it server-side, in tests and in scripts, not in a client bundle.
- **Dart:** `import 'package:plinth_contracts/plinth_contracts.dart';` then `RiskSummary.fromJson(map)` or `riskSummaryFromJson(string)`. Enum-like fields are `String`s so an older app never throws on a value added later: compare with the constants (`summary.display.state == DisplayState.scored`). Dates and timestamps are `String`s (keep the `+05:30` of `meta.generated_at`).
- **Python:** `from plinth_contracts import RiskSummary, parse_payload, REF_PATTERNS, load_catalogue`. Models forbid unknown fields where the schema does (the server never sends them).

## Conventions the generator enforces

- `$id` is `https://plinth.in/schemas/<file>`; every `$defs` key has `title` equal to the key; type names are unique across files.
- A payload's `properties.schema.const` is `plinth.<file stem>/1` and is required. Acknowledgements (`Ok`, `ConsentWithdrawal`, `DocCheckStarted`) and errors (`ApiError`, `RpcError`) carry no envelope.
- Exported types: every file's top-level type, every `*Request` def, and the acknowledgements and `RpcError`.
- `if`/`then`/`else` hold validation-only invariants (no band unless scored and public; a red-flag band has no frequency; a step matches its band; rows only after the project is confirmed; one PT status per error code). The validators enforce them; the generated types ignore them.
- No `unevaluated*` or `$dynamicRef`.
- Invalid examples are `{ "base", "patch" (RFC 6902), "why", "expect" }` (or a full `"document"`); `expect` is the `instancePath` that must fail.
