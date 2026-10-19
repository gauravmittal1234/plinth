import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FOOTER_NAV, PRIMARY_ACTION, PRIMARY_NAV } from "@/src/shell/nav";
import { Placeholder, placeholderMetadata } from "@/src/shell/placeholder";
import { SiteFooter } from "@/src/shell/site-footer";
import { SiteHeader } from "@/src/shell/site-header";
import { SiteShell } from "@/src/shell/site-shell";
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "@/src/shell/theme";
import { ThemeToggle } from "@/src/shell/theme-toggle";

describe("SiteHeader", () => {
  it("has the wordmark, 3–5 links and one action (DESIGN §0)", () => {
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const links = within(nav).getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(3);
    expect(links.length).toBeLessThanOrEqual(5);
    expect(links.map((l) => l.textContent)).toEqual(PRIMARY_NAV.map((l) => l.label));
    expect(screen.getByRole("link", { name: "Plinth" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getByRole("button", { name: "Night theme" })).toBeInTheDocument();
  });

  it("swaps to the workspace links without the buyer action", () => {
    render(<SiteHeader variant="workspace" />);
    expect(screen.getByRole("navigation", { name: "Workspace" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: PRIMARY_ACTION.label })).toBeNull();
  });
});

describe("SiteFooter", () => {
  it("closes on the promise and the name (DESIGN §0)", () => {
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("No developer pays us. Ever.");
    expect(footer).toHaveTextContent(
      "Our opinion, based on public records. Not a credit rating. Not issued by any RERA.",
    );
    expect(within(footer).getByText("Plinth")).toHaveAttribute("aria-hidden", "true");
    const nav = within(footer).getByRole("navigation", { name: "Footer" });
    expect(within(nav).getAllByRole("link")).toHaveLength(FOOTER_NAV.length);
  });
});

describe("SiteShell", () => {
  it("gives every page one main landmark and a skip link to it", () => {
    render(
      <SiteShell>
        <p>Page</p>
      </SiteShell>,
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
  });
});

describe("ThemeToggle (Day default, Night toggle)", () => {
  it("starts on Day and flips data-theme on <html>, remembering the choice", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Night theme" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);
    expect(document.documentElement).toHaveAttribute("data-theme", "night");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("night");
    expect(button).toHaveAttribute("aria-pressed", "true");

    await user.click(button);
    expect(document.documentElement).toHaveAttribute("data-theme", "day");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("day");
  });

  it("follows a theme set before hydration by the head script", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "night");
    new Function(THEME_INIT_SCRIPT)();
    expect(document.documentElement).toHaveAttribute("data-theme", "night");
    render(<ThemeToggle />);
    await act(async () => {});
    expect(screen.getByRole("button", { name: "Night theme" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("ignores anything but day or night in storage", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "javascript:alert(1)");
    new Function(THEME_INIT_SCRIPT)();
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });
});

describe("Placeholder", () => {
  it("shows the artboard name, route, task and the WebProjectStates variant", () => {
    render(<Placeholder artboard="WebProject" />);
    expect(screen.getByRole("heading", { level: 1, name: "WebProject" })).toBeInTheDocument();
    expect(screen.getByText("/gurugram/projects/[slug]")).toBeInTheDocument();
    expect(screen.getByText(/T20a and T20b build this page/)).toBeInTheDocument();
    expect(screen.getByText("WebProjectStates")).toBeInTheDocument();
    expect(screen.queryByRole("main")).toBeNull();
  });

  it("renders its own main landmark when standalone", () => {
    render(<Placeholder artboard="Share cards" standalone />);
    expect(screen.getByRole("main")).toHaveAttribute("data-screen", "Share cards");
  });

  it("says when an M3+ screen has no task yet", () => {
    render(<Placeholder artboard="WebCostSheet" />);
    expect(screen.getByText(/Planned for M3/)).toBeInTheDocument();
  });

  it("keeps stubs out of search results", () => {
    expect(placeholderMetadata("WebHome")).toMatchObject({
      title: "WebHome (placeholder)",
      robots: { index: false, follow: false },
    });
  });
});
