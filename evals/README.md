# evals: AI task evaluations (T63)

Every AI task ships prompts, a response schema, recorded responses for every sample document and an
eval with gates (AGENTS.md §7, BUILD_PLAN §14 hard rule 7). This folder holds the eval sets and the
Deno harness that runs them. CI runs every set in **recorded** mode (`ci-evals.yml`): no network, no
key, no cost. Only `nightly.yml` may run AI live.

## Commands (from `evals/`)

| Command                                 | What it does                                                        |
| --------------------------------------- | ------------------------------------------------------------------- |
| `deno task eval -- self-test`           | The harness's toy sets: `toy` must pass, `toy-fail` must miss gates |
| `deno task eval -- --all`               | Every set under `evals/` (not `evals/lib`); exit 1 on any gate miss |
| `deno task eval -- evals/claims/<task>` | One set (path from the repo root); `--json` prints the full report  |
| `deno task test`                        | The harness's own tests                                             |
| `deno task guard`                       | Fails if any workflow but `nightly.yml` sets `AI_MODE` to live      |
| `deno task record -- <set> [--write]`   | Re-records a set from a live run: nightly or dev, free tier only    |
| `deno task verify`                      | fmt, lint, check, tests, guard and the self-test                    |

## A set

The folder a task's catalogue entry names in `eval_set`
(`packages/contracts/catalogues/ai_tasks.json`), for example
`evals/claims/extract.marketing_claims`:

```
evals/claims/extract.marketing_claims/
  gates.json
  golden/flyer-aurelia.json
  golden/hoarding.json
```

`gates.json` (`plinth.eval_gates/1`):

```json
{
  "format": "plinth.eval_gates/1",
  "task": "extract.marketing_claims@1",
  "readers": ["a", "b"],
  "compare": {
    "items": "claims",
    "key": ["type"],
    "fields": {
      "value": {
        "by": "type",
        "kinds": { "price": "inr", "possession": "date", "area": "area" },
        "default": "text"
      },
      "qualifier": "text"
    }
  },
  "confidence_bar": 0.8,
  "gates": {
    "precision_min": 0.95,
    "recall_min": 0.9,
    "agreed_but_wrong_max": 0,
    "errors_max": 0,
    "fields": { "value": { "precision_min": 0.95 } }
  }
}
```

- `readers`: the two readers to compare (default: the task's readers when it has two, else one
  call). With one reader, `agreement_rate_*` and `agreed_but_wrong_*` gates cannot pass.
- `compare`: what `agree.ts` compares. `items` names the output's list and `key` the fields that
  pair items across readers; omit both for a flat output. Kinds: `inr`, `date` (month), `area` (sq
  ft with basis), `percent`, `number`, `text`, `enum`.
- `confidence_bar`: facts below it would be "Can't check" by the rules, so they do not count as
  predicted. Use the bar from `core.check_rules` for the task.
- Gates: `precision_min`, `recall_min`, `f1_min` (overall and per field), `agreement_rate_min`,
  `agreed_but_wrong_max` (the extraction-side guard for false Differs: both readers agreed on a
  value the golden says is wrong), `errors_max` (default 0: a recorded miss or a schema mismatch
  fails the set).

A golden (`plinth.eval_golden/1`) is one sample document's input and the output the readers should
agree on:

```json
{
  "format": "plinth.eval_golden/1",
  "id": "flyer-aurelia",
  "input": {
    "source_sha256": "<sha of packages/fixtures/media/docs/flyer.pdf>",
    "lines": [{ "id": "p1-l01", "text": "…" }]
  },
  "expected": { "claims": [{ "type": "price", "value": "₹2.74 Cr" }] }
}
```

The input is what the gateway receives (`TaskInput`), before PII stripping: the gateway strips and
hashes it the same way in every mode. For OCR, `input.media` is `{ "mime_type", "path" }` with a
path from the repo root. Facts in goldens come from DESIGN.md §5b, and every source document must be
a fictional sample listed in `packages/fixtures/media/docs/manifest.json`.

## Metrics

Facts are (item key, field, normalised value). "Predicted" is what would reach the rules: with two
readers, the facts both agreed on at or above the confidence bar; with one reader, its facts at or
above the bar. Per field and overall: precision = correct / predicted, recall = correct / expected,
F1. Agreement rate = agreed / (agreed + disagreements). Agreed-but-wrong = agreed facts above the
bar that are not in the golden.

## Adding a task's eval (T69, T70)

1. Prompts: `supabase/functions/_shared/ai/prompts/<task id>/<prompt version>.md` (`a@1.md`,
   `b@1.md` for two readers; `v1.md` for one). The file is the whole system instruction; the
   document arrives as fenced data. Changing what a prompt asks for means a new version.
2. Schema: the task's `response_schema` in `ai_tasks.json` (T61 adds `schemas/ai/`); the gateway
   refuses a task without one.
3. Set: `evals/<group>/<task id>/gates.json` and `golden/*.json`, where `<group>/<task id>` is the
   catalogue's `eval_set`.
4. Recordings: `deno task record -- evals/<group>/<task id> --write` on the free tier in dev (needs
   the sample manifest, a pinned `model_id`, a daily call cap and the dev database's budget and log
   RPCs), then commit `packages/fixtures/recorded/ai/<task id>/*.json`. Until a key exists, a
   recording can be written by hand in the same format (`packages/fixtures/recorded/ai/README.md`);
   `inputShaFor()` in `_shared/ai/gateway.ts` gives the file name.
5. `deno task eval -- evals/<group>/<task id>` passes locally; `ci-evals` runs it on every PR.

## The self-test

`lib/selftest/` holds a toy catalogue (`extract.toy_claims@1`), prompts, two sets and their
recordings. `toy` passes (precision 100%, recall 83%, one area disagreement on its basis);
`toy-fail` must fail with `agreed_but_wrong 1 > 0` (a golden that disagrees with what both readers
read) and `errors 1 > 0` (a golden with no recording). The recordings are built from
`lib/selftest/answers.json` by `deno run --allow-read --allow-write lib/selftest/make.ts`, and a
test keeps the committed files equal to what it builds.
