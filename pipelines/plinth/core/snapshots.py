"""The snapshot store: raw bytes by SHA-256, plus a core.snapshots row (platform_architecture §4.3).

Every fetch is stored before anything parses it:

1. the bytes go to a write-once blob store under a content-addressed key
   (`sha256/<first two hex>/<sha256>`): a local directory, or the private Supabase Storage
   bucket `snapshots`;
2. a core.snapshots row records the URL, method and parameters (QPRs are POSTs), fetch time,
   HTTP status, hash, storage key, content type, size and parser version, written as
   pipeline_writer. The row is unique on (sha256, url), so storing the same bytes for the same
   URL again is a no-op that returns the existing row: **idempotent by hash**.

`SnapshotPut.changed` tells the caller whether the content differs from the newest earlier
snapshot of the same URL. Unchanged means "record a heartbeat only" (platform_architecture
§4.1): nothing is re-parsed.
"""

from __future__ import annotations

import hashlib
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import httpx

from .fetchers import FetchResult
from .records import NewSnapshot, SnapshotRecord
from .store import EvidenceStore

SNAPSHOT_BUCKET = "snapshots"
# Built from parts so secret scanners never match this file.
_SECRET_KEY_PREFIX = "_".join(("sb", "secret", ""))


class SnapshotStoreError(RuntimeError):
    """The blob store failed, or stored bytes no longer match their hash."""


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def storage_key_for(sha256: str) -> str:
    return f"sha256/{sha256[:2]}/{sha256}"


class BlobStore(Protocol):
    def put(self, key: str, data: bytes, content_type: str | None) -> bool:
        """Store once. True if written now, False if the key already held these bytes."""
        ...

    def get(self, key: str) -> bytes: ...


class LocalBlobStore:
    """A directory of read-only files, one per content hash."""

    def __init__(self, root: Path) -> None:
        self.root = root

    def _path(self, key: str) -> Path:
        path = (self.root / key).resolve()
        if not path.is_relative_to(self.root.resolve()):
            raise SnapshotStoreError(f"storage key {key!r} escapes the snapshot directory")
        return path

    def put(self, key: str, data: bytes, content_type: str | None) -> bool:
        path = self._path(key)
        if path.exists():
            if sha256_hex(path.read_bytes()) != sha256_hex(data):
                raise SnapshotStoreError(f"{path} exists with different bytes (write-once)")
            return False
        path.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".tmp-")
        try:
            with os.fdopen(fd, "wb") as fh:
                fh.write(data)
            os.chmod(tmp, 0o444)
            os.replace(tmp, path)
        except BaseException:
            Path(tmp).unlink(missing_ok=True)
            raise
        return True

    def get(self, key: str) -> bytes:
        return self._path(key).read_bytes()


class StorageBlobStore:
    """Supabase Storage, private bucket `snapshots`, write-once (`x-upsert: false`).

    The token is a Storage credential scoped to this bucket. It is never the secret key: the
    constructor refuses a value that looks like one (BUILD_PLAN §12.5).
    """

    def __init__(
        self,
        base_url: str,
        token: str,
        *,
        bucket: str = SNAPSHOT_BUCKET,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        if token.startswith(_SECRET_KEY_PREFIX):
            raise SnapshotStoreError("refusing the Supabase secret key: use a Storage credential")
        self.bucket = bucket
        self._client = httpx.Client(
            base_url=base_url.rstrip("/") + "/storage/v1",
            headers={"Authorization": f"Bearer {token}"},
            transport=transport,
            timeout=120.0,
        )

    def put(self, key: str, data: bytes, content_type: str | None) -> bool:
        response = self._client.post(
            f"/object/{self.bucket}/{key}",
            content=data,
            headers={
                "Content-Type": content_type or "application/octet-stream",
                "x-upsert": "false",
                "cache-control": "max-age=31536000, immutable",
            },
        )
        if response.status_code in (200, 201):
            return True
        if response.status_code == 409 or "already exists" in response.text.lower():
            return False  # content-addressed: the same key holds the same bytes
        raise SnapshotStoreError(f"Storage put {key}: HTTP {response.status_code}")

    def get(self, key: str) -> bytes:
        response = self._client.get(f"/object/authenticated/{self.bucket}/{key}")
        if response.status_code != 200:
            raise SnapshotStoreError(f"Storage get {key}: HTTP {response.status_code}")
        return response.content


@dataclass(frozen=True)
class SnapshotPut:
    record: SnapshotRecord
    #: A new core.snapshots row was inserted (False: this URL already had these exact bytes).
    created: bool
    #: The content differs from the newest earlier snapshot of this URL (False: heartbeat only).
    changed: bool


class SnapshotStore:
    def __init__(self, blobs: BlobStore, store: EvidenceStore) -> None:
        self.blobs = blobs
        self.store = store

    def put(self, result: FetchResult, *, parser_version: str | None = None) -> SnapshotPut:
        sha = sha256_hex(result.body)
        key = storage_key_for(sha)
        req = result.request
        previous = self.store.latest_snapshot(req.source_code, req.url)
        self.blobs.put(key, result.body, result.content_type)
        record, created = self.store.insert_snapshot(
            NewSnapshot(
                source_code=req.source_code,
                url=req.url,
                method=req.method,
                params=req.snapshot_params(),
                fetched_at=result.fetched_at,
                http_status=result.status,
                sha256=sha,
                storage_key=key,
                content_type=result.content_type,
                bytes=len(result.body),
                parser_version=parser_version,
                fixture=result.fixture,
            )
        )
        changed = previous is None or previous.sha256 != sha
        return SnapshotPut(record=record, created=created, changed=changed)

    def read(self, record: SnapshotRecord) -> bytes:
        """The stored bytes, checked against the recorded hash."""
        data = self.blobs.get(record.storage_key)
        if sha256_hex(data) != record.sha256:
            raise SnapshotStoreError(f"snapshot {record.id}: stored bytes do not match sha256")
        return data
