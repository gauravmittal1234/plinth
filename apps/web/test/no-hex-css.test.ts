// ESLint's plinth/no-hex-colour covers TS/TSX; this covers the app's CSS.
// Every colour comes from @plinth/tokens (BUILD_PLAN §5.2, DESIGN §3).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { HEX_COLOUR } from "@plinth/config/eslint/plugin";

const WEB = resolve(__dirname, "..");

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory())
      return name === "node_modules" || name.startsWith(".") ? [] : cssFiles(p);
    return name.endsWith(".css") ? [p] : [];
  });
}

describe("no hex colours in CSS", () => {
  const files = [...cssFiles(join(WEB, "app")), ...cssFiles(join(WEB, "src"))];

  it("finds the app's stylesheets", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [relative(WEB, f)]))("%s uses tokens, not hex", (file) => {
    const css = readFileSync(join(WEB, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toMatch(new RegExp(HEX_COLOUR.source, "g"));
  });
});
