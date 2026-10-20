/// Layout copy for AppProjectStates (WORK_BREAKDOWN T31b; AGENTS.md §5):
/// the artboard's extra headings and the generic buyer-rights explainer.
///
/// Band, reason, confidence and fact copy for each state still comes from
/// the loaded `ProjectPage`/`RiskClass`, exactly as on AppProject (T31a) —
/// nothing in this file is composed from a project's own facts. The RERA
/// section references below are the statute, not a project fact, so they
/// read the same for every state.
///
/// `python3 scripts/artboard_text.py product/design/artboards/AppProjectStates.dc.html`
/// prints the source copy this mirrors.
abstract final class ProjectStatesCopy {
  // The red-flag rule card (shown when `RiskClass.band.rule` is set).
  static String redFlagRuleHeading(int? n) => n == null ? 'Red-flag rule' : 'Red-flag rule $n';

  /// Rewords the artboard's own explainer ("...we show no frequency of
  /// 100...") so the page never prints "of 100" on a rule-set band
  /// (WORK_BREAKDOWN T20c's accept line, mirrored here).
  static const redFlagExplainer =
      "When a rule sets the band, we don't show a similar-projects frequency: "
      'the rule itself is the reason. It is one of four published rules.';

  // Records, the age list and the re-scoring note.
  static const theRecords = 'The records, as they stand';
  static const howOldIsEachRecord = 'How old is each record?';

  static String staleLine(int days) =>
      'The line marks $days days. Past it, a record is stale and we say so on the band.';

  static String daysOld(int days) => '$days days old';
  static const staleTag = 'stale';

  // "Already booked here?" (the artboard's own heading already lives on
  // `ProjectCopy.alreadyBooked`, set by T31a for this task to reuse).
  static const alreadyBookedIntro =
      "Booking here doesn't leave you without routes. These are the rights every "
      'allottee has, and the records we would keep watching.';
  static const moneyBackHeading = 'Your money back, or interest';
  static const moneyBackBody =
      'RERA s.18: when possession is late against your agreement, you can withdraw '
      'and get your money back with interest, or stay and get interest for every '
      'month of delay.';
  static const buyersTogetherHeading = 'Buyers acting together';
  static const buyersTogetherBody =
      'RERA s.31 lets an association of allottees file a complaint. A buyers’ '
      'group also hears early about site and payment news.';
  static const iveBooked = "I've booked here";
  static const bookedHere = 'Booked here';
  static const bookedChip = 'Booked here · alerts for allottees';
  static const bookedNote =
      'Tell us you booked and alerts change: each one says what it means for an '
      'allottee. Only you see it.';
  static const beforeYouPayCta = "Haven't paid yet? Run the before-you-pay check";
  static const couldNotUpdateBooked = 'Could not update. Try again.';

  /// `RiskClass.display.overlays` entries ([c.Overlay]) as a short flag label.
  static String overlayLabel(String overlay) => switch (overlay) {
    'stalled' => 'Stall flag',
    'stale' => 'Stale data',
    'rescoring' => 'Re-scoring',
    'pending_change' => 'Pending change',
    _ => overlay,
  };
}
