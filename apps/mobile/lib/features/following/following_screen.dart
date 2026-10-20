import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../app/routes.dart';
import '../../core/widgets/widgets.dart';
import '../../data/follow.dart';
import '../../data/session.dart';
import '../onboarding/sign_in_sheet.dart';
import 'change_item_tile.dart';
import 'follow_type_sheet.dart';
import 'following_copy.dart';

/// Key for the screen's root, so other tests can find it without depending
/// on fixture copy or sign-in state (AGENTS.md pitfall note; `AppRisk`'s
/// `riskScreenKey` is the precedent).
const followingScreenKey = Key('app-following-screen');

/// Tab 2: what changed in the projects you follow (WORK_BREAKDOWN T50).
///
/// Opens on Updates, the same "Since you last looked" block as
/// WebFollowing (F-93). Browsing never forces sign-in (DESIGN §2.6): signed
/// out, this shows an inline prompt instead of the feed.
class FollowingScreen extends ConsumerStatefulWidget {
  const FollowingScreen({super.key});

  @override
  ConsumerState<FollowingScreen> createState() => _FollowingScreenState();
}

enum _Tab { projects, updates }

class _FollowingScreenState extends ConsumerState<FollowingScreen> {
  _Tab _tab = _Tab.updates;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final signedIn = ref.watch(signedInProvider);
    return Scaffold(
      key: followingScreenKey,
      backgroundColor: tokens.bg,
      body: SafeArea(
        child: !signedIn
            ? _SignedOut(onSignIn: () => showSignInSheet(context, next: Routes.following))
            : _Loaded(tab: _tab, onTab: (t) => setState(() => _tab = t)),
      ),
    );
  }
}

class _SignedOut extends StatelessWidget {
  const _SignedOut({required this.onSignIn});

  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(PlinthSpace.s24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              FollowingCopy.title,
              style: PlinthType.h1.copyWith(color: tokens.ink),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: PlinthSpace.s12),
            Text(
              FollowingCopy.signInToSeeFollows,
              style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink2),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: PlinthSpace.s20),
            PlinthButton(label: FollowingCopy.signIn, onPressed: onSignIn),
          ],
        ),
      ),
    );
  }
}

class _Loaded extends ConsumerWidget {
  const _Loaded({required this.tab, required this.onTab});

  final _Tab tab;
  final ValueChanged<_Tab> onTab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final feedAsync = ref.watch(followingFeedProvider);
    return switch (feedAsync) {
      AsyncData(value: final cached?) => _Feed(feed: cached.value, tab: tab, onTab: onTab),
      AsyncError() => Center(
        child: Padding(
          padding: const EdgeInsets.all(PlinthSpace.s24),
          child: PlinthButton(label: 'Try again', onPressed: () => ref.invalidate(followingFeedProvider)),
        ),
      ),
      _ => Center(child: CircularProgressIndicator(color: tokens.accent)),
    };
  }
}

class _Feed extends ConsumerWidget {
  const _Feed({required this.feed, required this.tab, required this.onTab});

  final c.FollowingFeed feed;
  final _Tab tab;
  final ValueChanged<_Tab> onTab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 40, PlinthLayout.gutterPhone, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: Text(FollowingCopy.title, style: PlinthType.h1.copyWith(fontSize: 48, color: tokens.ink)),
                  ),
                  IconButton(
                    tooltip: FollowingCopy.alertSettings,
                    onPressed: () {},
                    icon: Icon(Icons.tune, color: tokens.ink),
                  ),
                ],
              ),
              const SizedBox(height: PlinthSpace.s12),
              Text(
                '${feed.projects.length} projects · alerts in the app and on WhatsApp',
                style: PlinthType.body.copyWith(color: tokens.ink),
              ),
              const SizedBox(height: PlinthSpace.s8),
              // Who is actually in the circle is api.family_circle's job
              // (no read contract or fixture yet, T45a); this is a plain
              // link, not a membership claim.
              InkWell(
                onTap: () => context.push(Routes.family),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: PlinthSpace.s8),
                  child: Row(
                    children: [
                      Icon(Icons.group_outlined, size: 22, color: tokens.ink),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          FollowingCopy.familyCircle,
                          style: PlinthType.small.copyWith(fontSize: 15, color: tokens.ink),
                        ),
                      ),
                      Icon(Icons.chevron_right, color: tokens.ink),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: PlinthSpace.s12),
              PlinthSegmented<_Tab>(
                options: [
                  const SegmentOption(_Tab.projects, FollowingCopy.projectsTab),
                  SegmentOption(
                    _Tab.updates,
                    '${FollowingCopy.updatesTab}${feed.changes.isEmpty ? '' : ' ${feed.changes.length}'}',
                  ),
                ],
                value: tab,
                onChanged: onTab,
                semanticLabel: 'Show',
              ),
            ],
          ),
        ),
        if (tab == _Tab.projects) _ProjectsSection(feed: feed) else _UpdatesSection(feed: feed),
      ],
    );
  }
}

class _ProjectsSection extends StatelessWidget {
  const _ProjectsSection({required this.feed});

