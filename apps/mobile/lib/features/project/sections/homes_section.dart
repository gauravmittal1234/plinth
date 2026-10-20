import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/widgets/widgets.dart';
import '../project_copy.dart';
import '../project_format.dart';
import '../widgets/expander.dart';

/// "What are the homes like?": a 3/4 BHK picker over one configuration's
/// facts and room list, then the amenities, commute and "From the developer"
/// explainers (collapsed), and reported waterlogging (visible, G-35).
class ProjectHomesSection extends StatefulWidget {
  const ProjectHomesSection({super.key, required this.homes, this.fromDeveloper});

  final c.Homes homes;
  final c.FromDeveloper? fromDeveloper;

  @override
  State<ProjectHomesSection> createState() => _ProjectHomesSectionState();
}

class _ProjectHomesSectionState extends State<ProjectHomesSection> {
  late int _index = 0;

  @override
  Widget build(BuildContext context) {
    final configs = widget.homes.configurations;
    final config = configs.isEmpty ? null : configs[_index.clamp(0, configs.length - 1)];
    final amenities = widget.homes.amenities;
    final gettingAround = widget.homes.gettingAround;
    final waterlogging = widget.homes.waterlogging;
    final fromDeveloper = widget.fromDeveloper;

    return SectionBand(
      question: ProjectCopy.whatAreHomesLike,
      answer: configs.length < 2
          ? null
          : 'Two layouts in all. Sizes are carpet area: the floor you can use.',
      children: [
        if (configs.length > 1) ...[
          PlinthSegmented<int>(
            semanticLabel: 'Configuration',
            value: _index,
            options: [for (final (i, cfg) in configs.indexed) SegmentOption(i, cfg.label)],
            onChanged: (v) => setState(() => _index = v),
          ),
          const SizedBox(height: PlinthSpace.s20),
        ],
        if (config != null) _ConfigFacts(config: config),
        if (amenities != null || gettingAround != null || fromDeveloper != null) ...[
          const SizedBox(height: PlinthSpace.s24),
          ProjectExpander(
            title: ProjectCopy.amenitiesAndGettingAround,
            children: [
              if (amenities != null) _LaneBlock(items: amenities.items, lane: amenities.lane, sourceLine: amenities.sourceLine),
              if (amenities != null && gettingAround != null) const SizedBox(height: PlinthSpace.s16),
              if (gettingAround != null)
                _LaneBlock(
                  items: gettingAround.items,
                  lane: gettingAround.lane,
                  sourceLine: gettingAround.sourceLine,
                  noteLine: gettingAround.noteLine,
                ),
            ],
          ),
        ],
        if (fromDeveloper != null) ...[
          const SizedBox(height: PlinthSpace.s16),
          ProjectExpander(
            title: ProjectCopy.fromDeveloperPricesAndPlan,
            subtitle: KitCopy.lane(c.Lane.fromDeveloper),
            children: [_FromDeveloperDetail(fromDeveloper: fromDeveloper)],
          ),
        ],
        if (waterlogging != null && waterlogging.reports.isNotEmpty) ...[
          const SizedBox(height: PlinthSpace.s24),
          _Waterlogging(waterlogging: waterlogging),
        ],
      ],
    );
  }
}

class _ConfigFacts extends StatelessWidget {
  const _ConfigFacts({required this.config});

  final c.HomeConfiguration config;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final small = PlinthType.small.copyWith(color: tokens.muted);
    Widget fact(String? line) =>
        line == null ? const SizedBox.shrink() : Padding(padding: const EdgeInsets.only(bottom: 6), child: Text(line, style: small));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (config.carpetLine != null)
          Text(config.carpetLine!, style: PlinthType.numberLg.copyWith(fontSize: 28, color: tokens.ink)),
        const SizedBox(height: PlinthSpace.s8),
        fact(config.superLine == null ? null : '${config.superLine} super · ${config.loadingLine ?? ''}'.trim()),
        fact(config.priceLine),
        if (config.allInLine != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Text(config.allInLine!, style: PlinthType.body.copyWith(fontWeight: FontWeight.w700, color: tokens.ink)),
          )
        else if (config.allInNote != null)
          fact(config.allInNote),
        if (config.rooms != null && config.rooms!.isNotEmpty) ...[
          const SizedBox(height: PlinthSpace.s12),
          for (final room in config.rooms!)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(room, style: PlinthType.body.copyWith(color: tokens.ink2)),
            ),
        ],
      ],
    );
  }
}

