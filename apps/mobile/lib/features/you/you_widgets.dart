import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

// Small shared pieces for AppYou and its Privacy screen (T51): neither is in
// `core/widgets` (T15's kit) yet, so they stay local to this feature.

/// A rounded content card on a section band (DESIGN §0: panels ≤ 8 radius,
/// no resting shadow).
class YouPanel extends StatelessWidget {
  const YouPanel({super.key, required this.children, this.gap = PlinthSpace.s12});

  final List<Widget> children;
  final double gap;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Container(
      padding: const EdgeInsets.all(PlinthSpace.s20),
      decoration: BoxDecoration(color: tokens.panel, borderRadius: BorderRadius.circular(PlinthRadius.panel)),
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

/// One preference row: a title, an optional sub-line, and a switch. Disabled
/// rows still answer a tap, with [onBlocked] explaining why instead of
/// silently doing nothing (AppYou's own "turn on WhatsApp first" note).
class YouToggleRow extends StatelessWidget {
  const YouToggleRow({
    super.key,
    required this.title,
    required this.value,
    required this.onChanged,
    this.subtitle,
    this.enabled = true,
    this.onBlocked,
  });

  final String title;
  final String? subtitle;
  final bool value;
  final bool enabled;
  final ValueChanged<bool> onChanged;
  final VoidCallback? onBlocked;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final fg = enabled ? tokens.ink : tokens.muted;
    return Semantics(
      container: true,
      toggled: value,
      label: title,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: enabled ? () => onChanged(!value) : onBlocked,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: PlinthType.body.copyWith(fontWeight: FontWeight.w600, color: fg),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(subtitle!, style: PlinthType.small.copyWith(color: enabled ? tokens.ink2 : tokens.muted)),
                  ],
                ],
              ),
            ),
            const SizedBox(width: PlinthSpace.s12),
            IgnorePointer(
              child: Switch(
                value: value,
                onChanged: (_) {},
                activeThumbColor: tokens.onAccent,
                activeTrackColor: tokens.accent,
                inactiveTrackColor: tokens.track,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
