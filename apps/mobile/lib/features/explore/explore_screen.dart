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
    return ListView(
      padding: const EdgeInsets.fromLTRB(
        PlinthLayout.gutterPhone,
        PlinthSpace.s24,
        PlinthLayout.gutterPhone,
        PlinthSpace.s40,
      ),
      children: [
        Text('Which home are you buying?', style: PlinthType.h1.copyWith(color: tokens.ink)),
        const SizedBox(height: PlinthSpace.s12),
        Text(
          'Check any Gurugram project against its public records. No developer pays us. Ever.',
          style: PlinthType.lead.copyWith(color: tokens.ink2),
        ),
        const SizedBox(height: PlinthSpace.s24),
        _searchField(tokens),
        const SizedBox(height: PlinthSpace.s16),
        _corridorChips(),
        const SizedBox(height: PlinthSpace.s16),
        Row(
          children: [
            Expanded(
              child: PlinthButton(
                label: 'Scan RERA QR',
                kind: PlinthButtonKind.tonal,
                onPressed: () => context.push(Routes.scan),
              ),
            ),
            const SizedBox(width: PlinthSpace.s12),
            Expanded(
              child: PlinthButton(
                label: 'Map',
                kind: PlinthButtonKind.tonal,
                onPressed: () => context.push(Routes.map),
              ),
            ),
          ],
        ),
        const SizedBox(height: PlinthSpace.s24),
        Text(results.sortLine, style: PlinthType.small.copyWith(color: tokens.ink2)),
        const SizedBox(height: PlinthSpace.s12),
        if (items.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: PlinthSpace.s32),
            child: Text('No projects match this search.', style: PlinthType.body.copyWith(color: tokens.ink2)),
          )
        else
          for (final card in items) ...[
            ProjectCardTile(card: card, onTap: () => context.push(Routes.projectOf(card.slug))),
            const SizedBox(height: PlinthSpace.s12),
          ],
      ],
    );
  }

  Widget _searchField(PlinthTokens tokens) {
    return DecoratedBox(
      decoration: BoxDecoration(color: tokens.track, borderRadius: BorderRadius.circular(PlinthRadius.pill)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: PlinthSpace.s16),
        child: Row(
          children: [
            Icon(Icons.search, color: tokens.ink2, size: PlinthLayout.iconMd),
            const SizedBox(width: PlinthSpace.s8),
            Expanded(
              child: TextField(
                controller: _queryController,
                onChanged: (v) => setState(() => _query = v),
                style: PlinthType.body.copyWith(color: tokens.ink),
                decoration: InputDecoration(
                  isCollapsed: true,
                  border: InputBorder.none,
                  hintText: 'Project, developer or sector',
                  hintStyle: PlinthType.body.copyWith(color: tokens.ink2),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // A Wrap, not a scrolling row: with 3 corridors it never needs one, and the
  // app's test harness (scrollIntoView) assumes a single Scrollable per
  // screen.
  Widget _corridorChips() {
    return Wrap(
      spacing: PlinthSpace.s8,
      runSpacing: PlinthSpace.s8,
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
