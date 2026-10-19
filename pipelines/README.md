# pipelines: Plinth data pipelines (Python 3.14)

fetch -> snapshot -> parse -> facts -> score -> publish (BUILD_PLAN §5.4, §7.1).

```bash
npm run py:setup     # once: pipelines/.venv with this package + plinth_contracts (editable)
npm run py:verify    # ruff, ruff format --check, mypy, pytest
pipelines/.venv/bin/plinth-pipe --help
```

| Path | Owner |
|---|---|
| `plinth/core`, `plinth/extract`, `plinth/resolve`, `plinth/publish`, `plinth/cli.py`, `tests/` (except below) | T10 |
| `plinth/scoring/**`, `tests/scoring/**` | T11 |
| `plinth/sources/harera/**`, `tests/sources/harera/**`, `tests/fixtures/harera/**` | T18 |

Rules that bind every change here:

- **No scraping before the legal memo.** Live fetch needs both the `harera_live_fetch` flag and `HARERA_LIVE_FETCH_APPROVED=yes`. Tests run on saved fixtures only.
- Pipelines connect as the `pipeline_writer` Postgres role (`PIPELINE_DB_URL`), never the secret key.
- `pyproject.toml` and `uv.lock` are frozen after T00. New dependencies go through the lead.

## `plinth.core` (T10)

| Module | What it gives a source |
|---|---|
| `config` | `PipelineConfig.from_env()`: `PLINTH_FETCH_MODE` (`fixtures` default, or `live`), `PIPELINE_DB_URL`, `PLINTH_SNAPSHOT_DIR`, `PLINTH_FETCH_CONTACT`, `PLINTH_FIXED_NOW` |
| `clock` | `FrozenClock` at 18 Oct 2026 12:00 IST in fixtures mode and tests; `SystemClock` live |
| `gate` | `LiveGate`: live HTTP only with the `harera_live_fetch` flag (database) **and** `HARERA_LIVE_FETCH_APPROVED=yes`, never in CI or under pytest, and with a contact email |
| `fetchers` | `FetchRequest`, `FetchResult`, `FixtureFetcher` (a `manifest.json` or `fixture://` paths; no network) |
| `http_fetcher` | `HttpFetcher`: needs a `LivePermit`; robots.txt, 3-5 s per host, one request in flight, backoff on 429/5xx, stops on a CAPTCHA |
| `snapshots` | `SnapshotStore.put(result)`: sha256 blob (local dir or Storage, write-once) + `core.snapshots` row, idempotent by hash; `.changed` false means heartbeat only |
| `facts` | `FactsWriter.write(FactDraft(...))`: bitemporal, supersede chains, PII stripped first; `key_fields` separates a series (e.g. quarters) |
| `pii` | `strip_pii(text)`: phone numbers and emails out; RERA numbers, account numbers, amounts and dates stay |
| `jobs` | `JobRun(...)`: one `ops.job_runs` row per run (fetched, changed, parsed, yield, errors) |
| `store` | `PgStore` (pipeline_writer), `MemoryStore` (tests), `LocalIndexStore` (offline CLI) |
| `testing` | `FakeTime`, `FakeConnection`: no sleeping, no database |

A source's run, in outline:

```python
cfg = PipelineConfig.from_env()
clock = cfg.clock()
fetcher = make_fetcher(cfg, flags=flags, clock=clock, fixtures_dir=FIXTURES)
snapshots = SnapshotStore(LocalBlobStore(cfg.snapshot_dir), store)
facts = FactsWriter(store, clock)
with JobRun("harera.qpr", source_code="harera_qpr", mode=cfg.mode, clock=clock, sink=sink) as run:
    put = capture(FetchRequest("harera_qpr", url, "POST", data=form),
                  fetcher=fetcher, snapshots=snapshots, run=run, parser_version="harera@1")
    if put.changed:
        for draft in parse(snapshots.read(put.record), snapshot_id=put.record.id):
            facts.write(draft)
        run.parsed += 1
```

## `plinth-pipe`

`config`, `live-check`, `fetch`, `snapshot` and `pii-strip` live in `plinth/cli.py`. Other tasks add a subcommand with `add_<name>_parser(subparsers)` (setting a `handler` default), listed in `plinth.cli.PLUGINS`; a module that does not exist yet is skipped. Registered today: `plinth.scoring.cli:add_score_parser` (T11) and `plinth.sources.harera.cli:add_harera_parser` (T18).

Exit codes: 0 ok, 1 error, 2 usage or configuration, 3 live fetch refused, 4 no saved fixture.
