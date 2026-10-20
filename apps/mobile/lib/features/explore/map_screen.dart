import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';

// Owned by T30 (AppMap). Placeholder from T06.

/// The project map: MapLibre, all-in pins and a peek/half/full results sheet.
class MapScreen extends StatelessWidget {
  const MapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ArtboardPlaceholder(title: 'Map', artboard: 'AppMap', task: 'T30', milestone: 'M1');
  }
}
