// Covers the one shared date formatter (AGENTS.md §5, DESIGN §2.7/§5b): the
// house format is "18 Oct 2026", short month "Sep", never the ICU "Sept"
// that `Intl.DateTimeFormat(locale, { month: "short" })` renders for
// September under en-IN/en-GB locale data.
import { describe, expect, it } from "vitest";
import { formatDate, formatMonth, formatQuarterRange } from "@/src/lib/format/date";

const ALL_MONTHS = [
  ["01", "Jan"],
  ["02", "Feb"],
  ["03", "Mar"],
  ["04", "Apr"],
  ["05", "May"],
  ["06", "Jun"],
  ["07", "Jul"],
  ["08", "Aug"],
  ["09", "Sep"],
  ["10", "Oct"],
  ["11", "Nov"],
  ["12", "Dec"],
] as const;

describe("formatDate", () => {
  it.each(ALL_MONTHS)("formats month %s as %s (never a locale-dependent long form)", (mm, short) => {
    expect(formatDate(`2026-${mm}-14`)).toBe(`14 ${short} 2026`);
  });

  it('formats a date in September as "Sep", never "Sept"', () => {
    expect(formatDate("2026-09-15")).toBe("15 Sep 2026");
    expect(formatDate("2026-09-15")).not.toContain("Sept");
  });

  it("formats a full timestamp the same way as a bare ISO date", () => {
    expect(formatDate("2026-09-01T18:30:00.000Z")).toBe(formatDate("2026-09-02"));
  });

  it('the house single-digit day has no leading zero, e.g. "1 Jul 2026"', () => {
    expect(formatDate("2026-07-01")).toBe("1 Jul 2026");
  });
});

describe("formatMonth", () => {
  it.each(ALL_MONTHS)("formats month %s as %s 2026", (mm, short) => {
    expect(formatMonth(`2026-${mm}`)).toBe(`${short} 2026`);
  });

  it('a month-only "DateOrMonth" and a full-date one format the same month identically', () => {
    expect(formatMonth("2026-09")).toBe(formatMonth("2026-09-15"));
    expect(formatMonth("2026-09")).toBe("Sep 2026");
  });
});

describe("formatQuarterRange", () => {
  it('formats a quarter like "Jul–Sep 2026"', () => {
    expect(formatQuarterRange("2026-07", "2026-09")).toBe("Jul–Sep 2026");
  });

  it('formats "Apr–Jun 2026"', () => {
    expect(formatQuarterRange("2026-04", "2026-06")).toBe("Apr–Jun 2026");
  });

  it("never renders the start or end month as Sept", () => {
    const range = formatQuarterRange("2026-07", "2026-09");
    expect(range).not.toContain("Sept");
  });
});
