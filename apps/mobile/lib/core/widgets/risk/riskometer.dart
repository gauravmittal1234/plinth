import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/kit_copy.dart';
import '../foundation/motion.dart';
import 'risk_state.dart';

/// The riskometer dial (DESIGN §4b, AppProject): a semicircle of five arcs in
/// the band inks, the current one 30 wide at full opacity and the others 20
/// wide at 42%, and a needle at the band.
///
/// With [sweep] the needle sweeps from −90° to the band over 1.4 s on mount
/// (LiveDay); without it (AppProject: the tower is that page's one move) it
/// rests at the band. Reduced motion always shows it at rest. A non-band
/// state has no needle and no current arc.
///
/// [labels] are the five band names from the server, lowest first.
class Riskometer extends StatefulWidget {
  const Riskometer({
    super.key,
    required this.state,
    required this.labels,
    this.sweep = true,
    this.semanticLabel,
    this.maxWidth = 300,
  }) : assert(labels.length == 5, 'five band names, Low to Severe');

  final RiskState state;
  final List<String> labels;
  final bool sweep;

  /// Defaults to "Riskometer pointing to Elevated, step 3 of 5, on a scale
  /// from Low to Severe."
  final String? semanticLabel;
  final double maxWidth;

  /// The needle's resting angle in degrees, clockwise from straight up.
  static double angleOf(RiskState state) => state.isBand ? -90 + (state.step - 0.5) * 36 : -90;

  @override
  State<Riskometer> createState() => _RiskometerState();
}

class _RiskometerState extends State<Riskometer> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: PlinthMotion.needle);
  late Animation<double> _angle;
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    _go(from: widget.sweep ? -90 : Riskometer.angleOf(widget.state));
  }

  @override
  void didUpdateWidget(Riskometer old) {
    super.didUpdateWidget(old);
    if (old.state != widget.state) _go(from: _angle.value);
  }

  void _go({required double from}) {
    final to = Riskometer.angleOf(widget.state);
    if (from == to || KitMotion.reduced(context)) {
      _angle = AlwaysStoppedAnimation(to);
      _c.stop();
      return;
    }
    _angle = Tween(begin: from, end: to).animate(CurvedAnimation(parent: _c, curve: PlinthMotion.easeNeedle));
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
    final s = widget.state;
    final labels = widget.labels;
    final label =
        widget.semanticLabel ??
        KitCopy.riskometer(
          labels.first,
          labels.last,
          current: s.isBand ? labels[s.step - 1] : null,
          step: s.isBand ? s.step : null,
        );
    return Semantics(
      container: true,
      image: true,
      label: label,
      excludeSemantics: true,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: widget.maxWidth + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AspectRatio(
              aspectRatio: 300 / 172,
              child: AnimatedBuilder(
                animation: _c,
                builder: (context, _) => CustomPaint(
                  painter: RiskometerPainter(
                    current: s.isBand ? s.step : null,
                    needleDegrees: s.isBand ? _angle.value : null,
                    inks: [for (final b in RiskState.bands) b.colors(tokens).ink],
                    needle: tokens.ink,
                    hub: tokens.bgSolid,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 2),
            Row(
              children: [
                for (final l in labels)
                  Expanded(
                    child: Text(
                      l,
                      textAlign: TextAlign.center,
                      style: PlinthType.caption.copyWith(height: 1.3, color: tokens.muted),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Paints the dial in a 300 × 172 viewBox scaled to its canvas.
@visibleForTesting
class RiskometerPainter extends CustomPainter {
  RiskometerPainter({
    required this.current,
    required this.needleDegrees,
    required this.inks,
    required this.needle,
    required this.hub,
  });

  /// The current band's step, or null.
  final int? current;

  /// Clockwise from straight up; no needle when null.
  final double? needleDegrees;
  final List<Color> inks;
  final Color needle;
  final Color hub;

  static const _center = Offset(150, 150);
  static const _radius = 112.0;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 300, size.height / 172);
    for (var i = 0; i < 5; i++) {
      // Arc i runs from 180° − 36i (minus a 1.6° gap) towards 0°, in the
      // artboard's maths angles (counter-clockwise, y up).
      final a0 = 180 - i * 36 - 1.6;
      final a1 = 180 - (i + 1) * 36 + 1.6;
      final on = current == i + 1;
      final paint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = on ? 30 : 20
        ..color = inks[i].withValues(alpha: on ? 1 : 0.42);
      // Canvas angles are clockwise from +x with y down: negate.
      final start = -a0 * math.pi / 180;
      final sweep = (a0 - a1) * math.pi / 180;
      canvas.drawArc(Rect.fromCircle(center: _center, radius: _radius), start, sweep, false, paint);
    }
    final deg = needleDegrees;
    if (deg != null) {
      canvas.save();
      canvas.translate(_center.dx, _center.dy);
      canvas.rotate(deg * math.pi / 180);
      canvas.drawLine(
        Offset.zero,
        const Offset(0, -104),
        Paint()
          ..color = needle
          ..strokeWidth = 4
          ..strokeCap = StrokeCap.round,
      );
      canvas.restore();
      canvas.drawCircle(_center, 11, Paint()..color = needle);
      canvas.drawCircle(_center, 4, Paint()..color = hub);
    }
  }

  @override
  bool shouldRepaint(RiskometerPainter old) =>
      old.current != current || old.needleDegrees != needleDegrees || old.needle != needle || old.hub != hub;
}
