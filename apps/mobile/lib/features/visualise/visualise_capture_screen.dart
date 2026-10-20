import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';
import '../../app/routes.dart';

// AppVisualiseCapture. Placeholder from T06 until M5.

/// Picture it furnished: photograph a bare room.
class VisualiseCaptureScreen extends StatelessWidget {
  const VisualiseCaptureScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ArtboardPlaceholder(
      title: 'Picture it furnished',
      artboard: 'AppVisualiseCapture',
      milestone: 'M5',
      links: [PlaceholderLink('A furnished picture', Routes.visualiseResultOf('example'))],
    );
  }
}
