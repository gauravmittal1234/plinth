import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/motion.dart';

/// The two grounds a section band alternates between (DESIGN §4a).
enum BandTone {
  /// `bg`.
  ground,

  /// `track`.
  track,
}

/// A full-bleed section band (DESIGN §4a): one buyer question per band, as a
/// heading (never an eyebrow), a one-to-two-sentence answer, then the band's
/// one instrument and its details. Bands alternate [BandTone]s; the heading,
/// answer and body rise in 80 ms apart, once.
class SectionBand extends StatelessWidget {
  const SectionBand({
    super.key,
    required this.question,
    this.answer,
    this.children = const [],
    this.tone = BandTone.ground,
    this.animate = true,
  });

  /// The buyer's question ("Will it be delivered on time?"); a heading for
  /// screen readers. Two lines or fewer.
  final String question;

  /// The plain answer under it (lead size).
  final String? answer;
  final List<Widget> children;
  final BandTone tone;
  final bool animate;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    Widget rise(int i, Widget child) =>
        animate ? Rise(delay: const Duration(milliseconds: 80) * i, child: child) : child;
    return ColoredBox(
      color: tone == BandTone.track ? tokens.track : tokens.bg,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 56, PlinthLayout.gutterPhone, 48),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            rise(
              0,
              Semantics(
                header: true,
                child: Text(
                  question,
                  style: PlinthType.h1.copyWith(
                    fontSize: 34,
                    height: 1.02,
                    letterSpacing: -0.035 * 34,
                    color: tokens.ink,
                  ),
                ),
              ),
            ),
            if (answer != null) ...[
              const SizedBox(height: 14),
              rise(1, Text(answer!, style: PlinthType.lead.copyWith(height: 1.55, color: tokens.ink))),
            ],
            if (children.isNotEmpty) ...[
              const SizedBox(height: 28),
              rise(
                2,
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: children,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
