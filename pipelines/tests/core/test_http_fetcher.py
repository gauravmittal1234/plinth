"""HttpFetcher rules, driven only through httpx.MockTransport (no socket is ever opened)."""

from __future__ import annotations

import random
from collections.abc import Callable
from datetime import timedelta
from email.utils import format_datetime

import httpx
import pytest

from plinth.core.clock import FrozenClock
from plinth.core.config import FetchMode, PipelineConfig
from plinth.core.fetchers import FetchRequest
from plinth.core.flags import HARERA_LIVE_FETCH, StaticFlags
from plinth.core.gate import LiveFetchRefused, LiveGate, LivePermit
from plinth.core.http_fetcher import (
    AGENT_TOKEN,
    CaptchaEncountered,
    FetchFailed,
    HttpFetcher,
    retry_after_seconds,
)
from plinth.core.ratelimit import HostRateLimiter
from plinth.core.robots import RobotsDisallowed
from plinth.core.testing import FakeTime

CLOCK = FrozenClock()
HOST = "portal.example.test"
PAGE = f"https://{HOST}/projects"
Handler = Callable[[httpx.Request], httpx.Response]


def permit(*hosts: str) -> LivePermit:
    """A permit from a fully approved gate (config built explicitly, not from this env)."""
    cfg = PipelineConfig(
        mode=FetchMode.LIVE, live_approved=True, contact="data@example.test", ci=False
    )
    return LiveGate(cfg, StaticFlags({HARERA_LIVE_FETCH: True}), CLOCK).authorize(hosts or (HOST,))


def robots_ok(page: Handler) -> Handler:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/robots.txt":
            return httpx.Response(200, text="User-agent: *\nAllow: /\n")
        return page(request)

    return handler


class Recorder:
    def __init__(self, handler: Handler) -> None:
        self.handler = handler
        self.requests: list[httpx.Request] = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        return self.handler(request)

    def paths(self) -> list[str]:
        return [r.url.path for r in self.requests]


def fetcher(
    handler: Handler, t: FakeTime | None = None, *, with_permit: bool = False, **kw: object
) -> HttpFetcher:
    t = t or FakeTime()
    return HttpFetcher(
        permit() if with_permit else None,
        clock=CLOCK,
        transport=httpx.MockTransport(handler),
        limiter=HostRateLimiter(monotonic=t.monotonic, sleep=t.sleep, rng=random.Random(1)),
        sleep=t.sleep,
        rng=random.Random(1),
        **kw,  # type: ignore[arg-type]
    )


def ok_page(request: httpx.Request) -> httpx.Response:
    return httpx.Response(200, html="<html><body>ok</body></html>")


def test_user_agent_names_the_bot_and_a_contact_email() -> None:
    rec = Recorder(robots_ok(ok_page))
    fetcher(rec, with_permit=True).fetch(FetchRequest("harera_registration", PAGE))
    ua = rec.requests[-1].headers["user-agent"]
    assert ua.startswith(f"{AGENT_TOKEN}/")
    assert "contact: data@example.test" in ua


def test_fetch_returns_a_result_on_the_clock() -> None:
    rec = Recorder(robots_ok(ok_page))
    result = fetcher(rec).fetch(FetchRequest("harera_registration", PAGE, params={"page": "2"}))
    assert result.status == 200
    assert result.body == b"<html><body>ok</body></html>"
    assert result.fetched_at == CLOCK.now()
    assert result.fixture is False
    assert result.final_url == f"{PAGE}?page=2"
    assert result.headers["content-type"].startswith("text/html")


def test_post_sends_the_form() -> None:
    rec = Recorder(robots_ok(ok_page))
    fetcher(rec).fetch(FetchRequest("harera_qpr", PAGE, "POST", data={"quarter": "2026-Q2"}))
    sent = rec.requests[-1]
    assert sent.method == "POST"
    assert sent.content == b"quarter=2026-Q2"


def test_robots_disallow_stops_before_the_page() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/robots.txt":
            return httpx.Response(200, text=f"User-agent: {AGENT_TOKEN}\nDisallow: /projects\n")
        return ok_page(request)

    rec = Recorder(handler)
    with pytest.raises(RobotsDisallowed):
        fetcher(rec).fetch(FetchRequest("harera_registration", PAGE))
    assert rec.paths() == ["/robots.txt"]


@pytest.mark.parametrize(
    ("status", "allowed"), [(404, True), (410, True), (403, False), (500, False)]
)
def test_robots_status_handling(status: int, allowed: bool) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/robots.txt":
            return httpx.Response(status)
        return ok_page(request)

    f = fetcher(handler, max_retries=0)
    if allowed:
        assert f.fetch(FetchRequest("harera_registration", PAGE)).status == 200
    else:
        with pytest.raises(RobotsDisallowed):
            f.fetch(FetchRequest("harera_registration", PAGE))


def test_robots_is_fetched_once_per_origin() -> None:
    rec = Recorder(robots_ok(ok_page))
    f = fetcher(rec)
    for page in ("/a", "/b", "/c"):
        f.fetch(FetchRequest("harera_registration", f"https://{HOST}{page}"))
    assert rec.paths().count("/robots.txt") == 1


