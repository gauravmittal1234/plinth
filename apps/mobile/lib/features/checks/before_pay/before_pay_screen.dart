import 'package:flutter/material.dart';

import '../../../app/artboard_placeholder.dart';

// AppBeforePay. Placeholder from T06 until M3.

/// Before you pay: the payee and the 10% cap, checked against records.
class BeforePayScreen extends StatelessWidget {
  const BeforePayScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ArtboardPlaceholder(title: 'Before you pay', artboard: 'AppBeforePay', milestone: 'M3');
  }
}
