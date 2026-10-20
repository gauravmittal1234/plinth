// T20b acceptance (brief Accept line): no lender name appears anywhere in
// "What else before booking?" (PRD F-13 "Loans are R2"; DESIGN §5b "No
// lender is named on R1 screens").
import type { ProjectPage } from "@plinth/contracts";
import { loadExpected } from "@plinth/fixtures/node";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookingSection } from "@/src/features/project/sections/booking/booking-section";

const page = loadExpected<ProjectPage>("project_page", "aurelia-heights-phase-2");

// Real Indian lenders a buyer might expect to see named here. None of them
// may appear: the brochure's own claim ("Approved by major banks") stays
// unnamed, per "Loans are R2".
const LENDER_NAMES = ["HDFC", "SBI", "ICICI", "Axis Bank", "Kotak", "Bank of Baroda", "Yes Bank", "PNB"];

describe("BookingSection", () => {
  it("never names a lender", () => {
    render(<BookingSection beforeBooking={page.before_booking} />);
    const text = document.body.textContent ?? "";
    for (const name of LENDER_NAMES) expect(text).not.toContain(name);
    expect(screen.getByText("Loan checks arrive in 2027")).toBeInTheDocument();
    expect(screen.getByText(/“Approved by major banks\.”/)).toBeInTheDocument();
  });

  it("covers payment plans, NRI buying and selling before possession", () => {
    render(<BookingSection beforeBooking={page.before_booking} />);
    expect(screen.getByText("Which payment plan?")).toBeInTheDocument();
    expect(screen.getByText("Buying from abroad (NRI)")).toBeInTheDocument();
    expect(screen.getByText("Selling before possession")).toBeInTheDocument();
  });
});