def test_requests_to_one_host_are_spaced() -> None:
    t = FakeTime()
    f = fetcher(robots_ok(ok_page), t)
    f.fetch(FetchRequest("harera_registration", PAGE))
    f.fetch(FetchRequest("harera_registration", PAGE))
    # robots.txt, page, page: each request after the first waited 3-5 s.
    assert len(t.sleeps) == 2
    assert all(3.0 <= s <= 5.0 for s in t.sleeps)


def test_backoff_on_429_honours_retry_after() -> None:
    calls = {"n": 0}

    def page(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if calls["n"] == 1:
            return httpx.Response(429, headers={"Retry-After": "120"})
        return ok_page(request)

    t = FakeTime()
    result = fetcher(robots_ok(page), t).fetch(FetchRequest("harera_registration", PAGE))
    assert result.status == 200
    assert calls["n"] == 2
    assert 120.0 in t.sleeps


def test_backoff_on_5xx_is_exponential_then_gives_up() -> None:
    rec = Recorder(robots_ok(lambda r: httpx.Response(503)))
    t = FakeTime()
    f = fetcher(rec, t, max_retries=3, backoff_base=10.0, backoff_cap=300.0)
    with pytest.raises(FetchFailed, match="HTTP 503 after 4 tries"):
        f.fetch(FetchRequest("harera_registration", PAGE))
    assert rec.paths().count("/projects") == 4
    backoffs = [s for s in t.sleeps if s >= 10.0]
    assert len(backoffs) == 3
    assert backoffs == sorted(backoffs)
    assert 10.0 <= backoffs[0] <= 11.0 and 40.0 <= backoffs[2] <= 44.0


def test_transport_errors_are_retried() -> None:
    calls = {"n": 0}

    def page(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if calls["n"] < 3:
            raise httpx.ConnectTimeout("slow portal", request=request)
        return ok_page(request)

    assert fetcher(robots_ok(page)).fetch(FetchRequest("harera_registration", PAGE)).status == 200
    assert calls["n"] == 3


def test_a_very_long_retry_after_gives_up_instead_of_waiting() -> None:
    rec = Recorder(robots_ok(lambda r: httpx.Response(503, headers={"Retry-After": "86400"})))
    with pytest.raises(FetchFailed, match="giving up"):
        fetcher(rec).fetch(FetchRequest("harera_registration", PAGE))


def test_retry_after_parsing() -> None:
    now = CLOCK.now()
    assert retry_after_seconds("30", now) == 30.0
    assert retry_after_seconds(format_datetime(now + timedelta(seconds=90)), now) == 90.0
    assert retry_after_seconds("soon", now) is None
    assert retry_after_seconds(None, now) is None


def test_other_4xx_are_returned_not_retried() -> None:
    rec = Recorder(robots_ok(lambda r: httpx.Response(404)))
    result = fetcher(rec).fetch(FetchRequest("harera_registration", PAGE))
    assert result.status == 404
    assert rec.paths().count("/projects") == 1


@pytest.mark.parametrize(
    "marker",
    [
        b'<div class="g-recaptcha" data-sitekey="x"></div>',
        b'<input type="text" name="captcha">',
        b'<img src="/Captcha.aspx">',
        b"<script src='/cdn-cgi/challenge-platform/x.js'></script>",
    ],
)
def test_captcha_stops_the_run(marker: bytes) -> None:
    body = b"<html><body>" + marker + b"</body></html>"
    rec = Recorder(robots_ok(lambda r: httpx.Response(200, content=body)))
    with pytest.raises(CaptchaEncountered, match="never bypassed"):
        fetcher(rec).fetch(FetchRequest("harera_registration", PAGE))


def test_redirects_stay_on_permitted_hosts() -> None:
    def page(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/projects":
            return httpx.Response(302, headers={"Location": "/projects/list"})
        if request.url.path == "/projects/list":
            return httpx.Response(302, headers={"Location": "https://elsewhere.example.test/x"})
        return ok_page(request)

    f = fetcher(robots_ok(page), with_permit=True)
    with pytest.raises(LiveFetchRefused, match=r"elsewhere\.example\.test"):
        f.fetch(FetchRequest("harera_registration", PAGE))


def test_redirect_within_the_host_is_followed() -> None:
    def page(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/projects":
            return httpx.Response(301, headers={"Location": "/projects/"})
        return ok_page(request)

    result = fetcher(robots_ok(page), with_permit=True).fetch(
        FetchRequest("harera_registration", PAGE)
    )
    assert result.status == 200
    assert result.final_url == f"{PAGE}/"


def test_permit_hosts_are_enforced_before_any_request() -> None:
    rec = Recorder(robots_ok(ok_page))
    with pytest.raises(LiveFetchRefused, match="not covered"):
        fetcher(rec, with_permit=True).fetch(
            FetchRequest("harera_registration", "https://haryanarera.gov.in/")
        )
    assert rec.requests == []


def test_oversized_bodies_are_refused() -> None:
    rec = Recorder(robots_ok(lambda r: httpx.Response(200, content=b"x" * 2048)))
    with pytest.raises(FetchFailed, match="cap"):
        fetcher(rec, max_bytes=1024).fetch(FetchRequest("harera_registration", PAGE))
