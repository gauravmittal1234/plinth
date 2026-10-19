"""Shared pipeline core (T10): config and modes, the frozen clock, fetchers, snapshots, facts.

config.py        PipelineConfig.from_env(): fixtures | live, DB URL, snapshot dir
clock.py         FrozenClock (18 Oct 2026 12:00 IST) in fixtures mode and tests
gate.py          LiveGate: live HTTP needs harera_live_fetch AND HARERA_LIVE_FETCH_APPROVED=yes
fetchers.py      FetchRequest/FetchResult, FixtureFetcher (saved files, no network)
http_fetcher.py  HttpFetcher: permit-only, robots.txt, 3-5 s per host, backoff, no CAPTCHA
snapshots.py     SnapshotStore: sha256 blobs (local dir or Storage) + core.snapshots rows
facts.py         FactsWriter: bitemporal facts, supersede chains, PII stripped first
pii.py           strip_pii(): phone numbers and emails out of extracted text
jobs.py          JobRun: one ops.job_runs row per run
store.py         EvidenceStore: PgStore (pipeline_writer) or MemoryStore / LocalIndexStore
pipeline.py      make_fetcher() and capture(): fetch -> snapshot -> changed?
"""

from .clock import FROZEN_NOW, IST, Clock, FrozenClock, SystemClock, parse_instant, today_ist
from .config import ConfigError, FetchMode, PipelineConfig
from .facts import (
    FactDraft,
    FactsWriter,
    FactWrite,
    ForbiddenFact,
    WriteKind,
    check_supersede_chains,
)
from .fetchers import Fetcher, FetchRequest, FetchResult, FixtureFetcher, FixtureNotFound
from .flags import HARERA_LIVE_FETCH, DbFlags, FlagSource, NoFlags, StaticFlags
from .gate import HARERA_HOSTS, GateDecision, LiveFetchRefused, LiveGate, LivePermit
from .http_fetcher import CaptchaEncountered, FetchFailed, HttpFetcher
from .jobs import JobRun, JobRunRecord, JsonlJobSink, MemoryJobSink, PgJobSink
from .pii import PiiResult, strip_pii, strip_pii_json
from .pipeline import capture, make_fetcher
from .ratelimit import HostRateLimiter
from .records import FactIdentity, FactRecord, SnapshotRecord
from .robots import RobotsDisallowed
from .snapshots import LocalBlobStore, SnapshotPut, SnapshotStore, StorageBlobStore, sha256_hex
from .store import EvidenceStore, LocalIndexStore, MemoryStore, PgStore, SupersedeConflict

__all__ = [
    "FROZEN_NOW",
    "HARERA_HOSTS",
    "HARERA_LIVE_FETCH",
    "IST",
    "CaptchaEncountered",
    "Clock",
    "ConfigError",
    "DbFlags",
    "EvidenceStore",
    "FactDraft",
    "FactIdentity",
    "FactRecord",
    "FactWrite",
    "FactsWriter",
    "FetchFailed",
    "FetchMode",
    "FetchRequest",
    "FetchResult",
    "Fetcher",
    "FixtureFetcher",
    "FixtureNotFound",
    "FlagSource",
    "ForbiddenFact",
    "FrozenClock",
    "GateDecision",
    "HostRateLimiter",
    "HttpFetcher",
    "JobRun",
    "JobRunRecord",
    "JsonlJobSink",
    "LiveFetchRefused",
    "LiveGate",
    "LivePermit",
    "LocalBlobStore",
    "LocalIndexStore",
    "MemoryJobSink",
    "MemoryStore",
    "NoFlags",
    "PgJobSink",
    "PgStore",
    "PiiResult",
    "PipelineConfig",
    "RobotsDisallowed",
    "SnapshotPut",
    "SnapshotRecord",
    "SnapshotStore",
    "StaticFlags",
    "StorageBlobStore",
    "SupersedeConflict",
    "SystemClock",
    "WriteKind",
    "capture",
    "check_supersede_chains",
    "make_fetcher",
    "parse_instant",
    "sha256_hex",
    "strip_pii",
    "strip_pii_json",
    "today_ist",
]
