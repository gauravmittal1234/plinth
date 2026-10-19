import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';

// Owned by T50 (AppFamily, the relative's opt-in screen). Placeholder from T06.

/// Opened by a family invite link (`plinth.in/j/<code>`).
class FamilyJoinScreen extends StatelessWidget {
  const FamilyJoinScreen({super.key, required this.code});

  final String code;

  @override
  Widget build(BuildContext context) {
    return ArtboardPlaceholder(
      title: 'Family invite',
      artboard: 'AppFamily',
      task: 'T50',
      milestone: 'M2',
      details: {'code': code},
    );
  }
}
