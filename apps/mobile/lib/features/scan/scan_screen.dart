import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';

// AppScan. Placeholder from T06 until M5.

/// Scan RERA QR, Where am I? and Check claims.
class ScanScreen extends StatelessWidget {
  const ScanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ArtboardPlaceholder(title: 'Scan', artboard: 'AppScan', milestone: 'M5');
  }
}
