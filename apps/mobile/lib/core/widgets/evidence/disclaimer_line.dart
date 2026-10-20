import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../primitives/buttons.dart';

/// A labelled action for a row of links.
@immutable
class KitLink {
  const KitLink(this.label, this.onPressed);

  final String label;
  final VoidCallback? onPressed;
}

/// The disclaimer (DESIGN §4 item 10): `meta.disclaimer_line` ("Our opinion,
/// based on public records. Not a credit rating. Not issued by any RERA."),
/// at 16 px and never collapsed, then its links (Report an error, How we
/// make money) as underlined ink links.
class DisclaimerLine extends StatelessWidget {
  const DisclaimerLine({super.key, required this.line, this.links = const [], this.metaLine});

  final String line;
  final List<KitLink> links;

  /// A quiet line after the links ("Data as of 14 Oct 2026 · Model v1.2").
  final String? metaLine;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(line, style: PlinthType.body.copyWith(color: tokens.ink)),
        if (links.isNotEmpty)
          Wrap(
            spacing: PlinthSpace.s20,
            children: [
              for (final l in links)
                PlinthButton(label: l.label, kind: PlinthButtonKind.tertiary, onPressed: l.onPressed),
            ],
          ),
        if (metaLine != null) Text(metaLine!, style: PlinthType.small.copyWith(color: tokens.muted)),
      ],
    );
  }
}
