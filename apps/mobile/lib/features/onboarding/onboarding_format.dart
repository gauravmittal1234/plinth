import 'package:intl/intl.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show CoverageNext;

// Formatting for AppOnboarding (T48). Every value formatted here comes from
// a payload field; this file only changes how it is written, never what it
// says (DESIGN §0's house date style, "14 Oct 2026").

/// An ISO date or timestamp → "14 Oct 2026". Falls back to the raw string
/// when it doesn't parse.
String formatDisplayDate(String iso) {
  final parsed = DateTime.tryParse(iso.length > 10 ? iso : '${iso}T00:00:00+05:30');
  return parsed == null ? iso : DateFormat('d MMM yyyy').format(parsed);
}

/// The `about().coverage.next` entry named [name], or null when [next] is
/// null (`about()` hasn't loaded or failed) or simply doesn't list it yet.
/// `CoverageNext` carries no other key (API_CONTRACTS §3.1: `name`,
/// `when_line`, `notify` only), so the server's own name is the only way to
/// find "the Golf Course Ext Rd row" or "the resale row" — callers hide the
/// fact-bearing copy entirely when this returns null, rather than guess a
/// date or a "coming soon" line (AGENTS.md rule 10).
CoverageNext? coverageNextByName(List<CoverageNext>? next, String name) {
  if (next == null) return null;
  for (final item in next) {
    if (item.name == name) return item;
  }
  return null;
}
