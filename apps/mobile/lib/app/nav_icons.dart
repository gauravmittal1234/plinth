import 'package:flutter/material.dart';

/// The four tab icons of the phone artboards' navigation bar (AppExplore and
/// friends): 24 px, 1.8 px round strokes in the current icon colour. Drawn
/// from the artboards' SVG paths so the bar needs no asset or icon font.
enum NavGlyph { explore, following, ask, you }

class NavIcon extends StatelessWidget {
  const NavIcon(this.glyph, {super.key});

  final NavGlyph glyph;

  @override
  Widget build(BuildContext context) {
    final icon = IconTheme.of(context);
    final size = icon.size ?? 24;
    return SizedBox.square(
      dimension: size,
      child: CustomPaint(painter: _NavIconPainter(glyph, icon.color ?? const Color(0xFF000000))),
    );
  }
}

class _NavIconPainter extends CustomPainter {
  _NavIconPainter(this.glyph, this.color);

  final NavGlyph glyph;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    // The artboard paths use a 24 x 24 viewBox.
    canvas.scale(size.width / 24, size.height / 24);
    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    switch (glyph) {
      case NavGlyph.explore:
        // <circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>
        canvas.drawCircle(const Offset(12, 12), 9, stroke);
        canvas.drawPath(
          _poly(const [Offset(15.5, 8.5), Offset(13.5, 13.5), Offset(8.5, 15.5), Offset(10.5, 10.5)]),
          stroke,
        );
      case NavGlyph.following:
        // <path d="M7 4h10v16.5l-5-3.6-5 3.6z"/>
        canvas.drawPath(
          _poly(const [Offset(7, 4), Offset(17, 4), Offset(17, 20.5), Offset(12, 16.9), Offset(7, 20.5)]),
          stroke,
        );
      case NavGlyph.ask:
        // Two sparkles: M12 2.5l2.1 5.4L19.5 10l-5.4 2.1L12 17.5l-2.1-5.4L4.5 10l5.4-2.1z
        // and M18.5 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z
        canvas.drawPath(
          _poly(const [
            Offset(12, 2.5), Offset(14.1, 7.9), Offset(19.5, 10), Offset(14.1, 12.1), //
            Offset(12, 17.5), Offset(9.9, 12.1), Offset(4.5, 10), Offset(9.9, 7.9),
          ]),
          stroke,
        );
        canvas.drawPath(
          _poly(const [
            Offset(18.5, 16), Offset(19.2, 17.8), Offset(21, 18.5), Offset(19.2, 19.2), //
            Offset(18.5, 21), Offset(17.8, 19.2), Offset(16, 18.5), Offset(17.8, 17.8),
          ]),
          stroke,
        );
      case NavGlyph.you:
        // <circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.3-3.5 4-5.3 7-5.3s5.7 1.8 7 5.3"/>
        canvas.drawCircle(const Offset(12, 8.5), 3.5, stroke);
        canvas.drawPath(
          Path()
            ..moveTo(5, 20)
            ..cubicTo(6.3, 16.5, 9, 14.7, 12, 14.7)
            ..cubicTo(15, 14.7, 17.7, 16.5, 19, 20),
          stroke,
        );
    }
  }

  static Path _poly(List<Offset> points) => Path()..addPolygon(points, true);

  @override
  bool shouldRepaint(_NavIconPainter old) => old.glyph != glyph || old.color != color;
}
