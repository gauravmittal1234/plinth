import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show DeveloperResponse, PendingFact;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/glyphs.dart';
import '../foundation/motion.dart';

/// "Developer says" (DESIGN §0): a claim tone field (`claimBg`, radius 8)
/// with a speech icon and its label, never a dashed outline, so a claim
/// never looks like a record.
class DeveloperSaysField extends StatelessWidget {
  const DeveloperSaysField({super.key, required this.label, this.text, this.note, this.compact = false});

  /// The developer's reply on a risk summary: its label line
  /// ("Developer says · not yet verified · 15 Oct 2026 · …") and its words.
  factory DeveloperSaysField.fromResponse(DeveloperResponse response, {Key? key, String? note}) =>
      DeveloperSaysField(key: key, label: response.line, text: response.text, note: note);

  /// The label line, set beside the speech icon.
  final String label;

  /// The developer's own words, shown in quotes.
  final String? text;

  /// A quiet line under the words (who said it, what the records show).
  final String? note;

  /// AppProject's smaller field (16 px padding, 15 px text).
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final words = text;
    return DecoratedBox(
      decoration: BoxDecoration(color: tokens.claimBg, borderRadius: BorderRadius.circular(PlinthRadius.panel)),
      child: Padding(
        padding: compact ? const EdgeInsets.symmetric(horizontal: 16, vertical: 14) : const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: KitIcon(KitGlyph.speech, size: compact ? 16 : 20, color: tokens.ink2),
                ),
                Expanded(
                  child: Text(
                    label,
                    style: PlinthType.small.copyWith(fontWeight: FontWeight.w600, color: tokens.ink2),
                  ),
                ),
              ],
            ),
            if (words != null) ...[
              SizedBox(height: compact ? 4 : 10),
              Text(
                '“$words”',
                style: PlinthType.body.copyWith(fontSize: compact ? 15 : 17, color: tokens.ink),
              ),
            ],
            if (note != null) ...[
              const SizedBox(height: 10),
              Text(note!, style: PlinthType.small.copyWith(color: tokens.muted)),
            ],
          ],
        ),
      ),
    );
  }
}

/// "From the developer · not verified by Plinth" (AppProject): a claim-tone
/// pill that opens a claim-tone panel holding what the developer added in its
/// workspace. Expanded state is announced to screen readers.
class FromDeveloperBlock extends StatefulWidget {
  const FromDeveloperBlock({
    super.key,
    required this.label,
    required this.children,
    this.note,
    this.initiallyExpanded = false,
  });

  /// The lane label (`FromDeveloper.label`).
  final String label;

  /// A line on what this is and that it never moves the band.
  final String? note;
  final List<Widget> children;
  final bool initiallyExpanded;

  @override
  State<FromDeveloperBlock> createState() => _FromDeveloperBlockState();
}

class _FromDeveloperBlockState extends State<FromDeveloperBlock> {
  late bool _open = widget.initiallyExpanded;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final turns = _open ? 0.5 : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Semantics(
          container: true,
          button: true,
          expanded: _open,
          label: widget.label,
          excludeSemantics: true,
          onTap: _toggle,
          child: Pressable(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: _toggle,
              child: Container(
                constraints: const BoxConstraints(minHeight: 56),
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                decoration: BoxDecoration(
                  color: tokens.claimBg,
                  borderRadius: BorderRadius.circular(PlinthRadius.pill),
                ),
                child: Row(
                  children: [
                    KitIcon(KitGlyph.speech, size: 18, color: tokens.ink),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        widget.label,
                        style: PlinthType.body.copyWith(fontWeight: FontWeight.w600, height: 1.3, color: tokens.ink),
                      ),
                    ),
                    const SizedBox(width: 10),
                    AnimatedRotation(
                      turns: turns,
                      duration: KitMotion.of(context, const Duration(milliseconds: 200)),
                      child: KitIcon(KitGlyph.chevronDown, size: 20, color: tokens.ink),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        if (_open) ...[
          const SizedBox(height: 10),
          DecoratedBox(
            decoration: BoxDecoration(color: tokens.claimBg, borderRadius: BorderRadius.circular(PlinthRadius.panel)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
              child: DefaultTextStyle.merge(
                style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (widget.note != null) ...[
                      Text(widget.note!, style: PlinthType.small.copyWith(height: 1.5, color: tokens.ink2)),
                      const SizedBox(height: 14),
                    ],
                    for (final (i, child) in widget.children.indexed) ...[if (i > 0) const SizedBox(height: 14), child],
                  ],
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  void _toggle() => setState(() => _open = !_open);
}

/// A public fact that may move the band (AppProject, AppRisk): a clock, the
/// fact in bold, the marker line, and the developer's claim about it in a
/// small claim field. Never the proposed band.
class PendingFactNote extends StatelessWidget {
  const PendingFactNote({super.key, required this.fact});

  final PendingFact fact;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final style = PlinthType.body.copyWith(color: tokens.ink);
    final said = fact.developerSays;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 3, right: 10),
              child: KitIcon(KitGlyph.clock, size: 20, color: tokens.ink),
            ),
            Expanded(
              child: Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: fact.line,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    if (fact.markerLine != null) TextSpan(text: ' ${fact.markerLine}'),
                  ],
                ),
                style: style,
              ),
            ),
          ],
        ),
        if (said != null) ...[const SizedBox(height: 10), DeveloperSaysField(label: said.line, compact: true)],
      ],
    );
  }
}
