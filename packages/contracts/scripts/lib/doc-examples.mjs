// Reads the JSON examples of docs/engineering/API_CONTRACTS.md, so a test can
// prove an example file is the document's example, verbatim.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./paths.mjs";

export const API_CONTRACTS_MD = join(ROOT, "docs", "engineering", "API_CONTRACTS.md");

/** The first ```json block after the heading that starts with `heading`. */
export function jsonBlockAfter(heading, md = readFileSync(API_CONTRACTS_MD, "utf8")) {
  const at = md.indexOf(`\n${heading}`);
  if (at < 0) throw new Error(`API_CONTRACTS.md: heading "${heading}" not found`);
  const m = /```json\n([\s\S]*?)\n```/.exec(md.slice(at));
  if (!m) throw new Error(`API_CONTRACTS.md: no json block after "${heading}"`);
  return JSON.parse(m[1]);
}

/** API_CONTRACTS §2.1: the Aurelia Heights, Phase 2 RiskSummary. */
export const aureliaRiskSummary = () => jsonBlockAfter("### 2.1 Example: Aurelia Heights, Phase 2");
