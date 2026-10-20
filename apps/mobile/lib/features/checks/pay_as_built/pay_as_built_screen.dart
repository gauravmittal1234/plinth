import 'package:flutter/material.dart';

import '../../../app/artboard_placeholder.dart';

// AppPayAsBuilt. Placeholder from T06 until M3.

/// Pay as built: each demand checked against what is on record as built.
class PayAsBuiltScreen extends StatelessWidget {
  const PayAsBuiltScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ArtboardPlaceholder(title: 'Pay as built', artboard: 'AppPayAsBuilt', milestone: 'M3');
  }
}
