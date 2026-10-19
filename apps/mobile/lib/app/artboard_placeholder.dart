import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'theme_mode.dart';

/// A link from a placeholder to a screen it will lead to, so the skeleton can
/// be walked on a phone before the screens exist.
@immutable
class PlaceholderLink {
  const PlaceholderLink(this.label, this.location);

  final String label;
  final String location;
}

/// The stand-in every route renders until its task builds the real screen
/// (WORK_BREAKDOWN §1 rule 4, "Stubs, then fill"). It names the artboard in
/// `product/design/artboards/` and the task that replaces it.
///
/// Feature tasks delete their use of this widget; nothing else depends on it.
class ArtboardPlaceholder extends ConsumerWidget {
  const ArtboardPlaceholder({
    super.key,
    required this.title,
    required this.artboard,
    required this.milestone,
    this.task,
    this.details = const {},
    this.links = const [],
  });

  /// The screen's name, as a person would say it ("Explore").
  final String title;

  /// The artboard file name without `.dc.html` ("AppExplore").
  final String artboard;

  /// When it ships ("M1").
  final String milestone;

  /// The WORK_BREAKDOWN task that builds it, when one is assigned ("T30").
  final String? task;

  /// Route values worth showing (slug, code, id, state).
  final Map<String, String> details;

  final List<PlaceholderLink> links;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final text = theme.textTheme;
    final night = ref.watch(themeModeProvider) == ThemeMode.dark;
    final location = _locationOf(context);
    final builtBy = task == null ? 'This screen arrives in $milestone.' : '$task builds this screen in $milestone.';
    final rows = {'Path': ?location, ...details};

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(
            tooltip: night ? 'Switch to Day theme' : 'Switch to Night theme',
            icon: Icon(night ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
            onPressed: ref.read(themeModeProvider.notifier).toggle,
          ),
        ],
      ),
      body: SafeArea(
        top: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            Text(title, style: text.headlineLarge),
            const SizedBox(height: 8),
            Text(artboard, style: text.titleMedium),
            const SizedBox(height: 4),
            Text('Placeholder. $builtBy', style: text.bodyMedium),
            if (rows.isNotEmpty) ...[
              const SizedBox(height: 24),
              DecoratedBox(
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (final MapEntry(:key, :value) in rows.entries)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Text.rich(
                            TextSpan(
                              children: [
                                TextSpan(text: '$key  ', style: text.bodySmall),
                                TextSpan(text: value, style: text.bodyMedium),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
            if (links.isNotEmpty) ...[
              const SizedBox(height: 32),
              Text('Screens from here', style: text.titleLarge),
              const SizedBox(height: 8),
              for (final link in links)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(link.label),
                  subtitle: Text(link.location, style: text.bodySmall),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push(link.location),
                ),
            ],
          ],
        ),
      ),
    );
  }

  /// The location this placeholder was opened at, when it sits under go_router.
  static String? _locationOf(BuildContext context) {
    try {
      return GoRouterState.of(context).uri.toString();
    } on GoError {
      return null;
    }
  }
}
