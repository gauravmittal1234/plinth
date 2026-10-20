import 'package:intl/intl.dart';

// Formatting for AppOnboarding (T48). Every value formatted here comes from
// a payload field; this file only changes how it is written, never what it
// says (DESIGN §0's house date style, "14 Oct 2026").

/// An ISO date or timestamp → "14 Oct 2026". Falls back to the raw string
/// when it doesn't parse.
String formatDisplayDate(String iso) {
  final parsed = DateTime.tryParse(iso.length > 10 ? iso : '${iso}T00:00:00+05:30');
  return parsed == null ? iso : DateFormat('d MMM yyyy').format(parsed);
}
