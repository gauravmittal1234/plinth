import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/glyphs.dart';
import '../foundation/kit_copy.dart';
import '../foundation/motion.dart';

/// The replay slider (DESIGN §4b; AppProject): the quarter shown, set large,
/// with "Report 8 of 8 shown", a slider over every QPR quarter and the first
/// and last quarter under it. Screen readers hear the quarter's label as the
/// slider's value. Pair it with [ReplayStepButtons] for one-tap steps.
class ReplaySlider extends StatelessWidget {
  const ReplaySlider({
    super.key,
    required this.labels,
    required this.index,
    required this.onChanged,
    this.positionLabel,
  }) : assert(labels.length > 1, 'at least two quarters');

  /// One label per quarter, oldest first ("Apr–Jun 2026").
  final List<String> labels;
  final int index;
  final ValueChanged<int> onChanged;

  /// Defaults to "Report 8 of 8 shown".
  final String? positionLabel;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final quiet = PlinthType.small.copyWith(color: tokens.muted);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.end,
          spacing: PlinthSpace.s12,
          children: [
            ExcludeSemantics(
              child: Text(
                labels[index],
                style: PlinthType.h1.copyWith(fontSize: 34, letterSpacing: -0.035 * 34, color: tokens.ink),
              ),
            ),
            Text(positionLabel ?? KitCopy.reportOf(index, labels.length), style: quiet),
          ],
        ),
        const SizedBox(height: PlinthSpace.s8),
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            activeTrackColor: tokens.accent,
            inactiveTrackColor: tokens.slabOff,
            thumbColor: tokens.accent,
            overlayColor: tokens.accent.withValues(alpha: 0.12),
            activeTickMarkColor: tokens.onAccent.withValues(alpha: 0.6),
            inactiveTickMarkColor: tokens.emptyBorder,
            trackHeight: 4,
          ),
          child: Slider(
            value: index.toDouble(),
            min: 0,
            max: (labels.length - 1).toDouble(),
            divisions: labels.length - 1,
            onChanged: (v) => onChanged(v.round()),
            semanticFormatterCallback: (v) => labels[v.round()],
          ),
        ),
        ExcludeSemantics(
          child: Row(
            children: [
              Expanded(
                child: Text(labels.first, style: PlinthType.caption.copyWith(color: tokens.muted)),
              ),
              Expanded(
                child: Text(
                  labels.last,
                  textAlign: TextAlign.end,
                  style: PlinthType.caption.copyWith(color: tokens.muted),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Earlier / Later report: two 44 dp round step buttons beside the tower.
/// Each is disabled at its end of the quarters.
class ReplayStepButtons extends StatelessWidget {
  const ReplayStepButtons({
    super.key,
    required this.index,
    required this.count,
    required this.onChanged,
    this.earlierLabel = KitCopy.earlierReport,
    this.laterLabel = KitCopy.laterReport,
  });

  final int index;
  final int count;
  final ValueChanged<int> onChanged;
  final String earlierLabel;
  final String laterLabel;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _StepButton(
          glyph: KitGlyph.chevronLeft,
          label: earlierLabel,
          onPressed: index > 0 ? () => onChanged(index - 1) : null,
        ),
        const SizedBox(width: 6),
        _StepButton(
          glyph: KitGlyph.chevronRight,
          label: laterLabel,
          onPressed: index < count - 1 ? () => onChanged(index + 1) : null,
        ),
      ],
    );
  }
}

class _StepButton extends StatelessWidget {
  const _StepButton({required this.glyph, required this.label, required this.onPressed});

  final KitGlyph glyph;
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final enabled = onPressed != null;
    return Semantics(
      container: true,
      button: true,
      enabled: enabled,
      label: label,
      excludeSemantics: true,
      onTap: onPressed,
      child: Pressable(
        enabled: enabled,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onPressed,
          // 44 dp visible circle inside a 48 dp target.
          child: SizedBox.square(
            dimension: PlinthLayout.touchApp,
            child: Center(
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(color: tokens.bgSolid, shape: BoxShape.circle),
                alignment: Alignment.center,
                child: KitIcon(glyph, size: 20, color: enabled ? tokens.ink : tokens.disabledFg.withValues(alpha: 0.5)),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
