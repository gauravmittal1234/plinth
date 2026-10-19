import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';

// AppVisitPass. Placeholder from T06 until M5.

/// A site-visit pass.
class VisitPassScreen extends StatelessWidget {
  const VisitPassScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    return ArtboardPlaceholder(title: 'Visit pass', artboard: 'AppVisitPass', milestone: 'M5', details: {'id': id});
  }
}
