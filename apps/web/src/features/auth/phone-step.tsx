"use client";

// State 1: Phone (DESIGN.md §5b "WebSignIn"). International codes so NRIs can
// sign in (fix-trust.md G-17); "Not now, keep reading" always lets the reader
// leave without an account (AGENTS.md "Browsing never redirects to sign-in").
import { Button } from "@plinth/web-ui";
import Link from "next/link";
import type { Country } from "./countries";
import { COPY } from "./copy";
import { cx } from "./cx";
import type { PhoneChannel } from "./types";

export function PhoneStep({
  heading,
  countries,
  countryCode,
  onCountryCode,
  phoneDigits,
  onPhoneDigits,
  phoneError,
  channel,
  onChannel,
  onSend,
  pending = false,
  notNowHref,
}: {
  heading: string;
  countries: readonly Country[];
  countryCode: string;
  onCountryCode: (code: string) => void;
  phoneDigits: string;
  onPhoneDigits: (digits: string) => void;
  phoneError: string;
  channel: PhoneChannel;
  onChannel: (channel: PhoneChannel) => void;
  onSend: () => void;
  /** Live mode: Supabase Auth is sending the code (src/features/auth/session.ts). */
  pending?: boolean;
  notNowHref: string;
}) {
  return (
    <div className="flex flex-col gap-4.5">
      <h1 id="flow-h" className="m-0 font-display text-question leading-none font-bold">
        {heading}
      </h1>
      <p className="m-0 text-lead">{COPY.genericIntro}</p>

      <div className="flex flex-col gap-2 pt-1.5">
        <label htmlFor="phone-in" className="text-body font-semibold">
          {COPY.mobileNumberLabel}
        </label>
        <div className="flex gap-2">
          <select
            aria-label={COPY.countryCodeLabel}
            value={countryCode}
            onChange={(e) => onCountryCode(e.target.value)}
            className="h-14 w-29 shrink-0 rounded-pill border-[1.5px] border-line-strong bg-bg-solid px-4 font-sans text-body text-ink"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            id="phone-in"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phoneDigits}
            onChange={(e) => onPhoneDigits(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSend();
            }}
            placeholder={COPY.phonePlaceholder}
            aria-invalid={phoneError !== ""}
            aria-describedby="phone-err"
            className={cx(
              "h-14 min-w-0 flex-1 rounded-pill border-[1.5px] bg-bg-solid px-5.5 font-sans text-lead text-ink",
              phoneError ? "border-error" : "border-line-strong",
            )}
          />
        </div>
        <p id="phone-err" aria-live="polite" className="m-0 min-h-6 text-small text-error">
          {phoneError}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span id="via-l" className="text-body font-semibold">
          {COPY.sendByLabel}
        </span>
        <div role="radiogroup" aria-labelledby="via-l" className="flex gap-1 rounded-pill bg-track p-1">
          <button
            type="button"
            role="radio"
            aria-checked={channel === "wa"}
            onClick={() => onChannel("wa")}
            className={cx(
              "min-h-12 flex-1 rounded-pill font-sans text-body font-semibold",
              channel === "wa" ? "bg-segment-on text-ink" : "bg-transparent text-ink2",
            )}
          >
            {COPY.whatsapp}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={channel === "sms"}
            onClick={() => onChannel("sms")}
            className={cx(
              "min-h-12 flex-1 rounded-pill font-sans text-body font-semibold",
              channel === "sms" ? "bg-segment-on text-ink" : "bg-transparent text-ink2",
            )}
          >
            {COPY.sms}
          </button>
        </div>
      </div>

      <Button size="lg" onClick={onSend} disabled={pending} className="mt-1.5">
        {channel === "wa" ? COPY.sendCodeOnWhatsapp : COPY.sendCodeBySms}
      </Button>

      <p className="m-0 text-small text-ink2">
        {COPY.consentLine}{" "}
        <Link href="/privacy" className="font-semibold text-ink underline underline-offset-3">
          {COPY.privacyNotice}
        </Link>
      </p>

      <Link
        href={notNowHref}
        className="inline-flex min-h-11 items-center self-start text-body font-semibold text-ink underline underline-offset-5"
      >
        {COPY.notNow}
      </Link>
    </div>
  );
}
