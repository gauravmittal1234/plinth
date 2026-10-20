import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/motion.dart';
import '../risk/risk_state.dart';

/// The replay tower (DESIGN §4b; AppProject "How much is built?"): the
/// phase's slabs stacked in 3D, as the CSS artboard builds them
/// (`perspective: 1000px; rotateX(58deg) rotateZ(-42deg)`, slab k at
/// `translateZ(k × 10px)`). Built slabs are solid accent; the rest are dashed
/// wireframes; the slab at the sold level carries a 2 px outline in the band
/// ink of that quarter.
///
/// Slabs fill in one after another, 45 ms apart, on mount and whenever
/// [built] changes; under reduced motion they show the end state at once.
///
/// The picture is decorative: always pair it with Built / Sold / Time used
/// [FactTile]s that say the same in words.
class TowerStack extends StatefulWidget {
  const TowerStack({super.key, required this.built, this.floors = 20, this.soldFloor, this.soldBand, this.height = 360})
    : assert(built >= 0 && built <= floors, 'built slabs within the floors');

  /// Slabs built (on the QPR, or for one tower).
  final int built;

  /// Floors per tower (`ProjectProgress.floors_per_tower`).
  final int floors;

  /// The slab at the sold level (1-based), outlined; none when null.
  final int? soldFloor;

  /// The band of that quarter, whose ink draws the sold outline.
  final RiskState? soldBand;
  final double height;

  /// Slab side and the rise between slabs (artboard px).
  static const slabSide = 164.0;
  static const slabStep = 10.0;

  /// The stagger between slabs and one slab's fill.
  static const stagger = Duration(milliseconds: 45);
  static const slabFill = Duration(milliseconds: 500);

  /// CSS `perspective(1000px)` about the stage centre, then
  /// `rotateX(58deg) rotateZ(-42deg) translateZ(k × 10px)` about the slab's.
  @visibleForTesting
  static Matrix4 slabTransform(int k, double drop) {
    final perspective = Matrix4.identity()..setEntry(3, 2, -1 / 1000);
    return Matrix4.identity()
      ..translateByDouble(0, -drop, 0, 1)
      ..multiply(perspective)
      ..translateByDouble(0, drop, 0, 1)
      ..rotateX(58 * math.pi / 180)
      ..rotateZ(-42 * math.pi / 180)
      ..translateByDouble(0, 0, k * TowerStack.slabStep, 1);
  }

  @override
  State<TowerStack> createState() => _TowerStackState();
}

class _TowerStackState extends State<TowerStack> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this);
  late List<double> _from;
  late List<double> _to;
  bool _started = false;

  List<double> _targets() => [for (var k = 0; k < widget.floors; k++) k < widget.built ? 1.0 : 0.0];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    _from = List.filled(widget.floors, 0);
    _to = _targets();
    _run();
  }

  @override
  void didUpdateWidget(TowerStack old) {
    super.didUpdateWidget(old);
    if (old.built == widget.built && old.floors == widget.floors) return;
    final now = [for (var k = 0; k < old.floors; k++) _value(k)];
    _from = [for (var k = 0; k < widget.floors; k++) k < now.length ? now[k] : 0.0];
    _to = _targets();
    _run();
  }

  void _run() {
    final total = TowerStack.slabFill + TowerStack.stagger * (widget.floors - 1);
    _c.duration = total;
    if (KitMotion.reduced(context)) {
      _c.value = 1;
    } else {
      _c.forward(from: 0);
    }
  }

  /// Slab [k]'s built-ness, 0 (wireframe) to 1 (solid).
  double _value(int k) {
    final total = _c.duration?.inMicroseconds ?? 1;
    final start = (TowerStack.stagger * k).inMicroseconds / total;
    final end = math.min(1.0, start + TowerStack.slabFill.inMicroseconds / total);
    final t = Interval(start, end, curve: Curves.ease).transform(_c.value);
    return ui.lerpDouble(_from[k], _to[k], t)!;
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final night = tokens.brightness == Brightness.dark;
    final builtFill = tokens.accent.withValues(alpha: night ? 0.62 : 0.86);
    final wire = tokens.ink.withValues(alpha: 0.30);
    final soldInk = widget.soldBand?.colors(tokens).ink;
    const side = TowerStack.slabSide;
    // The perspective origin is the centre of the stage; the tower stands at
    // its foot (20 px up), so the slabs' centre sits this far below it.
    final drop = widget.height / 2 - 20 - side / 2;
    return ExcludeSemantics(
      child: SizedBox(
        height: widget.height,
        child: AnimatedBuilder(
          animation: _c,
          builder: (context, _) => Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.bottomCenter,
            children: [
              for (var k = 0; k < widget.floors; k++)
                Positioned(
                  bottom: 20,
                  child: Transform(
                    alignment: Alignment.center,
                    transform: TowerStack.slabTransform(k, drop),
                    child: CustomPaint(
                      size: const Size.square(side),
                      painter: SlabPainter(
                        built: _value(k),
                        sold: soldInk != null && widget.soldFloor == k + 1 ? soldInk : null,
                        fill: builtFill,
                        edge: tokens.accentStrong,
                        wire: wire,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// One slab: a wireframe that fills to solid accent as [built] goes to 1.
@visibleForTesting
class SlabPainter extends CustomPainter {
  SlabPainter({required this.built, required this.fill, required this.edge, required this.wire, this.sold});

  final double built;
  final Color fill;
  final Color edge;
  final Color wire;

  /// The sold-level outline's ink, or null.
  final Color? sold;

  @override
  void paint(Canvas canvas, Size size) {
    final slab = RRect.fromRectAndRadius(Offset.zero & size, const Radius.circular(4));
    if (built > 0) {
      canvas.drawRRect(slab, Paint()..color = fill.withValues(alpha: fill.a * built));
      canvas.drawRRect(
        slab.deflate(0.5),
        Paint()
          ..color = edge.withValues(alpha: edge.a * built)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1,
      );
    }
    if (built < 1) {
      final paint = Paint()
        ..color = wire.withValues(alpha: wire.a * (1 - built))
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1;
      for (final metric in (Path()..addRRect(slab.deflate(0.5))).computeMetrics()) {
        for (var d = 0.0; d < metric.length; d += 7) {
          canvas.drawPath(metric.extractPath(d, d + 4), paint);
        }
      }
    }
    final s = sold;
    if (s != null) {
      canvas.drawRRect(
        slab.inflate(4),
        Paint()
          ..color = s
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2,
      );
    }
  }

  @override
  bool shouldRepaint(SlabPainter old) =>
      old.built != built || old.sold != sold || old.fill != fill || old.edge != edge || old.wire != wire;
}
