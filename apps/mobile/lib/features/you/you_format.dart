import 'package:intl/intl.dart';

// Formatting for AppYou and its Privacy screen (T51). Every value formatted
// here comes from a payload field; this file only changes how it is written,
// never what it says (DESIGN §0's house date style, "14 Oct 2026").

/// An ISO date or timestamp → "14 Oct 2026". Falls back to the raw string
/// when it doesn't parse.
String formatDisplayDate(String iso) {
  final parsed = DateTime.tryParse(iso.length > 10 ? iso : '${iso}T00:00:00+05:30');
  return parsed == null ? iso : DateFormat('d MMM yyyy').format(parsed);
}

/// "22:00" → "10 pm" (`AlertPrefsMap.quietHours`'s own IST clock values).
String friendlyTime(String hhmm) {
  final parts = hhmm.split(':');
  if (parts.length != 2) return hhmm;
  final hour = int.tryParse(parts[0]);
  final minute = int.tryParse(parts[1]);
  if (hour == null || minute == null) return hhmm;
  final dt = DateTime(2000, 1, 1, hour, minute);
  return DateFormat('h a').format(dt).toLowerCase();
}

/// `ChannelPrefs.digest`'s code, in words. Unknown codes are shown as given,
/// never dropped (so a new digest cadence from the server still reads).
String digestLabel(String code) => switch (code) {
  'weekly_sun_9am' => 'Sundays at 9 am',
  _ => code,
};
