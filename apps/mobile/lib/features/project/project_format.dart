import 'package:intl/intl.dart';

/// `₹4,50,000`: the Indian digit grouping the contract itself uses for exact
/// amounts (`afford_default.answer_line`'s "₹1,18,077"). Only for the two
/// plain rupee figures the contract gives as raw numbers
/// (`wait_defaults.take_home_inr`, `.rent_inr`); every other amount in
/// `ProjectPage`/`RiskSummary` already arrives as a formatted label.
String formatInrExact(int amountInr) => '₹${NumberFormat('#,##,###', 'en_IN').format(amountInr)}';

/// "14 Oct 2026" from an ISO date (`RiskMeta.data_as_of` and the like);
/// DESIGN §0's house date style. Falls back to the raw string when it
/// doesn't parse as a date (a year-month such as "2027-12" is formatted by
/// the server already, never here).
String formatDisplayDate(String isoDate) {
  final parsed = DateTime.tryParse(isoDate);
  return parsed == null ? isoDate : DateFormat('d MMM yyyy').format(parsed);
}

/// "Dec 2027" from a `YearMonth` ("2027-12", `Late12.original_completion`
/// and `.late_after`).
String formatYearMonth(String yearMonth) {
  final parsed = DateTime.tryParse('$yearMonth-01');
  return parsed == null ? yearMonth : DateFormat('MMM yyyy').format(parsed);
}
