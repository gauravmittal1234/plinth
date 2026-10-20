// T27: /c/[code] (WORK_BREAKDOWN §2.1 "Share cards"). Renders the server
// component directly (an async function, called and awaited like Next
// does) rather than booting a real route — Playwright covers that smoke.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));

const NOT_FOUND = new Error("NEXT_NOT_FOUND");
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw NOT_FOUND;
  },
}));

import { CardRoute, generateMetadata } from "@/app/c/[code]/page";

function params(code: string) {
  return { params: Promise.resolve({ code }), searchParams: Promise.resolve({}) };
}

describe("/c/[code]", () => {
  it("shows the phase name, the current band and what changed", async () => {
    const element = await CardRoute(params("ce57248d"));
    render(element);

    expect(screen.getByRole("heading", { name: "Aurelia Heights, Phase 2" })).toBeInTheDocument();
    expect(screen.getByText(/Changed since this card was sent/)).toBeInTheDocument();
    expect(screen.getByText("Elevated")).toBeInTheDocument();
    expect(screen.getByText("Elevated since 2 Oct 2026", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the live page" })).toHaveAttribute(
      "href",
      "https://plinth.in/gurugram/projects/aurelia-heights-phase-2",
    );
  });

  it("calls notFound() for an unknown code", async () => {
    await expect(CardRoute(params("not-a-real-code"))).rejects.toThrow(NOT_FOUND);
  });

  it("builds metadata from the ShareCard, kept out of the index (a reopen link, not the canonical page)", async () => {
    const metadata = await generateMetadata(params("ce57248d"));
    expect(metadata.title).toBe("Aurelia Heights, Phase 2");
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe("https://plinth.in/c/ce57248d");
  });
});
