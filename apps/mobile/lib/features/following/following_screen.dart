import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';
import '../../app/routes.dart';

// Owned by T50 (AppFollowing). Placeholder from T06.

/// Tab 2: what changed in the projects you follow.
class FollowingScreen extends StatelessWidget {
  const FollowingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ArtboardPlaceholder(
      title: 'Following',
      artboard: 'AppFollowing',
      task: 'T50',
      milestone: 'M2',
      links: [
        const PlaceholderLink('Your family circle', Routes.family),
        PlaceholderLink('A family invite', Routes.familyJoinOf('AH2-7KQ')),
      ],
    );
  }
}
