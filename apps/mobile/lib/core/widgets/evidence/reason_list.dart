import 'dart:ui' show SemanticsRole;

import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show Reason, SourceRef;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/motion.dart';
import 'source_chip.dart';

/// The reasons behind a band (AppRisk "Why Elevated?"; DESIGN §0): a real
/// ordered list, strongest first, with no index numbers on screen; order is
/// shown by position. Each reason is one sentence with its factor group
/// written in ("**Finances:** 72% of units sold, 41% built."), then its
/// source chips.
///
/// Screen readers get a list of [reasons.length] items. Renders nothing when
/// there are no reasons (Limited history, Not scored, a withheld band).
class ReasonList extends StatelessWidget {
  const ReasonList({
    super.key,
    required this.reasons,
    required this.onSource,
    this.ground = SourceChipGround.page,
    this.animate = true,
  });

  /// `RiskSummary.reasons` (at most 4), in the server's order.
  final List<Reason> reasons;

  /// Opens the evidence for one source of one reason.
  final void Function(Reason reason, SourceRef source) onSource;
  final SourceChipGround ground;

  /// Reasons rise in one after another (reduced motion: they are just there).
  final bool animate;

  @override
  Widget build(BuildContext context) {
    if (reasons.isEmpty) return const SizedBox.shrink();
    final tokens = PlinthTokens.of(context);
    final text = PlinthType.lead.copyWith(height: 1.5, color: tokens.ink);
    return Semantics(
      role: SemanticsRole.list,
      container: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final (i, r) in reasons.indexed) ...[
            if (i > 0) const SizedBox(height: 28),
            _maybeRise(
              i,
              Semantics(
                role: SemanticsRole.listItem,
                container: true,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: '${r.factorLabel}:',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          TextSpan(text: ' ${r.text}'),
                        ],
                      ),
                      style: text,
                    ),
                    if (r.sources.isNotEmpty)
                      Wrap(
                        spacing: PlinthSpace.s8,
                        children: [
                          for (final s in r.sources)
                            SourceChip.fromRef(s, ground: ground, onPressed: () => onSource(r, s)),
                        ],
                      ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _maybeRise(int i, Widget child) => animate ? Rise(delay: Rise.step(i), child: child) : child;
}
