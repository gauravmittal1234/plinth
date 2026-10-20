import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show ProjectCard;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../core/widgets/widgets.dart';

/// One project, all-in price first (DESIGN §5b; AppExplore, AppMap): name and
/// locality, delivery risk chip, price line and how much is built. Every
/// string is the server's (`ProjectCard`); this only lays them out. Shared by
/// the Explore list and the map's results sheet.
class ProjectCardTile extends StatelessWidget {
  const ProjectCardTile({super.key, required this.card, this.onTap, this.selected = false});

  final ProjectCard card;
  final VoidCallback? onTap;

  /// Highlighted because this project's map pin is selected.
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
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
          borderRadius: BorderRadius.circular(PlinthRadius.panel),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(PlinthSpace.s16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(card.name, style: PlinthType.h3.copyWith(color: tokens.ink)),
                  const SizedBox(height: PlinthSpace.s4),
                  Text(
                    '${card.developerName} · ${card.localityLine}',
                    style: PlinthType.small.copyWith(color: tokens.ink2),
                  ),
                  const SizedBox(height: PlinthSpace.s12),
                  // The chip, not a Row: a long non-band label ("Not enough
                  // history to score · no penalty") needs to wrap, which a
                  // Row's non-flexible child cannot do.
                  RiskChip(chip: card.chip),
                  if (card.chipNote != null) ...[
                    const SizedBox(height: PlinthSpace.s4),
                    Text(card.chipNote!, style: PlinthType.caption.copyWith(color: tokens.ink2)),
                  ],
                  const SizedBox(height: PlinthSpace.s8),
                  Text(
                    card.priceLine,
                    style: PlinthType.body.copyWith(fontWeight: FontWeight.w700, color: tokens.ink),
                  ),
                  if (card.progressLine != null) ...[
                    const SizedBox(height: PlinthSpace.s8),
                    Text(card.progressLine!, style: PlinthType.small.copyWith(color: tokens.ink2)),
                  ] else if (card.completionLine != null) ...[
                    const SizedBox(height: PlinthSpace.s8),
                    Text(card.completionLine!, style: PlinthType.small.copyWith(color: tokens.ink2)),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
