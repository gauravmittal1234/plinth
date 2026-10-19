// T01 acceptance (WORK_BREAKDOWN §4): fresh outputs, CSS ↔ Dart colour parity,
// WCAG contrast, no glass, and a Tailwind v4 compile of dist/theme.css.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { contrastRatio, toArgb } from "../src/contrast";
import {
  color,
  cssVar,
  elevation,
  layout,
  radius,
  risk,
  riskKeys,
  space,
  themes,
  typography,
  type ColorName,
  type Theme,
} from "../src/index";

const PKG = fileURLToPath(new URL("..", import.meta.url));
const read = (rel: string) => readFileSync(join(PKG, rel), "utf8");
const css = read("dist/tokens.css");
const theme = read("dist/theme.css");
const dart = read("dart/lib/plinth_tokens.dart");
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const hexArgb = (n: number) => `0x${n.toString(16).toUpperCase().padStart(8, "0")}`;

// ------------------------------------------------------------ parsers

/** Custom properties of the Day and Night blocks of dist/tokens.css. */
function cssThemeBlocks(): Record<Theme, Map<string, string>> {
  const block = (selector: string) => {
    const start = css.indexOf(`${selector} {`);
    if (start < 0) throw new Error(`no "${selector}" block in tokens.css`);
    const body = css.slice(start, css.indexOf("\n}", start));
    return new Map([...body.matchAll(/^\s*(--[\w-]+):\s*(.+);$/gm)].map((m) => [m[1]!, m[2]!]));
  };
  return { day: block(':root,\n[data-theme="day"]'), night: block('[data-theme="night"]') };
}

/** The source of `static const <Type> <name> = <Type>(` … `);` in plinth_tokens.dart. */
function dartConst(typeName: string, name: string): string {
  const head = `static const ${typeName} ${name} = ${typeName}(`;
  const start = dart.indexOf(head);
  if (start < 0) throw new Error(`no "${head}" in plinth_tokens.dart`);
  return dart.slice(start, dart.indexOf("\n  );", start));
}

