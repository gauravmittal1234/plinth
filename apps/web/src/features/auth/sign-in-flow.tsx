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
//
// Live mode (`live`, PLINTH_DATA=supabase; M2 gate gap 2): Supabase Auth
// sends and checks the code (./session.ts), and its session cookies are set
// on this browser. Nothing says "sent" or "signed in" before Auth answered
// so (AGENTS.md rule 9). Once signed in, the Bring step runs on the buyer's
// own session; then the reader goes back to `next` (`nextHref`), where the
// pages read their own records. The Done step's list is the design
// prototype's (a "Followed just now" row with no follow record behind it),
// so live mode never shows it.
import { Toast } from "@plinth/web-ui";
import { useRouter } from "next/navigation";
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
import { sendSignInCode, verifySignInCode } from "./session";
import type { PhoneChannel, SignInStep } from "./types";

const RESEND_SECONDS = 30;

type DoneOutcome = "merged" | "failed" | "skipped";

export function SignInFlow({
  projectPage,
  notNowHref,
  live = false,
  nextHref = notNowHref,
}: {
  projectPage: ProjectPage | null;
  notNowHref: string;
  /** PLINTH_DATA=supabase: Supabase Auth sends and checks the code. */
  live?: boolean;
  /** Where a live sign-in returns to: `next`, already reduced to a same-origin path. */
  nextHref?: string;
}) {
  const router = useRouter();
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
  const phoneE164 = `${countryCode}${phoneDigits}`;
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

  /** The code step's countdown starts again: a code went out just now. */
  function codeSent() {
    setOtp("");
    setOtpError("");
    setSentAt(Date.now());
    setNow(Date.now());
  }

  function sendCode() {
    if (!isPhoneValid(countryCode, phoneDigits)) {
      setPhoneError(phoneErrorFor(countryCode));
      return;
    }
    setPhoneError("");
    if (!live) {
      codeSent();
      setStep("code");
      return;
    }
    startFlowTransition(async () => {
      const { sent } = await sendSignInCode(phoneE164);
      if (!sent) {
        setPhoneError(COPY.sendFailed);
        return;
      }
      codeSent();
      setStep("code");
    });
  }

  /** Live mode, once Auth has set the session: back to `next`. */
  function returnToNext() {
    router.replace(nextHref);
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
      if (live) {
        const { signedIn } = await verifySignInCode(phoneE164, otp);
        if (!signedIn) {
          setOtpError(COPY.otpErrNoMatch);
          return;
        }
      }
      const preview = await previewWhatsappFollows();
      if (preview) {
        setWaPreview(preview);
        setStep("bring");
      } else if (live) {
        // Signed in, nothing to bring: back to where the reader came from.
        returnToNext();
      } else {
        // Nothing to bring (or the data can't answer yet): skip the step.
        setOutcome("skipped");
        setBrought([]);
        setStep("done");
      }
    });
  }

  /** Live mode: a new code from Auth; the toast only once Auth said it went out. */
  function sendAgain(after: () => void) {
    startFlowTransition(async () => {
      const { sent } = await sendSignInCode(phoneE164);
      if (!sent) {
        say(COPY.sendFailed);
        return;
      }
      codeSent();
      after();
    });
  }

  function resend() {
    if (resendSecondsLeft > 0) return;
    if (live) {
      sendAgain(() => say(COPY.newCodeSentToast));
      return;
    }
    codeSent();
    say(COPY.newCodeSentToast);
  }

  function switchChannel() {
    const next: PhoneChannel = channel === "wa" ? "sms" : "wa";
    if (live) {
      // Auth's Send-SMS hook picks the channel (WhatsApp first, then SMS), as for
      // the app, so the toast says only what is known: a new code went out.
      sendAgain(() => {
        setChannel(next);
        say(COPY.newCodeSentToast);
      });
      return;
    }
    setChannel(next);
    codeSent();
    say(COPY.channelSwitchedToast(next));
  }

  function bring() {
    startFlowTransition(async () => {
      const confirmed = await confirmWhatsappFollows();
      if (live) {
        // Recorded: Following now lists them, from the records. Not recorded:
        // say so and stay, so the reader can try again or choose Not now.
        if (confirmed) returnToNext();
        else say(COPY.doneLine("failed"));
        return;
      }
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
    if (live) {
      returnToNext();
      return;
    }
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
          pending={isPending}
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
