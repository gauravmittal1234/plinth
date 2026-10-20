import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../project_copy.dart';

/// "How much is built?": the replay tower, the signature move of this page
/// (G-33). A Tower picker redraws the 3D tower for that tower alone; the
/// replay slider and its step buttons move through every QPR on file.
class ProjectBuiltSection extends StatefulWidget {
  const ProjectBuiltSection({super.key, required this.progress, required this.answer});

  final c.ProjectProgress progress;

  /// `RiskClass.progress.line` ("41% built · 77% of the promised time used ·
  /// 72% sold"): the one line that already combines what `ProjectProgress`
  /// only carries per quarter.
  final String answer;

  @override
  State<ProjectBuiltSection> createState() => _ProjectBuiltSectionState();
}

class _ProjectBuiltSectionState extends State<ProjectBuiltSection> {
  late int _index = widget.progress.quarters.length - 1;

  /// null = "All".
  String? _tower;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final progress = widget.progress;
    final quarters = progress.quarters;
    final quarter = quarters[_index];
    final floors = progress.floorsPerTower ?? 20;
    final towers = progress.towers ?? const [];
    final perTowerSlabs = quarter.towers?[_tower];

    final int builtSlabs;
    String? towerSentence;
    String? towerNote;
    if (_tower == null || perTowerSlabs == null) {
      builtSlabs = ((quarter.builtPct ?? 0) / 100 * floors).round();
      if (_tower != null) towerNote = quarter.noteLine ?? ProjectCopy.phaseWideQuarter;
    } else {
      builtSlabs = perTowerSlabs;
      towerSentence = ProjectCopy.towerSlab(_tower!, builtSlabs, floors);
    }

    return SectionBand(
      question: ProjectCopy.howMuchBuilt,
      answer: widget.answer,
      children: [
        if (towers.isNotEmpty) ...[
          PlinthSegmented<String?>(
            semanticLabel: ProjectCopy.tower,
            value: _tower,
            options: [
              SegmentOption<String?>(null, ProjectCopy.towerAll),
              for (final t in towers) SegmentOption<String?>(t, t),
            ],
            onChanged: (v) => setState(() => _tower = v),
          ),
          const SizedBox(height: PlinthSpace.s20),
        ],
        if (towerSentence != null) ...[
          Text(
            towerSentence,
            style: PlinthType.numberLg.copyWith(fontSize: 28, letterSpacing: -0.03 * 28, color: tokens.accentText),
          ),
          const SizedBox(height: PlinthSpace.s16),
        ],
        Center(
          child: TowerStack(built: builtSlabs, floors: floors, height: 320),
        ),
        const SizedBox(height: PlinthSpace.s20),
        Row(
          children: [
            if (towerSentence == null)
              Expanded(child: FactTile(label: ProjectCopy.built, value: '${quarter.builtPct?.round() ?? 0}%', valueColor: tokens.accentText)),
            Expanded(child: FactTile(label: ProjectCopy.sold, value: '${quarter.soldPct?.round() ?? 0}%')),
            Expanded(child: FactTile(label: ProjectCopy.timeUsed, value: '${quarter.timeUsedPct?.round() ?? 0}%')),
          ],
        ),
        const SizedBox(height: PlinthSpace.s24),
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: ReplaySlider(
                labels: [for (final q in quarters) q.label],
                index: _index,
                onChanged: (v) => setState(() => _index = v),
              ),
            ),
            const SizedBox(width: PlinthSpace.s12),
            ReplayStepButtons(index: _index, count: quarters.length, onChanged: (v) => setState(() => _index = v)),
          ],
        ),
        const SizedBox(height: PlinthSpace.s12),
        Text(
          'HARERA QPR · ${quarter.label}',
          style: PlinthType.small.copyWith(color: tokens.muted),
        ),
        if (quarter.noteLine != null || towerNote != null) ...[
          const SizedBox(height: 6),
          Text(
            '${ProjectCopy.onRecordThatQuarter}: ${towerNote ?? quarter.noteLine}',
            style: PlinthType.small.copyWith(color: tokens.ink2),
          ),
        ],
        if (progress.lateFilingsLine != null) ...[
          const SizedBox(height: PlinthSpace.s12),
          Text(progress.lateFilingsLine!, style: PlinthType.small.copyWith(color: tokens.muted)),
        ],
      ],
    );
  }
}
