import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';
import '../../app/routes.dart';

// Owned by T51 (AppYou). Placeholder from T06.

/// Tab 4: alerts, privacy and the account.
class YouScreen extends StatelessWidget {
  const YouScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ArtboardPlaceholder(
      title: 'You',
      artboard: 'AppYou',
      task: 'T51',
      milestone: 'M2',
      links: [PlaceholderLink('Privacy', Routes.privacy)],
    );
  }
}
