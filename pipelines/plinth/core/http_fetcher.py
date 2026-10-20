"""The live HTTP fetcher (httpx). Disabled unless `LiveGate` issues a `LivePermit`.

LEGAL: no live scraping of HARERA or any government site before the founder's legal memo
(BUILD_PLAN §1 rule 8). This class refuses to open a real network transport without a permit,
and a permit is refused in CI, under pytest, and unless both the `harera_live_fetch` flag and
`HARERA_LIVE_FETCH_APPROVED=yes` are set. Tests drive it only through `httpx.MockTransport`,
which cannot reach the network, so they need no permit.

Collection rules it enforces (platform_architecture §4.2, §4.6):
- an identified User-Agent with a contact email;
- robots.txt checked per origin before the first request;
- one request in flight per host, 3-5 s apart (`HostRateLimiter`);
- exponential backoff on 429 and 5xx (honouring Retry-After), giving up after a few tries;
- redirects followed only to hosts the permit covers;
- never bypass a CAPTCHA: a CAPTCHA page stops the run.
"""

from __future__ import annotations

import random
import re
import time
from collections.abc import Callable, Mapping
from datetime import datetime
from email.utils import parsedate_to_datetime

import httpx

from plinth import __version__

from .clock import Clock
from .fetchers import KEPT_HEADERS, FetchRequest, FetchResult
from .gate import LiveFetchRefused, LivePermit
from .ratelimit import HostRateLimiter
from .robots import RobotsPolicy

AGENT_TOKEN = "PlinthBot"
RETRY_STATUSES = frozenset({429, 500, 502, 503, 504})
REDIRECT_STATUSES = frozenset({301, 302, 303, 307, 308})

# Markers of a CAPTCHA or bot challenge. We stop; we never try to get past one.
_CAPTCHA = re.compile(
    rb"g-recaptcha|h-captcha|cf-chl|cf_chl|challenge-platform"
    rb"|name=[\"']?captcha|id=[\"']?captcha|captcha\.(?:jpg|png|aspx|php)",
    re.IGNORECASE,
)


class FetchFailed(RuntimeError):
    """The request did not succeed after the allowed retries (or broke a collection rule)."""


class CaptchaEncountered(FetchFailed):
    """The response is a CAPTCHA or bot challenge. The run stops; a person looks."""


def user_agent(contact: str) -> str:
    return f"{AGENT_TOKEN}/{__version__} (Plinth public-records research; contact: {contact})"


def retry_after_seconds(value: str | None, now: datetime) -> float | None:
    """Retry-After as seconds (delta-seconds or an HTTP date), or None."""
    if not value:
        return None
    text = value.strip()
    if text.isdigit():
        return float(text)
    try:
        when = parsedate_to_datetime(text)
    except TypeError, ValueError:
        return None
    return max(0.0, (when - now).total_seconds())


