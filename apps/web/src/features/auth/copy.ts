// Layout copy from the artboard (WebSignIn.dc.html, via
// docs/engineering/briefs/T47.md and DESIGN.md §5b "WebSignIn"). Facts (the
// project's name, band, price, reasons, and the Bring step's WhatsApp
// follow/cost-sheet counts and names) always come from data — project_page
// or api.link_whatsapp_follows (src/features/auth/actions.ts) — never fixed
// here. Copy lint (AGENTS.md §5) bans "Unlock", "seamless" and the
// trust/probability words, so these stay plain.

export const COPY = {
  pageTitle: "Sign in to Plinth",
  genericHeading: "Sign in to Plinth",
  followHeading: (name: string) => `Sign in to follow ${name}`,
  genericIntro:
    "One account for the web, the app and WhatsApp. We send a 6-digit code. There is no password.",
  readingWithoutAccount:
    "You’re reading this without an account. Bands, reasons and sources never need one. Signing in only lets us alert you.",
  illustrativeImage: "Illustrative image",
  deliveryRiskSr: "Delivery risk: ",
  riskCaption: (dataAsOf: string, modelVersion: string) =>
    `Delivery risk · data as of ${dataAsOf} · ${modelVersion}`,

  // Phone step
  mobileNumberLabel: "Mobile number",
  countryCodeLabel: "Country code",
  phonePlaceholder: "10-digit number",
  sendByLabel: "Send the code by",
  whatsapp: "WhatsApp",
  sms: "SMS",
  sendCodeOnWhatsapp: "Send code on WhatsApp",
  sendCodeBySms: "Send code by SMS",
  consentLine: "We use your number to sign you in, and for alerts you switch on. It is never shared without your tap.",
  privacyNotice: "Privacy notice",
  notNow: "Not now, keep reading",

  // Code step
  changeNumber: "Change number",
  enterCodeHeading: "Enter the code",
  sentLine: (channel: "wa" | "sms", masked: string) =>
    channel === "wa"
      ? `We sent it to WhatsApp, ${masked}. It works for 10 minutes.`
      : `We sent it by SMS to ${masked}. It works for 10 minutes.`,
  codeLabel: "6-digit code",
  otpErrIncomplete: "Enter all 6 digits.",
  // Live mode's two failures, word for word the app's (apps/mobile/lib/features/
  // onboarding: OnboardingCopy.otpErrNoMatch and the controller's send failure),
  // so web and app say the same thing.
  otpErrNoMatch: "That code didn’t match. Check it and try again, or resend it.",
  sendFailed: "Could not send the code. Check your connection and try again.",
  // The pending follow's own failure (M2 gate gap A), word for word the
  // app's (apps/mobile/lib/features/onboarding/onboarding_copy.dart
  // OnboardingCopy.followFailed) — never shown as a reason to stop or retry
  // sign-in itself, since the reader is signed in either way.
  followFailed: "Could not follow that project. Try again.",
  verifyAndFollow: (name: string | null) => (name ? `Verify and follow ${name}` : "Verify and continue"),
  resendIn: (left: number) => `New code in 0:${left < 10 ? "0" : ""}${left}`,
  sendNewCode: "Send a new code",
  newCodeSentToast: "New code sent. The old one no longer works.",
  switchChannel: (channel: "wa" | "sms") =>
    channel === "wa" ? "Send by SMS instead" : "Send on WhatsApp instead",
  channelSwitchedToast: (channel: "wa" | "sms") =>
    channel === "wa" ? "Code sent on WhatsApp." : "Code sent by SMS.",
  spotHeading: "How to spot the real message",
  spotText: (channel: "wa" | "sms") =>
    channel === "wa"
      ? "It comes from Plinth’s verified WhatsApp business account and says “…is your verification code. For your security, do not share this code.” Plinth never calls to ask for it."
      : "It comes from the sender PLINTH and says “…is your Plinth sign-in code.” Plinth never calls to ask for it.",

  // Bring-follows step. Counts and names are never fixed here (lead review
  // of #62: in live mode every reader would see this same hard-coded
  // number) — they come from the preview src/features/auth/actions.ts reads
  // off api.link_whatsapp_follows.
  bringHeading: "We found your WhatsApp follows",
  signedLine: (masked: string, name: string | null) =>
    name ? `Signed in as ${masked} · following ${name}` : `Signed in as ${masked}`,
  bringIntro: (followCount: number, sheetCount: number) => {
    const parts = [`follows ${followCount} project${followCount === 1 ? "" : "s"} on WhatsApp`];
    if (sheetCount > 0) parts.push(`saved ${sheetCount} cost sheet${sheetCount === 1 ? "" : "s"} there`);
    return `This number ${parts.join(" and ")}. Bring them here?`;
  },
  alsoSendAlerts: (name: string) => `Also send ${name} alerts on WhatsApp`,
  alsoSendAlertsHint: "Utility alerts only: band changes, filings and orders. Reply STOP to end them.",
  bringThemHere: "Bring them here",
  notNowBring: "Not now",
  bringFooter: "Nothing changes on WhatsApp; alerts keep coming there. You can unlink WhatsApp in Your account.",
  costSheetMeta: (savedOn: string) => `Sheet of ${savedOn}, saved on WhatsApp`,

  // Done step. `outcome` is "merged" only once a write answer recorded it;
  // "failed" is the tap that didn't get a record; "skipped" covers both
  // "Not now" and there being nothing to bring in the first place
  // (AGENTS.md §9 "no confirmation without a record", lead review of #62).
  doneHeading: "One account, three places",
  doneLine: (outcome: "merged" | "failed" | "skipped") => {
    if (outcome === "merged")
      return "Your WhatsApp follows are here now. The app and WhatsApp show the same list.";
    if (outcome === "failed")
      return "We couldn’t bring your WhatsApp follows over just now. Nothing was saved; they stay on WhatsApp.";
    return "Your WhatsApp follows stay on WhatsApp. Bring them here any time from Your account.";
  },
  followedJustNow: "Followed just now, on the web",
  broughtOverFromWhatsapp: "Brought over from WhatsApp",
  placeWeb: "Web",
  placeAndroid: "Android app",
  placeWhatsapp: "WhatsApp",
  placeWebLine: (count: number) =>
    `Signed in on this browser. Following ${count} ${count === 1 ? "project." : "projects."}`,
  placeAndroidLine: "Sign in with the same number and your follows are there.",
  placeWhatsappLine: (masked: string, waNames: readonly string[], alsoName: string | null) => {
    const as_before = waNames.length ? ` · alerts for ${joinNames(waNames)}, as before` : "";
    const also = alsoName ? `, now with ${alsoName}` : "";
    return `${masked}${as_before}${also}. Reply STOP to end them.`;
  },
  openFollowing: "Open Following",
  whoHasMyNumber: "Who has my number",
} as const;

/** "Aurelia Heights" / "Aurelia Heights and Kestrel Park" / "A, B and C". */
function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
