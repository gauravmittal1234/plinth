"""Fetch requests and results, the `Fetcher` protocol, and the fixtures fetcher.

`FixtureFetcher` serves saved files and never touches the network. It is the default in every
mode except an authorised live run (see `make_fetcher`). Saved files are found two ways:

1. **A manifest**, `<root>/manifest.json`, mapping real requests (method, URL, query and form
   parameters: QPRs are POSTs) to files:

       {
         "schema": "plinth.fetch_fixtures/1",
         "entries": [
           {"url": "https://haryanarera.gov.in/...", "method": "POST",
            "data": {"project": "..."}, "file": "qpr/aurelia-2026-Q2.html",
            "content_type": "text/html", "status": 200,
            "fetched_at": "2026-10-14T10:00:00+05:30"}
         ]
       }

2. **`fixture://` URLs**, read as paths under the root: `fixture://harera/list.html` is
   `<root>/harera/list.html` (the canonical evidence uses `fixture://` snapshot URLs).
"""

from __future__ import annotations

import json
import mimetypes
from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Protocol

from .clock import Clock, parse_instant

FIXTURE_SCHEME = "fixture://"
MANIFEST = "manifest.json"
MANIFEST_SCHEMA = "plinth.fetch_fixtures/1"

#: Response headers worth keeping with a snapshot (no cookies, nothing personal).
KEPT_HEADERS = ("content-type", "content-length", "etag", "last-modified", "date")


class FixtureNotFound(LookupError):
    """No saved file answers this request."""


@dataclass(frozen=True)
class FetchRequest:
    """One HTTP request for one source. `params` go in the query string; `data` is a form body."""

    source_code: str
    url: str
    method: str = "GET"
    params: Mapping[str, str] | None = None
    data: Mapping[str, str] | None = None

    def __post_init__(self) -> None:
        object.__setattr__(self, "method", self.method.upper())
        if self.method not in ("GET", "POST", "HEAD"):
            raise ValueError(f"unsupported method {self.method!r}")
        if not self.source_code:
            raise ValueError("a request names its source code (core.sources.code)")

    def snapshot_params(self) -> dict[str, Any] | None:
        """What core.snapshots.params records: the query and form parameters, if any."""
        out: dict[str, Any] = {}
        if self.params:
            out["query"] = dict(sorted(self.params.items()))
        if self.data:
            out["form"] = dict(sorted(self.data.items()))
        return out or None

    def match_key(
        self,
    ) -> tuple[str, str, tuple[tuple[str, str], ...], tuple[tuple[str, str], ...]]:
        return (
            self.method,
            self.url,
            tuple(sorted((self.params or {}).items())),
            tuple(sorted((self.data or {}).items())),
        )


@dataclass(frozen=True)
class FetchResult:
    request: FetchRequest
    status: int
    body: bytes = field(repr=False)
    content_type: str | None
    fetched_at: datetime
    fixture: bool
    final_url: str
    headers: Mapping[str, str] = field(default_factory=dict)


class Fetcher(Protocol):
    def fetch(self, request: FetchRequest) -> FetchResult: ...


@dataclass(frozen=True)
class _Entry:
    file: str
    content_type: str | None
    status: int
    fetched_at: datetime | None


class FixtureFetcher:
    """Serves saved fixture files. Never opens a socket."""

    def __init__(self, root: Path, *, clock: Clock) -> None:
        self.root = root.resolve()
        self._clock = clock
        self._entries = self._load_manifest()

    def _load_manifest(self) -> dict[tuple[Any, ...], _Entry]:
        path = self.root / MANIFEST
        if not path.is_file():
            return {}
        doc = json.loads(path.read_text(encoding="utf-8"))
        if doc.get("schema") != MANIFEST_SCHEMA:
            raise ValueError(f"{path}: schema must be {MANIFEST_SCHEMA!r}")
        entries: dict[tuple[Any, ...], _Entry] = {}
        for i, raw in enumerate(doc.get("entries", [])):
            req = FetchRequest(
                source_code=raw.get("source", "fixture"),
                url=raw["url"],
                method=raw.get("method", "GET"),
                params=raw.get("params"),
                data=raw.get("data"),
            )
            key = req.match_key()
            if key in entries:
                raise ValueError(f"{path}: entry {i} repeats {req.method} {req.url}")
            entries[key] = _Entry(
                file=raw["file"],
                content_type=raw.get("content_type"),
                status=int(raw.get("status", 200)),
                fetched_at=parse_instant(raw["fetched_at"]) if raw.get("fetched_at") else None,
            )
        return entries

    def _resolve(self, relative: str) -> Path:
        path = (self.root / relative).resolve()
        if not path.is_relative_to(self.root):
            raise FixtureNotFound(f"{relative!r} points outside the fixtures root")
        if not path.is_file():
            raise FixtureNotFound(f"no fixture file at {path}")
        return path

    def fetch(self, request: FetchRequest) -> FetchResult:
        entry = self._entries.get(request.match_key())
        if entry is None and request.url.startswith(FIXTURE_SCHEME):
            entry = _Entry(request.url[len(FIXTURE_SCHEME) :], None, 200, None)
        if entry is None:
            raise FixtureNotFound(
                f"no saved file for {request.method} {request.url} under {self.root} "
                f"(add it to {MANIFEST} or use a {FIXTURE_SCHEME} URL)"
            )
        path = self._resolve(entry.file)
        content_type = entry.content_type or mimetypes.guess_type(path.name)[0]
        return FetchResult(
            request=request,
            status=entry.status,
            body=path.read_bytes(),
            content_type=content_type,
            fetched_at=entry.fetched_at or self._clock.now(),
            fixture=True,
            final_url=request.url,
            headers={"content-type": content_type} if content_type else {},
        )
