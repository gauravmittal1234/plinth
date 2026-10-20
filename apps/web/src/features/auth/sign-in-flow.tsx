"use client";

// WebSignIn's 4 states (DESIGN.md §5b "WebSignIn"; WebSignIn.dc.html): Phone
// → Code → Bring follows → Done. Fixture mode never calls Supabase Auth
// (AGENTS.md "Fixture mode uses fake sessions…"): sending and verifying a
// code are UI-only steps here, same as the design prototype. "Bring them
// here" / "Not now" merges follows only locally too — T45a/T45b still have to
// define api.link_whatsapp_follows' response shape (INTEGRATION_NOTES.md)
// before a real call can land; T59 checks the live wiring once it does.
import { Toast } from "@plinth/web-ui";
import { useEffect, useRef, useState } from "react";
import type { ProjectPage } from "@/src/data";
import { BringStep } from "./bring-step";
import { CodeStep } from "./code-step";
import { COUNTRIES, DEFAULT_COUNTRY_CODE } from "./countries";
import { COPY } from "./copy";
import { buildFollowedList, type WaFollowItem, type WaProjectFollow } from "./data";
import { DoneStep } from "./done-step";
import { digitsOnly, isPhoneValid, maskPhone, phoneError as phoneErrorFor } from "./phone";
import { PhoneStep } from "./phone-step";
import type { PhoneChannel, SignInStep } from "./types";

const RESEND_SECONDS = 30;

export function SignInFlow({
  projectPage,
  waProjects,
  waFollows,
  notNowHref,
}: {
  projectPage: ProjectPage | null;
  waProjects: readonly [WaProjectFollow, WaProjectFollow];
  waFollows: readonly WaFollowItem[];
  notNowHref: string;
}) {
  const projectName = projectPage?.risk.phase.name ?? null;

  const [step, setStep] = useState<SignInStep>("phone");
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [channel, setChannel] = useState<PhoneChannel>("wa");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [alsoChecked, setAlsoChecked] = useState(false);
  const [merged, setMerged] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The resend countdown ticks only while the code step is showing.
  useEffect(() => {
    if (step !== "code") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  function say(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
  }

  const maskedPhone = maskPhone(countryCode, phoneDigits);
  const resendSecondsLeft = sentAt === null ? 0 : Math.max(0, RESEND_SECONDS - Math.floor((now - sentAt) / 1000));

  function handleCountryCode(code: string) {
    setCountryCode(code);
    setPhoneError("");
  }

  function handlePhoneDigits(raw: string) {
    setPhoneDigits(digitsOnly(raw));
    setPhoneError("");
  }

  function sendCode() {
    if (!isPhoneValid(countryCode, phoneDigits)) {
      setPhoneError(phoneErrorFor(countryCode));
      return;
    }
    setPhoneError("");
    setOtp("");
    setOtpError("");
    setSentAt(Date.now());
    setNow(Date.now());
    setStep("code");
  }

  function changeNumber() {
    setOtp("");
    setOtpError("");
    setStep("phone");
  }

  function verify() {
    if (otp.length < 6) {
      setOtpError(COPY.otpErrIncomplete);
      return;
    }
    setOtpError("");
    setStep("bring");
  }

  function resend() {
    if (resendSecondsLeft > 0) return;
    setSentAt(Date.now());
    setNow(Date.now());
    setOtp("");
    setOtpError("");
    say(COPY.newCodeSentToast);
  }

  function switchChannel() {
    const next: PhoneChannel = channel === "wa" ? "sms" : "wa";
    setChannel(next);
    setSentAt(Date.now());
    setNow(Date.now());
    setOtp("");
    setOtpError("");
    say(COPY.channelSwitchedToast(next));
  }

  function bring() {
    setMerged(true);
    setStep("done");
  }

  function skipBring() {
    setMerged(false);
    setStep("done");
  }

  const followed = buildFollowedList(projectPage, waProjects, merged);

  return (
    <section aria-labelledby="flow-h" className="flex min-w-0 flex-1 basis-[30rem] flex-col pt-2">
      {step === "phone" ? (
        <PhoneStep
          heading={projectName ? COPY.followHeading(projectName) : COPY.genericHeading}
          countries={COUNTRIES}
          countryCode={countryCode}
          onCountryCode={handleCountryCode}
          phoneDigits={phoneDigits}
          onPhoneDigits={handlePhoneDigits}
          phoneError={phoneError}
          channel={channel}
          onChannel={setChannel}
          onSend={sendCode}
          notNowHref={notNowHref}
        />
      ) : null}

      {step === "code" ? (
        <CodeStep
          projectName={projectName}
          channel={channel}
          maskedPhone={maskedPhone}
          otp={otp}
          onOtp={(digits) => {
            setOtp(digits);
            setOtpError("");
          }}
          otpError={otpError}
          onVerify={verify}
          resendSecondsLeft={resendSecondsLeft}
          onResend={resend}
          onSwitchChannel={switchChannel}
          onChangeNumber={changeNumber}
        />
      ) : null}

      {step === "bring" ? (
        <BringStep
          maskedPhone={maskedPhone}
          projectName={projectName}
          waFollows={waFollows}
          alsoChecked={alsoChecked}
          onToggleAlso={() => setAlsoChecked((v) => !v)}
          onBring={bring}
          onSkip={skipBring}
        />
      ) : null}

      {step === "done" ? (
        <DoneStep
          merged={merged}
          followed={followed}
          maskedPhone={maskedPhone}
          alsoChecked={alsoChecked}
          projectName={projectName}
        />
      ) : null}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
