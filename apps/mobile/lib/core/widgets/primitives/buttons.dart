import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/glyphs.dart';
import '../foundation/motion.dart';

/// Button tones (DESIGN §0, §4 item 2; app UI v2): one primary action per
/// screen; no outlined buttons, so the secondary is a tone fill.
enum PlinthButtonKind {
  /// Accent fill: the one primary action.
  primary,

  /// A tone fill (`chipFill`) with ink text: Ask Plinth, Copy link, Our
  /// archived copy. It reads as a button on the page, a panel or a band.
  tonal,

  /// Ink fill: a strong secondary ("Check before you pay anything").
  inverse,

  /// An underlined ink link, 48 dp tall.
  tertiary,
}

/// A button named for what it does (app UI v2, benchmark-thapki.md): an
/// optional rounded icon and a label on **one line, always** — the label
/// scales down rather than wrapping, at any width or text size. Radius 16,
/// 56 tall for the primary and inverse (and any [large] button), 48 for
/// tonal, [compact] and tertiary; press feedback on every one.
///
/// [pressed] marks a toggle (Follow / Following): it reads as selected and a
/// pressed primary turns accent-soft.
class PlinthButton extends StatelessWidget {
  const PlinthButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.kind = PlinthButtonKind.primary,
    this.glyph,
    this.icon,
    this.pressed,
    this.compact = false,
    this.large,
    this.expand = false,
    this.chevron = false,
    this.tone,
  });

  final String label;
  final VoidCallback? onPressed;
  final PlinthButtonKind kind;

  /// A kit glyph before the label ([icon] wins when both are set).
  final KitGlyph? glyph;

  /// A Material rounded icon before the label.
  final IconData? icon;
  final bool? pressed;

  /// 48 tall whatever the kind (inside sheets and cards).
  final bool compact;

  /// Forces 56 (true) or 48 (false); null picks by kind.
  final bool? large;

  /// Fill the available width.
  final bool expand;

  /// A trailing chevron: the button opens another screen.
  final bool chevron;

  /// Overrides a tonal button's fill (the action bar raises it on
  /// `segmentOn`).
  final Color? tone;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final on = pressed ?? false;
    final enabled = onPressed != null;
    final (Color bg, Color fg) = switch (kind) {
      PlinthButtonKind.tertiary when !enabled => (Colors.transparent, tokens.disabledFg),
      _ when !enabled => (tokens.disabledBg, tokens.disabledFg),
      PlinthButtonKind.primary => on ? (tokens.accentSoft, tokens.onAccentSoft) : (tokens.accent, tokens.onAccent),
      PlinthButtonKind.tonal => (tone ?? tokens.chipFill, tokens.ink),
      PlinthButtonKind.inverse => (tokens.inverse, tokens.onInverse),
      PlinthButtonKind.tertiary => (Colors.transparent, tokens.ink),
    };
    final tertiary = kind == PlinthButtonKind.tertiary;
    final tall =
        !tertiary && !compact && (large ?? (kind == PlinthButtonKind.primary || kind == PlinthButtonKind.inverse));
    final style = PlinthType.button.copyWith(
      fontWeight: tertiary ? FontWeight.w600 : FontWeight.w700,
      color: fg,
      decoration: tertiary ? TextDecoration.underline : null,
      decorationColor: fg,
    );
    final iconData = icon ?? glyph?.icon;
    final iconSize = tall ? PlinthLayout.iconLg : PlinthLayout.iconMd;
    final content = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (iconData != null) ...[
          ExcludeSemantics(
            child: Icon(iconData, size: iconSize, color: fg),
          ),
          SizedBox(width: tall ? 10 : 8),
        ],
        Text(label, maxLines: 1, softWrap: false, style: style),
        if (chevron) ...[
          const SizedBox(width: 2),
          ExcludeSemantics(
            child: Icon(Icons.chevron_right_rounded, size: PlinthLayout.iconMd, color: fg),
          ),
        ],
      ],
    );
    final shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(PlinthRadius.button));
    final height = tall ? PlinthLayout.buttonApp : PlinthLayout.buttonSecondaryApp;
    final button = Material(
      color: bg,
      shape: shape,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onPressed,
        customBorder: shape,
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: height),
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: tertiary ? 4 : (tall ? 20 : 16), vertical: 8),
            child: Align(
              widthFactor: expand ? null : 1,
              heightFactor: 1,
              // One line, always: a long label at a narrow width or a large
              // text size shrinks to fit instead of wrapping.
              child: FittedBox(fit: BoxFit.scaleDown, child: content),
            ),
          ),
        ),
      ),
    );
    // One node, named by its label, outside the press feedback so a finder
    // for the button lands on it.
    return Semantics(
      container: true,
      button: true,
      enabled: enabled,
      selected: pressed,
      label: label,
      excludeSemantics: true,
      onTap: onPressed,
      child: Pressable(enabled: enabled, child: button),
    );
  }
}

/// A square icon-only button (Share in the action bar): tonal, radius 16,
/// 56 or 48 dp, with [label] as its screen-reader name and tooltip.
class PlinthIconButton extends StatelessWidget {
  const PlinthIconButton({
    super.key,
    required this.icon,
    required this.label,
    required this.onPressed,
    this.size = PlinthLayout.buttonApp,
    this.tone,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onPressed;
  final double size;

  /// The fill; `chipFill` by default.
  final Color? tone;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final enabled = onPressed != null;
    final shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(PlinthRadius.button));
    return Semantics(
      container: true,
      button: true,
      enabled: enabled,
      label: label,
      excludeSemantics: true,
      onTap: onPressed,
      child: Tooltip(
        message: label,
        excludeFromSemantics: true,
        child: Pressable(
          enabled: enabled,
          child: Material(
            color: enabled ? (tone ?? tokens.chipFill) : tokens.disabledBg,
            shape: shape,
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: onPressed,
              customBorder: shape,
              child: SizedBox.square(
                dimension: size,
                child: Icon(icon, size: PlinthLayout.iconLg, color: enabled ? tokens.ink : tokens.disabledFg),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
