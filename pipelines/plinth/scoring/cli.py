"""`plinth-pipe score`: run scoring and emit the published document or an explanation.

    plinth-pipe score --fixtures --as-of 2026-10-14 --emit json
    plinth-pipe score --fixtures --as-of 2026-10-14 --emit explain
    plinth-pipe score --fixtures --as-of 2026-10-14 --replay-audit

`plinth-pipe` itself is T10's (plinth/cli.py): it registers this subcommand with
`add_score_parser(subparsers)`. Until then the same command runs as
`python -m plinth.scoring score ...`.
"""

from __future__ import annotations

import argparse
import sys
from collections.abc import Sequence
from datetime import date, datetime
from pathlib import Path

from .dates import parse_instant
from .emit import document, dumps
from .explain import explain, replay_audit
from .fixture_world import load_ledger, load_provenance
from .runs import run_scoring
from .world import World

CANONICAL = Path("packages") / "fixtures" / "canonical"


def find_canonical(start: Path | None = None) -> Path:
    """packages/fixtures/canonical from the working directory or this file, walking up."""
    seeds = [start or Path.cwd(), Path(__file__).resolve()]
    for seed in seeds:
        for d in [seed, *seed.parents]:
            if (d / CANONICAL / "catalogue.json").is_file():
                return d / CANONICAL
    raise FileNotFoundError("packages/fixtures/canonical not found; pass --fixtures-dir")


def add_score_parser(subparsers: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    p = subparsers.add_parser(
        "score",
        help="Score every phase (Delivery Risk v1.x) and emit the published runs.",
        description="Delivery Risk scoring. Rules decide; AI never sets a band.",
    )
    configure(p)


def configure(p: argparse.ArgumentParser) -> None:
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument(
        "--fixtures",
        action="store_true",
        help="Read packages/fixtures/canonical (the DESIGN §5b world) and its run ledger.",
    )
    src.add_argument(
        "--fixtures-dir", type=Path, help="A canonical fixtures directory to read instead."
    )
    p.add_argument(
        "--as-of",
        required=True,
        type=date.fromisoformat,
        help="Data cutoff (YYYY-MM-DD). Bands are recalculated on data up to the end of it.",
    )
    p.add_argument(
        "--now",
        type=parse_instant,
        default=None,
        help="Clock for the watch pass (ISO instant). Default: the fixtures' frozen clock.",
    )
    p.add_argument(
        "--model", default=None, help="Model version (default: the one current on --as-of)."
    )
    p.add_argument(
        "--emit",
        choices=("json", "explain"),
        default="json",
        help="json: the published document; explain: features, bins, contributions, p.",
    )
    p.add_argument(
        "--replay-audit",
        action="store_true",
        help="Re-run each ledger run's model on the facts on record at its cutoff and compare.",
    )
    p.add_argument("--out", type=Path, default=None, help="Write here instead of stdout.")
    p.set_defaults(handler=handle)


def handle(args: argparse.Namespace) -> int:
    canonical: Path = args.fixtures_dir if args.fixtures_dir else find_canonical()
    world = World.from_dir(canonical)
    ledger = load_ledger()
    provenance = load_provenance()
    now: datetime | None = args.now
    if args.replay_audit:
        text = replay_audit(world, ledger)
    else:
        result = run_scoring(
            world,
            args.as_of,
            ledger=ledger,
            provenance=provenance,
            clock=now,
            model_version=args.model,
        )
        text = dumps(document(result)) if args.emit == "json" else explain(result)
    if args.out is not None:
        args.out.write_text(text, encoding="utf-8")
    else:
        sys.stdout.write(text)
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m plinth.scoring", description="Plinth scoring (T11)."
    )
    sub = parser.add_subparsers(dest="command", required=True)
    add_score_parser(sub)
    args = parser.parse_args(argv)
    code: int = args.handler(args)
    return code
