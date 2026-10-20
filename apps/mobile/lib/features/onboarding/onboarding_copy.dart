/// Layout copy for AppOnboarding (WORK_BREAKDOWN §1 rule 6), copied verbatim
/// from `product/design/artboards/AppOnboarding.dc.html`: headings, field
/// labels, button names and screen-reader phrasing.
///
/// What is never here: a project's name, developer, band, price or any other
/// fact about a specific project. The artboard's own "card builds" and
/// "Follow your first project" demos name three or four real-looking
/// projects (Aurelia Heights, Kestrel Park, Coral Towers…) to show the
/// *design*, but those are the artboard's fixture stand-ins, not something
/// this app may hard-code (AGENTS.md rule 10). This build reads the same
/// three or four real projects from `api.search_projects` instead, so a
/// fixture change or a new corridor never leaves the screen showing a
/// project that doesn't exist.
abstract final class OnboardingCopy {
  static const plinth = 'Plinth';
  static const skip = 'Skip';
  static const back = 'Back';

  // Welcome.
  static const welcomeHeadline = 'Know before you book.';
  static const welcomeBody = 'Every Gurugram project, rated from its own public filings. No developer pays us. Ever.';
  static const illustrativeImage = 'Illustrative image';
  static const deliveryRisk = 'Delivery risk: ';
  static const welcomeDisclaimer = 'Our opinion, based on public records. Not a credit rating.';

  /// "Data as of {date}" from the payload's own `meta.data_as_of`/`generated_at`.
  static String welcomeDataAsOf(String date) => 'Data as of $date.';
  static const welcomePrimary = 'Next: what you’re buying';
  static const welcomeSecondary = 'Explore without an account';

  // What are you buying? (nothing preselected).
  static const buyingHeadline = 'What are you buying?';
  static const buyingBody = 'So we show the right things first. Your answer stays on this phone.';
  static const kindUcTitle = 'A flat being built';
  static const kindUcSub = 'Under construction. This is what Plinth rates today.';
  static const kindReadyTitle = 'A ready flat';
  static const kindReadySub =
      'Ready to move in, or resale. Full checks arrive in R2, planned Apr–Jun 2027. Until then you see the '
      'project’s RERA records.';
  static const kindCheckTitle = 'Just checking';
  static const kindCheckSub = 'A project someone sent you, or one you have already booked.';
  static const buyingPrimary = 'Next: where you’re looking';

  // Where are you looking? Each is optional.
  static const locationHeadline = 'Where are you looking?';
  static const locationBody = 'Pick a corridor, use your location, or both. Each is optional.';
  static const corridorDwarkaExpressway = 'Dwarka Expressway';
  static const corridorNewGurugram = 'New Gurugram';
  static const corridorGolfCourseExtRd = 'Golf Course Ext Rd · from Dec 2026';
  static const corridorSoonToast = 'Golf Course Ext Rd is planned for Dec 2026. We’ll show it here then.';
  static const useMyLocation = 'Use my location';
  static const locationHint =
      'Only while the app is open: for “Near me”, and for “Where am I?” at a site. Never stored with your number. '
      'Android asks you next.';
  static const locationOnHeadline = 'Location on, while the app is open';

  /// No reverse-geocoding service is wired up yet (no fact to name a sector
  /// by, AGENTS.md rule 10), so this stays general rather than inventing a
  /// place name the way the artboard's own "You’re near Sector 37D" does.
  static const locationOnBody = 'Projects near you come first in Explore.';
  static const turnLocationOff = 'Turn location off';
  static const locationPermissionDenied = 'Plinth can’t use your location. You can still pick a corridor instead.';
  static const locationPrimary = 'Next: sign in';

  // Sign in to follow projects.
  static const phoneHeadline = 'Sign in to follow projects';
  static const phoneBody =
      'Reading never needs an account. Signing in lets us alert you, on this phone, the web and WhatsApp.';
  static const mobileNumber = 'Mobile number';
  static const countryCodeLabel = 'Country code';
  static const phoneHint = '10-digit number';
  static const ccIn = '+91 IN';
  static const ccAe = '+971 AE';
  static const ccUs = '+1 US';
  static const ccGb = '+44 GB';
  static const phoneErrIn = 'Enter a 10-digit mobile number, starting with 6, 7, 8 or 9.';
  static const phoneErrOther = 'Enter your number without the country code.';
  static const sendCodeBy = 'Send the code by';
  static const whatsApp = 'WhatsApp';
  static const sms = 'SMS';
  static const phoneDisclaimer =
      'We use your number to sign you in, and for alerts you switch on. It is never shared without your tap.';
  static const privacyNotice = 'Privacy notice';
  static const privacyNoticeBody =
      'Your number is used to sign you in and for the alerts you switch on. It is never shared without your tap, '
      'and no developer ever sees it. You can read every band, reason and source without an account.';
  static const sendCodeOnWhatsApp = 'Send code on WhatsApp';
  static const sendCodeBySms = 'Send code by SMS';
  static const notNowExploreFirst = 'Not now, explore first';

