import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show ProjectCard, SearchResults;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../app/routes.dart';
import '../../core/widgets/widgets.dart';
import '../../data/search.dart';
import 'project_card_tile.dart';

// Owned by T30 (AppExplore artboard; docs/engineering/briefs/T30.md). Search,
// corridor chips and the project list, all-in price first. Every fact (name,
// price, delivery risk, how much is built) is `api.search_projects`'s own
// text (DESIGN §5b); this screen only lays it out and never reorders what
// the server returns ("Order never follows money", `results.sortLine`).

/// A corridor chip: narrows the already-fetched list by its locality text.
/// The fixture world has no search engine for arbitrary filters (T17), so
/// corridor and free-text narrowing both happen on the one fetched page.
enum _Corridor {
  all('All of Gurugram', null),
  dwarka('Dwarka Expressway', 'Dwarka Expressway'),
  newGurugram('New Gurugram', 'New Gurugram');

  const _Corridor(this.label, this.match);

  final String label;
  final String? match;
}

/// Tab 1: search, corridor chips and project cards, all-in price first.
class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  final _queryController = TextEditingController();
  _Corridor _corridor = _Corridor.all;
  String _query = '';

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  List<ProjectCard> _filtered(List<ProjectCard> items) {
    final q = _query.trim().toLowerCase();
    return [
      for (final card in items)
        if ((_corridor.match == null || card.localityLine.contains(_corridor.match!)) &&
            (q.isEmpty ||
                card.name.toLowerCase().contains(q) ||
                card.developerName.toLowerCase().contains(q) ||
                card.localityLine.toLowerCase().contains(q)))
          card,
    ];
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final results = ref.watch(searchProvider(const SearchQuery()));
    return Scaffold(
      backgroundColor: tokens.bg,
      body: SafeArea(
        child: results.when(
          data: (r) => _body(context, tokens, r),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stackTrace) => Center(
            child: Padding(
              padding: const EdgeInsets.all(PlinthSpace.s24),
              child: Text('Explore is not available right now.', style: PlinthType.body.copyWith(color: tokens.ink)),
            ),
          ),
        ),
      ),
    );
  }

  Widget _body(BuildContext context, PlinthTokens tokens, SearchResults results) {
    final items = _filtered(results.items);
    Widget gutter(Widget child) => Padding(
      padding: const EdgeInsets.symmetric(horizontal: PlinthLayout.gutterApp),
      child: child,
    );
    return ListView(
      padding: const EdgeInsets.only(top: PlinthSpace.s16, bottom: PlinthSpace.s24),
      children: [
        gutter(
          Semantics(
            header: true,
            child: Text('Which home are you buying?', style: PlinthType.title.copyWith(color: tokens.ink)),
          ),
        ),
        const SizedBox(height: PlinthSpace.s8),
        gutter(
          Text(
            'Check any Gurugram project against its public records. No developer pays us. Ever.',
            style: PlinthType.body.copyWith(color: tokens.ink2),
          ),
        ),
        const SizedBox(height: PlinthSpace.s20),
        gutter(
          PlinthSearchField(
            controller: _queryController,
            hint: 'Project, developer or sector',
            onChanged: (v) => setState(() => _query = v),
          ),
        ),
        const SizedBox(height: PlinthSpace.s12),
        _corridorChips(),
        const SizedBox(height: PlinthSpace.s12),
        gutter(
          Row(
            children: [
              Expanded(
                child: PlinthButton(
                  label: 'Scan RERA QR',
                  icon: Icons.qr_code_scanner_rounded,
                  kind: PlinthButtonKind.tonal,
                  expand: true,
                  onPressed: () => context.push(Routes.scan),
                ),
              ),
              const SizedBox(width: PlinthSpace.s12),
              Expanded(
                child: PlinthButton(
                  label: 'Map',
                  icon: Icons.map_rounded,
                  kind: PlinthButtonKind.tonal,
                  expand: true,
                  onPressed: () => context.push(Routes.map),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: PlinthSpace.s32),
        gutter(
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 1),
                child: Icon(Icons.sort_rounded, size: PlinthLayout.iconMd, color: tokens.ink2),
              ),
              const SizedBox(width: PlinthSpace.s8),
              Expanded(
                child: Text(results.sortLine, style: PlinthType.meta.copyWith(color: tokens.ink2)),
              ),
            ],
          ),
        ),
        const SizedBox(height: PlinthSpace.s12),
        if (items.isEmpty)
          gutter(
            Padding(
              padding: const EdgeInsets.symmetric(vertical: PlinthSpace.s32),
              child: Text('No projects match this search.', style: PlinthType.body.copyWith(color: tokens.ink2)),
            ),
          )
        else
          for (final card in items) ...[
            gutter(ProjectCardTile(card: card, onTap: () => context.push(Routes.projectOf(card.slug)))),
            const SizedBox(height: PlinthSpace.s12),
          ],
      ],
    );
  }

  // One horizontally scrolling row (app UI v2): never wraps onto a second
  // line. A SingleChildScrollView, not a ListView, so the page's one
  // ListView stays the screen's main list.
  Widget _corridorChips() {
    return PlinthChipRow(
      padding: const EdgeInsets.symmetric(horizontal: PlinthLayout.gutterApp),
      children: [
        for (final corridor in _Corridor.values)
          PlinthPill(
            label: corridor.label,
            selected: _corridor == corridor,
            onPressed: () => setState(() => _corridor = corridor),
          ),
      ],
    );
  }
}
