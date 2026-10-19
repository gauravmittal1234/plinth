import 'package:flutter/material.dart';

import '../../../app/artboard_placeholder.dart';

// AppClaims (one check). Placeholder from T06 until M3.

/// One claims check and its verdicts.
class ClaimScreen extends StatelessWidget {
  const ClaimScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    return ArtboardPlaceholder(title: 'Claims check', artboard: 'AppClaims', milestone: 'M3', details: {'id': id});
  }
}
