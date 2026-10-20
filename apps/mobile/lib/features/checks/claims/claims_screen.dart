import 'package:flutter/material.dart';

import '../../../app/artboard_placeholder.dart';
import '../../../app/routes.dart';

// AppClaims. Placeholder from T06 until M3.

/// Check a developer's claims: paste, share or photograph a flyer.
class ClaimsScreen extends StatelessWidget {
  const ClaimsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ArtboardPlaceholder(
      title: 'Check claims',
      artboard: 'AppClaims',
      milestone: 'M3',
      links: [PlaceholderLink('A checked claim', Routes.claimOf('example'))],
    );
  }
}
