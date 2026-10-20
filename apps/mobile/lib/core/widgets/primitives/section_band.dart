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

/// A full-bleed section band (DESIGN §4a; app UI v2): one buyer question per
/// band, as a `section` heading (Bricolage 20/25 · 700, never an eyebrow), a
/// one-to-two-sentence answer in `body`, then the band's one instrument and
/// its details. Bands alternate [BandTone]s with a 32 dp section gap and the
/// 20 dp app gutter; the heading, answer and body rise in 80 ms apart, once.
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
        padding: const EdgeInsets.fromLTRB(
          PlinthLayout.gutterApp,
          PlinthLayout.sectionGapAppMin,
          PlinthLayout.gutterApp,
          PlinthLayout.sectionGapAppMin,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            rise(
              0,
              Semantics(
                header: true,
                child: Text(question, style: PlinthType.section.copyWith(color: tokens.ink)),
              ),
            ),
            if (answer != null) ...[
              const SizedBox(height: PlinthSpace.s8),
              rise(1, Text(answer!, style: PlinthType.body.copyWith(color: tokens.ink))),
            ],
            if (children.isNotEmpty) ...[
              const SizedBox(height: PlinthSpace.s20),
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
