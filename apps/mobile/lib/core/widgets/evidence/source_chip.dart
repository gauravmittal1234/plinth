import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show SourceRef;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/glyphs.dart';
import '../foundation/kit_copy.dart';
import '../foundation/motion.dart';

/// The ground a source chip sits on; it picks the chip's tone step.
enum SourceChipGround {
  /// The page ground (`bg`): `chipFill`.
  page,

  /// A `track` band: `chipFillOnTrack`.
  track,

  /// The Developer says field (`claimBg`): `chipFillOnClaim`.
  claim,
}

/// A source chip (DESIGN §0, §4 item 8): a filled tone pill with no border, a
/// document icon and the source's label ("HARERA QPR · Apr–Jun 2026"). It is
/// 36 tall inside a 48 dp target and opens the evidence sheet.
class SourceChip extends StatelessWidget {
  const SourceChip({
    super.key,
    required this.label,
    required this.onPressed,
    this.ground = SourceChipGround.page,
    this.hint = KitCopy.openEvidence,
  });

  /// A chip for one of a reason's sources.
  factory SourceChip.fromRef(
    SourceRef source, {
    Key? key,
    required VoidCallback? onPressed,
    SourceChipGround ground = SourceChipGround.page,
  }) => SourceChip(key: key, label: source.label, onPressed: onPressed, ground: ground);

  final String label;
  final VoidCallback? onPressed;
  final SourceChipGround ground;

  /// What a tap does, for screen readers.
  final String hint;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final fill = switch (ground) {
      SourceChipGround.page => tokens.chipFill,
      SourceChipGround.track => tokens.chipFillOnTrack,
      SourceChipGround.claim => tokens.chipFillOnClaim,
    };
    final style = PlinthType.small.copyWith(height: 1.2, color: tokens.ink);
    return Semantics(
      container: true,
      button: true,
      enabled: onPressed != null,
      label: label,
      hint: hint,
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
              alignment: AlignmentDirectional.centerStart,
              widthFactor: 1,
              child: DecoratedBox(
                decoration: BoxDecoration(color: fill, borderRadius: BorderRadius.circular(18)),
                child: Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(12, 9, 14, 9),
                  // One run of text with the icon inline, so a long label
                  // wraps inside the pill at large text sizes.
                  child: Text.rich(
                    TextSpan(
                      children: [
                        WidgetSpan(
                          alignment: PlaceholderAlignment.middle,
                          child: KitIcon(KitGlyph.document, size: PlinthLayout.iconSm, color: tokens.ink),
                        ),
                        const WidgetSpan(child: SizedBox(width: 6)),
                        TextSpan(text: label),
                      ],
                    ),
                    style: style,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
