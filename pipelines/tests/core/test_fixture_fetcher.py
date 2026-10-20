"""FixtureFetcher: saved files by manifest or fixture:// URL; never the network."""

from __future__ import annotations

import json
import socket
from pathlib import Path

import pytest

from plinth.core.clock import FrozenClock, parse_instant
from plinth.core.config import ConfigError, PipelineConfig
from plinth.core.fetchers import FetchRequest, FixtureFetcher, FixtureNotFound
from plinth.core.flags import NoFlags
from plinth.core.pipeline import make_fetcher

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures" / "core"
CLOCK = FrozenClock()


@pytest.fixture
def fetcher() -> FixtureFetcher:
    return FixtureFetcher(FIXTURES, clock=CLOCK)


def test_manifest_get_with_query(fetcher: FixtureFetcher) -> None:
    req = FetchRequest(
        "harera_registration", "https://portal.example.test/projects", params={"page": "1"}
    )
    result = fetcher.fetch(req)
    assert result.status == 200
    assert result.fixture is True
    assert result.content_type == "text/html; charset=utf-8"
    assert result.fetched_at == parse_instant("2026-10-14T10:00:00+05:30")
    assert b"Fixture Towers" in result.body
    assert req.snapshot_params() == {"query": {"page": "1"}}


def test_manifest_post_with_form_matches_regardless_of_key_order(fetcher: FixtureFetcher) -> None:
    req = FetchRequest(
        "harera_qpr",
        "https://portal.example.test/qpr",
        method="post",
        data={"registration": "FIX/001/2022", "quarter": "2026-Q2"},
    )
    result = fetcher.fetch(req)
    assert req.method == "POST"
    assert b"Percentage of work completed: 41%" in result.body
    assert result.fetched_at == CLOCK.now()  # no fetched_at in the entry: the frozen clock
    assert result.content_type == "text/html"  # guessed from the file name


def test_unmatched_requests_are_not_found(fetcher: FixtureFetcher) -> None:
    with pytest.raises(FixtureNotFound, match="no saved file"):
        fetcher.fetch(FetchRequest("harera_registration", "https://portal.example.test/projects"))
    with pytest.raises(FixtureNotFound, match="no fixture file"):  # listed, file absent
        fetcher.fetch(
            FetchRequest(
                "harera_qpr",
                "https://portal.example.test/qpr",
                "POST",
                data={"quarter": "2026-Q3", "registration": "FIX/001/2022"},
            )
        )


def test_fixture_urls_read_paths_under_the_root(fetcher: FixtureFetcher) -> None:
    result = fetcher.fetch(FetchRequest("news", "fixture://pages/notes.json"))
    assert result.content_type == "application/json"
    assert json.loads(result.body)["rows"][0]["ref"] == "FIX-1"


def test_fixture_urls_cannot_escape_the_root(fetcher: FixtureFetcher) -> None:
    with pytest.raises(FixtureNotFound, match="outside"):
        fetcher.fetch(FetchRequest("news", "fixture://../../conftest.py"))


def test_fixtures_never_touch_the_network(fetcher: FixtureFetcher) -> None:
    # The suite-wide guard is active, so any socket use would raise here.
    with pytest.raises(RuntimeError, match="network access is blocked"):
        socket.create_connection(("portal.example.test", 443))
    assert fetcher.fetch(FetchRequest("news", "fixture://pages/list.html")).status == 200


def test_bad_manifests_are_rejected(tmp_path: Path) -> None:
    (tmp_path / "manifest.json").write_text('{"schema": "other/1", "entries": []}')
    with pytest.raises(ValueError, match="schema"):
        FixtureFetcher(tmp_path, clock=CLOCK)
    entry = {"url": "https://x.example.test/", "file": "a.html"}
    (tmp_path / "manifest.json").write_text(
        json.dumps({"schema": "plinth.fetch_fixtures/1", "entries": [entry, entry]})
    )
    with pytest.raises(ValueError, match="repeats"):
        FixtureFetcher(tmp_path, clock=CLOCK)


def test_requests_validate_their_shape() -> None:
    with pytest.raises(ValueError, match="method"):
        FetchRequest("news", "https://x.example.test/", method="DELETE")
    with pytest.raises(ValueError, match="source"):
        FetchRequest("", "https://x.example.test/")


def test_make_fetcher_in_fixtures_mode() -> None:
    cfg = PipelineConfig()
    f = make_fetcher(cfg, flags=NoFlags(), clock=CLOCK, fixtures_dir=FIXTURES)
    assert isinstance(f, FixtureFetcher)
    with pytest.raises(ConfigError, match="fixtures directory"):
        make_fetcher(cfg, flags=NoFlags(), clock=CLOCK, fixtures_dir=None)
