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
