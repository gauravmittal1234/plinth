import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/kit_copy.dart';
import 'risk_state.dart';

/// The icon array, DESIGN §4 item 7: 100 circles, 10 by 10, filled row by
/// row. Filled cells are in band ink; hatched cells (45° band-ink stripes on
/// the band fill) are the range we're less certain about; empty cells sit on
/// `emptyCell` with an `emptyBorder` edge.
///
/// Always beside the frequency sentence; the sentence is its screen-reader
/// label ([semanticLabel], usually `frequency.sentence`).
class RiskIconArray extends StatelessWidget {
  const RiskIconArray({
    super.key,
    required this.state,
    required this.filled,
    required this.hatched,
    required this.semanticLabel,
    this.cell = PlinthComponents.iconArrayCell,
    this.gap = PlinthComponents.iconArrayGap,
  }) : assert(filled >= 0 && hatched >= 0 && filled + hatched <= 100, 'at most 100 icons');

  /// From a summary's frequency. Null when there is none to show: a
  /// red-flag band, Limited history, Not scored or a withheld band.
  static RiskIconArray? fromSummary(c.RiskSummary summary, {Key? key, double? cell, double? gap}) =>
      fromFrequency(summary.chip, summary.frequency, key: key, cell: cell, gap: gap);

  /// From a chip and its frequency (`ProjectPage.risk` has both too).
  static RiskIconArray? fromFrequency(c.Chip chip, c.Frequency? f, {Key? key, double? cell, double? gap}) {
    if (f == null) return null;
    return RiskIconArray(
      key: key,
      state: RiskState.ofChip(chip),
      filled: f.iconArray.filled,
      hatched: f.iconArray.hatched,
      semanticLabel: f.sentence,
      cell: cell ?? PlinthComponents.iconArrayCell,
      gap: gap ?? PlinthComponents.iconArrayGap,
    );
  }

  final RiskState state;
  final int filled;
  final int hatched;
  final String semanticLabel;
  final double cell;
  final double gap;

  int get empty => 100 - filled - hatched;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final side = cell * PlinthComponents.iconArrayColumns + gap * (PlinthComponents.iconArrayColumns - 1);
    return Semantics(
      container: true,
      image: true,
      label: semanticLabel,
      excludeSemantics: true,
      child: CustomPaint(
        size: Size(side, side),
        painter: IconArrayPainter(
          filled: filled,
          hatched: hatched,
          cell: cell,
          gap: gap,
          colors: state.colors(tokens),
          emptyCell: tokens.emptyCell,
          emptyBorder: tokens.emptyBorder,
        ),
      ),
    );
  }
}

/// The swatch kinds of the icon array's legend.
enum IconArrayCellKind { filled, hatched, empty }

/// The legend under the icon array (AppRisk): a swatch and a line for each
/// kind of cell. Pass `frequency.hatch_legend` as [hatchedText]; the other
/// two lines default to the artboard's.
class RiskIconArrayLegend extends StatelessWidget {
  const RiskIconArrayLegend({
    super.key,
    required this.state,
    this.filledText = KitCopy.iconArrayFilled,
    this.hatchedText,
    this.emptyText = KitCopy.iconArrayEmpty,
  });

  final RiskState state;
  final String filledText;

  /// Omitted (with its swatch) when null: a point estimate has no hatch.
  final String? hatchedText;
  final String emptyText;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final style = PlinthType.small.copyWith(fontSize: 15, color: tokens.ink2);
    Widget row(IconArrayCellKind kind, String text) => Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 3, right: 10),
            child: CustomPaint(
              size: const Size.square(16),
              painter: IconArrayPainter.swatch(kind, state.colors(tokens), tokens.emptyCell, tokens.emptyBorder),
            ),
          ),
          Expanded(child: Text(text, style: style)),
        ],
      ),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        row(IconArrayCellKind.filled, filledText),
        if (hatchedText != null) row(IconArrayCellKind.hatched, hatchedText!),
        row(IconArrayCellKind.empty, emptyText),
      ],
    );
  }
}

/// Paints the 10 × 10 array (or one legend swatch).
@visibleForTesting
class IconArrayPainter extends CustomPainter {
  IconArrayPainter({
    required this.filled,
    required this.hatched,
    required this.cell,
    required this.gap,
    required this.colors,
    required this.emptyCell,
    required this.emptyBorder,
  }) : _swatch = null;

  IconArrayPainter.swatch(IconArrayCellKind kind, this.colors, this.emptyCell, this.emptyBorder)
    : filled = 0,
      hatched = 0,
      cell = 16,
      gap = 0,
      _swatch = kind;

  final int filled;
  final int hatched;
  final double cell;
  final double gap;
  final PlinthBandColors colors;
  final Color emptyCell;
  final Color emptyBorder;
  final IconArrayCellKind? _swatch;

  /// The kind of cell [index] (row-major, 0–99).
  IconArrayCellKind kindOf(int index) => index < filled
      ? IconArrayCellKind.filled
      : index < filled + hatched
      ? IconArrayCellKind.hatched
      : IconArrayCellKind.empty;

  @override
  void paint(Canvas canvas, Size size) {
    final swatch = _swatch;
    if (swatch != null) {
      _cell(canvas, Offset.zero & size, swatch);
      return;
    }
    const columns = PlinthComponents.iconArrayColumns;
    for (var k = 0; k < columns * PlinthComponents.iconArrayRows; k++) {
      final rect = Rect.fromLTWH((k % columns) * (cell + gap), (k ~/ columns) * (cell + gap), cell, cell);
      _cell(canvas, rect, kindOf(k));
    }
  }

  void _cell(Canvas canvas, Rect rect, IconArrayCellKind kind) {
    final center = rect.center;
    final r = rect.width / 2;
    final edge = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    switch (kind) {
      case IconArrayCellKind.filled:
        canvas.drawCircle(center, r, Paint()..color = colors.ink);
      case IconArrayCellKind.hatched:
        canvas.drawCircle(center, r, Paint()..color = colors.fill);
        canvas.save();
        canvas.clipPath(Path()..addOval(rect));
        _hatch(canvas, rect, colors.ink);
        canvas.restore();
        canvas.drawCircle(center, r - 0.5, edge..color = colors.ink);
      case IconArrayCellKind.empty:
        canvas.drawCircle(center, r, Paint()..color = emptyCell);
        canvas.drawCircle(center, r - 0.5, edge..color = emptyBorder);
    }
  }

  /// Stripes at [PlinthComponents.hatchAngle], [PlinthComponents.hatchPeriod] apart.
  static void _hatch(Canvas canvas, Rect rect, Color ink) {
    final paint = Paint()
      ..color = ink
      ..strokeWidth = PlinthComponents.hatchStroke;
    const period = PlinthComponents.hatchPeriod;
    final a = PlinthComponents.hatchAngle * math.pi / 180;
    final dir = Offset(math.cos(a), -math.sin(a));
    final normal = Offset(dir.dy, -dir.dx);
    final reach = rect.longestSide;
    for (var d = -reach; d <= reach; d += period) {
      final mid = rect.center + normal * d;
      canvas.drawLine(mid - dir * reach, mid + dir * reach, paint);
    }
  }

  @override
  bool shouldRepaint(IconArrayPainter old) =>
      old.filled != filled ||
      old.hatched != hatched ||
      old.cell != cell ||
      old.gap != gap ||
      old.colors != colors ||
      old.emptyCell != emptyCell ||
      old.emptyBorder != emptyBorder ||
      old._swatch != _swatch;
}
