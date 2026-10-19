"""`plinth-pipe` command line.

Placeholder from T00 so the console script declared in pyproject.toml resolves.
T10 replaces it with the real argparse CLI (`score`, `harera run`, ...).
"""

import argparse

from plinth import __version__


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="plinth-pipe",
        description="Plinth pipelines: fetch, snapshot, parse, facts, score, publish.",
    )
    parser.add_argument("--version", action="version", version=f"plinth-pipe {__version__}")
    return parser


def main(argv: list[str] | None = None) -> int:
    build_parser().parse_args(argv)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
