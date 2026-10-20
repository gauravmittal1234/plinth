/// Layout copy for AppProject (WORK_BREAKDOWN §1 rule 6): the artboard's
/// section headings, field labels and button names. Risk and fact copy is
/// never composed here — it always comes from `RiskSummary`/`ProjectPage`.
///
/// `python3 scripts/artboard_text.py product/design/artboards/AppProject.dc.html`
/// prints the source copy this mirrors.
abstract final class ProjectCopy {
  // Hero.
  static const illustrativeImage = 'Illustrative image';
  static const showRera = 'Show the RERA QR code';
  static const alreadyBooked = "Already booked here?";

  // Risk.
  static const willItBeOnTime = 'Will it be delivered on time?';
  static const ocNotKeysHeading = 'The OC is not the keys';
  static const whyBand = 'Why';
  static const seeReasons = 'See the reasons and their sources';
  static const dial = 'Dial';
  static const of100Projects = '100 projects';

  // So what do we do now?
  static const soWhatNow = 'So what do we do now?';
  static const forScale = 'For scale';

  // Before booking.
  static const beforeBooking = 'What else before booking?';
  static const paymentPlans = 'Which payment plan?';
  static const loans = 'Home loans';
  static const nri = 'Buying from abroad (NRI)';
  static const sellingBeforePossession = 'Selling before possession';
  static const preRera = 'Before RERA';
  static const notifyLabel = 'Tell me when loan checks open';

  // Built.
  static const howMuchBuilt = 'How much is built?';
  static const tower = 'Tower';
  static const towerAll = 'All';
  static const built = 'Built';
  static const sold = 'Sold';
  static const timeUsed = 'Time used';
  static const onRecordThatQuarter = 'On record that quarter';

  // Homes.
  static const whatAreHomesLike = 'What are the homes like?';
  static const amenitiesAndGettingAround = 'Amenities and getting around';
  static const fromDeveloperPricesAndPlan = "From the developer: prices and plan";
  static const waterloggingLabel = 'Reported waterlogging nearby';

  // Pay.
  static const whatWillIPay = 'What will I really pay?';
  static const payAllIn = 'All-in';

  // Afford the wait.
  static const canWeAfford = 'Can we afford the wait?';
  static const takeHomeLabel = 'Take-home, a month';
  static const rentLabel = 'Rent now, a month';
  static const loanAssumptionLabel = 'Loan at 20% down, 8.50%, 20 years';
  static const nowLabel = 'Now';
  static const afterKeysLabel = 'After keys';
  static const checkBeforeYouPay = 'Check before you pay anything';
  static const neverMovesMoney = 'Plinth never takes or moves your money.';

  // Furnish.
  static const furnishHeading = 'What would it look like furnished?';
  static const furnishBody =
      'Start from the brochure plan, or snap the sample flat on your site visit. '
      'AI furnishes it to scale and never moves a wall or window.';
  static const tryOnYourRoom = 'Try it on your room · beta';

  // Simple view.
  static const simpleViewLabel = 'Simple view';
  static const fullPageLabel = 'Back to the full page';
  static const readAloud = 'Read this aloud';
  static const stopReading = 'Stop reading';
  static const readingLanguage = 'English';

  // Bottom action bar.
  static const follow = 'Follow';
  static const following = 'Following';
  static const ask = 'Ask Plinth';
  static const share = 'Share';

  // Alerts sheet.
  static String alertsHeading(String name) => 'Get alerts for $name?';
  static const turnOnAlerts = 'Turn on alerts';
  static const notNowJustFollow = 'Not now, just follow';
  static const notificationNote = 'Android will ask to allow notifications next. Change this anytime in You › Notifications.';

  // Ask sheet.
  static String askAbout(String name) => 'About $name · answers cite public records';
  static const askDisclaimer =
      'Ask Plinth is an AI. It answers from public records like HARERA and shows its sources. '
      'It can make mistakes, so check them. It doesn’t give legal, tax or investment advice.';
  static String askHint(String name) => 'Ask a question about $name';
  static const wantAPerson = 'Want a person to check?';
  static const talkToAdviser = 'Talk to a Plinth adviser · free · developers never pay us';
  static const adviserHours = 'Mon–Sat, 10 am–7 pm';

  // Footer.
  static const howWeMakeMoney = 'How we make money';
  static const reportError = 'Report an error';

  /// "Tower {code}, slab {slab} of {floors}."
  static String towerSlab(String code, int slab, int floors) => 'Tower $code, slab $slab of $floors';

  /// "This QPR reports Phase 2 as a whole, not by tower." falls back on this
  /// when a quarter carries no note of its own.
  static const phaseWideQuarter = 'This QPR reports the phase as a whole, not by tower.';
}
