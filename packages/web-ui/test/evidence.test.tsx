// Evidence components (DESIGN §0, §2, §4 items 8–10; WebProject.dc.html drawer).
import type { Evidence, SourceRef } from "@plinth/contracts";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  DeveloperSaysField,
  DisclaimerLine,
  EvidenceDrawer,
  FromDeveloperBlock,
  PendingFact,
  ReasonList,
  SourceChip,
} from "../src";
import { COPY, QPR_EVIDENCE, fixture } from "./fixtures";

const aurelia = fixture("aurelia-heights-phase-2");
const laurel = fixture("laurel-residency");
const juniper = fixture("juniper-enclave");
const factsOnly = fixture("aurelia-heights-phase-2--facts-only");

const LABELS = { close: COPY.closeEvidence, lanes: COPY.lanes, ...COPY.evidence };

describe("ReasonList", () => {
  it("Aurelia: a real ordered list of the 4 ranked reasons, factor first", () => {
    render(<ReasonList reasons={aurelia.risk.reasons} />);
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent("Finances: 72% of units sold, 41% built.");
    expect(items.map((li) => li.getAttribute("data-factor"))).toEqual([
      "finances",
      "timeline",
      "legal",
      "track_record",
    ]);
  });

  it("without a handler, chips link to the evidence page", () => {
    render(<ReasonList reasons={aurelia.risk.reasons} />);
    const link = screen.getByRole("link", { name: "HARERA QPR · Apr–Jun 2026" });
    expect(link).toHaveAttribute("href", "/evidence/196cb4f5-27eb-57a5-99f8-e5ab1b599c93");
  });

  it("with a handler, chips are buttons that hand back the source and its reason", async () => {
    const onOpen = vi.fn();
    render(
      <ReasonList
        reasons={aurelia.risk.reasons}
        onOpenSource={onOpen}
        sourceLabel={(s) => `Source: ${s.label}. Open evidence.`}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Source: HARERA orders · 24 months. Open evidence." }),
    );
    expect(onOpen).toHaveBeenCalledTimes(1);
    const [source, reason] = onOpen.mock.calls[0]! as [SourceRef, { rank: number }];
    expect(source.fact_ids).toEqual(["d56b2adf-6ea3-598a-8cef-cbd1b0c74895"]);
    expect(reason.rank).toBe(3);
  });

  it("Laurel lists its rule-set reasons; Juniper and facts-only have none, so nothing renders", () => {
    expect(
      render(<ReasonList reasons={laurel.risk.reasons} />).container.querySelectorAll("li").length,
    ).toBe(laurel.risk.reasons.length);
    expect(render(<ReasonList reasons={juniper.risk.reasons} />).container).toBeEmptyDOMElement();
    expect(render(<ReasonList reasons={factsOnly.risk.reasons} />).container).toBeEmptyDOMElement();
  });
});

describe("SourceChip", () => {
  it("is plain text when there is nowhere to go", () => {
    const { container } = render(
      <SourceChip source={{ label: "HARERA registration", evidence_url: null }} />,
    );
    expect(container.querySelector("a, button")).toBeNull();
    expect(container).toHaveTextContent("HARERA registration");
  });

  it("keeps the visible label inside a fuller accessible name (WCAG 2.5.3)", () => {
    const row = juniper.page.records[0]!;
    render(
      <SourceChip
        source={{ label: row.chip, evidence_url: row.evidence_url }}
        onOpen={() => {}}
        ariaLabel={`Source: ${row.chip}. Open evidence.`}
      />,
    );
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-label")).toContain(btn.textContent!);
  });
});

function Harness({ evidence }: { evidence: Evidence }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ReasonList reasons={aurelia.risk.reasons} onOpenSource={() => setOpen(true)} />
      <EvidenceDrawer evidence={evidence} open={open} onOpenChange={setOpen} labels={LABELS} />
    </>
  );
}

