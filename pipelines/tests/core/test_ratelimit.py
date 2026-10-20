"""Limiter timing: one request per 3-5 s per host, one in flight per host."""

from __future__ import annotations

import random
import threading

import pytest

from plinth.core.ratelimit import HostRateLimiter
from plinth.core.testing import FakeTime


def limiter(t: FakeTime, seed: int = 7) -> HostRateLimiter:
    return HostRateLimiter(monotonic=t.monotonic, sleep=t.sleep, rng=random.Random(seed))


def test_first_request_to_a_host_does_not_wait() -> None:
    t = FakeTime()
    with limiter(t).slot("haryanarera.gov.in") as waited:
        assert waited == 0.0
    assert t.sleeps == []


def test_same_host_requests_are_3_to_5_seconds_apart() -> None:
    t = FakeTime()
    lim = limiter(t)
    starts: list[float] = []
    for _ in range(50):
        with lim.slot("haryanarera.gov.in"):
            starts.append(t.monotonic())
            t.advance(0.4)  # the request itself takes time
    ends = [s + 0.4 for s in starts]
    gaps = [nxt - end for end, nxt in zip(ends, starts[1:], strict=False)]
    assert all(3.0 <= g <= 5.0 for g in gaps), gaps
    assert len({round(g, 6) for g in gaps}) > 1, "the spacing is spread, not a fixed beat"


def test_time_already_passed_counts_toward_the_gap() -> None:
    t = FakeTime()
    lim = limiter(t)
    with lim.slot("a.example.test"):
        pass
    t.advance(10.0)
    with lim.slot("a.example.test") as waited:
        assert waited == 0.0
    assert t.sleeps == []


def test_hosts_do_not_wait_for_each_other() -> None:
    t = FakeTime()
    lim = limiter(t)
    with lim.slot("a.example.test"):
        pass
    with lim.slot("B.example.test") as waited:
        assert waited == 0.0
    with lim.slot("b.example.test") as waited:  # host names are case-insensitive
        assert waited > 0


@pytest.mark.parametrize(("low", "high"), [(1.0, 5.0), (0.0, 0.0), (2.9, 3.5), (5.0, 4.0)])
def test_floor_of_three_seconds_is_enforced(low: float, high: float) -> None:
    with pytest.raises(ValueError, match="politeness floor"):
        HostRateLimiter(low, high)


def test_one_request_in_flight_per_host() -> None:
    t = FakeTime()
    lim = limiter(t)
    first_inside = threading.Event()
    release_first = threading.Event()
    second_entered = threading.Event()

    def first() -> None:
        with lim.slot("a.example.test"):
            first_inside.set()
            release_first.wait(5)

    def second() -> None:
        first_inside.wait(5)
        with lim.slot("a.example.test"):
            second_entered.set()

    a = threading.Thread(target=first)
    b = threading.Thread(target=second)
    a.start()
    b.start()
    assert first_inside.wait(5)
    assert not second_entered.wait(0.2), "a second request entered while the first was in flight"
    release_first.set()
    a.join(5)
    b.join(5)
    assert second_entered.is_set()
    assert t.sleeps and 3.0 <= t.sleeps[-1] <= 5.0
