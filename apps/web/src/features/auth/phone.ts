// Phone step logic (WebSignIn.dc.html; DESIGN §5b "WebSignIn", state 1).
// Fixture mode never calls Supabase Auth or an SMS/WhatsApp provider: these
// are the same plain checks the artboard runs, kept pure so they're testable
// without rendering anything.
import { DEFAULT_COUNTRY_CODE } from "./countries";

/** Keeps only digits, as the phone field does on every keystroke. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** The input's own cap: 10 for +91, 12 for everyone else (room for a longer national number). */
export function maxDigits(countryCode: string): number {
  return countryCode === DEFAULT_COUNTRY_CODE ? 10 : 12;
}

/** +91: exactly 10 digits starting 6-9. Others: at least 7 digits (no strict national format here). */
export function isPhoneValid(countryCode: string, digits: string): boolean {
  return countryCode === DEFAULT_COUNTRY_CODE ? /^[6-9]\d{9}$/.test(digits) : digits.length >= 7;
}

export const PHONE_ERROR_IN = "Enter a 10-digit mobile number, starting with 6, 7, 8 or 9.";
export const PHONE_ERROR_OTHER = "Enter your number without the country code.";

/** The validation copy for an invalid number, by country. */
export function phoneError(countryCode: string): string {
  return countryCode === DEFAULT_COUNTRY_CODE ? PHONE_ERROR_IN : PHONE_ERROR_OTHER;
}

/**
 * The masked number shown once a code is sent ("+91 98••• ••12"): the first 2
 * and last 3 digits, nothing in between. Never the plain number (AGENTS.md
 * §6 "no real phone numbers"); this runs on whatever the reader typed,
 * fixture test numbers included.
 */
export function maskPhone(countryCode: string, digits: string): string {
  if (digits.length < 5) return `${countryCode} ${"•".repeat(Math.max(digits.length, 3))}`;
  const head = digits.slice(0, 2);
  const tail = digits.slice(-3);
  return `${countryCode} ${head}••• ••${tail}`;
}
