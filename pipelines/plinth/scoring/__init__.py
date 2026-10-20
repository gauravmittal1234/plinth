"""Delivery Risk scoring engine v1.2 (T11). Rules decide; AI never sets a band.

    World (canonical catalogue + evidence)
      -> features.build_view   point-in-time features for one phase
      -> scorecard.score       WoE bins -> logistic -> p(Late12) -> band
      -> assess.assess         red flags, not scored, limited history, confidence, frequency,
                               reasons (reasons.py), what would change (change.py)
      -> runs.run_scoring      recalculation, notices, watch pass, re-score window, history
      -> emit.document/dumps   the published document (`plinth-pipe score --emit json`)

Models live in `models/v1.0.yaml`, `v1.1.yaml`, `v1.2.yaml`; reasons and red-flag rules in
`models/reasons.yaml` and `models/red_flags.yaml`.
"""

from .assess import Assessment, assess
from .runs import ScoringResult, run_scoring
from .world import World

__all__ = ["Assessment", "ScoringResult", "World", "assess", "run_scoring"]
