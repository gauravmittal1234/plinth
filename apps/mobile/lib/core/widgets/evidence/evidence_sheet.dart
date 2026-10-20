import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show Evidence, Lane;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/glyphs.dart';
import '../foundation/kit_copy.dart';
import '../foundation/motion.dart';
import '../primitives/buttons.dart';
import '../primitives/rows.dart';
import '../primitives/sheet.dart';

/// Opens the evidence sheet for one fact (AppRisk; API_CONTRACTS §4.6).
Future<void> showEvidenceSheet(
  BuildContext context, {
  required Evidence evidence,
  String? fact,
  String? subtitle,
  String? highlight,
  VoidCallback? onOpenOriginal,
  VoidCallback? onOpenArchive,
  VoidCallback? onReportError,
  VoidCallback? onCopyCitation,
}) {
  return showPlinthSheet<void>(
    context: context,
    builder: (_) => EvidenceSheet(
      evidence: evidence,
      fact: fact,
      subtitle: subtitle,
      highlight: highlight,
      onOpenOriginal: onOpenOriginal,
      onOpenArchive: onOpenArchive,
      onReportError: onReportError,
      onCopyCitation: onCopyCitation,
    ),
  );
}

/// The evidence sheet's content (AppRisk, the page's signature move): the
/// source chip's label as the heading, the lane as a tone label, the fact,
/// then where it comes from, its dates, the extract, how we read it, where
/// it is used, the developer's note and corrections; then the original and
/// our archived copy, "Report an error" and "Copy citation".
///
/// Every line is the server's `plinth.evidence/1` copy; the field names are
/// the artboard's layout copy ([KitCopy]).
class EvidenceSheet extends StatefulWidget {
  const EvidenceSheet({
    super.key,
    required this.evidence,
    this.fact,
    this.subtitle,
    this.highlight,
    this.onOpenOriginal,
    this.onOpenArchive,
    this.onReportError,
    this.onCopyCitation,
    this.onClose,
  });

  final Evidence evidence;

  /// The sentence this evidence backs (the reason's text), set large.
  final String? fact;

  /// A quiet line under the heading ("Evidence for reason 2 of 4").
  final String? subtitle;

  /// A figure in the extract to mark ("72%"): an accent-soft highlighter
  /// wipes in behind it shortly after the sheet opens.
  final String? highlight;
  final VoidCallback? onOpenOriginal;
  final VoidCallback? onOpenArchive;
  final VoidCallback? onReportError;
  final VoidCallback? onCopyCitation;

  /// Defaults to popping the sheet.
  final VoidCallback? onClose;

  @override
  State<EvidenceSheet> createState() => _EvidenceSheetState();
}

