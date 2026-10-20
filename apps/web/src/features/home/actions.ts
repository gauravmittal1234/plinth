"use server";

// The hero's signature (WORK_BREAKDOWN T21): type a project name and its risk
// card assembles (`api.suggest` → `risk_summary`). A Server Action, not a
// route, so it stays inside this feature's own paths (OWNERSHIP.md) — src/data
// is server-only and apps/web/app/api/** belongs to other tasks.
import { isDataError, requestProject, riskSummary, suggest, type RiskSummary } from "@/src/data";
import type { Suggestion } from "@plinth/contracts";

export type HeroCardResult =
  | { kind: "card"; summary: RiskSummary }
  | { kind: "redirect"; item: Suggestion }
  | { kind: "unknown"; query: string };

/** Looks up `query`, then assembles the risk card for its best match. */
export async function assembleCard(query: string): Promise<HeroCardResult> {
  const q = query.trim();
  if (!q) return { kind: "card", summary: await riskSummary("aurelia-heights-phase-2") };

  const results = await suggest(q);
  const top = results.items[0];
  if (!top) return { kind: "unknown", query: q };
  if (top.kind === "phase") return { kind: "card", summary: await riskSummary(top.slug) };
  // A developer or locality match: there is no single risk card for a group of
  // phases, so the page sends the buyer to that developer or search instead.
  return { kind: "redirect", item: top };
}

export type RequestProjectResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * "Request a project" (DESIGN §5b): any Gurugram project with a RERA number.
 * `api.request_project` has no packages/fixtures/expected payload yet (a
 * handoff in this PR to the fixtures owner), so a fixture-mode submit is
 * answered honestly rather than faking a reference number no system issued.
 */
export async function submitProjectRequest(name: string): Promise<RequestProjectResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: "Enter a project or developer name first." };
  try {
    await requestProject(trimmed);
    return {
      ok: true,
      message: "We add any Gurugram project with a RERA number within 14 days, or say why not in writing.",
    };
  } catch (e) {
    if (isDataError(e, "fixture_missing")) {
      return {
        ok: false,
        message:
          "Fixture mode doesn't record requests yet. In the live product, we add any Gurugram project with a RERA number within 14 days, or say why not in writing.",
      };
    }
    throw e;
  }
}
