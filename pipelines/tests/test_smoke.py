"""Bootstrap smoke test (T00). T10 replaces it with real core tests."""

import pytest

import plinth
from plinth.cli import main


def test_package_imports() -> None:
    assert plinth.__version__


def test_cli_version_exits_cleanly(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit) as exc:
        main(["--version"])
    assert exc.value.code == 0
    assert "plinth-pipe" in capsys.readouterr().out
