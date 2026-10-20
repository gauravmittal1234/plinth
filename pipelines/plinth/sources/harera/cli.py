"""`plinth-pipe harera run`: parse HARERA fixtures into records or facts (T18).

    plinth-pipe harera run --fixtures --as-of 2026-10-14 --emit facts
    plinth-pipe harera run --fixtures --as-of 2026-10-14 --emit records

`plinth-pipe` itself is T10's (plinth/cli.py); it registers this subcommand with
`add_harera_parser(subparsers)` (see `plinth.cli.PLUGINS`). Live HTTP is never on this path:
`run_harera` only ever builds a `FixtureFetcher` (AGENTS.md §7, the hard "no live network
access to HARERA" rule).
"""

from __future__ import annotations

import argparse
import dataclasses
import json
import sys
from collections.abc import Sequence
from datetime import date, datetime
from pathlib import Path
from typing import Any

from plinth.core.clock import Clock, FrozenClock
from plinth.core.facts import FactWrite
from plinth.core.store import MemoryStore

from .pipeline import run_harera
from .records import MissingQpr

FIXTURES = Path("pipelines") / "tests" / "fixtures" / "harera"


def find_default_fixtures(start: Path | None = None) -> Path:
    """`pipelines/tests/fixtures/harera`, from the working directory or this file, walking up."""
    seeds = [start or Path.cwd(), Path(__file__).resolve()]
    for seed in seeds:
        for d in [seed, *seed.parents]:
            if (d / FIXTURES / "manifest.json").is_file():
                return d / FIXTURES
    raise FileNotFoundError(f"{FIXTURES} not found; pass --fixtures-dir")


def add_harera_parser(subparsers: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    p = subparsers.add_parser(
        "harera",
        help="HARERA sources (T18): parse saved fixtures into records or facts.",
        description="HARERA parsers run only on saved fixture files. No live fetch (AGENTS §7).",
    )
    sub = p.add_subparsers(dest="harera_command", required=True)
    configure_run(sub)


def configure_run(subparsers: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    p = subparsers.add_parser(
        "run", help="Parse every changed fixture in the manifest; write facts in memory."
    )
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument(
        "--fixtures",
        action="store_true",
        help="Read pipelines/tests/fixtures/harera (manifest.json + the §5b synthetic pages).",
    )
    src.add_argument(
        "--fixtures-dir", type=Path, help="A HARERA fixtures directory to read instead."
    )
    p.add_argument(
        "--as-of",
        required=True,
        type=date.fromisoformat,
        help="Data cutoff (YYYY-MM-DD): a quarter is 'missing' once this date passes its due date.",
    )
    p.add_argument(
        "--emit",
        choices=("facts", "records"),
        default="facts",
        help="facts: FactsWriter output (bitemporal, with page refs). records: the raw parse.",
    )
    p.add_argument("--out", type=Path, default=None, help="Write here instead of stdout.")
    p.set_defaults(handler=handle_run)


def _fact_write_json(write: FactWrite) -> dict[str, Any]:
    fact = write.fact
    return {
        "kind": write.kind.value,
        "subject_type": fact.subject_type,
        "subject_id": fact.subject_id,
        "attribute": fact.attribute,
        "value": fact.value,
        "as_of": fact.as_of.isoformat() if fact.as_of else None,
        "valid_from": fact.valid_from.isoformat() if fact.valid_from else None,
        "snapshot_id": fact.snapshot_id,
        "page_ref": fact.page_ref,
        "method": fact.method,
        "lane": fact.lane.value,
        "read_note": fact.read_note,
    }


def _missing_json(missing: MissingQpr) -> dict[str, Any]:
    return {
        "registration_no": missing.registration_no,
        "quarter": missing.quarter,
        "due_at": missing.due_at.isoformat(),
    }


def _record_json(value: Any) -> Any:
    if dataclasses.is_dataclass(value) and not isinstance(value, type):
        return {k: _record_json(v) for k, v in dataclasses.asdict(value).items()}
    if isinstance(value, datetime | date):
        return value.isoformat()
    return value


def handle_run(args: argparse.Namespace) -> int:
    fixtures_dir: Path = args.fixtures_dir if args.fixtures_dir else find_default_fixtures()
    as_of: date = args.as_of
    store = MemoryStore()
    clock: Clock = FrozenClock()
    result = run_harera(fixtures_dir, as_of=as_of, store=store, clock=clock)

    if args.emit == "facts":
        doc: dict[str, Any] = {
            "as_of": as_of.isoformat(),
            "fetched": result.fetched,
            "changed": result.changed,
            "facts": [_fact_write_json(w) for w in result.facts],
            "missing_qprs": [_missing_json(m) for m in result.missing_qprs],
        }
    else:
        doc = {
            "as_of": as_of.isoformat(),
            "records": {
                doc_type: [_record_json(r) for r in rows]
                for doc_type, rows in result.records.items()
            },
        }
    text = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
    if args.out is not None:
        args.out.write_text(text, encoding="utf-8")
    else:
        sys.stdout.write(text)
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m plinth.sources.harera", description="HARERA (T18)."
    )
    sub = parser.add_subparsers(dest="command", required=True)
    add_harera_parser(sub)
    args = parser.parse_args(argv)
    code: int = args.handler(args)
    return code


if __name__ == "__main__":
    raise SystemExit(main())
