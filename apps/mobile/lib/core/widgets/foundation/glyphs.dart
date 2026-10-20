import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

/// The icons the kit names, each a Material *rounded* icon (app UI v2,
/// benchmark-thapki.md: `Icons.*_rounded` everywhere, never mixed with
/// outlined or sharp). 24 dp in navigation and buttons, 20 dp inline.
enum KitGlyph {
  /// Source chips: a document.
  document(Icons.description_rounded),

  /// "Developer says" and "From the developer": a speech bubble.
  speech(Icons.chat_bubble_outline_rounded),

  /// A pending fact: a clock.
  clock(Icons.schedule_rounded),

  /// A band set by a red-flag rule.
  flag(Icons.flag_rounded),

  /// "Records show".
  check(Icons.check_rounded),

  /// Opens the authority's page.
  external(Icons.open_in_new_rounded),
  close(Icons.close_rounded),
  chevronLeft(Icons.chevron_left_rounded),
  chevronRight(Icons.chevron_right_rounded),
  chevronDown(Icons.expand_more_rounded),
  share(Icons.share_rounded),

  /// Ask Plinth.
  sparkle(Icons.auto_awesome_rounded),

  /// Follow.
  bookmark(Icons.bookmark_add_rounded),

  /// Following.
  bookmarkAdded(Icons.bookmark_added_rounded),

  /// A next step.
  arrowRight(Icons.arrow_forward_rounded),

  /// A band change ("Was Moderate until 2 Oct 2026").
  trend(Icons.trending_up_rounded);

  const KitGlyph(this.icon);

  /// The Material rounded icon drawn for this glyph.
  final IconData icon;
}

/// A [KitGlyph] at [size] in [color] (the ambient [IconTheme] colour when
/// null). Decorative: screen readers skip it; label the control instead.
class KitIcon extends StatelessWidget {
  const KitIcon(this.glyph, {super.key, this.size = PlinthLayout.iconLg, this.color});

  final KitGlyph glyph;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? IconTheme.of(context).color ?? PlinthTokens.of(context).ink;
    return ExcludeSemantics(
      child: SizedBox.square(
        dimension: size,
        child: Icon(glyph.icon, size: size, color: c),
      ),
    );
  }
}
