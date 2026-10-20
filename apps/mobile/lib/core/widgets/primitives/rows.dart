import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/motion.dart';

/// A rounded square holding one rounded icon (app UI v2): 40 dp, radius 12,
/// on a tone (`track` by default) with the icon in ink. It anchors list
/// rows and sheet hints the way Thapki's icon tiles do.
class PlinthIconTile extends StatelessWidget {
  const PlinthIconTile({super.key, required this.icon, this.size = PlinthLayout.iconTile, this.tone, this.color});

  final IconData icon;
  final double size;

  /// The tile's fill.
  final Color? tone;

  /// The icon's colour.
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return ExcludeSemantics(
      child: Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        decoration: BoxDecoration(color: tone ?? tokens.track, borderRadius: BorderRadius.circular(PlinthRadius.tile)),
        child: Icon(
          icon,
          size: size >= PlinthLayout.iconTile ? PlinthLayout.iconMd + 2 : PlinthLayout.iconMd,
          color: color ?? tokens.ink,
        ),
      ),
    );
  }
}

/// A card (app UI v2): radius 20 on `panel`, 16–20 padding, no border and no
/// shadow at rest (DESIGN §0). With [onTap] the whole card is one button,
/// with press feedback.
class PlinthCard extends StatelessWidget {
  const PlinthCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(PlinthLayout.cardPaddingLg),
    this.tone,
    this.semanticLabel,
  });

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;

  /// The fill; `panel` by default.
  final Color? tone;

  /// The card's screen-reader name when it is a button.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final radius = BorderRadius.circular(PlinthRadius.card);
    final card = Material(
      color: tone ?? tokens.panel,
      borderRadius: radius,
      clipBehavior: Clip.antiAlias,
      child: onTap == null
          ? Padding(padding: padding, child: child)
          : InkWell(
              onTap: onTap,
              child: Padding(padding: padding, child: child),
            ),
    );
    if (onTap == null) return card;
    return Semantics(
      container: true,
      button: true,
      label: semanticLabel,
      excludeSemantics: semanticLabel != null,
      onTap: onTap,
      child: Pressable(child: card),
    );
  }
}

/// One list row (app UI v2): at least 64 tall, a leading icon tile or
/// thumbnail, a [title] in `rowTitle` with an optional [subtitle] in `meta`,
/// and a trailing widget — a chevron when it [navigates], a switch, or
/// nothing. The whole row is one tap target.
class PlinthListRow extends StatelessWidget {
  const PlinthListRow({
    super.key,
    required this.title,
    this.subtitle,
    this.subtitleColor,
    this.leading,
    this.trailing,
    this.onTap,
    this.navigates = false,
    this.semanticLabel,
    this.toggled,
    this.enabled = true,
  });

  final String title;
  final String? subtitle;

  /// An inline status colour for the subtitle (Thapki's "35 min late").
  final Color? subtitleColor;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;

  /// Shows a trailing chevron: the row opens another screen or sheet.
  final bool navigates;

  /// Overrides the row's screen-reader label (title and subtitle).
  final String? semanticLabel;

  /// A switch row's state, for screen readers.
  final bool? toggled;

  /// Dims the title and subtitle; the row still answers a tap.
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final fg = enabled ? tokens.ink : tokens.muted;
    final row = ConstrainedBox(
      constraints: const BoxConstraints(minHeight: PlinthLayout.rowMin),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: PlinthSpace.s16, vertical: PlinthSpace.s12),
        child: Row(
          children: [
            if (leading != null) ...[leading!, const SizedBox(width: PlinthSpace.s16)],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title, style: PlinthType.rowTitle.copyWith(color: fg)),
                  if (subtitle != null && subtitle!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: PlinthType.meta.copyWith(color: enabled ? (subtitleColor ?? tokens.ink2) : tokens.muted),
                    ),
                  ],
                ],
              ),
            ),
            if (trailing != null) ...[const SizedBox(width: PlinthSpace.s12), trailing!],
            if (navigates) ...[
              const SizedBox(width: PlinthSpace.s8),
              ExcludeSemantics(
                child: Icon(Icons.chevron_right_rounded, size: PlinthLayout.iconLg, color: tokens.ink2),
              ),
            ],
          ],
        ),
      ),
    );
    final label = semanticLabel ?? [title, if (subtitle != null && subtitle!.isNotEmpty) subtitle!].join(', ');
    if (onTap == null) {
      return Semantics(container: true, label: label, toggled: toggled, excludeSemantics: true, child: row);
    }
    return Semantics(
      container: true,
      button: toggled == null,
      toggled: toggled,
      label: label,
      excludeSemantics: true,
      onTap: onTap,
      child: InkWell(onTap: onTap, child: row),
    );
  }
}

/// Rows grouped on one rounded `panel` (app UI v2's grouped list): radius 20,
/// rows separated by a 2 dp tone step rather than a hairline (DESIGN §0).
class PlinthGroup extends StatelessWidget {
  const PlinthGroup({super.key, required this.children, this.tone, this.gapTone});

  final List<Widget> children;

  /// The rows' fill; `panel` by default.
  final Color? tone;

  /// The colour that shows between rows; the page ground by default.
  final Color? gapTone;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return ClipRRect(
      borderRadius: BorderRadius.circular(PlinthRadius.card),
      child: ColoredBox(
        color: gapTone ?? tokens.bg,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < children.length; i++) ...[
              if (i > 0) const SizedBox(height: 2),
              Material(color: tone ?? tokens.panel, child: children[i]),
            ],
          ],
        ),
      ),
    );
  }
}

/// A tinted hint row (app UI v2 sheets): an icon tile, a bold line and an
/// optional quieter one, on `accentSoft`, radius 16.
class PlinthHintRow extends StatelessWidget {
  const PlinthHintRow({super.key, required this.icon, required this.title, this.subtitle});

  final IconData icon;
  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return MergeSemantics(
      child: Container(
        padding: const EdgeInsets.all(PlinthSpace.s12),
        decoration: BoxDecoration(color: tokens.accentSoft, borderRadius: BorderRadius.circular(PlinthRadius.button)),
        child: Row(
          children: [
            PlinthIconTile(icon: icon, tone: tokens.bgSolid, color: tokens.onAccentSoft),
            const SizedBox(width: PlinthSpace.s12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title, style: PlinthType.rowTitle.copyWith(color: tokens.onAccentSoft)),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(subtitle!, style: PlinthType.meta.copyWith(color: tokens.onAccentSoft)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A section heading inside a screen (app UI v2 `section`: Bricolage 20/25 ·
/// 700) with an optional quiet line under it — never an eyebrow above it.
class PlinthSectionHeading extends StatelessWidget {
  const PlinthSectionHeading(this.text, {super.key, this.subtitle});

  final String text;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Semantics(
          header: true,
          child: Text(text, style: PlinthType.section.copyWith(color: tokens.ink)),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(subtitle!, style: PlinthType.meta.copyWith(color: tokens.ink2)),
        ],
      ],
    );
  }
}
