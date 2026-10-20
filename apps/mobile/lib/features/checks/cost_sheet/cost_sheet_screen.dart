import 'package:flutter/material.dart';

import '../../../app/artboard_placeholder.dart';

// AppCostSheet. Placeholder from T06 until M3.

/// Check a cost sheet: the all-in price, line by line.
class CostSheetScreen extends StatelessWidget {
  const CostSheetScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ArtboardPlaceholder(title: 'Cost sheet', artboard: 'AppCostSheet', milestone: 'M3');
  }
}
