import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/motion.dart';

/// A filled choice or filter pill (DESIGN §0: filled, never outlined): 40 tall
/// in a 48 dp target, `track` at rest and `inverse` when [selected]. Reads
/// as a selected button to screen readers.
class PlinthPill extends StatelessWidget {
  const PlinthPill({
    super.key,
    required this.label,
    required this.onPressed,
    this.selected = false,
    this.onSolid = false,
    this.leading,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool selected;

  /// On a `track` band the resting pill is `bgSolid` instead.
  final bool onSolid;
  final Widget? leading;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final bg = selected ? tokens.inverse : (onSolid ? tokens.bgSolid : tokens.track);
    final fg = selected ? tokens.onInverse : tokens.ink;
    return Semantics(
      container: true,
      button: true,
      selected: selected,
      enabled: onPressed != null,
      label: label,
      excludeSemantics: true,
      onTap: onPressed,
      child: Pressable(
        enabled: onPressed != null,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onPressed,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: PlinthLayout.touchApp),
            child: Align(
              widthFactor: 1,
              heightFactor: 1,
              child: AnimatedContainer(
                duration: KitMotion.of(context, PlinthMotion.fade),
                constraints: const BoxConstraints(minHeight: 40),
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(PlinthRadius.pill)),
                child: Text.rich(
                  TextSpan(
                    children: [
                      if (leading != null) ...[
                        WidgetSpan(alignment: PlaceholderAlignment.middle, child: leading!),
                        const WidgetSpan(child: SizedBox(width: 6)),
                      ],
                      TextSpan(text: label),
                    ],
                  ),
                  style: PlinthType.body.copyWith(fontSize: 15, fontWeight: FontWeight.w600, height: 1.6, color: fg),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// One option of a [PlinthSegmented].
@immutable
class SegmentOption<T> {
  const SegmentOption(this.value, this.label);

  final T value;
  final String label;
}

/// A segmented control on a `track` pill (AppProject "Dial / 100 projects"):
/// equal options 48 tall, the chosen one on `segmentOn`. Each option reads
/// as a selected or unselected button.
class PlinthSegmented<T> extends StatelessWidget {
  const PlinthSegmented({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
    this.semanticLabel,
  });

  final List<SegmentOption<T>> options;
  final T value;
  final ValueChanged<T> onChanged;

  /// Names the group ("Risk view").
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Semantics(
      container: true,
      label: semanticLabel,
      child: DecoratedBox(
        decoration: BoxDecoration(color: tokens.track, borderRadius: BorderRadius.circular(PlinthRadius.pill)),
        child: Padding(
          padding: const EdgeInsets.all(4),
          child: Row(
            children: [
              for (final o in options)
                Expanded(
                  child: _Segment(
                    label: o.label,
                    selected: o.value == value,
                    onPressed: () => onChanged(o.value),
                    tokens: tokens,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Segment extends StatelessWidget {
  const _Segment({required this.label, required this.selected, required this.onPressed, required this.tokens});

  final String label;
  final bool selected;
  final VoidCallback onPressed;
  final PlinthTokens tokens;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      button: true,
      selected: selected,
      label: label,
      excludeSemantics: true,
      onTap: onPressed,
      child: Pressable(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onPressed,
          child: AnimatedContainer(
            duration: KitMotion.of(context, PlinthMotion.fade),
            constraints: const BoxConstraints(minHeight: PlinthLayout.touchApp),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: selected ? tokens.segmentOn : tokens.segmentOn.withValues(alpha: 0),
              borderRadius: BorderRadius.circular(PlinthRadius.pill),
            ),
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: PlinthType.body.copyWith(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                height: 1.3,
                color: tokens.ink,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