  // Enter the code.
  static const codeHeadline = 'Enter the code';
  static String sentByWhatsApp(String masked) => 'We sent it to WhatsApp, $masked. It works for 10 minutes.';
  static String sentBySms(String masked) => 'We sent it by SMS to $masked. It works for 10 minutes.';
  static const codeArrivedOnWhatsApp = 'Code arrived on WhatsApp';
  static const tapToFillIn = 'Tap to fill it in';
  static const nothingToFillIn = 'Nothing to fill in from your clipboard yet.';
  static const sixDigitCode = '6-digit code';
  static const otpErrIncomplete = 'Enter all 6 digits.';
  static const otpErrNoMatch = 'That code didn’t match. Check it and try again, or resend it.';
  static String resendIn(int seconds) => 'New code in 0:${seconds < 10 ? '0' : ''}$seconds';
  static const sendNewCode = 'Send a new code';
  static const sendBySmsInstead = 'Send by SMS instead';
  static const sendOnWhatsAppInstead = 'Send on WhatsApp instead';
  static const newCodeSent = 'New code sent. The old one no longer works.';
  static const codeSentBySms = 'Code sent by SMS.';
  static const codeSentOnWhatsApp = 'Code sent on WhatsApp.';
  static const neverCallsForCode = 'Plinth never calls to ask for this code.';
  static const verify = 'Verify';
  static const signedInToast = 'Signed in. The same account works on the web and WhatsApp.';

  // Follow your first project.
  static const followHeadline = 'Follow your first project';
  static const followBody = 'We’ll tell you when its band, filings or orders change.';
  static const searchHint = 'Search a project or developer';
  static const follow = 'Follow';
  static const following = 'Following';

  /// "No covered project matches “{query}”. …"
  static String noMatch(String query) =>
      'No covered project matches “$query”. We cover Gurugram under-construction projects today.';
  static const followedToast = 'Following';
  static const unfollowedToast = 'Unfollowed';
  static const followFailed = 'Could not follow that project. Try again.';

  /// "Next: alerts for 1 project" / "Next: alerts for N projects" / "Next: alerts".
  static String followPrimary(int count) =>
      count == 0 ? 'Next: alerts' : 'Next: alerts for ${count == 1 ? '1 project' : '$count projects'}';

  // Turn on alerts?
  static const alertsHeadline = 'Turn on alerts?';
  static const alertsBodyBold = 'Utility alerts only.';
  static const alertsBody = ' No offers, no ads, and nothing from developers.';
  static const whatOneLooksLike = 'What one looks like';
  static const sampleGenericTitle = 'A project you follow';
  static const sampleGenericBody =
      'You’ll get an alert here when its delivery risk changes, or a new filing or order appears.';
  static const sampleBodyPrefix = 'You’ll get an alert here the moment this changes, or a new filing or order appears.';
  static const alertKindBand = 'A band change, with what triggered it';
  static const alertKindFiling = 'A new QPR, order or extension';
  static const alertKindVisit = 'Reminders for visits you book';
  static const quietHours = 'Quiet hours';
  static const quietHoursBody = 'Nothing from 10 pm to 8 am';
  static const alsoOnWhatsApp = 'Also send them on WhatsApp';
  static const replyStop = 'Reply STOP to end them.';
  static const turnOnAlerts = 'Turn on alerts';
  static const alertsNotNow = 'Not now';
  static const androidWillAskToast = 'Android will ask for permission now. You can change it any time in You.';
  static const notificationPermissionDenied =
      'Alerts are saved, but Android notifications are off. Turn them on in Settings any time.';
  static const alertsSaveFailed = 'Could not turn on alerts right now. Try again from You.';

  // You're set.
  static const doneHeadline = 'You’re set.';
  static const doneLineSignedIn =
      'Your account is the same everywhere: this app, the web and WhatsApp. Reading is still free without it.';
  static const doneLineSignedOut =
      'You can read every band, reason and source without an account. Sign in later to follow projects.';
  static const summaryBuying = 'Buying';
  static const summaryLooking = 'Looking';
  static const summaryAccount = 'Account';
  static const summaryFollowing = 'Following';
  static const summaryAlerts = 'Alerts';
  static const summaryLocation = 'Location';
  static const buyingNotSaid = 'Not said';
  static const lookingAllGurugram = 'All of Gurugram';
  static const accountNone = 'None. You can sign in later from You';
  static const accountSameEverywhere = ' · the same on the web and WhatsApp';
  static const followingNothingYet = 'Nothing yet';
  static const alertsOff = 'Off';
  static const alertsOnQuiet = 'On · quiet from 10 pm to 8 am';
  static const alertsAlsoWhatsApp = ' · also on WhatsApp';
  static const locationOffLine = 'Off';
  static const locationOnLine = 'On, only while the app is open';
  static const doneTagline = 'No developer pays us. Ever.';
  static const openExplore = 'Open Explore';
  static const changeInYou = 'Change any of this in You';

  /// "A flat being built" / "A ready flat" / "Just checking", from the kind
  /// code picked on Buying. Falls back to [buyingNotSaid] for an unknown or
  /// unset code, never guessing which one was meant.
  static String kindWord(String? kind) => switch (kind) {
    'uc' => kindUcTitle,
    'ready' => kindReadyTitle,
    'check' => kindCheckTitle,
    _ => buyingNotSaid,
  };

  // Standalone sign-in sheet (opened from an account page, not onboarding).
  static const signInSheetTitle = 'Sign in with your phone';
}
