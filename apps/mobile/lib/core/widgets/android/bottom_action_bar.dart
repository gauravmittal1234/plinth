import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/glyphs.dart';
import '../primitives/buttons.dart';

/// One action in a [BottomActionBar].
@immutable
class BottomAction {
  const BottomAction({
    required this.label,
    required this.onPressed,
    this.glyph,
    this.icon,
    this.primary = false,
    this.pressed,
    this.flex = 10,
    this.iconOnly = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final KitGlyph? glyph;

  /// A Material rounded icon ([glyph]'s icon when null).
  final IconData? icon;

  /// The bar's one accent action; the others are tone-filled.
  final bool primary;

  /// A toggle's state (Follow / Following).
  final bool? pressed;

  /// Width share among the labelled actions; AppRisk gives its primary 14 to
  /// the other's 10.
  final int flex;

  /// A square 56 dp icon button named by [label] (Share), instead of a
  /// labelled one.
  final bool iconOnly;
}

/// The sticky bottom action bar on detail screens (DESIGN §0, §4 item 16; app
/// UI v2): a plain bar on the `nav` tone (no hairline, no shadow), 56 dp
/// buttons with an icon and a label that never wraps, and no FAB. An
/// [BottomAction.iconOnly] action sits at the end as a square icon button.
/// It keeps clear of the system navigation bar. Put it in
/// `Scaffold.bottomNavigationBar`.
class BottomActionBar extends StatelessWidget {
  const BottomActionBar({super.key, required this.actions})
    : assert(actions.length >= 1 && actions.length <= 3, 'one to three actions');

  final List<BottomAction> actions;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return ColoredBox(
      color: tokens.nav,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: PlinthLayout.gutterPhone, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              for (final (i, a) in actions.indexed) ...[
                if (i > 0) const SizedBox(width: 10),
                if (a.iconOnly)
                  PlinthIconButton(
                    icon: a.icon ?? a.glyph?.icon ?? Icons.more_horiz_rounded,
                    label: a.label,
                    tone: tokens.segmentOn,
                    onPressed: a.onPressed,
                  )
                else
                  Expanded(
                    flex: a.flex,
                    child: PlinthButton(
                      label: a.label,
                      glyph: a.glyph,
                      icon: a.icon,
                      onPressed: a.onPressed,
                      pressed: a.pressed,
                      expand: true,
                      large: true,
                      tone: tokens.segmentOn,
                      kind: a.primary ? PlinthButtonKind.primary : PlinthButtonKind.tonal,
                    ),
                  ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
