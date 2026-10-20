// T47 accept: "a 9-digit number shows the validation copy." These are the
// pure checks sign-in-flow.tsx runs on every keystroke and send.
import { describe, expect, it } from "vitest";
import {
  digitsOnly,
  isPhoneValid,
  maskPhone,
  maxDigits,
  phoneError,
  PHONE_ERROR_IN,
  PHONE_ERROR_OTHER,
} from "@/src/features/auth/phone";

describe("digitsOnly", () => {
  it("strips everything but digits", () => {
    expect(digitsOnly("99 000 00318")).toBe("9900000318");
    expect(digitsOnly("+91 (990) 000-0318")).toBe("919900000318");
  });
});

describe("isPhoneValid / phoneError (+91)", () => {
  it("accepts a 10-digit number starting 6-9", () => {
    expect(isPhoneValid("+91", "9900000318")).toBe(true);
  });

  it("rejects a 9-digit number with the house copy", () => {
    expect(isPhoneValid("+91", "990000031")).toBe(false);
    expect(phoneError("+91")).toBe(PHONE_ERROR_IN);
    expect(PHONE_ERROR_IN).toBe("Enter a 10-digit mobile number, starting with 6, 7, 8 or 9.");
  });

  it("rejects a number starting 0-5", () => {
    expect(isPhoneValid("+91", "5900000318")).toBe(false);
  });

  it("rejects an 11-digit number", () => {
    expect(isPhoneValid("+91", "99000003189")).toBe(false);
  });
});

describe("isPhoneValid / phoneError (other country codes)", () => {
  it("only needs at least 7 digits, with its own validation copy", () => {
    expect(isPhoneValid("+971", "501234")).toBe(false);
    expect(isPhoneValid("+971", "5012345")).toBe(true);
    expect(phoneError("+971")).toBe(PHONE_ERROR_OTHER);
  });
});

describe("maxDigits", () => {
  it("caps +91 at 10 and every other code at 12", () => {
    expect(maxDigits("+91")).toBe(10);
    expect(maxDigits("+1")).toBe(12);
  });
});

describe("maskPhone", () => {
  it("keeps only the first 2 and last 3 digits (never the real number)", () => {
    expect(maskPhone("+91", "9900000318")).toBe("+91 99••• ••318");
  });

  it("degrades gracefully for a too-short number", () => {
    expect(maskPhone("+91", "99")).toBe("+91 •••");
  });
});
