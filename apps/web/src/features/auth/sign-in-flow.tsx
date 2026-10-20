"use client";

// WebSignIn's 4 states (DESIGN.md §5b "WebSignIn"; WebSignIn.dc.html): Phone
// → Code → Bring follows → Done. Fixture mode never calls Supabase Auth
// (AGENTS.md "Fixture mode uses fake sessions…"): sending and verifying a
// code stay UI-only, same as the design prototype. The Bring step itself is
// real data, not a design-prototype guess: once the code verifies, it reads
// api.link_whatsapp_follows (previewWhatsappFollows/confirmWhatsappFollows,
// ./actions.ts) — if that can't answer (no fixture key, or
// `not_implemented` before T45a builds the real function), there's nothing
// to bring, so the flow goes straight to Done (lead review of #62).
import { Toast } from "@plinth/web-ui";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ProjectPage } from "@/src/data";
import { confirmWhatsappFollows, previewWhatsappFollows, type WaPreview } from "./actions";
import { BringStep } from "./bring-step";
import { CodeStep } from "./code-step";
import { COUNTRIES, DEFAULT_COUNTRY_CODE } from "./countries";
import { COPY } from "./copy";
import { buildFollowedList } from "./data";
import { DoneStep } from "./done-step";
import { digitsOnly, isPhoneValid, maskPhone, phoneError as phoneErrorFor } from "./phone";
import { PhoneStep } from "./phone-step";
import type { PhoneChannel, SignInStep } from "./types";

const RESEND_SECONDS = 30;

type DoneOutcome = "merged" | "failed" | "skipped";

export function SignInFlow({
  projectPage,
  notNowHref,
}: {
  projectPage: ProjectPage | null;
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
  const [waPreview, setWaPreview] = useState<WaPreview | null>(null);
  const [outcome, setOutcome] = useState<DoneOutcome>("skipped");
  const [brought, setBrought] = useState<readonly WaPreview["follows"][number][]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startFlowTransition] = useTransition();

  // The resend countdown ticks only while the code step is showing.
  useEffect(() => {
    if (step !== "code") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [step]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  function say(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
  }

  const maskedPhone = maskPhone(countryCode, phoneDigits);
  const resendSecondsLeft =
    sentAt === null ? 0 : Math.max(0, RESEND_SECONDS - Math.floor((now - sentAt) / 1000));

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
    startFlowTransition(async () => {
      const preview = await previewWhatsappFollows();
      if (preview) {
        setWaPreview(preview);
        setStep("bring");
      } else {
        // Nothing to bring (or the data can't answer yet): skip the step.
        setOutcome("skipped");
        setBrought([]);
        setStep("done");
      }
    });
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
    startFlowTransition(async () => {
      const confirmed = await confirmWhatsappFollows();
      if (confirmed) {
        setBrought(confirmed.follows);
        setOutcome("merged");
      } else {
        // The tap happened, but nothing came back recorded: say so plainly,
        // never claim a merge that has no record (AGENTS.md §9).
        setBrought([]);
        setOutcome("failed");
      }
      setStep("done");
    });
  }

  function skipBring() {
    setBrought([]);
    setOutcome("skipped");
    setStep("done");
  }

  const followed = buildFollowedList(projectPage, brought);
  const waNames = waPreview ? waPreview.follows.map((f) => f.name) : [];

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
          pending={isPending}
          resendSecondsLeft={resendSecondsLeft}
          onResend={resend}
          onSwitchChannel={switchChannel}
          onChangeNumber={changeNumber}
        />
      ) : null}

      {step === "bring" && waPreview ? (
        <BringStep
          maskedPhone={maskedPhone}
          projectName={projectName}
          preview={waPreview}
          alsoChecked={alsoChecked}
          onToggleAlso={() => setAlsoChecked((v) => !v)}
          onBring={bring}
          onSkip={skipBring}
          pending={isPending}
        />
      ) : null}

      {step === "done" ? (
        <DoneStep
          outcome={outcome}
          followed={followed}
          waNames={waNames}
          maskedPhone={maskedPhone}
          alsoChecked={alsoChecked}
          projectName={projectName}
        />
      ) : null}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
