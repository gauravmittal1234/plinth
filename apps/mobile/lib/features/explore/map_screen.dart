import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:maplibre_gl/maplibre_gl.dart' show CameraPosition, LatLng;
import 'package:plinth_contracts/plinth_contracts.dart' show ProjectCard, SearchResults;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../app/routes.dart';
import '../../core/widgets/widgets.dart';
import '../../data/search.dart';
import 'map_surface.dart';
import 'project_card_tile.dart';

// Owned by T30 (AppMap artboard). The project map: a MapLibre canvas with no
// basemap tiles in fixtures (map_surface.dart), all-in pins, a peek/half/full
// results sheet (`PeekSheet`, T15) and the legend. Every project in the
// search (`api.search_projects`, same fetch as AppExplore) gets a pin; the
// server's text is reused as-is (pin label, price line, chip).

/// The project map: MapLibre, all-in pins and a peek/half/full results sheet.
class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  bool _riskMode = false;
  String? _selected;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final results = ref.watch(searchProvider(const SearchQuery()));
    return Scaffold(
      backgroundColor: tokens.bg,
      body: results.when(
        data: (r) => _body(context, tokens, r),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: Padding(
            padding: const EdgeInsets.all(PlinthSpace.s24),
            child: Text('The map is not available right now.', style: PlinthType.body.copyWith(color: tokens.ink)),
          ),
        ),
      ),
    );
  }

  Widget _body(BuildContext context, PlinthTokens tokens, SearchResults results) {
    final pins = [
      for (final card in results.items)
        if (card.centroid != null && card.centroid!.length == 2) card,
    ];
    final bounds = MapBounds.of(pins);
    return Stack(
      children: [
        Positioned.fill(
          child: buildMapSurface(
            context,
            initialCamera: CameraPosition(target: LatLng(bounds.centerLat, bounds.centerLon), zoom: 12),
          ),
        ),
        Positioned.fill(child: _pinLayer(tokens, pins, bounds)),
        _topBar(context, tokens, results),
        PeekSheet(
          header: _sheetHeader(tokens, results, pins.length),
          builder: (context, controller) => _sheetList(controller, pins),
        ),
      ],
    );
  }

  Widget _pinLayer(PlinthTokens tokens, List<ProjectCard> pins, MapBounds bounds) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = constraints.biggest;
        return Stack(
          children: [
            for (final card in pins)
              Builder(
                builder: (context) {
                  final at = bounds.project(card.centroid!, size);
                  return Positioned(
                    left: at.dx,
                    top: at.dy,
                    child: FractionalTranslation(
                      translation: const Offset(-0.5, -1),
                      child: _MapPin(
                        card: card,
                        riskMode: _riskMode,
                        selected: _selected == card.slug,
                        onTap: () => setState(() => _selected = _selected == card.slug ? null : card.slug),
                      ),
                    ),
                  );
                },
              ),
          ],
        );
      },
    );
  }

  Widget _topBar(BuildContext context, PlinthTokens tokens, SearchResults results) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(PlinthSpace.s16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Material(
              color: tokens.sheet,
              shape: const CircleBorder(),
              elevation: 0,
              child: IconButton(
                onPressed: () => context.pop(),
                icon: KitIcon(KitGlyph.chevronLeft, color: tokens.ink),
                tooltip: 'Back to Explore',
              ),
            ),
            const SizedBox(width: PlinthSpace.s12),
            Expanded(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: tokens.sheet,
                  borderRadius: BorderRadius.circular(PlinthRadius.panel),
                  boxShadow: tokens.sheetShadow,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(PlinthSpace.s12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (results.legendLine != null)
                        Text(
                          results.legendLine!,
                          style: PlinthType.small.copyWith(color: tokens.ink, fontWeight: FontWeight.w600),
                        ),
                      Text(
                        '"Quoted" means no cost sheet yet.',
                        style: PlinthType.caption.copyWith(color: tokens.ink2),
                      ),
                      const SizedBox(height: PlinthSpace.s8),
                      PlinthSegmented<bool>(
                        semanticLabel: 'Pins show',
                        options: const [SegmentOption(false, 'Price'), SegmentOption(true, 'Delivery risk')],
                        value: _riskMode,
                        onChanged: (v) => setState(() => _riskMode = v),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sheetHeader(PlinthTokens tokens, SearchResults results, int count) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 0, PlinthLayout.gutterPhone, PlinthSpace.s12),
      child: Text(
        '$count ${count == 1 ? 'project' : 'projects'} · ${results.sortLine}',
        style: PlinthType.small.copyWith(color: tokens.ink2),
      ),
    );
  }

  Widget _sheetList(ScrollController controller, List<ProjectCard> pins) {
    return ListView.separated(
      controller: controller,
      padding: const EdgeInsets.fromLTRB(
        PlinthLayout.gutterPhone,
        0,
        PlinthLayout.gutterPhone,
        PlinthSpace.s24,
      ),
      itemCount: pins.length,
      separatorBuilder: (context, i) => const SizedBox(height: PlinthSpace.s12),
      itemBuilder: (context, i) {
        final card = pins[i];
        return ProjectCardTile(
          card: card,
          selected: _selected == card.slug,
          onTap: () => context.push(Routes.projectOf(card.slug)),
        );
      },
    );
  }
}

/// One project's pin: the all-in price (or "Quoted …" when not known yet) by
/// default, or the delivery-risk chip in risk mode. Both are the server's own
/// text (`ProjectCard`); nothing here composes a number.
class _MapPin extends StatelessWidget {
  const _MapPin({required this.card, required this.riskMode, required this.selected, required this.onTap});

  final ProjectCard card;
  final bool riskMode;
  final bool selected;
  final VoidCallback onTap;

  /// The pin's price label: `pin_label` when the server set one, or the
  /// price line's first clause ("Quoted ₹2.25 Cr") otherwise.
  String get _priceLabel => card.pinLabel ?? card.priceLine.split(' · ').first;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final label = riskMode ? card.chip.label : _priceLabel;
    return Semantics(
      container: true,
      button: true,
      selected: selected,
      label: '${card.name}, $label',
      excludeSemantics: true,
      onTap: onTap,
      child: Pressable(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onTap,
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: selected ? tokens.inverse : tokens.bgSolid,
              borderRadius: BorderRadius.circular(PlinthRadius.pill),
              border: Border.all(color: tokens.lineStrong),
              boxShadow: tokens.sheetShadow,
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: PlinthSpace.s12, vertical: PlinthSpace.s8),
              child: riskMode
                  ? RiskChip(chip: card.chip)
                  : Text(
                      label,
                      style: PlinthType.small.copyWith(
                        fontWeight: FontWeight.w700,
                        color: selected ? tokens.onInverse : tokens.ink,
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
