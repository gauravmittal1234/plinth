import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/glyphs.dart';
import '../foundation/kit_copy.dart';
import '../foundation/motion.dart';

/// Opens a modal bottom sheet the Plinth way (DESIGN §0, §3.4): the one
/// surface with a shadow, 28 radius on top, a drag handle, over a scrim.
/// It rises in [PlinthMotion.sheet]; under reduced motion it is simply open.
/// Never taller than [maxHeightFactor] of the screen, and clear of the
/// system navigation bar.
Future<T?> showPlinthSheet<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  double maxHeightFactor = 0.9,
  bool isDismissible = true,
}) {
  final reduced = KitMotion.reduced(context);
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    isDismissible: isDismissible,
    constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * maxHeightFactor),
    sheetAnimationStyle: reduced
        ? AnimationStyle.noAnimation
        : const AnimationStyle(duration: PlinthMotion.sheet, curve: PlinthMotion.easeOut),
    builder: (ctx) => SafeArea(top: false, child: builder(ctx)),
  );
}

/// A sheet's heading row: the title (display 26) with an optional quiet
/// line under it, and a 48 dp close button.
class PlinthSheetHeader extends StatelessWidget {
  const PlinthSheetHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.onClose,
    this.closeLabel = KitCopy.close,
  });

  final String title;
  final String? subtitle;

  /// Defaults to popping the sheet.
  final VoidCallback? onClose;
  final String closeLabel;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(20, 0, 8, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Semantics(
                    header: true,
                    child: Text(
                      title,
                      style: PlinthType.h2.copyWith(letterSpacing: -0.03 * 26, color: tokens.ink),
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(subtitle!, style: PlinthType.small.copyWith(color: tokens.muted)),
                  ],
                ],
              ),
            ),
          ),
          IconButton(
            onPressed: onClose ?? () => Navigator.of(context).maybePop(),
            tooltip: closeLabel,
            icon: KitIcon(KitGlyph.close, color: tokens.ink),
          ),
        ],
      ),
    );
  }
}
