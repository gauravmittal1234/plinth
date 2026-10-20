"""Wiring: pick the fetcher for the mode, and the fetch -> snapshot step every source shares.

fetcher = make_fetcher(cfg, flags=flags, clock=clock, fixtures_dir=root)
put = capture(FetchRequest("harera_qpr", url, "POST", data=form),
              fetcher=fetcher, snapshots=snapshots, run=run)
if put.changed:      # else: heartbeat only, nothing to parse
    records = parse(snapshots.read(put.record))
"""

from __future__ import annotations

from collections.abc import Iterable
from pathlib import Path

from .clock import Clock
from .config import ConfigError, FetchMode, PipelineConfig
from .fetchers import Fetcher, FetchRequest, FixtureFetcher
from .flags import FlagSource
from .gate import HARERA_HOSTS, LiveGate
from .http_fetcher import HttpFetcher
from .jobs import JobRun
from .ratelimit import HostRateLimiter
from .snapshots import SnapshotPut, SnapshotStore


def make_fetcher(
    config: PipelineConfig,
    *,
    flags: FlagSource,
    clock: Clock,
    fixtures_dir: Path | None,
    live_hosts: Iterable[str] = HARERA_HOSTS,
) -> Fetcher:
    """Fixtures mode: a FixtureFetcher. Live mode: an HttpFetcher, only if the gate passes."""
    if config.mode is FetchMode.FIXTURES:
        if fixtures_dir is None:
            raise ConfigError("fixtures mode reads saved files: pass a fixtures directory")
        return FixtureFetcher(fixtures_dir, clock=clock)
    permit = LiveGate(config, flags, clock).authorize(live_hosts)  # raises LiveFetchRefused
    low, high = config.request_interval
    return HttpFetcher(permit, clock=clock, limiter=HostRateLimiter(low, high))


def capture(
    request: FetchRequest,
    *,
    fetcher: Fetcher,
    snapshots: SnapshotStore,
    run: JobRun | None = None,
    parser_version: str | None = None,
) -> SnapshotPut:
    """Fetch one request and store its snapshot; count it on the job run."""
    result = fetcher.fetch(request)
    put = snapshots.put(result, parser_version=parser_version)
    if run is not None:
        run.fetched += 1
        if put.changed:
            run.changed += 1
    return put
