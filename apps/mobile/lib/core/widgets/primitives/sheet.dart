import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/glyphs.dart';
import '../foundation/kit_copy.dart';
import '../foundation/motion.dart';

/// Opens a modal bottom sheet the Plinth way (DESIGN §0, §3.4; app UI v2):
/// the one surface with a shadow, 28 radius on top, a grabber, over a scrim.
/// Inside: [PlinthSheetHeader], then a [PlinthHintRow], one 56 dp primary
/// [PlinthButton] and a [PlinthGroup] of rows with icon tiles and chevrons.
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

/// A sheet's heading row (app UI v2, after Thapki's action sheet): an
/// optional [leading] thumbnail or icon tile, the title in `section`
/// (Bricolage 20/25 · 700) with an optional quiet `meta` line under it, and a
/// 48 dp close button.
class PlinthSheetHeader extends StatelessWidget {
  const PlinthSheetHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.onClose,
    this.closeLabel = KitCopy.close,
  });

  final String title;
  final String? subtitle;

  /// A [ProjectThumb] or [PlinthIconTile] before the title.
  final Widget? leading;

  /// Defaults to popping the sheet.
  final VoidCallback? onClose;
  final String closeLabel;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(PlinthLayout.gutterApp, 0, 8, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (leading != null) ...[leading!, const SizedBox(width: PlinthSpace.s16)],
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Semantics(
                    header: true,
                    child: Text(title, style: PlinthType.section.copyWith(color: tokens.ink)),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 4),
                    Text(subtitle!, style: PlinthType.meta.copyWith(color: tokens.ink2)),
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
