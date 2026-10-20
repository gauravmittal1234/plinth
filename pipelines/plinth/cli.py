"""`plinth-pipe`: the pipelines command line (argparse).

    plinth-pipe config                       resolved configuration (no secrets), as JSON
    plinth-pipe live-check                   may this process fetch live? exit 0 yes, 3 no
    plinth-pipe fetch URL --source CODE --fixtures-dir DIR
                                             fetch one request (saved files by default) and
                                             store its snapshot; prints the snapshot as JSON
    plinth-pipe snapshot FILE --source CODE --url URL
                                             store a hand-saved file as a snapshot
    plinth-pipe pii-strip [FILE]             phone numbers and emails out of text
    plinth-pipe score ...                    scoring (T11, plinth.scoring.cli), when present
    plinth-pipe harera ...                   HARERA sources (T18), when present

Subcommands from other packages register through `add_<name>_parser(subparsers)` and set a
`handler` default; `main` dispatches with `args.handler(args)`. A package that is not there
yet (before its task merges) is skipped, so this CLI works on its own.

Exit codes: 0 ok, 1 error, 2 usage or configuration, 3 live fetch refused, 4 no saved fixture.
"""

from __future__ import annotations

import argparse
import dataclasses
import importlib
import json
import sys
from collections.abc import Callable, Sequence
from contextlib import ExitStack
from pathlib import Path
from typing import Any

from plinth import __version__

from .core.clock import parse_instant
from .core.config import ConfigError, FetchMode, PipelineConfig
from .core.db import connect
from .core.fetchers import FetchRequest, FetchResult, FixtureNotFound
from .core.flags import DbFlags, FlagSource, NoFlags
from .core.gate import LiveFetchRefused, LiveGate
from .core.jobs import JobRun, JobSink, JsonlJobSink, PgJobSink
from .core.pii import strip_pii
from .core.pipeline import capture, make_fetcher
from .core.records import SnapshotRecord
from .core.snapshots import LocalBlobStore, SnapshotPut, SnapshotStore
from .core.store import EvidenceStore, LocalIndexStore, PgStore

type SubParsers = argparse._SubParsersAction[argparse.ArgumentParser]
type Registrar = Callable[[SubParsers], None]

#: (module, function) of subcommands owned by other tasks. Missing modules are skipped.
PLUGINS: tuple[tuple[str, str], ...] = (
    ("plinth.scoring.cli", "add_score_parser"),  # T11: plinth-pipe score
    ("plinth.sources.harera.cli", "add_harera_parser"),  # T18: plinth-pipe harera
)

EXIT_ERROR = 1
EXIT_USAGE = 2
EXIT_LIVE_REFUSED = 3
EXIT_NO_FIXTURE = 4


def load_plugin(module: str, attr: str) -> Registrar | None:
    """The registrar `module.attr`, or None when the module does not exist (yet).

    Only a missing module itself (or one of its parent packages) is tolerated. If the module
    exists but fails to import, or lacks `attr`, that is a real bug and it raises.
    """
    try:
        mod = importlib.import_module(module)
    except ModuleNotFoundError as exc:
        missing = exc.name or ""
        if missing and (module == missing or module.startswith(missing + ".")):
            return None
        raise
    registrar = getattr(mod, attr, None)
    if not callable(registrar):
        raise TypeError(f"{module} has no callable {attr}(subparsers)")
    fn: Registrar = registrar
    return fn


# --------------------------------------------------------------------------------------------
# Commands
# --------------------------------------------------------------------------------------------


def _print_json(doc: Any) -> None:
    sys.stdout.write(json.dumps(doc, indent=2, ensure_ascii=False, default=str) + "\n")


def _config(args: argparse.Namespace) -> PipelineConfig:
    cfg = PipelineConfig.from_env()
    snapshot_dir: Path | None = getattr(args, "snapshot_dir", None)
    if snapshot_dir is not None:
        cfg = dataclasses.replace(cfg, snapshot_dir=snapshot_dir)
    return cfg


def cmd_config(args: argparse.Namespace) -> int:
    _print_json(_config(args).describe())
    return 0


