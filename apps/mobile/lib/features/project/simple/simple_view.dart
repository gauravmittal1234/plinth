import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../../../data/trust.dart';
import '../project_copy.dart';
import '../project_format.dart';
import 'project_tts.dart';

/// One block of the Simple view (G-27): a heading and a plain-language body,
/// read aloud as one sentence.
class _Block {
  const _Block(this.heading, this.body);

  final String heading;
  final String body;

  String get spoken => '$heading. $body';
}

/// The large-type alternative view (G-27): the band, the keys range, the
/// less-certain line (also the text alternative to the icon array's hatch),
/// 3 reasons with plain sources, 3 next steps, Follow and a way back. "Read
/// this aloud" steps through its 6 blocks with [ProjectTts], highlighting the
/// one being read; a tap stops it mid-sentence.
class SimpleProjectView extends ConsumerStatefulWidget {
  const SimpleProjectView({
    super.key,
    required this.projectName,
    required this.risk,
    required this.nextSteps,
    required this.onBackToFullPage,
    required this.onFollow,
    required this.followed,
  });

  final String projectName;
  final c.RiskClass risk;
  final c.NextSteps nextSteps;
  final VoidCallback onBackToFullPage;
  final VoidCallback onFollow;
  final bool followed;

  @override
  ConsumerState<SimpleProjectView> createState() => _SimpleProjectViewState();
}

class _SimpleProjectViewState extends ConsumerState<SimpleProjectView> {
  int? _activeBlock;
  int _session = 0;

  List<_Block> _blocks(List<String> bandLabels) {
    final risk = widget.risk;
    final band = risk.band;
    final frequency = risk.frequency;

    final bandBody = band == null
        ? risk.chip.label
        : 'Step ${band.step} of our five, from ${bandLabels.isEmpty ? 'Low' : bandLabels.first} to '
              '${bandLabels.isEmpty ? 'Severe' : bandLabels.last}.';

    final keysBody = frequency == null
        ? risk.late12.line
        : 'Promised: ${formatYearMonth(risk.late12.originalCompletion)}. Out of every 100 similar projects, '
              '${frequency.low} to ${frequency.high} got the OC after ${formatYearMonth(risk.late12.lateAfter)}.';

    final confidenceBody = risk.confidence?.line ?? frequency?.referenceClassLine ?? risk.late12.ocNotKeysLine;

    final reasons = risk.reasons.take(3).toList();
    final reasonsBody = reasons.isEmpty
        ? 'No reasons are shown for this state.'
        : reasons
              .map((r) => '${r.text} Source: ${r.sources.isEmpty ? 'HARERA records' : r.sources.first.label}.')
              .join(' ');

    final steps = widget.nextSteps.steps.take(3).toList();
    final stepsBody = steps.isEmpty ? widget.nextSteps.introLine : steps.map((s) => '${s.heading} ${s.body}').join(' ');

    final followBody = widget.followed
        ? 'You are following this project.'
        : 'Follow this project to hear when its delivery risk changes.';

    return [
      _Block('Delivery risk: ${risk.chip.label}', bandBody),
      _Block('When might we get the keys?', keysBody),
      _Block("We're less certain about this one", confidenceBody),
      _Block('Why ${risk.chip.label}?', reasonsBody),
      _Block(ProjectCopy.soWhatNow, stepsBody),
      _Block(ProjectCopy.follow, followBody),
    ];
  }

  Future<void> _start(List<_Block> blocks) async {
    final mySession = ++_session;
    final tts = ref.read(projectTtsProvider);
    for (var i = 0; i < blocks.length; i++) {
      if (mySession != _session || !mounted) return;
      setState(() => _activeBlock = i);
      await tts.speak(blocks[i].spoken);
      if (mySession != _session || !mounted) return;
    }
    if (mounted) setState(() => _activeBlock = null);
  }

  void _stop() {
    _session++;
    ref.read(projectTtsProvider).stop();
    setState(() => _activeBlock = null);
  }

  @override
  void dispose() {
    _session++;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final bands = ref.watch(bandsProvider).value;
    final labels = bands == null ? const <String>[] : [for (final b in bands) b.label];
    final blocks = _blocks(labels);
    final reading = _activeBlock != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, PlinthSpace.s16, PlinthLayout.gutterPhone, 0),
          child: Text(
            '${widget.projectName} · large-text view',
            style: PlinthType.small.copyWith(color: tokens.muted),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, PlinthSpace.s16, PlinthLayout.gutterPhone, 0),
          child: PlinthButton(
            label: reading ? ProjectCopy.stopReading : ProjectCopy.readAloud,
            glyph: KitGlyph.sparkle,
            kind: PlinthButtonKind.tonal,
            onPressed: reading ? _stop : () => _start(blocks),
          ),
        ),
        if (reading) ...[
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: PlinthLayout.gutterPhone),
            child: Text(ProjectCopy.readingLanguage, style: PlinthType.caption.copyWith(color: tokens.muted)),
          ),
        ],
        const SizedBox(height: PlinthSpace.s16),
        for (final (i, block) in blocks.indexed)
          _SimpleBlock(block: block, active: _activeBlock == i),
        const SizedBox(height: PlinthSpace.s24),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: PlinthLayout.gutterPhone),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              PlinthButton(
                label: widget.followed ? ProjectCopy.following : ProjectCopy.follow,
                pressed: widget.followed,
                onPressed: widget.onFollow,
              ),
              const SizedBox(height: PlinthSpace.s12),
              PlinthButton(
                label: ProjectCopy.fullPageLabel,
                kind: PlinthButtonKind.tertiary,
                onPressed: widget.onBackToFullPage,
              ),
            ],
          ),
        ),
        const SizedBox(height: PlinthSpace.s32),
      ],
    );
  }
}

class _SimpleBlock extends StatelessWidget {
  const _SimpleBlock({required this.block, required this.active});

  final _Block block;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 0, PlinthLayout.gutterPhone, PlinthSpace.s20),
      child: AnimatedContainer(
        duration: KitMotion.of(context, PlinthMotion.fade),
        padding: const EdgeInsets.all(PlinthSpace.s16),
        decoration: BoxDecoration(
          color: active ? tokens.accentSoft : Colors.transparent,
          borderRadius: BorderRadius.circular(PlinthRadius.panel),
        ),
        child: Semantics(
          container: true,
          liveRegion: active,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                block.heading,
                style: PlinthType.h2.copyWith(fontSize: 24, color: active ? tokens.onAccentSoft : tokens.ink),
              ),
              const SizedBox(height: PlinthSpace.s8),
              Text(
                block.body,
                style: PlinthType.body.copyWith(
                  fontSize: 21,
                  height: 1.5,
                  color: active ? tokens.onAccentSoft : tokens.ink,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
