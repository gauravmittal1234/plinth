/// Layout copy for AppRisk (WORK_BREAKDOWN T32; AppRisk.dc.html). Risk copy
/// itself — the band name, frequency sentence, reasons, developer's words,
/// the pending fact, next steps — always comes from `RiskClass`/`NextSteps`/
/// `PreRera` (API_CONTRACTS §2, §4.2); nothing here names a fact.
abstract final class RiskCopy {
  static const willItBeOnTime = 'Will it be delivered on time?';
  static const deliveryRiskOurOpinion = 'Delivery risk, our opinion.';
  static const howOftenLate = 'How often are projects like this late?';
  static const dial = 'Dial';
  static const of100Projects = '100 projects';
  static const riskView = 'Risk view';

  /// "Why Elevated?"
  static String whyBand(String bandLabel) => 'Why $bandLabel?';
  static const reasonsIntro =
      '4 reasons, strongest first. Each one is a line in a public record; tap a source to read it.';
  static const whatWouldChangeHeading = 'What would change this?';

  static const beforeRera = 'Before RERA · from court orders and news';
  static const soWhatNow = 'So what do we do now?';
  static const forScale = 'For scale';

  static const shareRiskCard = 'Share risk card';
  static const howWeMakeMoney = 'How we make money';

  /// "Data as of 14 Oct 2026 · model v1.2"
  static String dataAsOf(String date, String modelVersion) => 'Data as of $date · model $modelVersion';

  static const couldNotLoad = 'This risk page could not be loaded.';
  static const tryAgain = 'Try again';
}
