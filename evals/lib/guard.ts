// Workflow guard (T63): no workflow but nightly.yml may run AI live.
//
//   deno task guard        scans .github/workflows/*.yml and *.yaml; exit 1 on an offender
// A line offends when it gives AI_MODE any value other than `recorded` (YAML `AI_MODE: live`, a
// shell `AI_MODE=live`, an expression `AI_MODE: ${{ … }}`), outside comments, in any workflow
// except nightly.yml. Adding live evals to nightly.yml is the lead's call (a Handoff).

import { REPO_ROOT } from "./sets.ts";

export const LIVE_ALLOWED = new Set(["nightly.yml"]);

const ASSIGN = /\bAI_MODE\s*(?::|=)\s*(.*)$/;

export interface Offence {
  file: string;
  line: number;
  text: string;
}

/** The lines of one workflow that set AI_MODE to anything but recorded. */
export function offendingLines(file: string, text: string): Offence[] {
  const out: Offence[] = [];
  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (line.startsWith("#")) return;
    const m = ASSIGN.exec(line.replace(/\s+#.*$/, ""));
    if (!m) return;
    const value = m[1]!.trim().replace(/^["']|["']$/g, "").split(/\s/)[0] ?? "";
    if (value !== "recorded") out.push({ file, line: i + 1, text: line });
  });
  return out;
}

/** Every offending line in a workflows folder, except the files allowed to run live. */
export async function scanWorkflows(
  dir: URL = new URL(".github/workflows/", REPO_ROOT),
): Promise<Offence[]> {
  const out: Offence[] = [];
  const names: string[] = [];
  for await (const e of Deno.readDir(dir)) {
    if (e.isFile && /\.ya?ml$/.test(e.name)) names.push(e.name);
  }
  for (const name of names.sort()) {
    if (LIVE_ALLOWED.has(name)) continue;
    out.push(...offendingLines(name, await Deno.readTextFile(new URL(name, dir))));
  }
  return out;
}

if (import.meta.main) {
  const offences = await scanWorkflows();
  if (offences.length) {
    for (const o of offences) {
      console.error(
        `${o.file}:${o.line}: sets AI_MODE to something other than recorded: ${o.text}`,
      );
    }
    console.error("Only nightly.yml may run AI live (WORK_BREAKDOWN T63; ask the lead).");
    Deno.exit(1);
  }
  console.log("guard ok: no workflow but nightly.yml sets AI_MODE to live");
}
