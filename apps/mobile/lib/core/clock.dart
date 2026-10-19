import 'package:flutter_riverpod/flutter_riverpod.dart';

/// "Now" for anything that needs it. FIXTURES mode and tests freeze it at
/// 18 Oct 2026, 12:00 IST (`plinthFixedNow`).
///
/// Screens take "today" from a payload's `meta.generated_at`, never from the
/// device (AGENTS.md §1, Clock). This is only for local bookkeeping, such as
/// when an offline action was queued.
final clockProvider = Provider<DateTime Function()>((ref) => DateTime.now);
