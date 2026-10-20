"""Per-host politeness: one request in flight per host, and 3-5 s between requests.

platform_architecture §4.2-§4.3: "One request every 3-5 s, off-peak" and "keep at most one
request in flight per host". The interval is measured from the end of one request to the start
of the next, with a random spread in [min, max] so requests do not land on a fixed beat. The
floor of 3 s is enforced by `PipelineConfig` and again here.
"""

from __future__ import annotations

import random
import threading
import time
from collections.abc import Callable, Iterator
from contextlib import contextmanager

from .config import REQUEST_INTERVAL_S


class HostRateLimiter:
    def __init__(
        self,
        min_interval: float = REQUEST_INTERVAL_S[0],
        max_interval: float = REQUEST_INTERVAL_S[1],
        *,
        monotonic: Callable[[], float] = time.monotonic,
        sleep: Callable[[float], None] = time.sleep,
        rng: random.Random | None = None,
    ) -> None:
        if not REQUEST_INTERVAL_S[0] <= min_interval <= max_interval:
            raise ValueError(
                f"interval [{min_interval}, {max_interval}] s is below the "
                f"{REQUEST_INTERVAL_S[0]:g} s politeness floor"
            )
        self.min_interval = min_interval
        self.max_interval = max_interval
        self._monotonic = monotonic
        self._sleep = sleep
        self._rng = rng or random.Random()
        self._next_allowed: dict[str, float] = {}
        self._locks: dict[str, threading.Lock] = {}
        self._guard = threading.Lock()

    def _lock(self, host: str) -> threading.Lock:
        with self._guard:
            return self._locks.setdefault(host, threading.Lock())

    @contextmanager
    def slot(self, host: str) -> Iterator[float]:
        """Hold the host's only slot for one request. Yields the seconds waited for it."""
        key = host.lower()
        with self._lock(key):
            waited = 0.0
            due = self._next_allowed.get(key)
            if due is not None:
                delay = due - self._monotonic()
                if delay > 0:
                    self._sleep(delay)
                    waited = delay
            try:
                yield waited
            finally:
                spacing = self._rng.uniform(self.min_interval, self.max_interval)
                self._next_allowed[key] = self._monotonic() + spacing
