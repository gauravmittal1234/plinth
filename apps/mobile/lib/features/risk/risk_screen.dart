import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';

// Owned by T32 (AppRisk). Placeholder from T06.

/// The delivery-risk detail: dial or 100 projects, reasons with evidence,
/// what would change it, Developer says.
class RiskScreen extends StatelessWidget {
  const RiskScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context) {
    return ArtboardPlaceholder(
      title: 'Delivery risk',
      artboard: 'AppRisk',
      task: 'T32',
      milestone: 'M1',
      details: {'slug': slug},
    );
  }
}
