import { Linter } from "eslint";
import tseslint from "typescript-eslint";
import { describe, expect, it } from "vitest";
import { HEX_COLOUR, noHexColourConfig } from "./plinth-plugin.mjs";

const linter = new Linter({ configType: "flat" });
const config = [
  {
    files: ["**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  noHexColourConfig,
];

/** Rule ids reported for a snippet of TSX. */
function lint(code) {
  return linter.verify(code, config, { filename: "x.tsx" }).map((m) => m.ruleId ?? m.message);
}

describe("plinth/no-hex-colour", () => {
  it.each([
    ['const c = "#1D5A44";'],
    ["const c = '#fff';"],
    ["const c = `border: 1px solid #E7E3DA`;"],
    ['const c = "#1d5a44cc";'],
    ['const el = <rect fill="#1D5A44" />;'],
    ['const el = <div style={{ color: "#1B1A17" }} />;'],
    ["const el = <p>#FBFAF7</p>;"],
  ])("flags %s", (code) => {
    expect(lint(code)).toEqual(["plinth/no-hex-colour"]);
  });

  it.each([
    ['const el = <a href="#face">Jump</a>;'],
    ['const el = <a href="/about#money">How we make money</a>;'],
    ['const c = "var(--pl-color-accent)";'],
    ['const id = "#main";'],
    ['const ref = "C-1018-11";'],
    ["const re = /^#([0-9A-Fa-f]{6})$/;"],
    ['const c = "bg-panel text-ink";'],
    ["// a comment about #1D5A44 is fine\nconst x = 1;"],
  ])("allows %s", (code) => {
    expect(lint(code)).toEqual([]);
  });

  it("matches only whole hex colours", () => {
    expect(HEX_COLOUR.test("#12345")).toBe(false);
    expect(HEX_COLOUR.test("#1234567")).toBe(false);
    expect(HEX_COLOUR.test("#abcdefg")).toBe(false);
    expect(HEX_COLOUR.test("#ABCDEF")).toBe(true);
  });
});
