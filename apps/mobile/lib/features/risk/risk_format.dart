import 'package:intl/intl.dart';

/// "14 Oct 2026" from an ISO date (`RiskMeta.data_as_of`); DESIGN §0's house
/// date style. Falls back to the raw string when it doesn't parse.
String formatDisplayDate(String isoDate) {
  final parsed = DateTime.tryParse(isoDate);
  return parsed == null ? isoDate : DateFormat('d MMM yyyy').format(parsed);
}