class _LaneBlock extends StatelessWidget {
  const _LaneBlock({required this.items, required this.lane, this.sourceLine, this.noteLine});

  final List<String> items;
  final String lane;
  final String? sourceLine;
  final String? noteLine;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        LaneLabel(lane: lane),
        const SizedBox(height: PlinthSpace.s12),
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Text(item, style: PlinthType.body.copyWith(height: 1.4, color: tokens.ink)),
          ),
        if (sourceLine != null) Text(sourceLine!, style: PlinthType.small.copyWith(color: tokens.muted)),
        if (noteLine != null) Text(noteLine!, style: PlinthType.small.copyWith(color: tokens.muted)),
      ],
    );
  }
}

class _FromDeveloperDetail extends StatelessWidget {
  const _FromDeveloperDetail({required this.fromDeveloper});

  final c.FromDeveloper fromDeveloper;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final lists = fromDeveloper.priceLists;
    final plan = fromDeveloper.paymentPlan;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final (i, list) in lists.indexed) ...[
          if (i > 0) const SizedBox(height: PlinthSpace.s12),
          Text(
            '${list.label}, ${formatDisplayDate(list.publishedOn)}:',
            style: PlinthType.small.copyWith(fontWeight: FontWeight.w600, color: tokens.ink2),
          ),
          for (final item in list.items)
            Text(
              '${item.unitLabel}: ${item.priceLine}${item.perSqftLine == null ? '' : ' (${item.perSqftLine})'}',
              style: PlinthType.body.copyWith(color: tokens.ink),
            ),
        ],
        if (plan != null) ...[
          const SizedBox(height: PlinthSpace.s16),
          Text(
            [plan.name, plan.kind].whereType<String>().join(' · '),
            style: PlinthType.small.copyWith(fontWeight: FontWeight.w600, color: tokens.ink2),
          ),
          const SizedBox(height: PlinthSpace.s8),
          for (final stage in plan.stages)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text.rich(
                TextSpan(
                  children: [
                    TextSpan(text: stage.label, style: const TextStyle(fontWeight: FontWeight.w600)),
                    TextSpan(text: '  ${stage.pct.toStringAsFixed(stage.pct == stage.pct.roundToDouble() ? 0 : 1)}%'),
                  ],
                ),
                style: PlinthType.body.copyWith(color: tokens.ink),
              ),
            ),
          if (plan.dueByRegistrationLine != null) ...[
            const SizedBox(height: 6),
            Text(plan.dueByRegistrationLine!, style: PlinthType.small.copyWith(color: tokens.muted)),
          ],
        ],
        if (fromDeveloper.transferPolicy != null) ...[
          const SizedBox(height: PlinthSpace.s16),
          Text(fromDeveloper.transferPolicy!, style: PlinthType.small.copyWith(color: tokens.ink2)),
        ],
      ],
    );
  }
}

class _Waterlogging extends StatelessWidget {
  const _Waterlogging({required this.waterlogging});

  final c.Waterlogging waterlogging;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(ProjectCopy.waterloggingLabel, style: PlinthType.body.copyWith(fontWeight: FontWeight.w700, color: tokens.ink)),
        const SizedBox(height: PlinthSpace.s12),
        Wrap(
          spacing: PlinthSpace.s8,
          runSpacing: PlinthSpace.s8,
          children: [
            for (final r in waterlogging.reports)
              SourceChip(
                label: 'News report · ${formatDisplayDate(r.reportedOn)}',
                onPressed: r.url == null ? null : () => launchUrl(Uri.parse(r.url!), mode: LaunchMode.externalApplication),
              ),
          ],
        ),
        if (waterlogging.noteLine != null) ...[
          const SizedBox(height: PlinthSpace.s12),
          Text(waterlogging.noteLine!, style: PlinthType.small.copyWith(color: tokens.muted)),
        ],
      ],
    );
  }
}
