import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

/// One tab of the shell, in branch order, with its Material rounded icon.
@immutable
class ShellTab {
  const ShellTab(this.label, this.icon);

  final String label;
  final IconData icon;
}

/// The 4 tabs (DESIGN §4.16; labels from the phone artboards' navigation bar).
const shellTabs = <ShellTab>[
  ShellTab('Explore', Icons.explore_rounded),
  ShellTab('Following', Icons.bookmark_rounded),
  ShellTab('Ask Plinth', Icons.auto_awesome_rounded),
  ShellTab('You', Icons.person_rounded),
];

/// The tab shell: each tab keeps its own stack, and a floating, rounded
/// 72 dp navigation bar sits at the bottom (app UI v2, benchmark-thapki.md):
/// 16 dp from the edges, radius 28, on the `nav` tone with no shadow or
/// hairline (DESIGN §0). The selected tab's icon sits on the indicator.
/// Project and check screens open above it, full screen, with their own
/// bottom action bar.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.shell});

  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Scaffold(
      body: shell,
      bottomNavigationBar: ColoredBox(
        color: tokens.bg,
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              PlinthLayout.navFloatingMargin,
              PlinthSpace.s8,
              PlinthLayout.navFloatingMargin,
              PlinthLayout.navFloatingMargin,
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(28),
              // The bar's own SafeArea would pad inside the pill; the outer
              // one already keeps it clear of the system navigation bar.
              child: MediaQuery.removePadding(
                context: context,
                removeBottom: true,
                child: NavigationBar(
                  selectedIndex: shell.currentIndex,
                  // Tapping the open tab again returns it to its first screen.
                  onDestinationSelected: (i) => shell.goBranch(i, initialLocation: i == shell.currentIndex),
                  destinations: [
                    for (final tab in shellTabs) NavigationDestination(icon: Icon(tab.icon), label: tab.label),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
