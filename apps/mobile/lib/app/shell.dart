import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'nav_icons.dart';

/// One tab of the shell, in branch order.
@immutable
class ShellTab {
  const ShellTab(this.label, this.glyph);

  final String label;
  final NavGlyph glyph;
}

/// The 4 tabs (DESIGN §4.16; labels from the phone artboards' navigation bar).
const shellTabs = <ShellTab>[
  ShellTab('Explore', NavGlyph.explore),
  ShellTab('Following', NavGlyph.following),
  ShellTab('Ask Plinth', NavGlyph.ask),
  ShellTab('You', NavGlyph.you),
];

/// The tab shell: each tab keeps its own stack, and a plain 64 dp navigation
/// bar sits at the bottom (no floating pill, no FAB; DESIGN §0, §4.16).
/// Project and check screens open above it, full screen, with their own
/// bottom action bar.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.shell});

  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: shell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: shell.currentIndex,
        // Tapping the open tab again returns it to its first screen.
        onDestinationSelected: (i) => shell.goBranch(i, initialLocation: i == shell.currentIndex),
        destinations: [for (final tab in shellTabs) NavigationDestination(icon: NavIcon(tab.glyph), label: tab.label)],
      ),
    );
  }
}
