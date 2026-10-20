// T14 acceptance: lint finds no hex literals; colours, type and motion come
// from @plinth/tokens. Also: every class a component renders exists in the
// tokens' Tailwind theme (a class outside it would silently do nothing), the
// colour variables the kit names are the tokens' own, and no component holds
// copy of its own.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative, resolve } from "node:path";
import { cssVar, riskKeys } from "@plinth/tokens";
import { render } from "@testing-library/react";
import { ESLint } from "eslint";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { HEX_COLOUR } from "@plinth/config/eslint/plugin";
import { riskVar, type RiskTone } from "../src";
import { CASES } from "./cases";
import { FIXTURES } from "./fixtures";

const PKG = resolve(__dirname, "..");
const SRC = join(PKG, "src");

function files(dir: string, ext: RegExp): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p, ext) : ext.test(name) ? [p] : [];
  });
}

describe("no hex colours", () => {
  it("ESLint (plinth/no-hex-colour, on in the package preset) finds none in src or test", async () => {
    const eslint = new ESLint({ cwd: PKG });
    const results = await eslint.lintFiles(["src", "test"]);
    const config = await eslint.calculateConfigForFile(join(SRC, "index.ts"));
    expect(
      config.rules?.["plinth/no-hex-colour"]?.[0] ?? config.rules?.["plinth/no-hex-colour"],
    ).toBe(2);
    const hex = results.flatMap((r) =>
      r.messages
        .filter((m) => m.ruleId === "plinth/no-hex-colour")
        .map((m) => `${relative(PKG, r.filePath)}:${m.line} ${m.message}`),
    );
    expect(hex).toEqual([]);
  });

  it("the rule would catch one (the check is live)", async () => {
    const eslint = new ESLint({ cwd: PKG });
    const hex = String.fromCharCode(35) + "A9480C"; // built here so this file stays hex-free
    const [r] = await eslint.lintText(`export const c = "${hex}";\n`, {
      filePath: join(SRC, "probe.ts"),
    });
    expect(r!.messages.map((m) => m.ruleId)).toContain("plinth/no-hex-colour");
  });

  it.each(files(SRC, /\.css$/).map((f) => [relative(PKG, f)]))(
    "%s uses tokens, not hex",
    (file) => {
      const css = readFileSync(join(PKG, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      expect(css).not.toMatch(new RegExp(HEX_COLOUR.source, "g"));
      expect(css).not.toMatch(/\brgba?\(|\bhsla?\(/);
    },
  );
});

describe("token variables", () => {
  const toneOf: Record<(typeof riskKeys)[number], RiskTone> = {
    low: "low",
    moderate: "moderate",
    elevated: "elevated",
    high: "high",
    severe: "severe",
    limited: "limited",
    notScored: "notScored",
  };

  it.each(riskKeys.map((k) => [k]))("riskVar(%s) names the tokens' own variables", (key) => {
    for (const part of ["ink", "fill", "text"] as const) {
      expect(riskVar(toneOf[key], part)).toBe(cssVar.risk[key][part]);
    }
  });

  it("every --pl- variable the kit reads exists in dist/tokens.css", () => {
    const tokensCss = readFileSync(
      createRequire(import.meta.url).resolve("@plinth/tokens/css"),
      "utf8",
    );
    const declared = new Set([...tokensCss.matchAll(/(--pl-[a-z0-9-]+):/g)].map((m) => m[1]));
    const sources = files(SRC, /\.(tsx?|css)$/).map((f) => readFileSync(f, "utf8"));
    const used = new Set(
      sources.flatMap((s) => [...s.matchAll(/(--pl-[a-z0-9-]+)/g)].map((m) => m[1]!)),
    );
    // riskVar builds its names; they are checked above.
    used.delete("--pl-risk-");
    const missing = [...used].filter((v) => !declared.has(v));
    expect(missing).toEqual([]);
  });
});

describe("components hold no copy", () => {
  /** JSX text, and string literals in a JSX attribute or child expression, that contain a word. */
  function wordsIn(file: string): string[] {
    const src = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const out: string[] = [];
    const at = (n: ts.Node) =>
      `${relative(PKG, file)}:${src.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
    const visit = (n: ts.Node) => {
      if (ts.isJsxText(n) && /[A-Za-z]{2}/.test(n.text)) out.push(`${at(n)} ${n.text.trim()}`);
      if (
        ts.isJsxExpression(n) &&
        n.expression &&
        ts.isStringLiteralLike(n.expression) &&
        /[A-Za-z]{2}/.test(n.expression.text)
      ) {
        // A string child ({"…"}) is text; a string attribute value is checked below.
        if (!ts.isJsxAttribute(n.parent)) out.push(`${at(n)} ${n.expression.text}`);
      }
      if (ts.isJsxAttribute(n) && n.initializer) {
        const name = n.name.getText(src);
        const value = ts.isStringLiteral(n.initializer) ? n.initializer.text : null;
        // aria-label, title, alt and placeholder are words a person hears or reads.
        if (value && /^(aria-label|aria-description|title|alt|placeholder)$/.test(name))
          out.push(`${at(n)} ${name}="${value}"`);
      }
      ts.forEachChild(n, visit);
    };
    visit(src);
    return out;
  }

  it("no component writes a word itself: every word comes from the payload or the page", () => {
    expect(files(SRC, /\.tsx$/).flatMap(wordsIn)).toEqual([]);
  });

  it("the check sees words when they are there", () => {
    const probe = join(PKG, "test", "copy-probe.fixture.tsx");
    expect(wordsIn(probe).map((w) => w.replace(/^\S+:\d+ /, ""))).toEqual([
      "Close",
      'aria-label="Close evidence"',
      "Delivery risk: ",
    ]);
  });
});

// Tailwind v4 (a dependency of apps/web, hoisted to the root node_modules).
const tailwind = await (async () => {
  try {
    const specifier = createRequire(import.meta.url).resolve("@tailwindcss/node");
    return (await import(specifier)) as {
      compile: (
        css: string,
        opts: { base: string; onDependency: (p: string) => void },
      ) => Promise<{
        build: (candidates: string[]) => string;
      }>;
    };
  } catch {
    return undefined;
  }
})();

describe.skipIf(!tailwind)("Tailwind classes", () => {
  it("every class the components render compiles against the tokens theme and styles.css", async () => {
    const theme = createRequire(import.meta.url).resolve("@plinth/tokens/theme.css");
    const input = `@import "tailwindcss";\n@import "${theme}";\n@import "${join(SRC, "styles.css")}";\n`;
    const compiler = await tailwind!.compile(input, { base: PKG, onDependency: () => {} });

    const classes = new Set<string>();
    for (const theme of ["day", "night"]) {
      document.documentElement.setAttribute("data-theme", theme);
      for (const fx of FIXTURES) {
        for (const c of CASES) {
          const { baseElement, unmount } = render(c.render(fx));
          for (const el of baseElement.querySelectorAll("[class]")) {
            for (const cls of (el.getAttribute("class") ?? "").split(/\s+/))
              if (cls) classes.add(cls);
          }
          unmount();
        }
      }
    }
    expect(classes.size).toBeGreaterThan(100);

    // Build once per class: a class that adds no CSS is not a utility in this theme.
    let css = compiler.build([]);
    const dead: string[] = [];
    for (const cls of [...classes].sort()) {
      const next = compiler.build([cls]);
      if (next === css) dead.push(cls);
      css = next;
    }
    expect(dead).toEqual([]);
    // Spot checks: the classes resolve to token variables.
    expect(css).toContain("var(--pl-color-claim-bg)");
    expect(css).toContain("var(--ui-band-fill)");
    expect(css).toContain("var(--pl-elevation-sheet)");
    expect(css).toMatch(/@keyframes ui-needle/);
  });
});
