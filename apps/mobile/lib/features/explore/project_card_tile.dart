import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show ProjectCard;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../core/widgets/widgets.dart';

/// One project, all-in price first (DESIGN §5b; AppExplore, AppMap; app UI
/// v2 card): the illustrative thumbnail, name and locality, a trailing
/// chevron, the delivery risk chip and its note, the price line, and how much
/// is built as an icon line. A High or Severe band adds a left accent bar in
/// the band's ink. Every string is the server's (`ProjectCard`); this only
/// lays them out. Shared by the Explore list and the map's results sheet.
class ProjectCardTile extends StatelessWidget {
  const ProjectCardTile({super.key, required this.card, this.onTap, this.selected = false});

  final ProjectCard card;
  final VoidCallback? onTap;

  /// Highlighted because this project's map pin is selected.
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final state = RiskState.ofChip(card.chip);
    // Hard states only: the band says it, so the bar follows the payload's
    // own meter step, never a label.
    final accent = state.isBand && state.step >= RiskState.high.step ? state.colors(tokens).ink : null;
    final statusLine = card.progressLine ?? card.completionLine;
    final body = Padding(
      padding: const EdgeInsets.all(PlinthLayout.cardPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ProjectThumb(imageUrl: card.imageUrl),
              const SizedBox(width: PlinthSpace.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      card.name,
                      style: PlinthType.rowTitle.copyWith(fontSize: 17, height: 22 / 17, color: tokens.ink),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${card.developerName} · ${card.localityLine}',
                      style: PlinthType.meta.copyWith(color: tokens.ink2),
                    ),
                  ],
                ),
              ),
              if (onTap != null) ...[
                const SizedBox(width: PlinthSpace.s8),
                Icon(Icons.chevron_right_rounded, size: PlinthLayout.iconLg, color: tokens.ink2),
              ],
            ],
          ),
          const SizedBox(height: PlinthSpace.s16),
          // The chip, not a Row: a long non-band label ("Not enough history
          // to score · no penalty") needs to wrap, which a Row's non-flexible
          // child cannot do.
          RiskChip(chip: card.chip),
          if (card.chipNote != null) ...[
            const SizedBox(height: 6),
            Text(card.chipNote!, style: PlinthType.caption.copyWith(color: tokens.ink2)),
          ],
          const SizedBox(height: PlinthSpace.s12),
          Text(card.priceLine, style: PlinthType.rowTitle.copyWith(color: tokens.ink)),
          if (statusLine != null) ...[
            const SizedBox(height: 6),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 1),
                  child: Icon(
                    card.progressLine != null ? Icons.apartment_rounded : Icons.event_rounded,
                    size: 18,
                    color: tokens.ink2,
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(statusLine, style: PlinthType.meta.copyWith(color: tokens.ink2)),
                ),
              ],
            ),
          ],
        ],
      ),
    );
    return Semantics(
      container: true,
      button: onTap != null,
      label: '${card.name}, ${card.priceLine}',
      excludeSemantics: true,
      onTap: onTap,
      child: Pressable(
        enabled: onTap != null,
        child: Material(
          color: selected ? tokens.track : tokens.panel,
          borderRadius: BorderRadius.circular(PlinthRadius.card),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: accent == null
                ? body
                : Stack(
                    children: [
                      body,
                      PositionedDirectional(
                        start: 0,
                        top: 0,
                        bottom: 0,
                        child: ColoredBox(color: accent, child: const SizedBox(width: 4)),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
