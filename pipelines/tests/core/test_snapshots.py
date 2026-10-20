"""Snapshot store: idempotent by hash, write-once blobs, change detection, Storage."""

from __future__ import annotations

import json
import os
import stat
from datetime import timedelta
from pathlib import Path

import httpx
import pytest

from plinth.core.clock import FrozenClock
from plinth.core.config import FetchMode
from plinth.core.fetchers import FetchRequest, FetchResult, FixtureFetcher
from plinth.core.jobs import JobRun, MemoryJobSink
from plinth.core.pipeline import capture
from plinth.core.snapshots import (
    LocalBlobStore,
    SnapshotStore,
    SnapshotStoreError,
    StorageBlobStore,
    sha256_hex,
    storage_key_for,
)
from plinth.core.store import LocalIndexStore, MemoryStore, UnknownSource

CLOCK = FrozenClock()
FIXTURES = Path(__file__).resolve().parent.parent / "fixtures" / "core"
URL = "https://portal.example.test/projects"


def result(
    body: bytes, *, url: str = URL, hours: int = 0, source: str = "harera_registration"
) -> FetchResult:
    return FetchResult(
        request=FetchRequest(source, url, params={"page": "1"}),
        status=200,
        body=body,
        content_type="text/html",
        fetched_at=CLOCK.now() + timedelta(hours=hours),
        fixture=True,
        final_url=url,
    )


@pytest.fixture
def store() -> MemoryStore:
    return MemoryStore()


@pytest.fixture
def snapshots(tmp_path: Path, store: MemoryStore) -> SnapshotStore:
    return SnapshotStore(LocalBlobStore(tmp_path / "blobs"), store)


def blob_files(root: Path) -> list[Path]:
    return [p for p in root.rglob("*") if p.is_file()]


def test_snapshot_is_idempotent_by_hash(
    snapshots: SnapshotStore, store: MemoryStore, tmp_path: Path
) -> None:
    first = snapshots.put(result(b"<html>v1</html>"), parser_version="harera@1")
    again = snapshots.put(result(b"<html>v1</html>", hours=24), parser_version="harera@1")
    assert first.created and first.changed
    assert not again.created and not again.changed  # heartbeat only
    assert again.record.id == first.record.id
    assert again.record.fetched_at == first.record.fetched_at  # the row is never rewritten
    assert len(store.snapshots()) == 1
    assert len(blob_files(tmp_path / "blobs")) == 1


def test_snapshot_row_records_provenance(snapshots: SnapshotStore) -> None:
    body = b"<html>v1</html>"
    rec = snapshots.put(result(body), parser_version="harera@1").record
    assert rec.sha256 == sha256_hex(body)
    assert rec.storage_key == storage_key_for(rec.sha256) == f"sha256/{rec.sha256[:2]}/{rec.sha256}"
    assert rec.bytes == len(body)
    assert rec.method == "GET"
    assert rec.params == {"query": {"page": "1"}}
    assert rec.http_status == 200
    assert rec.parser_version == "harera@1"
    assert rec.fixture is True
    assert rec.fetched_at == CLOCK.now()
    assert snapshots.read(rec) == body


def test_new_content_is_a_new_snapshot(snapshots: SnapshotStore, store: MemoryStore) -> None:
    a = snapshots.put(result(b"A"))
    b = snapshots.put(result(b"B", hours=1))
    assert b.created and b.changed and b.record.id != a.record.id
    back = snapshots.put(result(b"A", hours=2))  # A -> B -> A
    assert back.changed and not back.created and back.record.id == a.record.id
    assert len(store.snapshots()) == 2


def test_same_bytes_at_another_url_is_another_row(
    snapshots: SnapshotStore, store: MemoryStore
) -> None:
    snapshots.put(result(b"same"))
    other = snapshots.put(result(b"same", url=URL + "?x"))
    assert other.created
    assert len(store.snapshots()) == 2


def test_unknown_source_is_refused(snapshots: SnapshotStore) -> None:
    with pytest.raises(UnknownSource):
        snapshots.put(result(b"x", source="pinterest"))


