// Python: package plinth_contracts (Pydantic v2) via datamodel-code-generator,
// the version pinned in pipelines/uv.lock (dev extra). Skipped, with a message,
// when the generator is not installed: `npm run py:setup` once, or uv.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { buildBundle } from "./bundle.mjs";
import { HEADER } from "./emit-ts.mjs";
import { ROOT } from "./paths.mjs";

function onPath(bin) {
  return (process.env.PATH ?? "").split(delimiter).some((d) => d && existsSync(join(d, bin)));
}

export function lockedCodegenVersion() {
  const lock = readFileSync(join(ROOT, "pipelines", "uv.lock"), "utf8");
  const m = /name = "datamodel-code-generator"\nversion = "([^"]+)"/.exec(lock);
  return m ? m[1] : null;
}

/** Returns the command (argv prefix) that runs datamodel-codegen, or null. */
export function findCodegen() {
  if (process.env.DATAMODEL_CODEGEN) return [process.env.DATAMODEL_CODEGEN];
  const venv = join(ROOT, "pipelines", ".venv", "bin", "datamodel-codegen");
  if (existsSync(venv)) return [venv];
  if (onPath("datamodel-codegen")) return ["datamodel-codegen"];
  if (onPath("uv"))
    return [
      "uv",
      "run",
      "--project",
      join(ROOT, "pipelines"),
      "--frozen",
      "--extra",
      "dev",
      "datamodel-codegen",
    ];
  return null;
}

const pyString = (s) => JSON.stringify(s);

export function emitPython(loaded, catalogues, log) {
  const cmd = findCodegen();
  if (!cmd) {
    log(
      "skip python: datamodel-codegen not found (run `npm run py:setup` once; ci-contracts runs it)",
    );
    return null;
  }
  const version = spawnSync(cmd[0], [...cmd.slice(1), "--version"], { encoding: "utf8" });
  const have = (version.stdout || version.stderr || "").trim().split(/\s+/).pop();
  const want = lockedCodegenVersion();
  if (want && have !== want)
    log(
      `warning: datamodel-codegen ${have} differs from pipelines/uv.lock ${want}; output may drift`,
    );

  const dir = mkdtempSync(join(tmpdir(), "plinth-contracts-"));
  try {
    const input = join(dir, "plinth_contracts.json");
    const output = join(dir, "models.py");
    writeFileSync(input, JSON.stringify(buildBundle(loaded, "python"), null, 2));
    const args = [
      "--input",
      input,
      "--input-file-type",
      "jsonschema",
      "--output",
      output,
      "--output-model-type",
      "pydantic_v2.BaseModel",
      "--target-python-version",
      "3.14",
      "--use-title-as-name",
      "--use-annotated",
      "--field-constraints",
      "--use-standard-collections",
      "--use-union-operator",
      "--use-double-quotes",
      "--collapse-root-models",
      "--use-subclass-enum",
      "--output-datetime-class",
      "AwareDatetime",
      "--use-schema-description",
      "--use-field-description",
      "--disable-timestamp",
      "--formatters",
      "black",
      "isort",
      "--custom-file-header",
      `# ${HEADER}\n# Pydantic v2 models (datamodel-code-generator ${want ?? ""}).`,
    ];
    const r = spawnSync(cmd[0], [...cmd.slice(1), ...args], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`contracts: datamodel-codegen failed\n${r.stderr}`);
    let models = readFileSync(output, "utf8");
    // The bundle root has no type of its own; drop the placeholder it becomes.
    models = models.replace(
      /\n\nclass (?:Model|PlinthContracts)\(RootModel\[Any\]\):\n(?: {4}.*\n)+/,
      "",
    );
    if (/class (?:Model|PlinthContracts)\(/.test(models))
      throw new Error("contracts: bundle root model was not removed");
    if (!/\bAny\b/.test(models.replace(/^from typing import .*$/m, "")))
      models = models.replace(/^from typing import (.*)$/m, (_, names) => {
        const kept = names.split(", ").filter((n) => n !== "Any");
        return kept.length ? `from typing import ${kept.join(", ")}` : "";
      });
    if (!/RootModel\[/.test(models.replace(/^from pydantic import .*$/m, "")))
      models = models.replace(
        /^from pydantic import (.*)$/m,
        (_, names) =>
          `from pydantic import ${names
            .split(", ")
            .filter((n) => n !== "RootModel")
            .join(", ")}`,
      );
    const classes = [...models.matchAll(/^class (\w+)\(/gm)].map((m) => m[1]).sort();
    for (const name of loaded.exported)
      if (!classes.includes(name))
        throw new Error(`contracts: datamodel-codegen did not emit ${name}`);

    const ids = Object.entries(loaded.schemaIds).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const init = [
      `"""Plinth API contract models (Pydantic v2).`,
      "",
      HEADER,
      `"""`,
      "",
      "import json",
      "import re",
      "from pathlib import Path",
      "from typing import Any",
      "",
      "from pydantic import BaseModel",
      "",
      "from .models import (",
      ...classes.map((c) => `    ${c} as ${c},`),
      ")",
      "",
      `SCHEMA_PREFIX = "plinth."`,
      "",
      "#: Envelope id -> model class.",
      "MODEL_BY_SCHEMA_ID: dict[str, type[BaseModel]] = {",
      ...ids.map(([id, name]) => `    ${pyString(id)}: ${name},`),
      "}",
      "",
      "#: Every exported type: payloads, request bodies and acknowledgements.",
      "EXPORTED_TYPES: tuple[str, ...] = (",
      ...loaded.exported.map((n) => `    ${pyString(n)},`),
      ")",
      "",
      "#: Feature flag keys (catalogues/flags.json).",
      "FLAG_KEYS: tuple[str, ...] = (",
      ...catalogues.flags.flags.map((f) => `    ${pyString(f.key)},`),
      ")",
      "",
      "#: Human reference formats (catalogues/ref_formats.json), keyed by prefix.",
      "REF_PATTERNS: dict[str, re.Pattern[str]] = {",
      ...catalogues.ref_formats.formats.map(
        (f) => `    ${pyString(f.prefix)}: re.compile(r"${f.regex}"),`,
      ),
      "}",
      "",
      "#: The catalogues folder of packages/contracts (editable or in-repo installs).",
      'CATALOGUES_DIR = Path(__file__).resolve().parents[2] / "catalogues"',
      "",
      "",
      "def load_catalogue(name: str) -> dict[str, Any]:",
      '    """Reads packages/contracts/catalogues/<name>.json."""',
      '    with (CATALOGUES_DIR / f"{name}.json").open(encoding="utf-8") as fh:',
      "        data: dict[str, Any] = json.load(fh)",
      "    return data",
      "",
      "",
      "def parse_payload(data: dict[str, Any]) -> BaseModel:",
      '    """Validates a payload by its "schema" envelope."""',
      '    model = MODEL_BY_SCHEMA_ID[data["schema"]]',
      "    return model.model_validate(data)",
      "",
    ];
    return {
      "python/plinth_contracts/models.py": models,
      "python/plinth_contracts/__init__.py": init.join("\n"),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
