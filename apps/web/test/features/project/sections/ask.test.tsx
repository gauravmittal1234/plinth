// T20b acceptance: "Ask Plinth anything" discloses it is an AI, offers the
// human handoff, and shows cited, worked examples (the `ask` edge function
// itself is M5 — BUILD_PLAN §1 — so this is what it answers, not a live call).
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AskSection } from "@/src/features/project/sections/ask/ask-section";

describe("AskSection", () => {
  it("discloses it is an AI and offers the human handoff", () => {
    render(<AskSection />);
    expect(
      screen.getByText(
        "Ask Plinth is an AI. It answers from public records like HARERA and shows its sources. It can be wrong, so check them.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Talk to a Plinth adviser · free · developers never pay us · Mon–Sat 10 am–7 pm, usually within 4 working hours"),
    ).toBeInTheDocument();
  });

  it("shows a cited answer with its sources", () => {
    render(<AskSection />);
    expect(screen.getByText("Will it be delivered on time?")).toBeInTheDocument();
    expect(screen.getByText(/41% is built with 77% of the promised time used\./)).toBeInTheDocument();
    expect(screen.getByText("[2] HARERA QPR · Apr–Jun 2026")).toBeInTheDocument();
  });

  it("never answers should-I-buy, and hands the decision back with how to decide", () => {
    render(<AskSection />);
    expect(screen.getByText("Should I buy?")).toBeInTheDocument();
    expect(screen.getByText(/I can't tell you whether to buy\./)).toBeInTheDocument();
  });

  it("keeps the question box on the page but disabled", () => {
    render(<AskSection />);
    const input = screen.getByPlaceholderText("Ask a question about Aurelia Heights, Phase 2");
    expect(input).toBeDisabled();
  });
});
