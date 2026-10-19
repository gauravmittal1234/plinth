// DataError and its PostgREST mapping (API_CONTRACTS §1 "Errors"); PLINTH_DATA.
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataError, ERROR_CODES, dataMode, isDataError } from "@/src/data";
import { API_ERROR_STATUS, fromPostgrestError } from "@/src/data/errors";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("fromPostgrestError", () => {
  it.each(Object.entries(API_ERROR_STATUS))(
    "maps PT%s's contract code %s to the same DataError code",
    (code, status) => {
      const err = fromPostgrestError("risk_summary", {
        code: `PT${status}`,
        message: code,
        details: "A sentence in house copy.",
        hint: null,
      });
      expect(err).toMatchObject({ code, status, rpc: "risk_summary" });
      expect(err.message).toBe("A sentence in house copy.");
    },
  );

  it("falls back to the code when the server sent no sentence", () => {
    expect(fromPostgrestError("evidence", { code: "PT404", message: "not_found" }).message).toBe(
      "not_found",
    );
  });

  it("maps PostgREST's own errors", () => {
    expect(fromPostgrestError("suggest", { code: "PGRST202", message: "no function" }).code).toBe(
      "not_implemented",
    );
    expect(fromPostgrestError("me", { code: "PGRST301", message: "JWT expired" }).code).toBe(
      "auth_required",
    );
    expect(fromPostgrestError("me", { code: "42501", message: "permission denied" }).code).toBe(
      "forbidden",
    );
    expect(fromPostgrestError("about", { code: "", message: "fetch failed" }, 0).code).toBe(
      "unavailable",
    );
    expect(fromPostgrestError("about", { message: "Bad gateway" }, 502).code).toBe("unavailable");
    expect(fromPostgrestError("about", { code: "PT999", message: "made_up" }, 500).code).toBe(
      "internal",
    );
  });
});

describe("DataError", () => {
  it("round-trips through plain data (the cache boundary)", () => {
    const err = new DataError("not_found", "risk_summary", "We have no project at this address.");
    const back = DataError.fromShape(JSON.parse(JSON.stringify(err.toShape())));
    expect(back).toBeInstanceOf(DataError);
    expect(back).toMatchObject({ code: "not_found", rpc: "risk_summary", status: 404 });
    expect(isDataError(back, "not_found")).toBe(true);
    expect(isDataError(back, "invalid_input")).toBe(false);
    expect(isDataError(new Error("x"))).toBe(false);
  });

  it("lists the contract codes and the web's own", () => {
    expect(ERROR_CODES).toEqual(
      expect.arrayContaining(["not_found", "flag_off", "fixture_missing", "unavailable"]),
    );
  });
});

describe("dataMode (PLINTH_DATA)", () => {
  it("accepts the two modes", () => {
    expect(dataMode("fixtures")).toBe("fixtures");
    expect(dataMode("supabase")).toBe("supabase");
    expect(dataMode()).toBe("fixtures");
  });

  it("defaults to fixtures outside production", () => {
    expect(dataMode("", "development")).toBe("fixtures");
    expect(dataMode("", "test")).toBe("fixtures");
    vi.stubEnv("PLINTH_DATA", undefined);
    expect(dataMode()).toBe("fixtures");
  });

  it("refuses an unset value in production", () => {
    expect(() => dataMode("", "production")).toThrow(/PLINTH_DATA is not set/);
    expect(dataMode("fixtures", "production")).toBe("fixtures");
    vi.stubEnv("PLINTH_DATA", undefined);
    vi.stubEnv("NODE_ENV", "production");
    expect(() => dataMode()).toThrow(/production/);
  });

  it("refuses anything else", () => {
    expect(() => dataMode("prod")).toThrow(/PLINTH_DATA/);
  });
});
