import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/motion.dart';
import 'risk_state.dart';

/// Segment geometry of a 5-segment meter (DESIGN §4 items 4 and 5).
enum RiskMeterSize {
  /// In the risk chip: 6 × 10 segments, 2 apart.
  chip(
    PlinthComponents.chipSegmentWidth,
    PlinthComponents.chipSegmentHeight,
    PlinthComponents.chipSegmentGap,
    PlinthRadius.segment,
  ),

  /// In the risk header: 16 × 12 segments, 4 apart.
  header(
    PlinthComponents.riskHeaderSegmentWidth,
    PlinthComponents.riskHeaderSegmentHeight,
    PlinthComponents.riskHeaderSegmentGap,
    PlinthRadius.segmentLg,
  );

  const RiskMeterSize(this.segmentWidth, this.segmentHeight, this.gap, this.radius);

  final double segmentWidth;
  final double segmentHeight;
  final double gap;
  final double radius;

  Size get size => Size(segmentWidth * 5 + gap * 4, segmentHeight);
}

/// The 5-segment meter: the non-colour cue that carries a band everywhere
/// (DESIGN §3.2). A band fills its first `step` segments in band ink, left to
/// right; Limited history is dashed, Not scored outlined, a withheld band
/// quietly outlined.
///
/// With [fillFrom], the meter starts at that many segments and fills up to
/// the band's step (the AppFollowing "band steps" move), and it animates
/// whenever the state changes. Under reduced motion it shows the end state.
///
/// Decorative unless [semanticLabel] is given: the chip and header around it
/// carry the band in words.
class RiskMeter extends StatefulWidget {
  const RiskMeter({
    super.key,
    required this.state,
    this.size = RiskMeterSize.chip,
    this.fillFrom,
    this.fillDelay = Duration.zero,
    this.semanticLabel,
  });

  final RiskState state;
  final RiskMeterSize size;

  /// Segments shown before the fill animates to the band's step.
  final int? fillFrom;
  final Duration fillDelay;
  final String? semanticLabel;

  @override
  State<RiskMeter> createState() => _RiskMeterState();
}

class _RiskMeterState extends State<RiskMeter> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this);
  late Animation<double> _fill;
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    final to = widget.state.step.toDouble();
    _run(from: (widget.fillFrom ?? widget.state.step).toDouble(), to: to, delay: widget.fillDelay);
  }

  @override
  void didUpdateWidget(RiskMeter old) {
    super.didUpdateWidget(old);
    if (old.state != widget.state) _run(from: _fill.value, to: widget.state.step.toDouble());
  }

  void _run({required double from, required double to, Duration delay = Duration.zero}) {
    if (from == to || KitMotion.reduced(context)) {
      _fill = AlwaysStoppedAnimation(to);
      _c.stop();
      return;
    }
    final total = delay + PlinthMotion.rise;
    _c.duration = total;
    _fill = Tween(begin: from, end: to).animate(
      CurvedAnimation(
        parent: _c,
        curve: Interval(delay.inMicroseconds / total.inMicroseconds, 1, curve: PlinthMotion.easeOut),
      ),
    );
    _c.forward(from: 0);
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final meter = AnimatedBuilder(
      animation: _c,
      builder: (context, _) => CustomPaint(
        size: widget.size.size,
        painter: RiskMeterPainter(
          mode: widget.state.meterMode,
          fill: _fill.value,
          geometry: widget.size,
          colors: widget.state.colors(tokens),
          emptyFill: tokens.meterOff,
          emptyBorder: tokens.emptyBorder,
        ),
      ),
    );
    final label = widget.semanticLabel;
    if (label == null) return ExcludeSemantics(child: meter);
    return Semantics(
      container: true,
      image: true,
      label: label,
      child: ExcludeSemantics(child: meter),
    );
  }
}

/// Paints the five segments of a [RiskMeter].
@visibleForTesting
class RiskMeterPainter extends CustomPainter {
  RiskMeterPainter({
    required this.mode,
    required this.fill,
    required this.geometry,
    required this.colors,
    required this.emptyFill,
    required this.emptyBorder,
  });

  final RiskMeterMode mode;

  /// Filled segments, fractional while the fill animates.
  final double fill;
  final RiskMeterSize geometry;
  final PlinthBandColors colors;
  final Color emptyFill;
  final Color emptyBorder;

  /// Segments drawn fully in band ink.
  int get filledSegments => mode == RiskMeterMode.filled ? fill.floor() : 0;

  @override
  void paint(Canvas canvas, Size size) {
    for (var j = 0; j < 5; j++) {
      final rect = Rect.fromLTWH(
        j * (geometry.segmentWidth + geometry.gap),
        0,
        geometry.segmentWidth,
        geometry.segmentHeight,
      );
      final rrect = RRect.fromRectAndRadius(rect, Radius.circular(geometry.radius));
      switch (mode) {
        case RiskMeterMode.filled:
          final on = (fill - j).clamp(0.0, 1.0);
          if (on < 1) _outlined(canvas, rrect, emptyBorder, PlinthComponents.meterOffBorder, fill: emptyFill);
          if (on > 0) canvas.drawRRect(rrect, Paint()..color = colors.ink.withValues(alpha: colors.ink.a * on));
        case RiskMeterMode.dashed:
          _dashed(canvas, rrect, colors.ink, 1.5);
        case RiskMeterMode.outlined:
          _outlined(canvas, rrect, colors.ink, 1.5);
        case RiskMeterMode.withheld:
          _outlined(canvas, rrect, emptyBorder, PlinthComponents.meterOffBorder);
      }
    }
  }

  /// A border drawn inside the segment (CSS box-sizing: border-box).
  static void _outlined(Canvas canvas, RRect rrect, Color color, double width, {Color? fill}) {
    final inner = rrect.deflate(width / 2);
    if (fill != null && fill.a > 0) canvas.drawRRect(rrect, Paint()..color = fill);
    canvas.drawRRect(
      inner,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = width,
    );
  }

  static void _dashed(Canvas canvas, RRect rrect, Color color, double width) {
    final path = Path()..addRRect(rrect.deflate(width / 2));
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = width;
    final dash = width * 2;
    final gap = width * 1.4;
    for (final ui.PathMetric metric in path.computeMetrics()) {
      var d = 0.0;
      while (d < metric.length) {
        canvas.drawPath(metric.extractPath(d, d + dash), paint);
        d += dash + gap;
      }
    }
  }

  @override
  bool shouldRepaint(RiskMeterPainter old) =>
      old.mode != mode ||
      old.fill != fill ||
      old.geometry != geometry ||
      old.colors != colors ||
      old.emptyFill != emptyFill ||
      old.emptyBorder != emptyBorder;
}
