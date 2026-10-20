#!/usr/bin/env node
// Copy lint (BUILD_PLAN §12.11, DESIGN.md §0, §2, §6). Fails when user-facing
// strings in apps/ or server templates use banned trust words, probability
// wording or stock phrases.
//
// What it reads: string literals and JSX text in apps/**, packages/web-ui/src/**
// and the WhatsApp templates. Strings that look like identifiers (no space, not
// capitalised, e.g. a refusal code 'guarantee') are skipped. Tests are skipped.
//
// Escape hatch: put `copy-lint-allow: <reason>` in a comment on the same line
// or the line above. Use it only for strings that never reach a user.
//
// Usage: node scripts/ci/lint-copy.mjs [--self-test] [files...]
import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { BINARY_EXT, ROOT, globToRegExp, isMain, repoFiles, report } from "./lib.mjs";

export const BANNED = [
  // BUILD_PLAN §12.11 and DESIGN §2: trust words.
  { re: /\bsafe(?:ly|r|st)?\b/i, why: 'trust word "safe" (DESIGN §2)' },
  { re: /\bguarantee(?:d|s)?\b/i, why: 'trust word "guaranteed" (DESIGN §2)' },
  { re: /\bclear title\b/i, why: 'trust phrase "clear title" (DESIGN §2)' },
  { re: /\bfraud(?:s|ster|sters|ulent)?\b/i, why: 'trust word "fraud" (DESIGN §2)' },
  { re: /\bscam(?:s|mer|mers|med)?\b/i, why: 'trust word "scam" (DESIGN §2)' },
  { re: /\bavoid(?:s|ed|ing|ance)?\b/i, why: 'judgement word "avoid" (DESIGN §2)' },
  { re: /\brisky builders?\b/i, why: 'judgement phrase "risky builder" (DESIGN §2)' },
  { re: /\b(?:lie|lies|lied|lying)\b/i, why: 'judgement word "lie" (BUILD_PLAN §12.11)' },
  {
    re: /\bmislead(?:s|ing)?\b|\bmisled\b/i,
    why: 'judgement word "misleading" (BUILD_PLAN §12.11)',
  },
  // DESIGN §6: probabilities are natural frequencies only.
  {
    re: /%\s*(?:chance|probability|likely|likelihood)\b/i,
    why: 'probability as "% chance" (use "N of 100", DESIGN §6)',
  },
  {
    re: /\bper\s?cent\s+(?:chance|probability)\b/i,
    why: 'probability as "percent chance" (DESIGN §6)',
  },
  {
    re: /\b(?:1|one)\s+in\s+(?:\d[\d,]*|two|three|four|five|six|seven|eight|nine|ten|twenty|fifty|a hundred|hundred)\b/i,
    why: 'probability as "1 in X" (use "N of 100", DESIGN §6)',
  },
  // DESIGN §0: stock phrases. Every button is named for what it does.
  { re: /\bunlock(?:s|ed|ing)?\b/i, why: 'stock phrase "unlock" (DESIGN §0)' },
  { re: /\bseamless(?:ly)?\b/i, why: 'stock phrase "seamless" (DESIGN §0)' },
  { re: /\bget started\b/i, why: 'stock phrase "Get started" (DESIGN §0)' },
  { re: /\blearn more\b/i, why: 'stock phrase "Learn more" (DESIGN §0)' },
];

const SCOPE = [
  "apps/**",
  "packages/web-ui/src/**",
  "supabase/functions/_shared/wa/templates/**",
  "packages/contracts/catalogues/wa_templates.json",
].map(globToRegExp);

const SKIP = [
  "**/node_modules/**",
  "**/.next/**",
  "**/build/**",
  "**/test/**",
  "**/tests/**",
  "**/e2e/**",
  "**/__tests__/**",
  "**/*.{test,spec}.{ts,tsx,js,jsx,mjs}",
  "**/*_test.dart",
  "**/*.g.dart",
  "**/*.d.ts",
  "**/gen/**",
  "apps/mobile/android/**",
  "apps/mobile/ios/**",
].map(globToRegExp);

const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".dart"]);

/**
 * Extracts string literals (with their start line) and, for JSX files, text
 * between tags. A small lexer: handles // and block comments, '…', "…", `…`,
 * and Dart's raw and triple-quoted strings. Good enough for a lint.
 */
export function extractStrings(src, ext) {
  const out = [];
  const isDart = ext === ".dart";
  const isJsx = ext === ".tsx" || ext === ".jsx";
  let i = 0;
  let line = 1;
  let code = ""; // source with comments and strings blanked, for JSX text
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const next = src[i + 1];
    if (c === "\n") {
      line++;
      code += c;
      i++;
      continue;
    }
    if (c === "/" && next === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && next === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") {
          line++;
          code += "\n";
        }
        i++;
      }
      i += 2;
      continue;
    }
    const raw = isDart && c === "r" && (next === "'" || next === '"');
    const q = raw ? next : c;
    if (q === "'" || q === '"' || (q === "`" && !isDart)) {
      const start = raw ? i + 1 : i;
      const triple = isDart && src.startsWith(q.repeat(3), start);
      const delim = triple ? q.repeat(3) : q;
      const multiline = triple || q === "`";
      let j = start + delim.length;
      let text = "";
      let newlines = 0;
      let closed = false;
      while (j < n) {
        if (src.startsWith(delim, j)) {
          closed = true;
          break;
        }
        if (src[j] === "\\" && !raw) {
          text += src[j + 1] ?? "";
          if (src[j + 1] === "\n") newlines++;
          j += 2;
          continue;
        }
        if (src[j] === "\n") {
          if (!multiline) break; // unterminated (e.g. an apostrophe in JSX text): stop at end of line
          newlines++;
        }
        text += src[j];
        j++;
      }
      out.push({ text, line, kind: "string" });
      line += newlines;
      code += '""' + "\n".repeat(newlines);
      i = closed ? j + delim.length : j;
      continue;
    }
    code += c;
    i++;
  }
  if (isJsx) {
    let l = 1;
    const re = />([^<>{}]+)</g;
    let m;
    let last = 0;
    while ((m = re.exec(code))) {
      for (let k = last; k < m.index; k++) if (code[k] === "\n") l++;
      last = m.index;
      const t = m[1];
      if (/[A-Za-z]{2}/.test(t)) out.push({ text: t, line: l, kind: "jsx" });
    }
  }
  return out;
}

