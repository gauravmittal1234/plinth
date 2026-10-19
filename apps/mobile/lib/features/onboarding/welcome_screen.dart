import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';

// Owned by T48 (AppOnboarding). Placeholder from T06.

/// The first run: the card builds, what you're buying, location, sign in,
/// code, first follow, alerts, done.
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ArtboardPlaceholder(title: 'Welcome', artboard: 'AppOnboarding', task: 'T48', milestone: 'M2');
  }
}
