"""Suite-wide guard: no test opens a network connection (BUILD_PLAN §1 rule 8).

Pipelines tests run on saved fixtures only. Any socket connect (other than a local Unix
socket) fails loudly, so a fetcher that slipped past the live gate cannot reach a portal from
a test or from CI. HTTP behaviour is tested through `httpx.MockTransport`, which never opens a
socket.
"""

from __future__ import annotations

import socket
from collections.abc import Iterator
from typing import Any

import pytest


class NetworkBlocked(RuntimeError):
    pass


def _refuse(*_args: Any, **_kwargs: Any) -> Any:
    raise NetworkBlocked("tests run on saved fixtures only: network access is blocked")


@pytest.fixture(autouse=True)
def _no_network(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    real_connect = socket.socket.connect
    real_connect_ex = socket.socket.connect_ex

    def connect(self: socket.socket, address: Any) -> None:
        if self.family == getattr(socket, "AF_UNIX", object()):
            real_connect(self, address)
            return
        _refuse()

    def connect_ex(self: socket.socket, address: Any) -> int:
        if self.family == getattr(socket, "AF_UNIX", object()):
            return real_connect_ex(self, address)
        _refuse()
        return 1

    monkeypatch.setattr(socket.socket, "connect", connect)
    monkeypatch.setattr(socket.socket, "connect_ex", connect_ex)
    monkeypatch.setattr(socket, "create_connection", _refuse)
    monkeypatch.setattr(socket, "getaddrinfo", _refuse)
    yield