def test_blobs_are_write_once_and_read_only(tmp_path: Path) -> None:
    blobs = LocalBlobStore(tmp_path)
    key = storage_key_for(sha256_hex(b"x"))
    assert blobs.put(key, b"x", None) is True
    assert blobs.put(key, b"x", None) is False
    with pytest.raises(SnapshotStoreError, match="write-once"):
        blobs.put(key, b"y", None)
    mode = (tmp_path / key).stat().st_mode
    assert not mode & (stat.S_IWUSR | stat.S_IWGRP | stat.S_IWOTH)
    with pytest.raises(SnapshotStoreError, match="escapes"):
        blobs.put("../outside", b"x", None)


def test_tampered_blob_is_detected(snapshots: SnapshotStore, tmp_path: Path) -> None:
    rec = snapshots.put(result(b"original")).record
    path = tmp_path / "blobs" / rec.storage_key
    os.chmod(path, 0o644)
    path.write_bytes(b"tampered")
    with pytest.raises(SnapshotStoreError, match="do not match"):
        snapshots.read(rec)


def test_capture_counts_fetched_and_changed() -> None:
    store = MemoryStore()
    sink = MemoryJobSink()
    fetcher = FixtureFetcher(FIXTURES, clock=CLOCK)

    class Blobs:
        def __init__(self) -> None:
            self.data: dict[str, bytes] = {}

        def put(self, key: str, data: bytes, content_type: str | None) -> bool:
            new = key not in self.data
            self.data[key] = data
            return new

        def get(self, key: str) -> bytes:
            return self.data[key]

    snaps = SnapshotStore(Blobs(), store)
    with JobRun("test", source_code="news", mode=FetchMode.FIXTURES, clock=CLOCK, sink=sink) as run:
        for _ in range(3):
            capture(
                FetchRequest("news", "fixture://pages/list.html"),
                fetcher=fetcher,
                snapshots=snaps,
                run=run,
            )
    rec = sink.records[0]
    assert (rec.fetched, rec.changed) == (3, 1)


def test_local_index_store_persists_across_runs(tmp_path: Path) -> None:
    index = tmp_path / "index.json"
    first = SnapshotStore(LocalBlobStore(tmp_path), LocalIndexStore(index)).put(result(b"v1"))
    reopened = SnapshotStore(LocalBlobStore(tmp_path), LocalIndexStore(index))
    again = reopened.put(result(b"v1", hours=5))
    assert again.record.id == first.record.id and not again.created and not again.changed
    doc = json.loads(index.read_text())
    assert doc["schema"] == "plinth.local_evidence/1"
    assert len(doc["snapshots"]) == 1


def storage(handler: object) -> StorageBlobStore:
    return StorageBlobStore(
        "https://project.example.test",
        "storage-credential-for-tests",
        transport=httpx.MockTransport(handler),  # type: ignore[arg-type]
    )


def test_storage_put_is_write_once() -> None:
    seen: list[httpx.Request] = []
    stored: dict[str, bytes] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        key = request.url.path
        if request.method == "POST":
            if key in stored:
                return httpx.Response(
                    409, json={"error": "Duplicate", "message": "The resource already exists"}
                )
            stored[key] = request.content
            return httpx.Response(200, json={"Key": key})
        return httpx.Response(200, content=stored[key.replace("/authenticated", "")])

    blobs = storage(handler)
    key = storage_key_for(sha256_hex(b"page"))
    assert blobs.put(key, b"page", "text/html") is True
    assert blobs.put(key, b"page", "text/html") is False
    assert seen[0].url.path == f"/storage/v1/object/snapshots/{key}"
    assert seen[0].headers["x-upsert"] == "false"
    assert seen[0].headers["authorization"] == "Bearer storage-credential-for-tests"
    assert blobs.get(key) == b"page"


def test_storage_errors_surface() -> None:
    blobs = storage(lambda request: httpx.Response(500))
    with pytest.raises(SnapshotStoreError, match="HTTP 500"):
        blobs.put("sha256/aa/" + "a" * 64, b"x", None)
    with pytest.raises(SnapshotStoreError, match="HTTP 500"):
        blobs.get("sha256/aa/" + "a" * 64)


def test_storage_refuses_the_secret_key() -> None:
    with pytest.raises(SnapshotStoreError, match="secret key"):
        StorageBlobStore("https://project.example.test", "_".join(("sb", "secret", "x" * 20)))
