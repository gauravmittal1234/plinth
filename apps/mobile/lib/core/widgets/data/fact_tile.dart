import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

/// A fact tile (DESIGN §4 item 11; AppProject's Built / Sold / Time used): a
/// quiet label over a large number. One screen-reader node, "Built, 41%".
class FactTile extends StatelessWidget {
  const FactTile({
    super.key,
    required this.label,
    required this.value,
    this.valueColor,
    this.align = CrossAxisAlignment.center,
    this.onTone = false,
  });

  final String label;
  final String value;

  /// Defaults to ink. AppProject sets Built in `accentText` and Sold in the
  /// band ink of that quarter.
  final Color? valueColor;
  final CrossAxisAlignment align;

  /// Sit the tile on a `track` tone field (radius 8) instead of the ground.
  final bool onTone;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final textAlign = align == CrossAxisAlignment.center ? TextAlign.center : TextAlign.start;
    Widget tile = MergeSemantics(
      child: Column(
        crossAxisAlignment: align,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            textAlign: textAlign,
            style: PlinthType.small.copyWith(color: tokens.muted),
          ),
          Text(
            value,
            textAlign: textAlign,
            style: PlinthType.numberLg.copyWith(
              fontSize: 34,
              letterSpacing: -0.035 * 34,
              color: valueColor ?? tokens.ink,
            ),
          ),
        ],
      ),
    );
    if (onTone) {
      tile = DecoratedBox(
        decoration: BoxDecoration(color: tokens.track, borderRadius: BorderRadius.circular(PlinthRadius.panel)),
        child: Padding(padding: const EdgeInsets.all(PlinthSpace.s16), child: tile),
      );
    }
    return tile;
  }
}
