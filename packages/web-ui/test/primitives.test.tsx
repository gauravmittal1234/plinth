// Primitives: SectionBand, Pill, Button, SegmentedControl, Sheet, Toast.
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button, Pill, SectionBand, SegmentedControl, Sheet, Toast } from "../src";
import { COPY, fixture } from "./fixtures";

const aurelia = fixture("aurelia-heights-phase-2");

describe("SectionBand", () => {
  it("is a full-bleed band on the chosen ground, with the content column inside", () => {
    render(
      <SectionBand tone="track" id="risk" aria-labelledby="risk-h">
        <h2 id="risk-h">Will it be delivered on time?</h2>
      </SectionBand>,
    );
    const band = screen.getByRole("region", { name: "Will it be delivered on time?" });
    expect(band).toHaveAttribute("id", "risk");
    expect(band.className).toContain("bg-track");
    expect(band.firstElementChild!.className).toContain("max-w-[79rem]");
  });

  it("defaults to the page ground", () => {
    const { container } = render(<SectionBand />);
    expect(container.querySelector("section")!.className).toContain("bg-bg");
  });
});

describe("Pill", () => {
  it("a tag on a tone, never outlined", () => {
    const { container } = render(<Pill tone="claim">{COPY.lanes.developer_says}</Pill>);
    const pill = container.firstElementChild!;
    expect(pill.tagName).toBe("SPAN");
    expect(pill.className).toContain("bg-claim-bg");
    expect(pill.className).not.toMatch(/(^|\s)border(\s|-)/);
  });

  it("a toggle button: aria-pressed, ink when pressed, a 44 px target", async () => {
    const onClick = vi.fn();
    render(
      <Pill as="button" pressed={false} onClick={onClick} aria-label="Tower A">
        A
      </Pill>,
    );
    const btn = screen.getByRole("button", { name: "Tower A" });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(btn).toHaveAttribute("type", "button");
    expect(btn.className).toContain("min-h-11");
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });
});

describe("SegmentedControl", () => {
  it("is one radiogroup, not separate pills far apart (benchmark-thapki.md)", async () => {
    function Demo() {
      const [value, setValue] = useState<"day" | "night">("day");
      return (
        <SegmentedControl
          ariaLabel="Theme"
          value={value}
          onChange={setValue}
          options={[
            { value: "day", label: "Day" },
            { value: "night", label: "Night" },
          ]}
        />
      );
    }
    render(<Demo />);
    const group = screen.getByRole("radiogroup", { name: "Theme" });
    const day = screen.getByRole("radio", { name: "Day" });
    const night = screen.getByRole("radio", { name: "Night" });
    expect(group).toContainElement(day);
    expect(group).toContainElement(night);
    expect(day).toHaveAttribute("aria-checked", "true");
    expect(night).toHaveAttribute("aria-checked", "false");
    await userEvent.click(night);
    expect(night).toHaveAttribute("aria-checked", "true");
    expect(day).toHaveAttribute("aria-checked", "false");
  });
});

describe("Button", () => {
  it("primary is the accent, a 56 px button at size lg (UI v2 radius-button)", () => {
    render(
      <Button size="lg" aria-pressed={false}>
        Follow this project
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Follow this project" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn.className).toContain("bg-accent");
    expect(btn.className).toContain("h-14");
    expect(btn.className).toContain("rounded-button");
  });

  it("an icon sits with the label in one row that never wraps", () => {
    render(
      <Button icon={<svg aria-hidden="true" />} aria-pressed={false}>
        Follow
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Follow" });
    expect(btn.className).toContain("whitespace-nowrap");
    expect(btn.querySelector("svg")).not.toBeNull();
  });

  it("secondary is a tone fill (no outline), one step above its ground", () => {
    render(
      <Button variant="secondary" surface="track">
        See the 4 reasons
      </Button>,
    );
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-chip-fill-on-track");
    expect(btn.className).not.toMatch(/(^|\s)border(?!-0\b)(\s|-)/);
  });

  it("tertiary is an ink link-style button with an underline, never green", () => {
    render(<Button variant="tertiary">Show the licence and insolvency checks</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("underline");
    expect(btn.className).toContain("text-ink");
    expect(btn.className).not.toContain("text-accent");
  });

  it("asChild keeps a navigation an <a>", () => {
    render(
      <Button asChild variant="secondary">
        <a href={aurelia.risk.meta.methodology_url}>Methodology v1.2</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Methodology v1.2" });
    expect(link).toHaveAttribute("href", "/methodology");
    expect(link.className).toContain("rounded-button");
  });

  it("disabled cannot be pressed", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Send report
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Sheet", () => {
  it("is a dialog named by its title, with a named close button; Escape asks to close", async () => {
    const onOpenChange = vi.fn();
    render(
      <Sheet
        open
        onOpenChange={onOpenChange}
        title={aurelia.risk.phase.name}
        closeLabel={COPY.closeEvidence}
      >
        <p>{aurelia.risk.progress.line}</p>
      </Sheet>,
    );
    const dialog = screen.getByRole("dialog", { name: "Aurelia Heights, Phase 2" });
    expect(dialog).not.toHaveAttribute("aria-modal");
    expect(dialog.className).toContain("shadow-sheet");
    expect(screen.getByRole("button", { name: COPY.closeEvidence })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("modal: dims the page with the scrim and hides it from assistive tech", () => {
    render(
      <>
        <button type="button">Follow this project</button>
        <Sheet
          open
          modal
          onOpenChange={() => {}}
          title={aurelia.risk.phase.name}
          closeLabel={COPY.closeEvidence}
        />
      </>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.querySelector(".bg-scrim")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Follow this project" })).toBeNull();
  });

  it("renders nothing while closed", () => {
    render(
      <Sheet open={false} onOpenChange={() => {}} title="x" closeLabel={COPY.closeEvidence} />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("Toast", () => {
  it("announces the message in a polite live region that is always present", () => {
    const { rerender } = render(<Toast message={null} onDismiss={() => {}} />);
    const region = screen.getByRole("status");
    expect(region).toBeEmptyDOMElement();
    expect(region).toHaveAttribute("aria-live", "polite");
    rerender(
      <Toast
        message="Link copied. It opens the live page, not a screenshot."
        onDismiss={() => {}}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Link copied. It opens the live page, not a screenshot.",
    );
  });

  it("leaves on its own after the duration", () => {
    vi.useFakeTimers();
    try {
      const onDismiss = vi.fn();
      render(<Toast message={aurelia.risk.share.caption} onDismiss={onDismiss} duration={3200} />);
      act(() => vi.advanceTimersByTime(3199));
      expect(onDismiss).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
