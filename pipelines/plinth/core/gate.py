"""The live-fetch gate (BUILD_PLAN §1 rule 8; AGENTS.md §7 "No scraping before the legal memo").

Live HTTP to any source is refused unless **every** condition holds:

1. `PLINTH_FETCH_MODE=live` (fixtures is the default);
2. the `harera_live_fetch` flag is on in ops.feature_flags (an operator decision, read from
   the database; with no database it reads as off);
3. `HARERA_LIVE_FETCH_APPROVED=yes` (the founder's decision, after the legal memo);
4. the process is not in CI (`CI` unset) and not under pytest;
5. a contact email for the User-Agent is configured (`PLINTH_FETCH_CONTACT`).

`LiveGate.authorize()` turns a passing decision into a `LivePermit`. `HttpFetcher` will not
open a real network transport without one, and a permit names the hosts it covers.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass, field
from datetime import datetime

from .clock import Clock
from .config import ENV_CONTACT, ENV_FETCH_MODE, ENV_LIVE_APPROVED, FetchMode, PipelineConfig
from .flags import HARERA_LIVE_FETCH, FlagSource

#: Hosts a HARERA permit covers (the portal's base_url in core.sources).
HARERA_HOSTS: frozenset[str] = frozenset({"haryanarera.gov.in", "www.haryanarera.gov.in"})

# Only this module can mint a permit (see LivePermit.__post_init__).
_MINT = object()


class LiveFetchRefused(PermissionError):
    """Live fetching is not allowed here. The message lists every missing condition."""


@dataclass(frozen=True)
class GateDecision:
    allowed: bool
    refusals: tuple[str, ...]

    def explain(self) -> str:
        if self.allowed:
            return "live fetch allowed"
        return "live fetch refused:\n" + "\n".join(f"  - {r}" for r in self.refusals)


@dataclass(frozen=True)
class LivePermit:
    """Proof that the gate passed, for a fixed set of hosts. Minted only by LiveGate."""

    hosts: frozenset[str]
    contact: str
    issued_at: datetime
    _mint: object = field(default=None, repr=False, compare=False)

    def __post_init__(self) -> None:
        if self._mint is not _MINT:
            raise LiveFetchRefused("a LivePermit comes only from LiveGate.authorize()")

    def covers(self, host: str) -> bool:
        return host.lower() in self.hosts


class LiveGate:
    def __init__(self, config: PipelineConfig, flags: FlagSource, clock: Clock) -> None:
        self._config = config
        self._flags = flags
        self._clock = clock

    def decide(self) -> GateDecision:
        cfg = self._config
        refusals: list[str] = []
        if cfg.mode is not FetchMode.LIVE:
            refusals.append(f"{ENV_FETCH_MODE} is {cfg.mode.value!r}, not 'live'")
        flag = self._flags.read(HARERA_LIVE_FETCH)
        if not flag.enabled:
            note = f"; {flag.note}" if flag.note else ""
            refusals.append(f"flag {HARERA_LIVE_FETCH} is off (source: {flag.source}{note})")
        if not cfg.live_approved:
            refusals.append(f"{ENV_LIVE_APPROVED} is not 'yes' (set only after the legal memo)")
        if cfg.ci:
            refusals.append("running in CI: live fetching never runs in CI")
        if cfg.under_pytest:
            refusals.append("running under pytest: tests use saved fixtures only")
        if not cfg.contact or "@" not in cfg.contact:
            refusals.append(f"{ENV_CONTACT} (a contact email for the User-Agent) is not set")
        return GateDecision(allowed=not refusals, refusals=tuple(refusals))

    def authorize(self, hosts: Iterable[str] = HARERA_HOSTS) -> LivePermit:
        decision = self.decide()
        if not decision.allowed:
            raise LiveFetchRefused(decision.explain())
        assert self._config.contact is not None  # checked by decide()
        return LivePermit(
            hosts=frozenset(h.lower() for h in hosts),
            contact=self._config.contact,
            issued_at=self._clock.now(),
            _mint=_MINT,
        )