  final c.FollowingFeed feed;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 40, PlinthLayout.gutterPhone, 56),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(FollowingCopy.howAreProjectsDoing, style: PlinthType.h2.copyWith(color: tokens.ink)),
          const SizedBox(height: PlinthSpace.s8),
          Text(FollowingCopy.projectsIntro, style: PlinthType.small.copyWith(color: tokens.ink2)),
          for (final project in feed.projects) _ProjectRow(project: project),
          const SizedBox(height: PlinthSpace.s8),
          Text(FollowingCopy.imagesIllustrative, style: PlinthType.small.copyWith(color: tokens.muted)),
        ],
      ),
    );
  }
}

class _ProjectRow extends StatelessWidget {
  const _ProjectRow({required this.project});

  final c.FollowedProject project;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final name = project.name ?? project.slug;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: PlinthSpace.s12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: () => context.push(Routes.projectOf(project.slug)),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: PlinthType.h3.copyWith(fontSize: 18, color: tokens.ink)),
                  const SizedBox(height: 6),
                  RiskChip(chip: project.chip),
                  const SizedBox(height: 6),
                  Text(project.rowLine, style: PlinthType.body.copyWith(height: 1.4, color: tokens.ink)),
                  if (project.freshnessLine != null) ...[
                    const SizedBox(height: 2),
                    Text(project.freshnessLine!, style: PlinthType.small.copyWith(color: tokens.muted)),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: PlinthSpace.s8),
          Wrap(
            spacing: 10,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              _FollowTypePill(slug: project.slug, name: name, fallbackType: project.followType),
              if (project.familyLine != null)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.group_outlined, size: 16, color: tokens.muted),
                    const SizedBox(width: 6),
                    Text(project.familyLine!, style: PlinthType.small.copyWith(color: tokens.muted)),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FollowTypePill extends ConsumerWidget {
  const _FollowTypePill({required this.slug, required this.name, required this.fallbackType});

  final String slug;
  final String name;

  /// `FollowedProject.followType`, from when the feed last loaded: used
  /// until the live [followTypeProvider] (set by the follow-type sheet) has
  /// a value of its own.
  final String fallbackType;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final booked = (ref.watch(followTypeProvider(slug)) ?? fallbackType) == c.FollowType.booked;
    return PlinthPill(
      label: booked ? 'Booked here' : 'Just watching',
      selected: false,
      onSolid: true,
      onPressed: () => showFollowTypeSheet(context, slug: slug, projectName: name),
    );
  }
}

class _UpdatesSection extends ConsumerWidget {
  const _UpdatesSection({required this.feed});

  final c.FollowingFeed feed;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final unread = feed.changes.length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 32, PlinthLayout.gutterPhone, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(feed.heading, style: PlinthType.h2.copyWith(color: tokens.ink)),
              const SizedBox(height: PlinthSpace.s8),
              Text(feed.summaryLine, style: PlinthType.body.copyWith(height: 1.45, color: tokens.ink)),
              if (feed.lastLookedLine != null) ...[
                const SizedBox(height: PlinthSpace.s8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(feed.lastLookedLine!, style: PlinthType.small.copyWith(color: tokens.muted)),
                    ),
                    TextButton(
                      onPressed: unread == 0 ? null : () => ref.read(followsProvider.notifier).markSeen(),
                      child: Text(unread == 0 ? FollowingCopy.allSeen : FollowingCopy.markTheseAsSeen),
                    ),
                  ],
                ),
              ],
              if (feed.replay?.jumpChips.isNotEmpty ?? false) ...[
                const SizedBox(height: PlinthSpace.s8),
                Text(FollowingCopy.replayFromAnyDate, style: PlinthType.small.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final chip in feed.replay!.jumpChips)
                      PlinthPill(
                        label: chip.label,
                        selected: chip.date == feed.since?.substring(0, 10),
                        onPressed: null,
                      ),
                  ],
                ),
              ],
              for (final item in feed.changes) ChangeItemTile(item: item, projectName: _nameOf(feed, item.slug)),
              for (final quiet in feed.quiet)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Text(quiet.line, style: PlinthType.small.copyWith(color: tokens.muted)),
                ),
            ],
          ),
        ),
        const SizedBox(height: PlinthSpace.s32),
        Padding(
          padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 0, PlinthLayout.gutterPhone, 56),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(FollowingCopy.earlier, style: PlinthType.h2.copyWith(color: tokens.ink)),
              if (feed.record.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: PlinthSpace.s12),
                  child: Text(FollowingCopy.noEarlierUpdates, style: PlinthType.body.copyWith(color: tokens.ink2)),
                )
              else
                for (final item in feed.record) ChangeItemTile(item: item, projectName: _nameOf(feed, item.slug)),
              const SizedBox(height: PlinthSpace.s16),
              Text(FollowingCopy.footerNote, style: PlinthType.small.copyWith(color: tokens.muted)),
            ],
          ),
        ),
      ],
    );
  }

  static String _nameOf(c.FollowingFeed feed, String slug) =>
      feed.projects.firstWhere((p) => p.slug == slug, orElse: () => feed.projects.first).name ?? slug;
}
