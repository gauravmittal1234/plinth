import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/glyphs.dart';
import '../foundation/motion.dart';

/// Button tones (DESIGN §0, §4 item 2): one primary action per screen; no
/// outlined buttons, so the secondary is a tone fill.
enum PlinthButtonKind {
  /// Accent fill: the one primary action.
  primary,

  /// `track` fill with ink text: Ask Plinth, Copy link, Our archived copy.
  tonal,

  /// Ink fill: a strong secondary ("Check before you pay anything").
  inverse,

  /// An underlined ink link, 48 dp tall.
  tertiary,
}

/// A pill button named for what it does. 52 tall (48 for [compact] and
/// tertiary), press feedback, and a label that wraps at large text sizes.
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
    this.pressed,
    this.compact = false,
    this.expand = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final PlinthButtonKind kind;
  final KitGlyph? glyph;
  final bool? pressed;

  /// 48 tall instead of 52 (inside sheets).
  final bool compact;

  /// Fill the available width.
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final on = pressed ?? false;
    final enabled = onPressed != null;
    final (Color bg, Color fg) = switch (kind) {
      PlinthButtonKind.tertiary when !enabled => (Colors.transparent, tokens.disabledFg),
      _ when !enabled => (tokens.disabledBg, tokens.disabledFg),
      PlinthButtonKind.primary => on ? (tokens.accentSoft, tokens.onAccentSoft) : (tokens.accent, tokens.onAccent),
      PlinthButtonKind.tonal => (tokens.track, tokens.ink),
      PlinthButtonKind.inverse => (tokens.inverse, tokens.onInverse),
      PlinthButtonKind.tertiary => (Colors.transparent, tokens.ink),
    };
    final tertiary = kind == PlinthButtonKind.tertiary;
    final style = PlinthType.body.copyWith(
      fontSize: tertiary ? 16 : 17,
      fontWeight: FontWeight.w600,
      height: 1.25,
      color: fg,
      decoration: tertiary ? TextDecoration.underline : null,
      decorationColor: fg,
    );
    final content = Text.rich(
      TextSpan(
        children: [
          if (glyph != null) ...[
            WidgetSpan(
              alignment: PlaceholderAlignment.middle,
              child: KitIcon(glyph!, size: 20, color: fg),
            ),
            const WidgetSpan(child: SizedBox(width: 8)),
          ],
          TextSpan(text: label),
        ],
      ),
      style: style,
      textAlign: TextAlign.center,
    );
    const shape = StadiumBorder();
    final height = tertiary || compact ? PlinthLayout.touchApp : PlinthLayout.buttonPrimary;
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
            padding: EdgeInsets.symmetric(horizontal: tertiary ? 0 : 22, vertical: 8),
            child: Align(widthFactor: expand ? null : 1, heightFactor: 1, child: content),
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
