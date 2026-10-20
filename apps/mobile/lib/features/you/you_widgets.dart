import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../core/widgets/widgets.dart';

// Small shared pieces for AppYou and its Privacy screen (T51), built from
// the app UI v2 kit (cards, list rows, icon tiles).

/// A rounded content card (app UI v2: radius 20 on `panel`, no border, no
/// resting shadow).
class YouPanel extends StatelessWidget {
  const YouPanel({super.key, required this.children, this.gap = PlinthSpace.s12, this.tone});

  final List<Widget> children;
  final double gap;

  /// The fill; `panel` by default.
  final Color? tone;

  @override
  Widget build(BuildContext context) {
    return PlinthCard(
      tone: tone,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < children.length; i++) ...[if (i > 0) SizedBox(height: gap), children[i]],
        ],
      ),
    );
  }
}

/// A screen section on AppYou and Privacy: a `section` heading (a buyer
/// question), an optional quiet line under it, then its content, with the
/// app's 32 dp section gap above.
class YouSection extends StatelessWidget {
  const YouSection({super.key, required this.title, this.subtitle, required this.child});

  final String title;
  final String? subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: PlinthLayout.sectionGapAppMin),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          PlinthSectionHeading(title, subtitle: subtitle),
          const SizedBox(height: PlinthSpace.s12),
          child,
        ],
      ),
    );
  }
}

/// One preference row: an icon tile, a title, an optional sub-line, and a
/// switch (app UI v2 list row). Disabled rows still answer a tap, with
/// [onBlocked] explaining why instead of silently doing nothing (AppYou's own
/// "turn on WhatsApp first" note).
class YouToggleRow extends StatelessWidget {
  const YouToggleRow({
    super.key,
    required this.title,
    required this.value,
    required this.onChanged,
    this.icon,
    this.subtitle,
    this.enabled = true,
    this.onBlocked,
  });

  final String title;
  final String? subtitle;
  final IconData? icon;
  final bool value;
  final bool enabled;
  final ValueChanged<bool> onChanged;
  final VoidCallback? onBlocked;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return PlinthListRow(
      title: title,
      subtitle: subtitle,
      enabled: enabled,
      toggled: value,
      leading: icon == null ? null : PlinthIconTile(icon: icon!, tone: tokens.track),
      onTap: enabled ? () => onChanged(!value) : onBlocked,
      trailing: IgnorePointer(
        child: Switch(
          value: value,
          onChanged: enabled ? (_) {} : null,
          activeThumbColor: tokens.onAccent,
          activeTrackColor: tokens.accent,
          inactiveTrackColor: tokens.track,
        ),
      ),
    );
  }
}
