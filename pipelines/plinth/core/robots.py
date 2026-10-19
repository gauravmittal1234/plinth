"""robots.txt checks for live fetching (platform_architecture §4.6 "Honour robots.txt").

Status handling follows RFC 9309, leaning cautious where the RFC allows a choice:

- 2xx: parse the file and obey it for our user-agent token;
- 404 or 410: no robots.txt, everything is allowed;
- any other 4xx (401/403 often mean a firewall), 5xx, or a network error: everything is
  disallowed until the next check.

Results are cached per origin for 24 hours (RFC 9309 §2.4).
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from urllib.robotparser import RobotFileParser

import httpx

from .clock import Clock

CACHE_FOR = timedelta(hours=24)

#: (status, body text) of GET <origin>/robots.txt; raises httpx.HTTPError when unreachable.
RobotsFetch = Callable[[str], tuple[int, str]]


class RobotsDisallowed(PermissionError):
    """robots.txt (or its absence by error) does not allow this URL."""


@dataclass(frozen=True)
class _Rules:
    parser: RobotFileParser | None  # None with allow_all/deny_all
    allow_all: bool
    note: str
    checked_at: datetime


class RobotsPolicy:
    def __init__(self, agent_token: str, fetch: RobotsFetch, *, clock: Clock) -> None:
        self.agent_token = agent_token
        self._fetch = fetch
        self._clock = clock
        self._cache: dict[str, _Rules] = {}

    @staticmethod
    def origin(url: str) -> str:
        u = httpx.URL(url)
        port = f":{u.port}" if u.port else ""
        return f"{u.scheme}://{u.host}{port}"

    def _rules(self, origin: str) -> _Rules:
        now = self._clock.now()
        cached = self._cache.get(origin)
        if cached is not None and now - cached.checked_at < CACHE_FOR:
            return cached
        robots_url = origin + "/robots.txt"
        try:
            status, text = self._fetch(robots_url)
        except httpx.HTTPError as exc:
            rules = _Rules(None, False, f"robots.txt unreachable ({type(exc).__name__})", now)
        else:
            if 200 <= status < 300:
                parser = RobotFileParser(robots_url)
                parser.parse(text.splitlines())
                rules = _Rules(parser, False, "robots.txt", now)
            elif status in (404, 410):
                rules = _Rules(None, True, f"no robots.txt ({status})", now)
            else:
                rules = _Rules(None, False, f"robots.txt answered {status}", now)
        self._cache[origin] = rules
        return rules

    def check(self, url: str) -> None:
        """Raise RobotsDisallowed unless our agent token may fetch the URL."""
        rules = self._rules(self.origin(url))
        if rules.allow_all:
            return
        if rules.parser is None or not rules.parser.can_fetch(self.agent_token, url):
            raise RobotsDisallowed(f"{url} is not allowed for {self.agent_token} ({rules.note})")
