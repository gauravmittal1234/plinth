import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show ConfidenceLevel;
import 'package:plinth_tokens/plinth_tokens.dart';

/// Confidence as two dots, drawn rather than typed (DESIGN §3.2): ●● high,
/// ●○ low. Decorative: the sentence beside it, or the chip's label, says it.
class ConfidenceDots extends StatelessWidget {
  const ConfidenceDots({super.key, required this.level, this.size = PlinthComponents.confidenceDotSize, this.color});

  /// `RiskSummary.confidence.level`: "high" or "low".
  final String level;
  final double size;

  /// Defaults to `ink2`.
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final ink = color ?? PlinthTokens.of(context).ink2;
    final high = level == ConfidenceLevel.high;
    return ExcludeSemantics(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _Dot(size: size, color: ink, hollow: false),
          SizedBox(width: size * 3 / 7),
          _Dot(size: size, color: ink, hollow: !high),
        ],
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  const _Dot({required this.size, required this.color, required this.hollow});

  final double size;
  final Color color;
  final bool hollow;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: hollow ? null : color,
        border: hollow ? Border.all(color: color, width: PlinthComponents.confidenceDotHollowBorder) : null,
      ),
    );
  }
}
