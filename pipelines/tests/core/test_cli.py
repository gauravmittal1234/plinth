"""`plinth-pipe`: commands, exit codes, and the plugin hook for `score` (T11) and `harera` (T18)."""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
import types
from pathlib import Path

import pytest

from plinth import __version__
from plinth.cli import (
    EXIT_LIVE_REFUSED,
    EXIT_NO_FIXTURE,
    EXIT_USAGE,
    PLUGINS,
    build_parser,
    load_plugin,
    main,
)

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures" / "core"


@pytest.fixture(autouse=True)
def clean_env(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    for name in (
        "PLINTH_FETCH_MODE",
        "HARERA_LIVE_FETCH_APPROVED",
        "PIPELINE_DB_URL",
        "PLINTH_FETCH_CONTACT",
        "PLINTH_FIXED_NOW",
    ):
        monkeypatch.delenv(name, raising=False)
    snap = tmp_path / "snapshots"
    monkeypatch.setenv("PLINTH_SNAPSHOT_DIR", str(snap))
    return snap


def subcommands() -> set[str]:
    parser = build_parser()
    action = next(a for a in parser._actions if isinstance(a, argparse._SubParsersAction))
    return set(action.choices)


def test_version(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit) as exc:
        main(["--version"])
    assert exc.value.code == 0
    assert capsys.readouterr().out.strip() == f"plinth-pipe {__version__}"


def test_no_command_prints_help(capsys: pytest.CaptureFixture[str]) -> None:
    assert main([]) == EXIT_USAGE
    assert "usage: plinth-pipe" in capsys.readouterr().err


def test_core_commands_are_registered() -> None:
    assert {"config", "live-check", "fetch", "snapshot", "pii-strip"} <= subcommands()


def test_config_prints_the_mode(capsys: pytest.CaptureFixture[str], clean_env: Path) -> None:
    assert main(["config"]) == 0
    doc = json.loads(capsys.readouterr().out)
    assert doc["mode"] == "fixtures"
    assert doc["clock"] == "frozen 2026-10-18T12:00:00+05:30"
    assert doc["snapshot_dir"] == str(clean_env)


def test_live_check_refuses_here_even_with_every_key(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setenv("PLINTH_FETCH_MODE", "live")
    monkeypatch.setenv("HARERA_LIVE_FETCH_APPROVED", "yes")
    monkeypatch.setenv("PLINTH_FETCH_CONTACT", "data@example.test")
    assert main(["live-check"]) == EXIT_LIVE_REFUSED
    out = capsys.readouterr().out
    assert "running under pytest" in out
    assert "harera_live_fetch is off" in out


def test_fetch_twice_is_idempotent(capsys: pytest.CaptureFixture[str], clean_env: Path) -> None:
    args = ["fetch", "fixture://pages/list.html", "--source", "harera_registration"]
    args += ["--fixtures-dir", str(FIXTURES), "--parser-version", "test@1"]
    assert main(args) == 0
    first = json.loads(capsys.readouterr().out)
    assert main(args) == 0
    second = json.loads(capsys.readouterr().out)
    assert (first["created"], first["changed"]) == (True, True)
    assert (second["created"], second["changed"]) == (False, False)
    assert first["snapshot"]["id"] == second["snapshot"]["id"]
    snap = first["snapshot"]
    assert snap["fixture"] is True and snap["parser_version"] == "test@1"
    assert snap["fetched_at"] == "2026-10-18T12:00:00+05:30"
    assert (clean_env / snap["storage_key"]).is_file()
    runs = [json.loads(x) for x in (clean_env / "job_runs.jsonl").read_text().splitlines()]
    assert [(r["fetched"], r["changed"]) for r in runs] == [(1, 1), (1, 0)]


def test_fetch_post_from_the_manifest(capsys: pytest.CaptureFixture[str]) -> None:
    code = main(
        [
            "fetch",
            "https://portal.example.test/qpr",
            "--source",
            "harera_qpr",
            "--method",
            "POST",
            "--form",
            "quarter=2026-Q2",
            "--form",
            "registration=FIX/001/2022",
            "--fixtures-dir",
            str(FIXTURES),
        ]
    )
    assert code == 0
    snap = json.loads(capsys.readouterr().out)["snapshot"]
    assert snap["method"] == "POST"
    assert snap["params"] == {"form": {"quarter": "2026-Q2", "registration": "FIX/001/2022"}}


def test_fetch_exit_codes(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    base = ["--source", "harera_qpr", "--fixtures-dir", str(FIXTURES)]
    assert main(["fetch", "fixture://pages/nope.html", *base]) == EXIT_NO_FIXTURE
    assert main(["fetch", "fixture://pages/list.html", "--source", "harera_qpr"]) == EXIT_USAGE
    assert main(["fetch", "fixture://x", *base, "--param", "novalue"]) == EXIT_USAGE
    assert main(["fetch", "fixture://pages/list.html", *base, "--db"]) == EXIT_USAGE  # no DB URL
    monkeypatch.setenv("PLINTH_FETCH_MODE", "live")
    assert (
        main(["fetch", "https://haryanarera.gov.in/", "--source", "harera_qpr"])
        == EXIT_LIVE_REFUSED
    )
    assert "live fetch refused" in capsys.readouterr().err


def test_snapshot_a_hand_saved_file(capsys: pytest.CaptureFixture[str]) -> None:
    page = FIXTURES / "pages" / "list.html"
    args = [
        "snapshot",
        str(page),
        "--source",
        "harera_registration",
        "--url",
        "https://portal.example.test/projects",
    ]
    assert main([*args, "--no-fixture", "--fetched-at", "2026-10-14T10:00:00+05:30"]) == 0
    snap = json.loads(capsys.readouterr().out)["snapshot"]
    assert snap["fixture"] is False
    assert snap["fetched_at"] == "2026-10-14T10:00:00+05:30"
    assert snap["bytes"] == page.stat().st_size


def test_pii_strip(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    f = tmp_path / "t.txt"
    f.write_text("Call +91 99000 00318 or sales@example.com. A/c 50200071824417.\n")
    assert main(["pii-strip", str(f)]) == 0
    out = capsys.readouterr()
    assert out.out == "Call [phone removed] or [email removed]. A/c 50200071824417.\n"
    assert "1 phone number(s), 1 email(s)" in out.err


# -- plugins ---------------------------------------------------------------------------------


def test_plugins_are_the_t11_and_t18_registrars() -> None:
    assert ("plinth.scoring.cli", "add_score_parser") in PLUGINS
    assert ("plinth.sources.harera.cli", "add_harera_parser") in PLUGINS


def test_score_is_registered_exactly_when_t11_is_present() -> None:
    present = importlib.util.find_spec("plinth.scoring.cli") is not None
    assert ("score" in subcommands()) is present


def test_a_missing_plugin_module_is_skipped() -> None:
    assert load_plugin("plinth.sources.t10_not_a_package.cli", "add_x_parser") is None
    assert load_plugin("t10_no_such_top_level", "add_x_parser") is None


def test_a_broken_plugin_is_not_hidden(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    (tmp_path / "t10_broken_plugin.py").write_text("import t10_missing_dependency\n")
    (tmp_path / "t10_attrless_plugin.py").write_text("X = 1\n")
    monkeypatch.syspath_prepend(str(tmp_path))
    with pytest.raises(ModuleNotFoundError, match="t10_missing_dependency"):
        load_plugin("t10_broken_plugin", "add_x_parser")
    with pytest.raises(TypeError, match="add_x_parser"):
        load_plugin("t10_attrless_plugin", "add_x_parser")


def test_t11_shaped_plugin_dispatches_through_args_handler(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    """The handoff contract: add_score_parser(subparsers) sets `handler`; main calls it."""
    seen: list[argparse.Namespace] = []

    def handle(args: argparse.Namespace) -> int:
        seen.append(args)
        sys.stdout.write('{"schema": "plinth.fixtures.scoring/1"}\n')
        return 0

    def add_score_parser(subparsers: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
        p = subparsers.add_parser("score", help="Score every phase.")
        p.add_argument("--fixtures", action="store_true")
        p.add_argument("--as-of", required=True)
        p.add_argument("--emit", choices=("json", "explain"), default="json")
        p.set_defaults(handler=handle)

    fake = types.ModuleType("plinth.scoring.cli")
    fake.add_score_parser = add_score_parser  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "plinth.scoring.cli", fake)

    assert "score" in subcommands()
    assert main(["score", "--fixtures", "--as-of", "2026-10-14", "--emit", "json"]) == 0
    assert seen[0].as_of == "2026-10-14" and seen[0].fixtures and seen[0].emit == "json"
    assert json.loads(capsys.readouterr().out)["schema"] == "plinth.fixtures.scoring/1"


def test_t18_shaped_plugin_registers_harera(monkeypatch: pytest.MonkeyPatch) -> None:
    def add_harera_parser(subparsers: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
        p = subparsers.add_parser("harera")
        p.set_defaults(handler=lambda args: 7)

    pkg = types.ModuleType("plinth.sources.harera")
    pkg.__path__ = []
    fake = types.ModuleType("plinth.sources.harera.cli")
    fake.add_harera_parser = add_harera_parser  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "plinth.sources.harera", pkg)
    monkeypatch.setitem(sys.modules, "plinth.sources.harera.cli", fake)
    assert main(["harera"]) == 7
