import 'dart:async';

import 'package:plinth/features/project/simple/project_tts.dart';

/// A fake "Read this aloud" voice: [speak] never touches a platform channel.
/// Each call is recorded and stays pending until the test calls
/// [resolveNext], so a test can step through the Simple view's blocks one at
/// a time and assert what is highlighted in between.
class FakeProjectTts implements ProjectTts {
  final List<String> spoken = [];
  final List<Completer<void>> _pending = [];
  bool stopped = false;

  @override
  Future<void> speak(String text) {
    spoken.add(text);
    final completer = Completer<void>();
    _pending.add(completer);
    return completer.future;
  }

  @override
  Future<void> stop() async {
    stopped = true;
    for (final c in _pending) {
      if (!c.isCompleted) c.complete();
    }
    _pending.clear();
  }

  /// Finishes the oldest still-speaking block, letting the reader step on.
  void resolveNext() {
    final completer = _pending.removeAt(0);
    if (!completer.isCompleted) completer.complete();
  }
}
