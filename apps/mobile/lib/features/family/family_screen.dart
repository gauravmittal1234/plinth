import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';

// Owned by T50 (AppFamily). Placeholder from T06.

/// Your circle: invite family on WhatsApp, see who follows with you, remove.
class FamilyScreen extends StatelessWidget {
  const FamilyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ArtboardPlaceholder(title: 'Family', artboard: 'AppFamily', task: 'T50', milestone: 'M2');
  }
}
