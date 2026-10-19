import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';

// Owned by T51 (AppYou, privacy). Placeholder from T06.

/// Who has my number, consent history, download my data, delete account.
/// Needs a session: signed out, the router opens the You tab's sign-in sheet.
class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ArtboardPlaceholder(title: 'Privacy', artboard: 'AppYou', task: 'T51', milestone: 'M2');
  }
}
