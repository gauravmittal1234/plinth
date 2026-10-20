import 'package:plinth_contracts/plinth_contracts.dart' show CostTag, Lane;

/// Layout copy the kit's widgets fall back on (WORK_BREAKDOWN §1 rule 6).
///
/// Risk copy (band names, frequencies, reasons, evidence lines) always comes
/// from the contract payload a widget is given, never from here. What lives
/// here is the artboards' layout copy (AppRisk, AppProject, AppMap): field
/// labels, button names and screen-reader phrasing. Every widget that uses one
/// of these takes a parameter to override it, so a screen can pass its own.
abstract final class KitCopy {
  // Screen-reader phrasing for the risk instruments (DESIGN §3.2: the band is
  // never colour alone). "Delivery risk Elevated, step 3 of 5".
  static const deliveryRisk = 'Delivery risk';
  static const lowConfidence = 'low confidence';
  static const highConfidence = 'high confidence';
  static const setByRule = 'set by a red-flag rule';

  /// "step 3 of 5"
  static String stepOf(int step) => 'step $step of 5';

  /// The band scale as one sentence, e.g. "Delivery risk scale from Low to
  /// Severe. This project: Elevated, step 3 of 5."
  static String bandScale(String first, String last, {String? current, int? step}) {
    final scale = '$deliveryRisk scale from $first to $last.';
    if (current == null || step == null) return scale;
    return '$scale This project: $current, ${stepOf(step)}.';
  }

  /// "Riskometer pointing to Elevated, step 3 of 5, on a scale from Low to Severe."
  static String riskometer(String first, String last, {String? current, int? step}) {
    if (current == null || step == null) return 'Riskometer, on a scale from $first to $last. No band.';
    return 'Riskometer pointing to $current, ${stepOf(step)}, on a scale from $first to $last.';
  }

  // Icon array legend (AppRisk).
  static const iconArrayFilled = 'OC more than 12 months late';
  static const iconArrayEmpty = 'OC within 12 months';

  // Source chips and the evidence sheet (AppRisk).
  static const openEvidence = 'Opens the record';
  static const closeEvidence = 'Close evidence';
  static const evidenceSource = 'Source';
  static const evidenceDates = 'Dates';
  static const evidenceExtract = 'Extract';
  static const evidenceRead = 'How we read it';
  static const evidenceUsedIn = 'Used in';
  static const evidenceDeveloperNote = "Developer's note on this fact";
  static const evidenceNoDeveloperNote = 'None on this fact.';
  static const evidenceCorrections = 'Corrections';
  static const openOriginal = 'Open original';
  static const archivedCopy = 'Our archived copy';
  static const reportError = 'Report an error';
  static const copyCitation = 'Copy citation';
  static const citationCopied = 'Citation copied';

  /// The tone label for a fact's lane (API_CONTRACTS: clients style by lane).
  static String lane(String lane) => switch (lane) {
    Lane.recordsShow => 'Records show',
    Lane.developerSays => 'Developer says',
    Lane.fromDeveloper => 'From the developer · not verified by Plinth',
    Lane.ourEstimate => 'Our estimate',
    Lane.reportedUnverified => 'Reported, not verified',
    Lane.buyerUpload => 'From your upload',
    _ => 'Records show',
  };

  // Cost table (AppProject "What will I really pay?").
  static const allIn = 'All-in';

  /// The note beside a cost line, from its tag.
  static String? costTag(String? tag) => switch (tag) {
    CostTag.oftenNegotiable => 'often negotiable',
    CostTag.setByLaw => 'set by law',
    CostTag.includedInBase => 'in the base',
    CostTag.refundableDeposit => 'refundable deposit',
    _ => null,
  };

  // Replay slider (AppProject "How much is built?").
  static const earlierReport = 'Earlier report';
  static const laterReport = 'Later report';

  /// "Report 8 of 8 shown"
  static String reportOf(int index, int count) => 'Report ${index + 1} of $count shown';

  // Sheets.
  static const close = 'Close';

  // Search field.
  static const clearSearch = 'Clear search';

  /// The project picture's screen-reader name when it carries no caption.
  static const illustrativePicture = 'Illustrative picture';

  /// The results sheet's handle (AppMap): where it is, and what a tap does.
  static const peekHandlePeek = 'Results sheet is collapsed. Tap to open halfway';
  static const peekHandleHalf = 'Results sheet is half open. Tap to open fully';
  static const peekHandleFull = 'Results sheet is fully open. Tap to collapse';
}
