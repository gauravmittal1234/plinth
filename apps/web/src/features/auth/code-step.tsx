"use client";

// State 2: Code (DESIGN.md §5b "WebSignIn"). 6 cells over one real
// `one-time-code` input, a resend countdown (30 s, brief: "resend after
// 30 s"), SMS/WhatsApp fallback, and the spot-the-real-message line naming
// the sender ("PLINTH" for SMS, T41).
import { Button } from "@plinth/web-ui";
import { COPY } from "./copy";
import { cx } from "./cx";
import { OtpCells } from "./otp-cells";
import type { PhoneChannel } from "./types";

export function CodeStep({
  projectName,
  channel,
  maskedPhone,
  otp,
  onOtp,
  otpError,
  onVerify,
  pending,
  resendSecondsLeft,
  onResend,
  onSwitchChannel,
  onChangeNumber,
}: {
  projectName: string | null;
  channel: PhoneChannel;
  maskedPhone: string;
  otp: string;
  onOtp: (digits: string) => void;
  otpError: string;
  onVerify: () => void;
  /** Checking what this number already does on WhatsApp (src/features/auth/actions.ts). */
  pending: boolean;
  resendSecondsLeft: number;
  onResend: () => void;
  onSwitchChannel: () => void;
  onChangeNumber: () => void;
}) {
  const canResend = resendSecondsLeft <= 0;
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onChangeNumber}
        className="inline-flex min-h-11 items-center gap-2 self-start border-0 bg-transparent p-0 font-sans text-body font-semibold text-ink"
      >
        {COPY.changeNumber}
      </button>
      <h1 id="flow-h" className="m-0 font-display text-question leading-none font-extrabold">
        {COPY.enterCodeHeading}
      </h1>
      <p className="m-0 text-lead">{COPY.sentLine(channel, maskedPhone)}</p>

      <div className="flex flex-col gap-2 pt-1.5">
        <OtpCells
          value={otp}
          onChange={onOtp}
          onEnter={onVerify}
          invalid={otpError !== ""}
          describedBy="otp-err"
        />
        <p id="otp-err" aria-live="polite" className="m-0 min-h-6 text-small text-error">
          {otpError}
        </p>
      </div>

      <Button size="lg" onClick={onVerify} disabled={pending}>
        {pending ? "Checking…" : COPY.verifyAndFollow(projectName)}
      </Button>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <button
          type="button"
          onClick={onResend}
          aria-disabled={!canResend}
          disabled={!canResend}
          className={cx(
            "min-h-11 border-0 bg-transparent p-0 font-sans text-body font-semibold",
            canResend ? "cursor-pointer text-ink underline underline-offset-5" : "text-ink2",
          )}
        >
          {canResend ? COPY.sendNewCode : COPY.resendIn(resendSecondsLeft)}
        </button>
        <button
          type="button"
          onClick={onSwitchChannel}
          className="min-h-11 border-0 bg-transparent p-0 font-sans text-body font-semibold text-ink underline underline-offset-5"
        >
          {COPY.switchChannel(channel)}
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-1.5 rounded-panel bg-claim-bg px-5 py-4.5">
        <span className="text-body font-semibold">{COPY.spotHeading}</span>
        <span className="text-body">{COPY.spotText(channel)}</span>
      </div>
    </div>
  );
}