class HttpFetcher:
    def __init__(
        self,
        permit: LivePermit | None,
        *,
        clock: Clock,
        limiter: HostRateLimiter | None = None,
        transport: httpx.BaseTransport | None = None,
        sleep: Callable[[float], None] = time.sleep,
        rng: random.Random | None = None,
        max_retries: int = 4,
        backoff_base: float = 10.0,
        backoff_cap: float = 300.0,
        max_redirects: int = 3,
        max_bytes: int = 50 * 1024 * 1024,
        timeout: float = 60.0,
    ) -> None:
        offline = isinstance(transport, httpx.MockTransport)
        if not offline and permit is None:
            raise LiveFetchRefused(
                "HttpFetcher needs a LivePermit for a real network transport "
                "(LiveGate.authorize(); see plinth.core.gate)"
            )
        self.permit = permit
        self._clock = clock
        self._sleep = sleep
        self._rng = rng or random.Random()
        self._limiter = limiter or HostRateLimiter(sleep=sleep)
        self.max_retries = max_retries
        self.backoff_base = backoff_base
        self.backoff_cap = backoff_cap
        self.max_redirects = max_redirects
        self.max_bytes = max_bytes
        contact = permit.contact if permit else "offline-replay"
        self.user_agent = user_agent(contact)
        self._client = httpx.Client(
            transport=transport,
            headers={"User-Agent": self.user_agent, "Accept-Language": "en-IN,en;q=0.8"},
            timeout=timeout,
            follow_redirects=False,
        )
        self._robots = RobotsPolicy(AGENT_TOKEN, self._fetch_robots, clock=clock)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> HttpFetcher:
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    # -- rules ---------------------------------------------------------------------------

    def _check_host(self, url: httpx.URL) -> None:
        if url.scheme not in ("http", "https"):
            raise FetchFailed(f"unsupported scheme in {url}")
        if self.permit is not None and not self.permit.covers(url.host):
            raise LiveFetchRefused(f"host {url.host!r} is not covered by the live permit")

    def backoff(self, attempt: int, retry_after: float | None) -> float:
        """Seconds to wait before retry number `attempt` (0-based)."""
        exp = min(self.backoff_cap, self.backoff_base * 2.0**attempt)
        exp += self._rng.uniform(0, exp * 0.1)
        return max(exp, retry_after or 0.0)

    # -- transport -----------------------------------------------------------------------

    def _send_once(self, request: httpx.Request) -> httpx.Response:
        with self._limiter.slot(request.url.host):
            return self._client.send(request)

    def _send_with_retries(self, request: httpx.Request) -> httpx.Response:
        last: str = ""
        for attempt in range(self.max_retries + 1):
            retry_after: float | None = None
            try:
                response = self._send_once(request)
            except httpx.TransportError as exc:
                last = f"{type(exc).__name__}: {exc}"
            else:
                if response.status_code not in RETRY_STATUSES:
                    return response
                last = f"HTTP {response.status_code}"
                retry_after = retry_after_seconds(
                    response.headers.get("retry-after"), self._clock.now()
                )
                if retry_after is not None and retry_after > self.backoff_cap:
                    raise FetchFailed(
                        f"{request.url}: server asked to retry after {retry_after:.0f} s; giving up"
                    )
            if attempt == self.max_retries:
                break
            self._sleep(self.backoff(attempt, retry_after))
        raise FetchFailed(
            f"{request.method} {request.url}: {last} after {self.max_retries + 1} tries"
        )

    def _send(
        self,
        method: str,
        url: str,
        *,
        params: Mapping[str, str] | None = None,
        data: Mapping[str, str] | None = None,
    ) -> httpx.Response:
        request = self._client.build_request(method, url, params=params, data=data)
        for _hop in range(self.max_redirects + 1):
            self._check_host(request.url)
            response = self._send_with_retries(request)
            location = response.headers.get("location")
            if response.status_code not in REDIRECT_STATUSES or not location:
                return response
            target = request.url.join(location)
            keep = response.status_code in (307, 308)
            request = self._client.build_request(
                request.method if keep else "GET",
                target,
                content=request.content if keep and request.content else None,
                headers={"content-type": request.headers["content-type"]}
                if keep and "content-type" in request.headers
                else None,
            )
        raise FetchFailed(f"{url}: more than {self.max_redirects} redirects")

    def _fetch_robots(self, robots_url: str) -> tuple[int, str]:
        try:
            response = self._send("GET", robots_url)
        except FetchFailed:
            return 503, ""  # unreachable after retries: RobotsPolicy disallows everything
        return response.status_code, response.text

    # -- public --------------------------------------------------------------------------

    def fetch(self, request: FetchRequest) -> FetchResult:
        url = httpx.URL(request.url)
        self._check_host(url)
        self._robots.check(str(httpx.URL(request.url, params=request.params or None)))
        response = self._send(request.method, request.url, params=request.params, data=request.data)
        body = response.content
        if len(body) > self.max_bytes:
            raise FetchFailed(f"{request.url}: {len(body)} bytes is over the {self.max_bytes} cap")
        if _CAPTCHA.search(body[:500_000]):
            raise CaptchaEncountered(
                f"{request.url}: the response is a CAPTCHA or bot challenge. Stopped; "
                "CAPTCHAs are never bypassed (platform_architecture §4.6)"
            )
        headers = {k: response.headers[k] for k in KEPT_HEADERS if k in response.headers}
        return FetchResult(
            request=request,
            status=response.status_code,
            body=body,
            content_type=response.headers.get("content-type"),
            fetched_at=self._clock.now(),
            fixture=False,
            final_url=str(response.request.url),
            headers=headers,
        )
