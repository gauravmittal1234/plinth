import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tts/flutter_tts.dart';

/// Speaks one block of text at a time for the Simple view's "Read this
/// aloud" (English only in R1; `ProjectCopy.readingLanguage`). [speak]
/// resolves once that block has finished speaking, so the caller can step to
/// the next one; [stop] cancels mid-sentence.
abstract interface class ProjectTts {
  Future<void> speak(String text);
  Future<void> stop();
}

class FlutterProjectTts implements ProjectTts {
  final FlutterTts _tts = FlutterTts();
  bool _ready = false;

  Future<void> _ensureReady() async {
    if (_ready) return;
    _ready = true;
    await _tts.awaitSpeakCompletion(true);
    await _tts.setLanguage('en-IN');
  }

  @override
  Future<void> speak(String text) async {
    await _ensureReady();
    await _tts.speak(text);
  }

  @override
  Future<void> stop() => _tts.stop();
}

final projectTtsProvider = Provider<ProjectTts>((ref) => FlutterProjectTts());
