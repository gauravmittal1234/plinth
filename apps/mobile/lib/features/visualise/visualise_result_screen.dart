import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';

// AppVisualiseResult. Placeholder from T06 until M5.

/// The before/after compare, labelled as an AI illustration.
class VisualiseResultScreen extends StatelessWidget {
  const VisualiseResultScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    return ArtboardPlaceholder(
      title: 'Furnished picture',
      artboard: 'AppVisualiseResult',
      milestone: 'M5',
      details: {'id': id},
    );
  }
}
