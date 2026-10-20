import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';

/// A collapsed-by-default disclosure on the page ground (G-18: "Collapsed by
/// default"), for sections that are one tap away rather than always open.
/// Reads as an expanded/collapsed button to screen readers.
class ProjectExpander extends StatefulWidget {
  const ProjectExpander({
    super.key,
    required this.title,
    required this.children,
    this.subtitle,
    this.initiallyExpanded = false,
  });

  final String title;
  final String? subtitle;
  final List<Widget> children;
  final bool initiallyExpanded;

  @override
  State<ProjectExpander> createState() => _ProjectExpanderState();
}

class _ProjectExpanderState extends State<ProjectExpander> {
  late bool _open = widget.initiallyExpanded;

  void _toggle() => setState(() => _open = !_open);

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Semantics(
          container: true,
          button: true,
          expanded: _open,
          label: widget.title,
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
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            widget.title,
                            style: PlinthType.h3.copyWith(color: tokens.ink),
                          ),
                          if (widget.subtitle != null) ...[
                            const SizedBox(height: 2),
                            Text(widget.subtitle!, style: PlinthType.small.copyWith(color: tokens.muted)),
                          ],
                        ],
                      ),
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
          ...widget.children,
        ],
      ],
    );
  }
}