describe("EvidenceDrawer", () => {
  it("opens from a source chip with the filing: Filed 15 Jul 2026, the extract, the lane", async () => {
    render(<Harness evidence={QPR_EVIDENCE} />);
    const chip = screen.getAllByRole("button", { name: "HARERA QPR · Apr–Jun 2026" })[0]!;
    await userEvent.click(chip);
    const dialog = screen.getByRole("dialog", { name: "HARERA QPR · Apr–Jun 2026" });
    expect(dialog).toHaveAccessibleDescription(/^Filed 15 Jul 2026/);
    expect(within(dialog).getByText("Records show")).toBeInTheDocument();
    expect(dialog).toHaveTextContent(
      "Units booked: 72% of total. Physical progress, all towers: 41%.",
    );
    expect(dialog).toHaveTextContent("How we read it: Read by two AI extractors");
    expect(dialog).toHaveTextContent("Used in: Reason 1 of Delivery risk · Records → QPR filings");
    const link = within(dialog).getByRole("link", { name: "View on HARERA (opens in a new tab)" });
    expect(link).toHaveAttribute("href", "https://haryanarera.gov.in");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("moves focus in, closes on Escape and gives focus back to the chip", async () => {
    const user = userEvent.setup();
    render(<Harness evidence={QPR_EVIDENCE} />);
    const chip = screen.getAllByRole("button", { name: "HARERA QPR · Apr–Jun 2026" })[0]!;
    chip.focus();
    await user.keyboard("{Enter}");
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(chip).toHaveFocus();
  });

  it("closes from its close button, named from the artboard", async () => {
    const onOpenChange = vi.fn();
    render(
      <EvidenceDrawer evidence={QPR_EVIDENCE} open onOpenChange={onOpenChange} labels={LABELS} />,
    );
    await userEvent.click(screen.getByRole("button", { name: COPY.closeEvidence }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows a developer's claim in the claim tone when the evidence carries one", () => {
    const withClaim: Evidence = {
      ...QPR_EVIDENCE,
      developer_says: aurelia.risk.pending[0]!.developer_says,
    };
    render(<EvidenceDrawer evidence={withClaim} open onOpenChange={() => {}} labels={LABELS} />);
    const claim = screen.getByRole("dialog").querySelector('[data-lane="developer_says"]')!;
    expect(claim).toHaveTextContent("Developer says: filed 12 Oct, not yet verified.");
    expect(claim.querySelector("q")).toHaveTextContent("Filed on 12 Oct 2026.");
  });

  it("renders nothing without evidence", () => {
    const { baseElement } = render(
      <EvidenceDrawer evidence={null} open onOpenChange={() => {}} labels={LABELS} />,
    );
    expect(baseElement.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe("DeveloperSaysField", () => {
  it("Aurelia's response: the line, the signatory, the quoted words, in the claim tone", () => {
    const { container } = render(<DeveloperSaysField says={aurelia.risk.developer_response} />);
    const field = container.firstElementChild!;
    expect(field.className).toContain("bg-claim-bg");
    expect(field.className).not.toMatch(/border/);
    expect(field).toHaveTextContent(
      "Developer says · not yet verified · 15 Oct 2026 · we check it by 5 Nov 2026",
    );
    expect(field).toHaveTextContent("Authorised signatory");
    expect(field.querySelector("q")).toHaveTextContent(
      /^Tower B structure was completed in September 2026\./,
    );
  });

  it("compact: the label line only", () => {
    const { container } = render(
      <DeveloperSaysField says={aurelia.risk.pending[0]!.developer_says} variant="compact" />,
    );
    expect(container).toHaveTextContent(/^Developer says: filed 12 Oct, not yet verified\.$/);
    expect(container.querySelector("q")).toBeNull();
  });

  it("nothing for Laurel and Juniper, which have no developer response", () => {
    expect(
      render(<DeveloperSaysField says={laurel.risk.developer_response} />).container,
    ).toBeEmptyDOMElement();
    expect(
      render(<DeveloperSaysField says={juniper.risk.developer_response} />).container,
    ).toBeEmptyDOMElement();
  });
});

describe("PendingFact", () => {
  it("Aurelia: the missing QPR, what happens next, and the developer's claim beside it", () => {
    const { container } = render(<PendingFact fact={aurelia.risk.pending[0]} />);
    expect(container).toHaveTextContent(
      "The Jul–Sep 2026 QPR is not on HARERA yet. It was due 15 Oct 2026. If it is still missing on 25 Oct 2026, this band may change; followers hear first.",
    );
    expect(container.querySelector('[data-lane="developer_says"]')).toHaveTextContent(
      "Developer says: filed 12 Oct",
    );
  });

  it("facts-only keeps the fact but no marker (the band is withheld)", () => {
    const { container } = render(<PendingFact fact={factsOnly.risk.pending[0]} />);
    expect(container).toHaveTextContent("The Jul–Sep 2026 QPR is not on HARERA yet.");
    expect(container).not.toHaveTextContent("this band may change");
  });

  it("never names a proposed band", () => {
    const { container } = render(<PendingFact fact={aurelia.risk.pending[0]} />);
    expect(container).not.toHaveTextContent(/\b(Low|Moderate|High|Severe)\b/);
  });
});

describe("FromDeveloperBlock", () => {
  it("Aurelia: the label, the update line, the current price list and the payment plan", () => {
    render(
      <FromDeveloperBlock
        data={aurelia.page.from_developer}
        priceListHeading={<h3>Price list, 2 Oct 2026</h3>}
        flagStage={(s) => s.slab_no === 12}
      />,
    );
    const block = screen.getByRole("region", {
      name: "From the developer · not verified by Plinth",
    });
    expect(block.className).toContain("bg-claim-bg");
    expect(block).toHaveTextContent("Northfield Estates · updated 2 Oct 2026");
    expect(block).toHaveTextContent("from ₹2.35 Cr");
    expect(block).toHaveTextContent("₹16,207 per sq ft carpet");
    expect(block).not.toHaveTextContent("from ₹2.24 Cr");
    expect(block).toHaveTextContent("Base prices, before charges, GST and stamp duty.");
    const stages = block.querySelectorAll("ol > li");
    expect(stages.length).toBe(aurelia.page.from_developer!.payment_plan!.stages.length);
    expect(block.querySelector('[data-flagged="true"]')).toHaveTextContent("Slab 12");
  });

  it("Juniper's block; nothing for Laurel, whose developer published nothing", () => {
    expect(
      render(<FromDeveloperBlock data={juniper.page.from_developer} />).container,
    ).toHaveTextContent("From the developer · not verified by Plinth");
    expect(
      render(<FromDeveloperBlock data={laurel.page.from_developer} />).container,
    ).toBeEmptyDOMElement();
  });
});

describe("DisclaimerLine", () => {
  it("the server's sentence, always shown, with its links named for what they open", () => {
    render(
      <DisclaimerLine
        meta={aurelia.risk.meta}
        trailing="Data as of 14 Oct 2026 · model v1.2."
        links={COPY.links}
      />,
    );
    const line = screen.getByText(/^Our opinion, based on public records\./);
    expect(line).toHaveTextContent(
      "Our opinion, based on public records. Not a credit rating. Not issued by any RERA. Data as of 14 Oct 2026 · model v1.2. Report an error · How we make money",
    );
    expect(screen.getByRole("link", { name: "Report an error" })).toHaveAttribute(
      "href",
      "#report",
    );
    expect(line.className).toContain("text-small");
  });
});
