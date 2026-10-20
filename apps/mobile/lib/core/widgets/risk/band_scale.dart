import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/kit_copy.dart';
import 'risk_state.dart';

/// The band scale (L), DESIGN §4 item 6 and AppRisk: five bars in a row,
/// Low to Severe. The current band is a 22 px bar in band ink with a 2 px ink
/// outline 3 px out; the others are 12 px bars in band fill with a band-ink
/// edge. The band names sit underneath.
///
/// [labels] are the five band names from the server (`Methodology.bands`),
/// lowest first. A non-band [state] marks no bar.
class BandScale extends StatelessWidget {
  const BandScale({super.key, required this.labels, required this.state, this.semanticLabel})
    : assert(labels.length == 5, 'five band names, Low to Severe');

  final List<String> labels;
  final RiskState state;

  /// Defaults to "Delivery risk scale from Low to Severe. This project:
  /// Elevated, step 3 of 5."
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final current = state.isBand ? state.step : null;
    final label =
        semanticLabel ??
        KitCopy.bandScale(
          labels.first,
          labels.last,
          current: current == null ? null : labels[current - 1],
          step: current,
        );
    return Semantics(
      container: true,
      image: true,
      label: label,
      excludeSemantics: true,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (var i = 0; i < 5; i++) ...[
            if (i > 0) const SizedBox(width: PlinthSpace.s8),
            Expanded(
              child: _Column(band: RiskState.bands[i], label: labels[i], current: current == i + 1, tokens: tokens),
            ),
          ],
        ],
      ),
    );
  }
}

class _Column extends StatelessWidget {
  const _Column({required this.band, required this.label, required this.current, required this.tokens});

  final RiskState band;
  final String label;
  final bool current;
  final PlinthTokens tokens;

  @override
  Widget build(BuildContext context) {
    final colors = band.colors(tokens);
    final height = current ? PlinthComponents.bandScaleCurrentBarHeight : PlinthComponents.bandScaleBarHeight;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        CustomPaint(
          size: Size(double.infinity, height),
          painter: _BarPainter(
            fill: current ? colors.ink : colors.fill,
            edge: current ? null : colors.ink,
            outline: current ? tokens.ink : null,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          label,
          textAlign: TextAlign.center,
          style: PlinthType.small.copyWith(
            height: 1.2,
            fontWeight: current ? FontWeight.w700 : FontWeight.w400,
            color: current ? tokens.ink : tokens.ink2,
          ),
        ),
      ],
    );
  }
}

class _BarPainter extends CustomPainter {
  _BarPainter({required this.fill, this.edge, this.outline});

  final Color fill;
  final Color? edge;
  final Color? outline;

  @override
  void paint(Canvas canvas, Size size) {
    final r = Radius.circular(size.height / 2);
    final bar = RRect.fromRectAndRadius(Offset.zero & size, r);
    canvas.drawRRect(bar, Paint()..color = fill);
    if (edge != null) {
      canvas.drawRRect(
        bar.deflate(0.5),
        Paint()
          ..color = edge!
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1,
      );
    }
    if (outline != null) {
      const w = PlinthComponents.bandScaleCurrentOutline;
      const gap = PlinthComponents.bandScaleCurrentOutlineOffset;
      final ring = bar.inflate(gap + w / 2);
      canvas.drawRRect(
        RRect.fromRectAndRadius(ring.outerRect, Radius.circular(ring.height / 2)),
        Paint()
          ..color = outline!
          ..style = PaintingStyle.stroke
          ..strokeWidth = w,
      );
    }
  }

  @override
  bool shouldRepaint(_BarPainter old) => old.fill != fill || old.edge != edge || old.outline != outline;
}