def _open_backends(
    cfg: PipelineConfig, use_db: bool, stack: ExitStack
) -> tuple[EvidenceStore, FlagSource, JobSink]:
    local_jobs = JsonlJobSink(cfg.snapshot_dir / "job_runs.jsonl")
    if not use_db:
        return LocalIndexStore(cfg.snapshot_dir / "index.json"), NoFlags(), local_jobs
    if not cfg.db_url:
        raise ConfigError("--db needs PIPELINE_DB_URL (the pipeline_writer login)")
    conn = connect(cfg.db_url)
    stack.callback(conn.close)
    return PgStore(conn), DbFlags(conn), PgJobSink(conn, fallback=local_jobs)


def cmd_live_check(args: argparse.Namespace) -> int:
    cfg = _config(args)
    with ExitStack() as stack:
        flags: FlagSource = NoFlags()
        if cfg.db_url and args.db:
            conn = connect(cfg.db_url)
            stack.callback(conn.close)
            flags = DbFlags(conn)
        decision = LiveGate(cfg, flags, cfg.clock()).decide()
    sys.stdout.write(decision.explain() + "\n")
    return 0 if decision.allowed else EXIT_LIVE_REFUSED


def _pairs(values: list[str] | None, what: str) -> dict[str, str] | None:
    if not values:
        return None
    out: dict[str, str] = {}
    for item in values:
        key, sep, value = item.partition("=")
        if not sep or not key:
            raise ConfigError(f"{what} {item!r}: expected key=value")
        out[key] = value
    return out


def _put_doc(put: SnapshotPut) -> dict[str, Any]:
    rec: SnapshotRecord = put.record
    return {
        "created": put.created,
        "changed": put.changed,
        "snapshot": {
            "id": rec.id,
            "source_code": rec.source_code,
            "url": rec.url,
            "method": rec.method,
            "params": rec.params,
            "fetched_at": rec.fetched_at.isoformat(),
            "http_status": rec.http_status,
            "sha256": rec.sha256,
            "storage_key": rec.storage_key,
            "content_type": rec.content_type,
            "bytes": rec.bytes,
            "parser_version": rec.parser_version,
            "fixture": rec.fixture,
        },
    }


def cmd_fetch(args: argparse.Namespace) -> int:
    cfg = _config(args)
    clock = cfg.clock()
    request = FetchRequest(
        source_code=args.source,
        url=args.url,
        method=args.method,
        params=_pairs(args.param, "--param"),
        data=_pairs(args.form, "--form"),
    )
    with ExitStack() as stack:
        store, flags, jobs = _open_backends(cfg, args.db, stack)
        fetcher = make_fetcher(cfg, flags=flags, clock=clock, fixtures_dir=args.fixtures_dir)
        snapshots = SnapshotStore(LocalBlobStore(cfg.snapshot_dir), store)
        with JobRun(
            f"fetch.{args.source}", source_code=args.source, mode=cfg.mode, clock=clock, sink=jobs
        ) as run:
            put = capture(
                request,
                fetcher=fetcher,
                snapshots=snapshots,
                run=run,
                parser_version=args.parser_version,
            )
    _print_json(_put_doc(put))
    return 0


def cmd_snapshot(args: argparse.Namespace) -> int:
    cfg = _config(args)
    clock = cfg.clock()
    path: Path = args.file
    request = FetchRequest(source_code=args.source, url=args.url, method=args.method)
    result = FetchResult(
        request=request,
        status=args.status,
        body=path.read_bytes(),
        content_type=args.content_type,
        fetched_at=args.fetched_at or clock.now(),
        fixture=args.fixture,
        final_url=args.url,
    )
    with ExitStack() as stack:
        store, _flags, _jobs = _open_backends(cfg, args.db, stack)
        put = SnapshotStore(LocalBlobStore(cfg.snapshot_dir), store).put(
            result, parser_version=args.parser_version
        )
    _print_json(_put_doc(put))
    return 0


def cmd_pii_strip(args: argparse.Namespace) -> int:
    text = args.file.read_text(encoding="utf-8") if args.file else sys.stdin.read()
    result = strip_pii(text)
    sys.stdout.write(result.text)
    sys.stderr.write(f"stripped {result.phones} phone number(s), {result.emails} email(s)\n")
    return 0


