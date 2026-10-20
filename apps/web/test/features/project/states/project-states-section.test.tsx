// T20c fix-up (PR #46): every fact a hard-state line shows must come off
// `ProjectPage`/`RiskSummary`, never a slug-keyed string in copy.ts
// (AGENTS.md §1 "Never invent a fact in code"; §5 "risk copy ... comes from
// the server ... never composed in a client"). The band-word test below is
// the acceptance check named in the fix-up brief: on Aurelia's
// `?state=facts_only` fixture, the states section says none of the band
// words, because the group's bands are withheld everywhere for that group.
import type { ProjectPage } from "@plinth/contracts";
import { loadExpected } from "@plinth/fixtures/node";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceProvider } from "@/src/features/project/page/evidence-context";
import { ProjectStatesSection } from "@/src/features/project/states";

function renderStates(page: ProjectPage) {
  return render(
    <EvidenceProvider evidence={{}}>
      <ProjectStatesSection risk={page.risk} records={page.records} nextSteps={page.next_steps} />
    </EvidenceProvider>,
  );
}

const BAND_WORDS = [/\bLow\b/, /\bModerate\b/, /\bElevated\b/, /\bHigh\b/, /\bSevere\b/];

describe("ProjectStatesSection: Facts-only (Aurelia Heights, Phase 2)", () => {
  const page = loadExpected<ProjectPage>("project_page", "aurelia-heights-phase-2--facts-only");

  it("never shows a band word — the group's bands are withheld everywhere", () => {
    renderStates(page);
    const text = document.body.textContent ?? "";
    for (const word of BAND_WORDS) expect(text).not.toMatch(word);
  });

  it("still shows the withheld box and the records, each from the payload", () => {
    renderStates(page);
    expect(screen.getByText("Band withheld pending review, from 18 Oct 2026")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "The records, as they stand" })).toBeInTheDocument();
    // The watch bullets are the page's own next_steps lines, not a hard-coded
    // re-statement of them.
    for (const step of page.next_steps.steps) {
      expect(screen.getByText(`${step.heading}: ${step.body}`)).toBeInTheDocument();
    }
  });
});

describe("ProjectStatesSection: Not scored (Heron Point, Phase 2)", () => {
  const page = loadExpected<ProjectPage>("project_page", "heron-point-phase-2");

  it("builds the checklist from next_steps, not a hard-coded per-slug line", () => {
    renderStates(page);
    for (const step of page.next_steps.steps) {
      expect(screen.getByText(step.body)).toBeInTheDocument();
    }
  });

  it("names the real developer, not a stale hard-coded one", () => {
    renderStates(page);
    const text = document.body.textContent ?? "";
    expect(text).toContain(page.risk.phase.developer.name); // "Northfield Estates"
    expect(text).not.toContain("Heronstone Projects"); // the old copy.ts typo
  });
});

describe("ProjectStatesSection: Limited history (Juniper Enclave)", () => {
  const page = loadExpected<ProjectPage>("project_page", "juniper-enclave");

  it("watches the real developer's first finished project", () => {
    renderStates(page);
    expect(
      screen.getByText(`${page.risk.phase.developer.name}'s first finished project, when it comes.`),
    ).toBeInTheDocument();
  });
});

describe("ProjectStatesSection: Severe + Stalled (Laurel Residency)", () => {
  const page = loadExpected<ProjectPage>("project_page", "laurel-residency");

  it("templates the built share and the promoter's name off risk.progress/phase", () => {
    renderStates(page);
    expect(
      screen.getByText(`Each QPR: does the built share move from ${page.risk.progress.built_pct}%?`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`NCLT and IBBI lists for ${page.risk.phase.developer.name} and its group.`),
    ).toBeInTheDocument();
  });

  it("reads the NCLT order's date off risk.reasons for the insolvency addendum", () => {
    renderStates(page);
    expect(screen.getByText(/The NCLT order of 12 Mar 2023 is against a group company/)).toBeInTheDocument();
  });
});

describe("ProjectStatesSection: Stale data (Coral Towers)", () => {
  const page = loadExpected<ProjectPage>("project_page", "coral-towers");

  it("lists each overdue QPR from risk.pending and the latest extension from records", () => {
    renderStates(page);
    for (const pending of page.risk.pending) {
      expect(screen.getByText(pending.line)).toBeInTheDocument();
    }
    expect(
      screen.getByText(/Whether a third extension follows: Extension 2 moved the date/),
    ).toBeInTheDocument();
  });
});

describe("ProjectStatesSection: Re-scoring (Sapphire Grove, Phase 1)", () => {
  const page = loadExpected<ProjectPage>("project_page", "sapphire-grove-phase-1");

  it("reuses the pending fact's own line and marker_line, not a re-typed date", () => {
    renderStates(page);
    const pending = page.risk.pending[0]!;
    // `fact.line` also appears in the "Reading the new filing" track above
    // the watch list, so it's fine for this to render more than once.
    expect(screen.getAllByText(pending.line).length).toBeGreaterThan(0);
    expect(screen.getByText(pending.marker_line!)).toBeInTheDocument();
  });
});
