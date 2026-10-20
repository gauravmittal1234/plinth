"""HARERA sources, parsed only from saved fixtures (T18; AGENTS.md §7: no live fetch).

    registered list / Form A-H / QPR POST / corrigendum JSON / judgments index  (parsers.py)
      -> records                                                                (records.py)
      -> validators (dirty data: negative collections, impossible dates)       (validate.py)
      -> facts, with page refs                                                 (facts.py)
      -> missing-QPR detection by due date (a signal, not a fact)              (missing.py)

`run_harera` (pipeline.py) wires fetch -> snapshot -> parse -> facts over every entry of a
fixtures manifest, skipping anything whose hash is unchanged (heartbeat). `plinth-pipe harera
run` (cli.py) is the command line, registered with T10's `plinth-pipe` as
`add_harera_parser`.
"""

from .pipeline import HareraRunResult, run_harera

__all__ = ["HareraRunResult", "run_harera"]
