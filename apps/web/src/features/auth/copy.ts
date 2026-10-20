// Layout copy from the artboard (WebSignIn.dc.html, via
// docs/engineering/briefs/T47.md and DESIGN.md §5b "WebSignIn"). Facts (the
// project's name, band, price, reasons) always come from risk_summary; this
// file only holds the words around them. Copy lint (AGENTS.md §5) bans
// "Unlock", "seamless" and the trust/probability words, so these stay plain.

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

  // Bring-follows step
  bringHeading: "We found your WhatsApp follows",
  signedLine: (masked: string, name: string | null) =>
    name ? `Signed in as ${masked} · following ${name}` : `Signed in as ${masked}`,
  bringIntro: "This number follows 2 projects on WhatsApp and saved 1 cost sheet there. Bring them here?",
  alsoSendAlerts: (name: string) => `Also send ${name} alerts on WhatsApp`,
  alsoSendAlertsHint: "Utility alerts only: band changes, filings and orders. Reply STOP to end them.",
  bringThemHere: "Bring them here",
  notNowBring: "Not now",
  bringFooter: "Nothing changes on WhatsApp; alerts keep coming there. You can unlink WhatsApp in Your account.",
  costSheetName: "Aurelia Heights, 3 BHK cost sheet",
  costSheetMeta: "Sheet of 2 Oct 2026, saved on WhatsApp",

  // Done step
  doneHeading: "One account, three places",
  doneLine: (merged: boolean) =>
    merged
      ? "Your WhatsApp follows are here now. The app and WhatsApp show the same list."
      : "Your WhatsApp follows stay on WhatsApp. Bring them here any time from Your account.",
  followedJustNow: "Followed just now, on the web",
  broughtOverFromWhatsapp: "Brought over from WhatsApp",
  placeWeb: "Web",
  placeAndroid: "Android app",
  placeWhatsapp: "WhatsApp",
  placeWebLine: (count: number) =>
    `Signed in on this browser. Following ${count} ${count === 1 ? "project." : "projects."}`,
  placeAndroidLine: "Sign in with the same number and your follows are there.",
  placeWhatsappLine: (masked: string, alsoName: string | null) =>
    `${masked} · alerts for Aurelia Heights and Kestrel Park, as before${
      alsoName ? `, now with ${alsoName}` : ""
    }. Reply STOP to end them.`,
  openFollowing: "Open Following",
  whoHasMyNumber: "Who has my number",
} as const;