class _EvidenceSheetState extends State<EvidenceSheet> {
  bool _copied = false;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final e = widget.evidence;
    // App UI v2 sheet pattern: each field is a row with an icon tile, its
    // name in `meta` and its value in `body`, grouped on one rounded field.
    Widget field(IconData icon, String term, Widget value) => MergeSemantics(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: PlinthSpace.s16, vertical: PlinthSpace.s12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            PlinthIconTile(icon: icon, tone: tokens.bgSolid),
            const SizedBox(width: PlinthSpace.s12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(term, style: PlinthType.meta.copyWith(color: tokens.ink2)),
                  const SizedBox(height: 2),
                  value,
                ],
              ),
            ),
          ],
        ),
      ),
    );
    final dd = PlinthType.body.copyWith(color: tokens.ink);
    final extract = e.extract;
    return Semantics(
      scopesRoute: true,
      namesRoute: true,
      explicitChildNodes: true,
      label: e.chip,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PlinthSheetHeader(
            leading: PlinthIconTile(
              icon: KitGlyph.document.icon,
              size: 48,
              tone: tokens.accentSoft,
              color: tokens.onAccentSoft,
            ),
            title: e.chip,
            subtitle: widget.subtitle,
            onClose: widget.onClose,
            closeLabel: KitCopy.closeEvidence,
          ),
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterApp, PlinthSpace.s16, PlinthLayout.gutterApp, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: LaneLabel(lane: e.lane),
                  ),
                  if (widget.fact != null) ...[
                    const SizedBox(height: PlinthSpace.s12),
                    Text(widget.fact!, style: PlinthType.h3.copyWith(color: tokens.ink)),
                  ],
                  if (extract != null) ...[
                    const SizedBox(height: PlinthSpace.s16),
                    Text(
                      e.page == null ? KitCopy.evidenceExtract : '${KitCopy.evidenceExtract} · ${e.page}',
                      style: PlinthType.meta.copyWith(color: tokens.ink2),
                    ),
                    const SizedBox(height: 6),
                    _Extract(text: extract, highlight: widget.highlight),
                  ],
                  const SizedBox(height: PlinthSpace.s16),
                  PlinthGroup(
                    tone: tokens.track,
                    gapTone: tokens.sheet,
                    children: [
                      field(Icons.description_rounded, KitCopy.evidenceSource, Text(e.document, style: dd)),
                      field(Icons.event_rounded, KitCopy.evidenceDates, Text(e.datesLine, style: dd)),
                      if (e.readLine != null)
                        field(Icons.lightbulb_rounded, KitCopy.evidenceRead, Text(e.readLine!, style: dd)),
                      if (e.usedIn.isNotEmpty)
                        field(Icons.link_rounded, KitCopy.evidenceUsedIn, Text(e.usedIn.join(' · '), style: dd)),
                      field(
                        KitGlyph.speech.icon,
                        KitCopy.evidenceDeveloperNote,
                        Text(e.developerSays?.line ?? KitCopy.evidenceNoDeveloperNote, style: dd),
                      ),
                      field(Icons.edit_note_rounded, KitCopy.evidenceCorrections, Text(e.correctionsLine, style: dd)),
                    ],
                  ),
                  if (e.officialUrl != null) ...[
                    const SizedBox(height: PlinthSpace.s20),
                    PlinthButton(
                      label: e.viewLabel ?? KitCopy.openOriginal,
                      glyph: KitGlyph.external,
                      expand: true,
                      onPressed: widget.onOpenOriginal,
                    ),
                  ],
                  const SizedBox(height: PlinthSpace.s16),
                  PlinthGroup(
                    tone: tokens.track,
                    gapTone: tokens.sheet,
                    children: [
                      if (e.snapshot != null)
                        PlinthListRow(
                          leading: PlinthIconTile(icon: Icons.inventory_2_rounded, tone: tokens.bgSolid),
                          title: KitCopy.archivedCopy,
                          navigates: true,
                          onTap: widget.onOpenArchive,
                        ),
                      PlinthListRow(
                        leading: PlinthIconTile(icon: Icons.flag_rounded, tone: tokens.bgSolid),
                        title: KitCopy.reportError,
                        navigates: true,
                        onTap: widget.onReportError,
                      ),
                      PlinthListRow(
                        leading: PlinthIconTile(
                          icon: _copied ? Icons.check_rounded : Icons.content_copy_rounded,
                          tone: tokens.bgSolid,
                        ),
                        title: _copied ? KitCopy.citationCopied : KitCopy.copyCitation,
                        onTap: () {
                          setState(() => _copied = true);
                          widget.onCopyCitation?.call();
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// A fact's lane as a tone label ("Records show" with a check).
class LaneLabel extends StatelessWidget {
  const LaneLabel({super.key, required this.lane});

  /// A `core.lane` value.
  final String lane;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return DecoratedBox(
      decoration: BoxDecoration(color: tokens.chipFill, borderRadius: BorderRadius.circular(PlinthRadius.pill)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        child: Text.rich(
          TextSpan(
            children: [
              WidgetSpan(
                alignment: PlaceholderAlignment.middle,
                child: KitIcon(
                  lane == Lane.recordsShow ? KitGlyph.check : KitGlyph.speech,
                  size: 16,
                  color: tokens.ink,
                ),
              ),
              const WidgetSpan(child: SizedBox(width: 6)),
              TextSpan(text: KitCopy.lane(lane)),
            ],
          ),
          style: PlinthType.meta.copyWith(fontWeight: FontWeight.w600, color: tokens.ink),
        ),
      ),
    );
  }
}

/// The extract on a `track` block; [highlight] gets the highlighter wipe.
class _Extract extends StatefulWidget {
  const _Extract({required this.text, this.highlight});

  final String text;
  final String? highlight;

  @override
  State<_Extract> createState() => _ExtractState();
}

class _ExtractState extends State<_Extract> with SingleTickerProviderStateMixin {
  // 0.45 s delay, then a 0.7 s wipe (AppRisk pl-wipe).
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1150));
  late final Animation<double> _wipe = CurvedAnimation(
    parent: _c,
    curve: const Interval(450 / 1150, 1, curve: PlinthMotion.easeOut),
  );
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (KitMotion.reduced(context)) {
      _c.value = 1;
    } else {
      _c.forward();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final style = PlinthType.body.copyWith(color: tokens.ink);
    final h = widget.highlight;
    final at = h == null || h.isEmpty ? -1 : widget.text.indexOf(h);
    final Widget text;
    if (at < 0) {
      text = Text(widget.text, style: style);
    } else {
      text = Text.rich(
        TextSpan(
          children: [
            TextSpan(text: widget.text.substring(0, at)),
            WidgetSpan(
              alignment: PlaceholderAlignment.baseline,
              baseline: TextBaseline.alphabetic,
              child: AnimatedBuilder(
                animation: _wipe,
                builder: (context, child) =>
                    CustomPaint(painter: _WipePainter(_wipe.value, tokens.accentSoft), child: child),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: Text(
                    h!,
                    style: style.copyWith(fontWeight: FontWeight.w700, color: tokens.onAccentSoft),
                  ),
                ),
              ),
            ),
            TextSpan(text: widget.text.substring(at + h.length)),
          ],
        ),
        style: style,
      );
    }
    return DecoratedBox(
      decoration: BoxDecoration(color: tokens.track, borderRadius: BorderRadius.circular(PlinthRadius.button)),
      child: Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14), child: text),
    );
  }
}

class _WipePainter extends CustomPainter {
  _WipePainter(this.t, this.color);

  final double t;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    if (t <= 0) return;
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, size.width * t, size.height), const Radius.circular(4)),
      Paint()..color = color,
    );
  }

  @override
  bool shouldRepaint(_WipePainter old) => old.t != t || old.color != color;
}