/** Every colour of one theme in the Dart output, keyed by its CSS custom property. */
function dartThemeColors(th: Theme): Map<string, string> {
  const out = new Map<string, string>();
  const tokens = dartConst("PlinthTokens", th);
  for (const m of tokens.matchAll(/^ {4}(\w+): Color\((0x[0-9A-F]{8})\),$/gm))
    out.set(`--pl-color-${kebab(m[1]!)}`, m[2]!);
  const shadow = /BoxShadow\(\s*color: Color\((0x[0-9A-F]{8})\)/.exec(tokens);
  if (shadow) out.set("--pl-elevation-sheet", shadow[1]!);
  let band = "";
  for (const line of dartConst("PlinthRisk", th).split("\n")) {
    const b = /^ {4}(\w+): PlinthBandColors\($/.exec(line);
    if (b) band = b[1]!;
    const r = /^ {6}(ink|fill|text): Color\((0x[0-9A-F]{8})\),$/.exec(line);
    if (r) out.set(`--pl-risk-${kebab(band)}-${r[1]}`, r[2]!);
  }
  return out;
}

/** The colour inside a CSS value ("#…", "transparent", "rgba(…)" or a shadow ending in a colour). */
function cssColorOf(value: string): string {
  const m = /(#[0-9A-Fa-f]{6}|transparent|rgba\([^)]*\))\s*$/.exec(value);
  if (!m) throw new Error(`no colour in "${value}"`);
  return m[1]!;
}

/** tokens.json values, flattened to [path, $value] with references left as written. */
function tokenEntries(): Array<[string, unknown]> {
  const json = JSON.parse(read("tokens.json")) as Record<string, unknown>;
  const out: Array<[string, unknown]> = [];
  const walk = (node: unknown, path: string[]) => {
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    if ("$value" in obj) return void out.push([path.join("."), obj.$value]);
    for (const [k, v] of Object.entries(obj)) if (!k.startsWith("$")) walk(v, [...path, k]);
  };
  walk(json, []);
  return out;
}

// ------------------------------------------------------------ tests

describe("generated files", () => {
  const tmp = mkdtempSync(join(tmpdir(), "plinth-tokens-"));
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it("are what scripts/build.mjs makes from tokens.json today (no drift)", () => {
    execFileSync(
      process.execPath,
      [join(PKG, "scripts/build.mjs"), "--dist", join(tmp, "dist"), "--dart", join(tmp, "dart")],
      { stdio: "pipe" },
    );
    for (const f of readdirSync(join(tmp, "dist")))
      expect(read(`dist/${f}`), `dist/${f} is stale: run the build`).toBe(
        readFileSync(join(tmp, "dist", f), "utf8"),
      );
    for (const f of readdirSync(join(tmp, "dart")))
      expect(read(`dart/lib/${f}`), `dart/lib/${f} is stale: run the build`).toBe(
        readFileSync(join(tmp, "dart", f), "utf8"),
      );
  });
});

describe("CSS and Dart carry identical colours", () => {
  const cssBlocks = cssThemeBlocks();
  for (const th of themes) {
    it(`${th}: same names, same values`, () => {
      const cssColors = new Map(
        [...cssBlocks[th]].filter(([name]) => /^--pl-(color|risk|elevation)-/.test(name)),
      );
      const dartColors = dartThemeColors(th);
      expect([...dartColors.keys()].sort()).toEqual([...cssColors.keys()].sort());
      expect(cssColors.size).toBeGreaterThan(60);
      for (const [name, value] of cssColors)
        expect(dartColors.get(name), name).toBe(hexArgb(toArgb(cssColorOf(value))));
    });
  }

  it("and the TypeScript constants match the CSS", () => {
    const cssBlocksAll = cssThemeBlocks();
    for (const th of themes) {
      for (const [name, value] of Object.entries(color[th]))
        expect(cssBlocksAll[th].get(`--pl-color-${kebab(name)}`), name).toBe(value);
      for (const key of riskKeys)
        for (const role of ["ink", "fill", "text"] as const)
          expect(cssBlocksAll[th].get(`--pl-risk-${kebab(key)}-${role}`)).toBe(risk[th][key][role]);
      expect(cssBlocksAll[th].get("--pl-elevation-sheet")).toBe(elevation[th].sheet.css);
    }
  });

  it("Day and Night define the same colour names", () => {
    expect(Object.keys(color.night)).toEqual(Object.keys(color.day));
  });
});

describe("WCAG contrast", () => {
  const AA = 4.5;
  const NON_TEXT = 3;
  const surfaces: ColorName[] = [
    "bg",
    "bgSolid",
    "panel",
    "track",
    "claimBg",
    "nav",
    "header",
    "sheet",
    "pressed",
  ];
  const pairs: Array<[ColorName, ColorName]> = [
    ["onAccent", "accent"],
    ["accentText", "bg"],
    ["accentText", "panel"],
    ["onAccentSoft", "accentSoft"],
    ["onInverse", "inverse"],
    ["onGlass", "glass"],
    ["onSlab", "slab"],
    ["onSlab2", "slab"],
    ["aiLabelFg", "aiLabelBg"],
    ["disabledFg", "disabledBg"],
    ["error", "bg"],
    ["error", "panel"],
    ["ink", "navIndicator"],
    ["ink", "segmentOn"],
    ["ink", "chipFill"],
    ["ink2", "chipFill"],
    ["ink", "chipFillOnTrack"],
    ["ink2", "chipFillOnTrack"],
    ["ink", "chipFillOnClaim"],
    ["ink2", "chipFillOnClaim"],
  ];

  for (const th of themes) {
    const c = color[th];
    it(`${th}: running text (ink, ink2, muted) on every surface`, () => {
      for (const fg of ["ink", "ink2", "muted"] as const)
        for (const bg of surfaces)
          expect(contrastRatio(c[fg], c[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(AA);
    });

    it(`${th}: paired foregrounds on their backgrounds`, () => {
      for (const [fg, bg] of pairs)
        expect(contrastRatio(c[fg], c[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(AA);
    });

    it(`${th}: band names and chip text`, () => {
      for (const key of riskKeys) {
        const band = risk[th][key];
        for (const bg of ["bg", "bgSolid", "panel", "track"] as const)
          expect(contrastRatio(band.text, c[bg]), `${key} name on ${bg}`).toBeGreaterThanOrEqual(
            AA,
          );
        if (band.fill !== "transparent") {
          expect(
            contrastRatio(band.text, band.fill),
            `${key} name on its fill`,
          ).toBeGreaterThanOrEqual(AA);
          expect(
            contrastRatio(c.ink, band.fill),
            `chip text on the ${key} fill`,
          ).toBeGreaterThanOrEqual(AA);
        }
      }
    });

    it(`${th}: meter inks, empty borders and the focus ring are visible (3:1)`, () => {
      for (const bg of ["bg", "bgSolid", "panel"] as const) {
        for (const key of riskKeys)
          expect(
            contrastRatio(risk[th][key].ink, c[bg]),
            `${key} ink on ${bg}`,
          ).toBeGreaterThanOrEqual(NON_TEXT);
        expect(contrastRatio(c.emptyBorder, c[bg]), `emptyBorder on ${bg}`).toBeGreaterThanOrEqual(
          NON_TEXT,
        );
        expect(contrastRatio(c.focus, c[bg]), `focus on ${bg}`).toBeGreaterThanOrEqual(NON_TEXT);
        expect(contrastRatio(c.accent, c[bg]), `accent button on ${bg}`).toBeGreaterThanOrEqual(
          NON_TEXT,
        );
      }
    });
  }

  it("Low and Moderate names use ink on Day, because their inks fail 4.5:1", () => {
    for (const key of ["low", "moderate"] as const) {
      expect(risk.day[key].text).toBe(color.day.ink);
      expect(contrastRatio(risk.day[key].ink, color.day.bg)).toBeLessThan(AA);
    }
  });
});

describe("no glass, glow or gradients (DESIGN §0)", () => {
  // The documented exceptions: the photo scrim and the one shadow, on floating surfaces only.
  const ALLOWED = new Set([
    "color.day.scrim",
    "color.night.scrim",
    "elevation.day.sheet",
    "elevation.night.sheet",
  ]);
  const banned = /blur|gradient|rgba?\(|hsla?\(|backdrop/i;

  it("tokens.json: no token contains blur, gradient or rgba() except the documented exceptions", () => {
    const hits = tokenEntries()
      .filter(([, v]) => banned.test(JSON.stringify(v)))
      .map(([path]) => path);
    expect(hits.sort()).toEqual([...ALLOWED].sort());
  });

  it("tokens.json: every colour is opaque or fully transparent, except the scrim", () => {
    for (const [path, value] of tokenEntries()) {
      if (typeof value !== "string" || !/^(#|rgba|transparent)/.test(value)) continue;
      const alpha = toArgb(value) >>> 24;
      if (ALLOWED.has(path)) expect(alpha, path).toBeLessThan(255);
      else expect([0, 255], path).toContain(alpha);
    }
  });

  it("dist/tokens.css and theme.css: no backdrop-filter, blur(), gradients or stray rgba()", () => {
    for (const file of [css, theme]) {
      expect(file).not.toMatch(/backdrop-filter|blur\(|gradient/);
    }
    const rgbaLines = css.split("\n").filter((l) => l.includes("rgba("));
    for (const line of rgbaLines) expect(line).toMatch(/^\s*--pl-(color-scrim|elevation-sheet):/);
  });

  it("dart: every Color is opaque or fully transparent, except the scrim and the shadow", () => {
    for (const th of themes) {
      for (const [name, argb] of dartThemeColors(th)) {
        const alpha = argb.slice(2, 4);
        if (name === "--pl-color-scrim" || name === "--pl-elevation-sheet")
          expect(alpha).not.toMatch(/^(FF|00)$/);
        else expect(["FF", "00"], `${th} ${name}`).toContain(alpha);
      }
    }
    expect(dart).not.toMatch(/ImageFilter|BackdropFilter|Gradient/);
  });
});

describe("scale rules", () => {
  it("spacing is on the 4-px grid", () => {
    for (const v of Object.values(space)) expect(v % 4).toBe(0);
  });

  it("no type role is below 13 px", () => {
    for (const roles of Object.values(typography))
      for (const [role, r] of Object.entries(roles)) {
        expect(r.size, role).toBeGreaterThanOrEqual(13);
        if ("sizeMin" in r) expect(r.sizeMin, role).toBeGreaterThanOrEqual(13);
      }
  });

  it("media is square, panels stay at or under 8, pills are round", () => {
    expect(radius.none).toBe(0);
    expect(radius.panel).toBeLessThanOrEqual(8);
    expect(radius.pill).toBeGreaterThanOrEqual(999);
    expect(layout.touchWeb).toBeGreaterThanOrEqual(44);
    expect(layout.touchApp).toBeGreaterThanOrEqual(48);
  });

  it("cssVar references point at properties that exist", () => {
    const declared = new Set([...css.matchAll(/^\s*(--pl-[\w-]+):/gm)].map((m) => m[1]));
    const refs: string[] = [];
    const walk = (node: unknown) => {
      if (typeof node === "string") refs.push(node);
      else if (node && typeof node === "object") Object.values(node).forEach(walk);
    };
    walk(cssVar);
    expect(refs.length).toBeGreaterThan(100);
    for (const ref of refs) {
      const name = /^var\((--pl-[\w-]+)\)$/.exec(ref)?.[1];
      expect(name !== undefined && declared.has(name), ref).toBe(true);
    }
  });
});

// Tailwind is a dependency of apps/web, hoisted to the root node_modules; this check
// skips if it is not installed.
const tailwind = await (async () => {
  try {
    const specifier = createRequire(import.meta.url).resolve("@tailwindcss/node");
    return (await import(specifier)) as {
      compile: (
        css: string,
        opts: { base: string; onDependency: (p: string) => void },
      ) => Promise<{ build: (candidates: string[]) => string }>;
    };
  } catch {
    return undefined;
  }
})();

describe.skipIf(!tailwind)("Tailwind v4 theme", () => {
  async function build(candidates: string[]) {
    const input = `@import "tailwindcss";\n@import "${join(PKG, "dist/theme.css")}";\n`;
    const compiler = await tailwind!.compile(input, { base: PKG, onDependency: () => {} });
    return compiler.build(candidates);
  }

  it("maps utilities to the runtime custom properties", async () => {
    const out = await build([
      "bg-ink",
      "text-muted",
      "bg-risk-elevated-fill",
      "text-hero",
      "font-display",
      "rounded-panel",
      "shadow-sheet",
      "p-4",
      "max-w-content",
    ]);
    expect(out).toContain("background-color: var(--pl-color-ink)");
    expect(out).toContain("color: var(--pl-color-muted)");
    expect(out).toContain("background-color: var(--pl-risk-elevated-fill)");
    expect(out).toContain("font-size: var(--pl-type-hero-size)");
    expect(out).toContain("font-family: var(--pl-font-family-display)");
    expect(out).toContain("border-radius: var(--pl-radius-panel)");
    expect(out).toContain("--tw-shadow: var(--pl-elevation-sheet)");
    expect(out).toContain("padding: calc(4px * 4)");
    expect(out).toContain("max-width: var(--pl-layout-content-max)");
  });

  it("drops the default palette, blur, resting shadows and text glow", async () => {
    const banned = [
      "bg-red-500",
      "bg-white",
      "text-black",
      "backdrop-blur-md",
      "blur-sm",
      "shadow-md",
      "drop-shadow-md",
      "text-shadow-lg",
    ];
    const out = await build(banned);
    for (const cls of banned) expect(out, cls).not.toContain(`.${cls} {`);
  });
});
