import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../risk_copy.dart';

/// "Northfield before RERA, from court orders and news" (AppRisk, fix-
/// project2.md §2(d)): a collapsed-by-default disclosure of what the
/// developer group built before RERA, from `PreRera` — never counted in the
/// band (`pre_rera.line`).
///
/// Renders nothing when there is nothing to show.
class RiskPreReraSection extends StatefulWidget {
  const RiskPreReraSection({super.key, required this.preRera});

  final c.PreRera? preRera;

  @override
  State<RiskPreReraSection> createState() => _RiskPreReraSectionState();
}

class _RiskPreReraSectionState extends State<RiskPreReraSection> {
  bool _open = false;

  void _toggle() => setState(() => _open = !_open);

  @override
  Widget build(BuildContext context) {
    final preRera = widget.preRera;
    if (preRera == null || preRera.items.isEmpty) return const SizedBox.shrink();
    final tokens = PlinthTokens.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 0, PlinthLayout.gutterPhone, PlinthSpace.s24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Semantics(
            container: true,
            button: true,
            expanded: _open,
            label: RiskCopy.beforeRera,
            excludeSemantics: true,
            onTap: _toggle,
            child: Pressable(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: _toggle,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(minHeight: PlinthLayout.touchApp),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(RiskCopy.beforeRera, style: PlinthType.h3.copyWith(color: tokens.ink)),
                      ),
                      const SizedBox(width: 10),
                      AnimatedRotation(
                        turns: _open ? 0.5 : 0,
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
            const SizedBox(height: PlinthSpace.s16),
            for (final (i, item) in preRera.items.indexed) ...[
              if (i > 0) const SizedBox(height: PlinthSpace.s16),
              _PreReraItemTile(item: item),
            ],
            const SizedBox(height: PlinthSpace.s16),
            Text(preRera.line, style: PlinthType.small.copyWith(color: tokens.muted)),
          ],
        ],
      ),
    );
  }
}

class _PreReraItemTile extends StatelessWidget {
  const _PreReraItemTile({required this.item});

  final c.PreReraItem item;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final sources = item.sources;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text.rich(
          TextSpan(
            children: [
              TextSpan(
                text: '${item.name}: ',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              TextSpan(text: item.line),
            ],
          ),
          style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink),
        ),
        if (sources != null && sources.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(sources.join(' · '), style: PlinthType.small.copyWith(color: tokens.muted)),
        ],
      ],
    );
  }
}
