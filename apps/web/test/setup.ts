import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createElement, type AnchorHTMLAttributes } from "react";
import { afterEach, vi } from "vitest";

// next/link is Next's CommonJS build and would load a second copy of React
// (the root's hoisted one). Component tests only need the anchor it renders.
vi.mock("next/link", () => ({
  default: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    createElement("a", { href, ...rest }),
}));

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
});
