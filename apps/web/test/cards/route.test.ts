// @vitest-environment node
// T27 accept: PNG dimensions are exact; the card alt text equals
// RiskSummary.share.card_alt (exercised through the real /cards/* route,
// not just the renderers directly).
import { GET } from "@/app/cards/[...card]/route";
import { RISK_CARD_SIZE, riskCardAlt } from "@/src/features/cards/risk-card";
import { COST_CARD_SIZE } from "@/src/features/cards/cost-card";
import { CHANGED_CARD_SIZE } from "@/src/features/cards/changed-card";
import { DIGEST_CARD_SIZE } from "@/src/features/cards/digest-card";
import { loadExpected, loadRequests } from "@plinth/fixtures/node";
import type { RiskSummary } from "@plinth/contracts";
import { describe, expect, it, vi } from "vitest";
import "./node-test-env";
import { pngDimensions } from "./png-inspect";

vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));

function get(card: string[]) {
  return GET(new Request("https://plinth.in/cards"), { params: Promise.resolve({ card }) });
}

describe("GET /cards/[...card]", () => {
  it("serves the risk card PNG for a known phase", async () => {
    const response = await get(["risk", "aurelia-heights-phase-2.png"]);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    const png = Buffer.from(await response.arrayBuffer());
    expect(pngDimensions(png)).toEqual(RISK_CARD_SIZE);

    const risk = loadExpected<RiskSummary>("risk_summary", "aurelia-heights-phase-2");
    // The route's alt text (as it would be set wherever this card is
    // embedded) is exactly RiskSummary.share.card_alt, never recomposed.
    expect(riskCardAlt(risk)).toBe(risk.share.card_alt);
  });

  it("serves the cost card PNG for a phase with a cost sheet", async () => {
    const response = await get(["cost", "aurelia-heights-phase-2.png"]);
    expect(response.status).toBe(200);
    expect(pngDimensions(Buffer.from(await response.arrayBuffer()))).toEqual(COST_CARD_SIZE);
  });

  it("404s the cost card for a phase with no cost sheet (DESIGN §5b: Juniper Enclave)", async () => {
    const response = await get(["cost", "juniper-enclave.png"]);
    expect(response.status).toBe(404);
  });

  it("serves the changed card PNG for a share code", async () => {
    const response = await get(["changed", "ce57248d.png"]);
    expect(response.status).toBe(200);
    expect(pngDimensions(Buffer.from(await response.arrayBuffer()))).toEqual(CHANGED_CARD_SIZE);
  });

  // The lead's M2 gate gap 5: the weekly digest's header, by its unguessable card token.
  it("serves the weekly digest card at 1080×570 for a digest's token, never stored by a shared cache", async () => {
    const [token] = Object.values(loadRequests("digest_card")).map((r) => String(r.p_code));
    expect(token).toMatch(/^[0-9a-f]{32}$/);
    const response = await get(["digest", `${token}.png`]);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(pngDimensions(Buffer.from(await response.arrayBuffer()))).toEqual(DIGEST_CARD_SIZE);
  });

  it("404s a digest URL that is not a known token: a name, a user id or an unknown token", async () => {
    for (const file of [
      "rohan.png",
      "bff1ee72-9910-5980-a875-96a9a00b24cf.png",
      "0123456789abcdef0123456789abcdef.png",
    ]) {
      expect((await get(["digest", file])).status, file).toBe(404);
    }
  });

  it("404s an unknown slug", async () => {
    const response = await get(["risk", "not-a-real-project.png"]);
    expect(response.status).toBe(404);
  });

  it("404s an unknown kind", async () => {
    const response = await get(["visit", "aurelia-heights-phase-2.png"]);
    expect(response.status).toBe(404);
  });
});
