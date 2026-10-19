import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';

// AppVoice (Ask Plinth). Placeholder from T06 until M5.

/// Tab 3: ask about any project by voice or text; answers cite public records.
class AskScreen extends StatelessWidget {
  const AskScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ArtboardPlaceholder(title: 'Ask Plinth', artboard: 'AppVoice', milestone: 'M5');
  }
}