/** True when a string literal reads like copy rather than an identifier. */
export function looksLikeCopy(s) {
  const t = s.trim();
  if (!t) return false;
  if (/\s/.test(t)) return true;
  return /^[A-Z][a-z]/.test(t);
}

export function findBanned(text) {
  const hits = [];
  for (const b of BANNED) {
    const m = text.match(b.re);
    if (m) hits.push({ match: m[0], why: b.why });
  }
  return hits;
}

function allowed(lines, lineNo) {
  const here = lines[lineNo - 1] ?? "";
  const above = lines[lineNo - 2] ?? "";
  return here.includes("copy-lint-allow") || above.includes("copy-lint-allow");
}

function* jsonStrings(value) {
  if (typeof value === "string") yield value;
  else if (Array.isArray(value)) for (const v of value) yield* jsonStrings(v);
  else if (value && typeof value === "object")
    for (const v of Object.values(value)) yield* jsonStrings(v);
}

export function lintFile(rel, src) {
  const ext = extname(rel);
  const findings = [];
  if (ext === ".json") {
    let data;
    try {
      data = JSON.parse(src);
    } catch {
      return findings;
    }
    for (const s of jsonStrings(data)) {
      if (!looksLikeCopy(s)) continue;
      for (const h of findBanned(s)) findings.push({ file: rel, line: 0, ...h, text: s });
    }
    return findings;
  }
  if (!CODE_EXT.has(ext)) return findings;
  const lines = src.split("\n");
  for (const s of extractStrings(src, ext)) {
    if (s.kind === "string" && !looksLikeCopy(s.text)) continue;
    if (allowed(lines, s.line)) continue;
    for (const h of findBanned(s.text))
      findings.push({ file: rel, line: s.line, ...h, text: s.text.trim() });
  }
  return findings;
}

function selfTest() {
  const cases = [
    ["a.tsx", `<p>This project is safe to buy</p>`, 1],
    ["a.tsx", `<Button label="Get started" />`, 1],
    ["a.tsx", `const code = 'guarantee'; // refusal code`, 0],
    ["a.tsx", `const s = "Between 30 and 45 of 100 projects like this";`, 0],
    ["a.tsx", `const s = "A 35% chance of delay";`, 1],
    ["a.tsx", `const s = "About 1 in 3 projects";`, 1],
    ["a.tsx", `// the safe way\nconst x = 1;`, 0],
    ["a.tsx", `<p>We don't think it's safe</p>`, 1],
    ["a.tsx", `<div>\n  <h2>Who has my number?</h2>\n  <p>Unlock Pro</p>\n</div>`, 1],
    ["a.tsx", `const s = "Avoid this builder"; // copy-lint-allow: test fixture`, 0],
    ["a.dart", `Text('Records show 72% sold, 41% built')`, 0],
    ["a.dart", `const SafeArea(child: Text('Plinth'))`, 0],
    ["a.dart", `Text('This is a scam')`, 1],
    ["a.dart", `final s = '''\nNo developer pays us.\nEver. Guaranteed.''';`, 1],
    ["a.ts", "const t = `Fraud alert for ${name}`;", 1],
    ["a.ts", `const client = "lie-detector";`, 0],
    ["x.json", `{"body": "Your band is guaranteed"}`, 1],
    ["x.json", `{"code": "guarantee"}`, 0],
  ];
  let failed = 0;
  for (const [file, src, want] of cases) {
    const got = lintFile(file, src).length;
    if (got !== want) {
      failed++;
      console.log(
        `self-test FAIL: ${file} ${JSON.stringify(src)} -> ${got} finding(s), want ${want}`,
      );
    }
  }
  console.log(`lint-copy self-test: ${cases.length - failed}/${cases.length} passed`);
  return failed === 0;
}

function main(argv) {
  if (argv.includes("--self-test")) process.exit(selfTest() ? 0 : 1);
  const files = argv.length
    ? argv
    : repoFiles().filter((f) => SCOPE.some((r) => r.test(f)) && !SKIP.some((r) => r.test(f)));
  const findings = [];
  for (const rel of files) {
    if (BINARY_EXT.has(extname(rel))) continue;
    let src;
    try {
      src = readFileSync(join(ROOT, rel), "utf8");
    } catch {
      continue;
    }
    findings.push(...lintFile(rel, src));
  }
  for (const f of findings) {
    report("error", f.file, f.line, `${f.why}: "${f.match}" in "${f.text.slice(0, 120)}"`);
  }
  console.log(`lint-copy: ${files.length} file(s) checked, ${findings.length} finding(s)`);
  process.exit(findings.length ? 1 : 0);
}

if (isMain(import.meta.url)) main(process.argv.slice(2));
