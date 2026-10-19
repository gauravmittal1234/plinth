import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'routes.dart';

/// Shown for a link the app has no screen for, such as a web page that has no
/// app version yet. It names the link and offers a way back to Explore.
class NotFoundScreen extends StatelessWidget {
  const NotFoundScreen({super.key, required this.location});

  final String location;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        top: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            Text('This page isn\'t in the app yet', style: text.headlineLarge),
            const SizedBox(height: 12),
            Text('We couldn\'t open $location here.', style: text.bodyMedium),
            const SizedBox(height: 24),
            Align(
              alignment: Alignment.centerLeft,
              child: FilledButton(onPressed: () => context.go(Routes.explore), child: const Text('Open Explore')),
            ),
          ],
        ),
      ),
    );
  }
}
