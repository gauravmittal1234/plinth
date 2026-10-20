import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show CostBreakdown, CostBreakdownClass, CostLine;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/kit_copy.dart';

/// The cost table (DESIGN §4 item 12): each charge with its amount right
/// aligned and, where the server tags it, a quiet note ("often negotiable");
/// then the All-in total above a 1 px line (a real data table may keep its
/// rule), then how far that is over the quote and the rate per sq ft carpet.
///
/// Every row is one screen-reader node: "PLC (park-facing), often
/// negotiable, ₹2.9 L".
class CostTable extends StatelessWidget {
  const CostTable({
    super.key,
    required this.lines,
    required this.allInLabel,
    this.vsQuotedLine,
    this.perSqftCarpetLabel,
    this.totalLabel = KitCopy.allIn,
  });

  /// From `api.cost_breakdown`.
  factory CostTable.fromBreakdown(CostBreakdown cost, {Key? key}) => CostTable(
    key: key,
    lines: cost.lines,
    allInLabel: cost.allInLabel,
    vsQuotedLine: cost.vsQuotedLine,
    perSqftCarpetLabel: cost.perSqftCarpetLabel,
  );

  /// From the project page's static cost (`ProjectPage.cost`).
  factory CostTable.fromProjectCost(CostBreakdownClass cost, {Key? key}) => CostTable(
    key: key,
    lines: cost.lines,
    allInLabel: cost.allInLabel,
    vsQuotedLine: cost.vsQuotedLine,
    perSqftCarpetLabel: cost.perSqftCarpetLabel,
  );

  final List<CostLine> lines;
  final String allInLabel;
  final String? vsQuotedLine;
  final String? perSqftCarpetLabel;
  final String totalLabel;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final label = PlinthType.body.copyWith(color: tokens.ink);
    final amount = label.copyWith(fontWeight: FontWeight.w600);
    final note = PlinthType.small.copyWith(color: tokens.muted);
    final foot = [vsQuotedLine, perSqftCarpetLabel].whereType<String>().join(' · ');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final line in lines)
          MergeSemantics(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(line.label, style: label),
                        if (KitCopy.costTag(line.tag) case final tag?) Text(tag, style: note),
                      ],
                    ),
                  ),
                  const SizedBox(width: PlinthSpace.s16),
                  Flexible(
                    child: Text(line.amountLabel, textAlign: TextAlign.end, style: amount),
                  ),
                ],
              ),
            ),
          ),
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: DecoratedBox(
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: tokens.line)),
            ),
            child: MergeSemantics(
              child: Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Text(totalLabel, style: label.copyWith(fontWeight: FontWeight.w700)),
                    ),
                    const SizedBox(width: PlinthSpace.s16),
                    Flexible(
                      child: Text(
                        allInLabel,
                        textAlign: TextAlign.end,
                        style: PlinthType.number.copyWith(color: tokens.ink),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        if (foot.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(foot, style: PlinthType.small.copyWith(color: tokens.ink2)),
        ],
      ],
    );
  }
}
