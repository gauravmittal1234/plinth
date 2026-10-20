import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/motion.dart';

/// A filled choice or filter chip (DESIGN §0: filled, never outlined; app UI
/// v2): 40 tall in a 48 dp target, one line, `track` at rest and `inverse`
/// when [selected]. Reads as a selected button to screen readers. Put a row
/// of them in a [PlinthChipRow] so they scroll instead of wrapping.
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
                constraints: const BoxConstraints(minHeight: PlinthLayout.chipApp),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                alignment: Alignment.center,
                decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(PlinthRadius.pill)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (leading != null) ...[
                      IconTheme.merge(
                        data: IconThemeData(color: fg, size: PlinthLayout.iconMd),
                        child: leading!,
                      ),
                      const SizedBox(width: 6),
                    ],
                    Text(
                      label,
                      maxLines: 1,
                      softWrap: false,
                      style: PlinthType.meta.copyWith(
                        fontSize: 15,
                        height: 20 / 15,
                        fontWeight: FontWeight.w600,
                        color: fg,
                      ),
                    ),
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

/// A single row of [PlinthPill]s that scrolls sideways instead of wrapping
/// (app UI v2). [padding] lets the row run to the screen edges while the
/// first chip lines up with the gutter.
class PlinthChipRow extends StatelessWidget {
  const PlinthChipRow({super.key, required this.children, this.padding = EdgeInsets.zero});

  final List<Widget> children;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: padding,
      child: Row(
        children: [
          for (var i = 0; i < children.length; i++) ...[if (i > 0) const SizedBox(width: PlinthSpace.s8), children[i]],
        ],
      ),
    );
  }
}

/// One option of a [PlinthSegmented], with an optional rounded icon.
@immutable
class SegmentOption<T> {
  const SegmentOption(this.value, this.label, {this.icon});

  final T value;
  final String label;
  final IconData? icon;
}

/// A segmented control on a `track` field (AppProject "Dial / 100 projects",
/// You's Day / Night): radius 16, equal options 48 tall, the chosen one on
/// `segmentOn`. Each option reads as a selected or unselected button.
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
        decoration: BoxDecoration(color: tokens.track, borderRadius: BorderRadius.circular(PlinthRadius.button)),
        child: Padding(
          padding: const EdgeInsets.all(4),
          child: Row(
            children: [
              for (final o in options)
                Expanded(
                  child: _Segment(
                    label: o.label,
                    icon: o.icon,
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
  const _Segment({
    required this.label,
    required this.selected,
    required this.onPressed,
    required this.tokens,
    this.icon,
  });

  final String label;
  final IconData? icon;
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
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: selected ? tokens.segmentOn : tokens.segmentOn.withValues(alpha: 0),
              borderRadius: BorderRadius.circular(PlinthRadius.tile),
            ),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: PlinthLayout.iconMd, color: selected ? tokens.ink : tokens.ink2),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    label,
                    maxLines: 1,
                    softWrap: false,
                    style: PlinthType.button.copyWith(
                      fontSize: 15,
                      height: 20 / 15,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
                      color: selected ? tokens.ink : tokens.ink2,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