# --------------------------------------------------------------------------------------------
# Parser
# --------------------------------------------------------------------------------------------


def _store_options(p: argparse.ArgumentParser) -> None:
    p.add_argument(
        "--snapshot-dir",
        type=Path,
        default=None,
        help="Local snapshot store (default: PLINTH_SNAPSHOT_DIR or ~/.cache/plinth/snapshots).",
    )
    p.add_argument(
        "--db",
        action="store_true",
        help="Write rows to Postgres as pipeline_writer (PIPELINE_DB_URL) instead of the "
        "local index.",
    )
    p.add_argument("--parser-version", default=None, help="Recorded on the snapshot row.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="plinth-pipe",
        description="Plinth pipelines: fetch, snapshot, parse, facts, score, publish. "
        f"Fetch mode comes from PLINTH_FETCH_MODE (default {FetchMode.FIXTURES.value}).",
    )
    parser.add_argument("--version", action="version", version=f"plinth-pipe {__version__}")
    sub = parser.add_subparsers(dest="command", metavar="<command>")

    p = sub.add_parser("config", help="Print the resolved configuration (no secrets) as JSON.")
    p.add_argument("--snapshot-dir", type=Path, default=None)
    p.set_defaults(handler=cmd_config)

    p = sub.add_parser(
        "live-check",
        help="Explain whether live fetching is allowed here (exit 0 allowed, 3 refused).",
    )
    p.add_argument("--db", action="store_true", help="Read harera_live_fetch from the database.")
    p.set_defaults(handler=cmd_live_check)

    p = sub.add_parser(
        "fetch",
        help="Fetch one request (saved fixtures by default) and store its snapshot.",
    )
    p.add_argument("url", help="Request URL (fixture://path reads <fixtures-dir>/path).")
    p.add_argument("--source", required=True, help="core.sources code, e.g. harera_qpr.")
    p.add_argument("--method", default="GET", choices=("GET", "POST"))
    p.add_argument("--param", action="append", metavar="KEY=VALUE", help="Query parameter.")
    p.add_argument("--form", action="append", metavar="KEY=VALUE", help="Form field (POST).")
    p.add_argument("--fixtures-dir", type=Path, default=None, help="Saved files (fixtures mode).")
    _store_options(p)
    p.set_defaults(handler=cmd_fetch)

    p = sub.add_parser("snapshot", help="Store a hand-saved file as a snapshot.")
    p.add_argument("file", type=Path)
    p.add_argument("--source", required=True, help="core.sources code.")
    p.add_argument("--url", required=True, help="The page's official URL.")
    p.add_argument("--method", default="GET", choices=("GET", "POST"))
    p.add_argument("--status", type=int, default=200)
    p.add_argument("--content-type", default=None)
    p.add_argument(
        "--fetched-at", type=parse_instant, default=None, help="ISO instant (default: clock)."
    )
    p.add_argument(
        "--fixture",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Mark the snapshot as fixture data (default yes).",
    )
    _store_options(p)
    p.set_defaults(handler=cmd_snapshot)

    p = sub.add_parser("pii-strip", help="Strip phone numbers and emails (stdin or FILE).")
    p.add_argument("file", type=Path, nargs="?", default=None)
    p.set_defaults(handler=cmd_pii_strip)

    for module, attr in PLUGINS:
        registrar = load_plugin(module, attr)
        if registrar is not None:
            registrar(sub)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    handler: Callable[[argparse.Namespace], int] | None = getattr(args, "handler", None)
    if handler is None:
        parser.print_help(sys.stderr)
        return EXIT_USAGE
    try:
        return int(handler(args))
    except LiveFetchRefused as exc:
        sys.stderr.write(f"plinth-pipe: {exc}\n")
        return EXIT_LIVE_REFUSED
    except FixtureNotFound as exc:
        sys.stderr.write(f"plinth-pipe: {exc}\n")
        return EXIT_NO_FIXTURE
    except ConfigError as exc:
        sys.stderr.write(f"plinth-pipe: {exc}\n")
        return EXIT_USAGE


if __name__ == "__main__":
    raise SystemExit(main())
