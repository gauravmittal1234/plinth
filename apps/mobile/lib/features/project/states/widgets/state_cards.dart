import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../../core/widgets/widgets.dart';
import '../project_states_copy.dart';

/// The chip's overlay flags (`RiskClass.display.overlays`; AppProjectStates'
/// "Stall flag" pill on the hero), e.g. Laurel's Stalled state or Coral's
/// Stale state.
class OverlayFlagRow extends StatelessWidget {
  const OverlayFlagRow({super.key, required this.overlays});

  final List<String> overlays;

  @override
  Widget build(BuildContext context) {
    if (overlays.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 0, PlinthLayout.gutterPhone, PlinthSpace.s24),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [for (final o in overlays) _FlagPill(label: ProjectStatesCopy.overlayLabel(o))],
      ),
    );
  }
}

class _FlagPill extends StatelessWidget {
  const _FlagPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return DecoratedBox(
      decoration: BoxDecoration(color: tokens.track, borderRadius: BorderRadius.circular(PlinthRadius.pill)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        child: Text(label, style: PlinthType.small.copyWith(fontWeight: FontWeight.w600, color: tokens.ink)),
      ),
    );
  }
}

/// "Red-flag rule N" (AppProjectStates' Severe state): `band.rule.line`
/// already carries the assertion-bearing sentence ("Set by red-flag rule 1,
/// not our model: ..."); [catalogue] (`Methodology.red_flag_rules`) adds the
/// published rule's own title when it has loaded.
class RedFlagRuleCard extends StatelessWidget {
  const RedFlagRuleCard({super.key, required this.rule, this.catalogue});

  final c.BandRule rule;
  final List<c.RedFlagRule>? catalogue;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final match = _matchRule(catalogue, rule.code);
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 2, right: 8),
                child: KitIcon(KitGlyph.flag, size: 18, color: tokens.ink2),
              ),
              Expanded(
                child: Text(
                  ProjectStatesCopy.redFlagRuleHeading(match?.n),
                  style: PlinthType.small.copyWith(fontWeight: FontWeight.w700, color: tokens.ink2),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(rule.line, style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink)),
          if (match != null) ...[
            const SizedBox(height: 10),
            Text(
              '${match.title}. ${match.line}',
              style: PlinthType.small.copyWith(color: tokens.ink2, height: 1.4),
            ),
          ],
          const SizedBox(height: 12),
          Text(ProjectStatesCopy.redFlagExplainer, style: PlinthType.small.copyWith(color: tokens.muted, height: 1.4)),
        ],
      ),
    );
  }

  static c.RedFlagRule? _matchRule(List<c.RedFlagRule>? rules, String code) {
    if (rules == null) return null;
    for (final r in rules) {
      if (r.code == code) return r;
    }
    return null;
  }
}

/// The Facts-only banner (AppProjectStates' Facts-only state):
/// `RiskClass.withheld`'s line and explainer, verbatim.
class WithheldNotice extends StatelessWidget {
  const WithheldNotice({super.key, required this.withheld});

  final c.Withheld withheld;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            withheld.line,
            style: PlinthType.body.copyWith(fontWeight: FontWeight.w700, height: 1.4, color: tokens.ink),
          ),
          const SizedBox(height: 8),
          Text(withheld.explainerLine, style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink2)),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 0, PlinthLayout.gutterPhone, PlinthSpace.s24),
      child: DecoratedBox(
        decoration: BoxDecoration(color: tokens.track, borderRadius: BorderRadius.circular(PlinthRadius.panel)),
        child: Padding(padding: const EdgeInsets.all(PlinthSpace.s16), child: child),
      ),
    );
  }
}

/// "The records, as they stand" / "How old is each record?" (AppProjectStates'
/// Stale state): `ProjectPage.records` against `meta.generated_at`, so the
/// 120-day stale line never reads the device clock (AGENTS.md §1).
class RecordsAgeSection extends StatelessWidget {
  const RecordsAgeSection({
    super.key,
    required this.records,
    required this.generatedAt,
    required this.staleDays,
    this.ruleLine,
  });

