import { describe, expect, it } from "vitest";
import { dataMode } from "@/src/data/mode";

describe("dataMode", () => {
  it("accepts fixtures and supabase", () => {
    expect(dataMode("fixtures", "development")).toBe("fixtures");
    expect(dataMode("supabase", "development")).toBe("supabase");
  });

  it("defaults to fixtures outside production when unset", () => {
    expect(dataMode(undefined, "development")).toBe("fixtures");
    expect(dataMode("", "test")).toBe("fixtures");
  });

  it("refuses an unset value in production (never quietly fixtures)", () => {
    // "" rather than undefined: passing undefined falls back to the real
    // process.env.PLINTH_DATA, which vitest.config.mts sets to "fixtures".
    expect(() => dataMode("", "production")).toThrow(/PLINTH_DATA is not set/);
  });

  it("refuses any other value", () => {
    expect(() => dataMode("live", "development")).toThrow(/must be "fixtures" or "supabase"/);
  });
});
