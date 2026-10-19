"""Every valid example in packages/contracts/examples parses with the generated
Pydantic models and survives a dump/parse round trip."""

import json
import re
from pathlib import Path

import pytest
from pydantic import BaseModel

import plinth_contracts as pc

EXAMPLES = Path(__file__).resolve().parents[2] / "examples"


def folder_of(name: str) -> str:
    return re.sub(r"(?<!^)([A-Z])", r"_\1", name).lower()


CASES = [
    (name, path)
    for name in pc.EXPORTED_TYPES
    for path in sorted((EXAMPLES / folder_of(name) / "valid").glob("*.json"))
]


def test_every_examples_folder_is_an_exported_type() -> None:
    folders = sorted(p.name for p in EXAMPLES.iterdir() if p.is_dir())
    assert folders == sorted(folder_of(n) for n in pc.EXPORTED_TYPES)


@pytest.mark.parametrize(("name", "path"), CASES, ids=[f"{n}/{p.name}" for n, p in CASES])
def test_valid_example_parses(name: str, path: Path) -> None:
    model: type[BaseModel] = getattr(pc, name)
    data = json.loads(path.read_text(encoding="utf-8"))
    parsed = model.model_validate(data)
    dumped = parsed.model_dump(mode="json", by_alias=True, exclude_unset=True)
    assert model.model_validate(dumped) == parsed
    assert set(data) <= set(dumped)


def test_parse_payload_uses_the_envelope() -> None:
    path = EXAMPLES / "risk_summary" / "valid" / "aurelia-heights-phase-2.json"
    summary = pc.parse_payload(json.loads(path.read_text(encoding="utf-8")))
    assert isinstance(summary, pc.RiskSummary)
    assert summary.band is not None
    assert summary.band.code == pc.BandCode.elevated


def test_reference_patterns() -> None:
    assert pc.REF_PATTERNS["C"].match("C-1018-11")
    assert not pc.REF_PATTERNS["C"].match("PLN-C-261017-0623")


def test_catalogues_load() -> None:
    flags = pc.load_catalogue("flags")
    assert [f["key"] for f in flags["flags"]] == list(pc.FLAG_KEYS)
    assert len(pc.FLAG_KEYS) == 19
