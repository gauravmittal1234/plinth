# Recorded AI responses (T63)

`AI_MODE=recorded` (CI, tests, the fixture world) replays these files instead of calling a model.
The gateway (`supabase/functions/_shared/ai/gateway.ts`) looks up
`packages/fixtures/recorded/ai/<task id>/<input_sha256>.json`, the task's `recorded_dir` in
`packages/contracts/catalogues/ai_tasks.json`. A miss is a `recorded_miss` error, never a live call.

## The input SHA

```
input_sha256 = sha256( canonical JSON of [ "<task>@<version>", "<prompt version>", <input> ] )
```

`<input>` is the task input after normalisation (Unicode NFC, LF line ends, no trailing spaces, no
control characters) and PII stripping per the task's `pii_policy` (phones, e-mails, PAN, Aadhaar,
and bank accounts under `strip_and_redact_bank`, become `[PHONE_1]`-style tokens), without
`source_sha256`, with media as `{ mime_type, sha256 }`. Canonical JSON sorts object keys. The
prompt version is the reader's (`a@1`, `b@1`) or `v<version>`. `inputShaFor(taskKey, input, {
reader })` in the gateway computes it.

## File format (`plinth.ai_recorded/1`)

```json
{
  "format": "plinth.ai_recorded/1",
  "task": "extract.marketing_claims@1",
  "prompt_version": "a@1",
  "input_sha256": "<64 hex>",
  "source_sha256": "<64 hex: the sample document>",
  "model": "<the pinned model id>",
  "recorded_at": "2026-10-18T12:00:00+05:30",
  "attempts": [
    { "output": { "claims": [] }, "tokens_in": 812, "tokens_out": 140 }
  ]
}
```

`attempts` replays in order, one or two of them. An attempt is `{ "output": … }` (parsed JSON) or
`{ "text": "…" }` (the raw answer, kept when it was not JSON). When the first fails the response
schema, the gateway's one retry replays the second; a recording with one failing attempt replays
as `schema_mismatch`.

## Rules

- Recorded only from the **fictional sample documents** in `packages/fixtures/media/docs/manifest.json`
  (DECISIONS E-8): `evals/lib/record.ts` runs on the free tier, where the gateway refuses anything
  else. Never record a real buyer's document.
- Written by `deno task record -- <eval set> --write` (in `evals/`), nightly or in dev. A hand-written
  recording (before a key exists) uses the same format and file name.
- Recorded outputs are model readings, not facts: the rules decide every verdict. Facts the goldens
  expect come from DESIGN.md §5b.
- One folder per task id. Owners: the task that owns the eval set (T69 claims, T70 money); T63 owns
  this README and the format.
