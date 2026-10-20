// The §2.1 manifest matches the app folder: every row has its stub page, every
// page is in the manifest, and every stub names the right artboard.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SCREENS, hasShell } from "@/src/shell/screens";

const WEB = resolve(__dirname, "..");
const ARTBOARDS = resolve(WEB, "../../product/design/artboards");

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name.startsWith("__") ? [] : pages(p);
    return name === "page.tsx" ? [relative(WEB, p).split("\\").join("/")] : [];
  });
}

const routes = SCREENS.flatMap((s) => s.routes.map((r) => ({ screen: s, route: r })));

describe("screen manifest (WORK_BREAKDOWN §2.1)", () => {
  it("lists the 28 web rows of §2.1 (WebProjectStates rides on WebProject's route)", () => {
    const variants = SCREENS.flatMap((s) => ("variants" in s ? s.variants : []));
    expect(SCREENS.length + variants.length).toBe(28);
    const names = [...SCREENS.map((s) => s.name), ...variants.map((v) => v.name)];
    expect(new Set(names).size).toBe(names.length);
  });

  it("gives each route its own page file, and every page is a §2.1 route", () => {
    const files = routes.map((x) => x.route.file);
    expect(new Set(files).size).toBe(files.length);
    // A page a task adds outside §2.1 needs a row here first (via the lead).
    // app/__kit (T14's dev-only showcase) is exempt.
    for (const page of pages(join(WEB, "app"))) expect(files, page).toContain(page);
  });

  // Stubs only: once a task replaces a stub, its file no longer renders the
  // Placeholder and these checks skip it (e2e/smoke.spec.ts keeps checking 200).
  const stubs = routes.filter(({ route }) => {
    const path = join(WEB, route.file);
    return existsSync(path) && readFileSync(path, "utf8").includes("<Placeholder");
  });

  it("finds the stubs", () => {
    expect(stubs.length).toBeGreaterThan(0);
  });

  it.each(stubs.map((x) => [x.route.file, x.screen.name] as const))(
    "%s renders <Placeholder artboard=%j>",
    (file, name) => {
      const src = readFileSync(join(WEB, file), "utf8");
      expect(src).toContain(`<Placeholder artboard=${JSON.stringify(name)}`);
      expect(src).toContain(`placeholderMetadata(${JSON.stringify(name)})`);
    },
  );

  it.each(stubs.map((x) => [x.route.file] as const))(
    "%s renders its own <main> only outside a route group",
    (file) => {
      const route = routes.find((x) => x.route.file === file)!.route;
      const src = readFileSync(join(WEB, file), "utf8");
      expect(src.includes(" standalone")).toBe(!hasShell(route));
    },
  );

  it("points every named artboard at a file in product/design/artboards", () => {
    for (const s of SCREENS) {
      if (s.artboard) expect(existsSync(join(ARTBOARDS, s.artboard)), s.artboard).toBe(true);
    }
  });

  it("gives every route a concrete sample URL that matches its pattern", () => {
    for (const { route } of routes) {
      const path = route.sample.split("?")[0]!;
      const pattern = route.pattern
        .split("?")[0]!
        .replace(/\[a\]-vs-\[b\]/, "[^/]+-vs-[^/]+")
        .replace(/\[[^\]/]+\]/g, "[^/]+")
        .replace(/\*$/, ".+");
      expect(path, route.pattern).toMatch(new RegExp(`^${pattern}$`));
    }
  });

  it("names a task for every M1–M2 row and leaves M3+ rows unassigned", () => {
    for (const s of SCREENS) {
      const early = s.milestone === "M1" || s.milestone === "M2";
      expect(s.task !== null, s.name).toBe(early);
    }
  });
});
