import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

/// The line icons the kit uses, drawn from the phone artboards' SVG paths
/// (24 × 24 viewBox, round caps, `currentColor`; DESIGN §3.5). Drawn rather
/// than loaded, so they need no asset or icon font and render in tests.
enum KitGlyph {
  /// Source chips: a page with a folded corner.
  document,

  /// "Developer says" and "From the developer": a speech bubble.
  speech,

  /// A pending fact: a clock.
  clock,

  /// A band set by a red-flag rule.
  flag,

  /// "Records show".
  check,

  /// Opens the authority's page.
  external,
  close,
  chevronLeft,
  chevronRight,
  chevronDown,
  share,

  /// Ask Plinth.
  sparkle,

  /// Follow.
  bookmark,

  /// A next step.
  arrowRight,

  /// A band change ("Was Moderate until 2 Oct 2026").
  trend,
}

/// A [KitGlyph] at [size] in [color] (the ambient [IconTheme] colour when
/// null). Decorative: screen readers skip it; label the control instead.
class KitIcon extends StatelessWidget {
  const KitIcon(this.glyph, {super.key, this.size = 24, this.color});

  final KitGlyph glyph;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? IconTheme.of(context).color ?? PlinthTokens.of(context).ink;
    return ExcludeSemantics(
      child: SizedBox.square(
        dimension: size,
        child: CustomPaint(painter: KitGlyphPainter(glyph, c)),
      ),
    );
  }
}

/// Paints one [KitGlyph] scaled to its canvas.
class KitGlyphPainter extends CustomPainter {
  KitGlyphPainter(this.glyph, this.color);

  final KitGlyph glyph;
  final Color color;

  static Path _poly(List<Offset> points, {bool close = false}) {
    final path = Path()..moveTo(points.first.dx, points.first.dy);
    for (final p in points.skip(1)) {
      path.lineTo(p.dx, p.dy);
    }
    if (close) path.close();
    return path;
  }

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 24, size.height / 24);
    final width = switch (glyph) {
      KitGlyph.flag => 2.2,
      KitGlyph.chevronLeft || KitGlyph.chevronRight || KitGlyph.chevronDown || KitGlyph.arrowRight => 2.0,
      _ => 1.8,
    };
    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = width
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    void line(List<Offset> points, {bool close = false}) => canvas.drawPath(_poly(points, close: close), stroke);
    switch (glyph) {
      case KitGlyph.document:
        // M7 3.5h7l4 4v13H7z M14 3.5v4h4
        line(const [Offset(7, 3.5), Offset(14, 3.5), Offset(18, 7.5), Offset(18, 20.5), Offset(7, 20.5)], close: true);
        line(const [Offset(14, 3.5), Offset(14, 7.5), Offset(18, 7.5)]);
      case KitGlyph.speech:
        // 16 px artboard path M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z, scaled 1.5×.
        line(const [
          Offset(3.75, 5.25), Offset(20.25, 5.25), Offset(20.25, 15.75), Offset(11.25, 15.75), //
          Offset(6.75, 19.5), Offset(6.75, 15.75), Offset(3.75, 15.75),
        ], close: true);
      case KitGlyph.clock:
        // circle r 8.5; M12 7.5V12l3 2
        canvas.drawCircle(const Offset(12, 12), 8.5, stroke);
        line(const [Offset(12, 7.5), Offset(12, 12), Offset(15, 14)]);
      case KitGlyph.flag:
        // M6 21V4h11l-2 4 2 4H6
        line(const [Offset(6, 21), Offset(6, 4), Offset(17, 4), Offset(15, 8), Offset(17, 12), Offset(6, 12)]);
      case KitGlyph.check:
        // M5 12.5l4.5 4.5L19 7.5
        line(const [Offset(5, 12.5), Offset(9.5, 17), Offset(19, 7.5)]);
      case KitGlyph.external:
        // M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5
        line(const [Offset(14, 4), Offset(20, 4), Offset(20, 10)]);
        line(const [Offset(20, 4), Offset(11, 13)]);
        const r = Radius.circular(1);
        canvas.drawPath(
          Path()
            ..moveTo(18, 14)
            ..lineTo(18, 19)
            ..arcToPoint(const Offset(17, 20), radius: r)
            ..lineTo(5, 20)
            ..arcToPoint(const Offset(4, 19), radius: r)
            ..lineTo(4, 7)
            ..arcToPoint(const Offset(5, 6), radius: r)
            ..lineTo(10, 6),
          stroke,
        );
      case KitGlyph.close:
        // M6 6l12 12 M18 6L6 18
        line(const [Offset(6, 6), Offset(18, 18)]);
        line(const [Offset(18, 6), Offset(6, 18)]);
      case KitGlyph.chevronLeft:
        // 20 px artboard path M12.5 4.5L7 10l5.5 5.5, scaled 1.2×.
        line(const [Offset(15, 5.4), Offset(8.4, 12), Offset(15, 18.6)]);
      case KitGlyph.chevronRight:
        // 20 px artboard path M7.5 4.5L13 10l-5.5 5.5, scaled 1.2×.
        line(const [Offset(9, 5.4), Offset(15.6, 12), Offset(9, 18.6)]);
      case KitGlyph.chevronDown:
        // M6 9l6 6 6-6
        line(const [Offset(6, 9), Offset(12, 15), Offset(18, 9)]);
      case KitGlyph.share:
        // Three r 2.5 circles and M8.2 10.8l7.6-4.1 M8.2 13.2l7.6 4.1
        canvas.drawCircle(const Offset(18, 5.5), 2.5, stroke);
        canvas.drawCircle(const Offset(6, 12), 2.5, stroke);
        canvas.drawCircle(const Offset(18, 18.5), 2.5, stroke);
        line(const [Offset(8.2, 10.8), Offset(15.8, 6.7)]);
        line(const [Offset(8.2, 13.2), Offset(15.8, 17.3)]);
      case KitGlyph.sparkle:
        // M12 2.5l2.1 5.4L19.5 10l-5.4 2.1L12 17.5l-2.1-5.4L4.5 10l5.4-2.1z and a small one.
        line(const [
          Offset(12, 2.5), Offset(14.1, 7.9), Offset(19.5, 10), Offset(14.1, 12.1), //
          Offset(12, 17.5), Offset(9.9, 12.1), Offset(4.5, 10), Offset(9.9, 7.9),
        ], close: true);
        line(const [
          Offset(18.5, 16), Offset(19.2, 17.8), Offset(21, 18.5), Offset(19.2, 19.2), //
          Offset(18.5, 21), Offset(17.8, 19.2), Offset(16, 18.5), Offset(17.8, 17.8),
        ], close: true);
      case KitGlyph.bookmark:
        // M7 4h10v16.5l-5-3.6-5 3.6z
        line(const [Offset(7, 4), Offset(17, 4), Offset(17, 20.5), Offset(12, 16.9), Offset(7, 20.5)], close: true);
      case KitGlyph.arrowRight:
        // M5 12h13 M13 6l6 6-6 6
        line(const [Offset(5, 12), Offset(18, 12)]);
        line(const [Offset(13, 6), Offset(19, 12), Offset(13, 18)]);
      case KitGlyph.trend:
        // M4 16l6-6 4 4 6-6 M15 8h5v5
        line(const [Offset(4, 16), Offset(10, 10), Offset(14, 14), Offset(20, 8)]);
        line(const [Offset(15, 8), Offset(20, 8), Offset(20, 13)]);
    }
  }

  @override
  bool shouldRepaint(KitGlyphPainter old) => old.glyph != glyph || old.color != color;
}