  final List<c.EvidenceSummary> records;
  final String generatedAt;
  final int staleDays;

  /// `Methodology.data_rules.line`, shown instead of the artboard's static
  /// line once the methodology has loaded.
  final String? ruleLine;

  @override
  Widget build(BuildContext context) {
    if (records.isEmpty) return const SizedBox.shrink();
    final barMax = staleDays * 2;
    return SectionBand(
      question: ProjectStatesCopy.theRecords,
      answer: ruleLine ?? ProjectStatesCopy.staleLine(staleDays),
      children: [
        Text(ProjectStatesCopy.howOldIsEachRecord, style: PlinthType.h3.copyWith(color: PlinthTokens.of(context).ink)),
        const SizedBox(height: PlinthSpace.s16),
        for (final (i, record) in records.indexed) ...[
          if (i > 0) const SizedBox(height: PlinthSpace.s16),
          _RecordRow(record: record, generatedAt: generatedAt, staleDays: staleDays, barMax: barMax),
        ],
      ],
    );
  }
}

class _RecordRow extends StatelessWidget {
  const _RecordRow({required this.record, required this.generatedAt, required this.staleDays, required this.barMax});

  final c.EvidenceSummary record;
  final String generatedAt;
  final int staleDays;
  final int barMax;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final age = _ageDays(record.asOf, generatedAt);
    final stale = age != null && age > staleDays;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(record.chip, style: PlinthType.small.copyWith(fontWeight: FontWeight.w600, color: tokens.ink2)),
        const SizedBox(height: 4),
        Text(record.line, style: PlinthType.body.copyWith(color: tokens.ink)),
        if (age != null) ...[
          const SizedBox(height: 10),
          _AgeBar(fraction: (age / barMax).clamp(0.0, 1.0), markerFraction: (staleDays / barMax).clamp(0.0, 1.0), stale: stale),
          const SizedBox(height: 4),
          Text(
            stale ? '${ProjectStatesCopy.daysOld(age)} · ${ProjectStatesCopy.staleTag}' : ProjectStatesCopy.daysOld(age),
            style: PlinthType.small.copyWith(color: stale ? tokens.ink : tokens.muted, fontWeight: stale ? FontWeight.w700 : null),
          ),
        ],
      ],
    );
  }
}

class _AgeBar extends StatelessWidget {
  const _AgeBar({required this.fraction, required this.markerFraction, required this.stale});

  final double fraction;
  final double markerFraction;
  final bool stale;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return SizedBox(
      height: 8,
      child: Stack(
        children: [
          DecoratedBox(decoration: BoxDecoration(color: tokens.track, borderRadius: BorderRadius.circular(4))),
          FractionallySizedBox(
            widthFactor: fraction,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: stale ? tokens.ink2 : tokens.accentText,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          Align(
            alignment: Alignment(markerFraction * 2 - 1, 0),
            child: Container(width: 1.5, color: tokens.ink),
          ),
        ],
      ),
    );
  }
}

/// Days between [isoDate] and [generatedAt], reading only their Y-M-D
/// prefixes so the count never shifts with the host's time zone (CI runs
/// goldens on Linux; dev runs them on macOS).
int? _ageDays(String? isoDate, String generatedAt) {
  final from = _calendarDate(isoDate);
  final to = _calendarDate(generatedAt);
  if (from == null || to == null) return null;
  return to.difference(from).inDays;
}

DateTime? _calendarDate(String? iso) {
  if (iso == null) return null;
  final m = RegExp(r'^(\d{4})-(\d{2})-(\d{2})').firstMatch(iso);
  if (m == null) return null;
  return DateTime.utc(int.parse(m[1]!), int.parse(m[2]!), int.parse(m[3]!));
}
