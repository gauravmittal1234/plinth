import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';
import 'package:share_plus/share_plus.dart';

import '../../app/routes.dart';
import '../../core/widgets/widgets.dart';
import '../../data/api_client.dart' show noRetry;
import '../../data/family.dart';
import '../../data/follow.dart';
import '../../data/session.dart';
import '../onboarding/sign_in_sheet.dart';
import 'family_copy.dart';

/// Key for the screen's root (AGENTS.md pitfall note; `AppRisk`'s
/// `riskScreenKey` is the precedent).
const familyScreenKey = Key('app-family-screen');

/// "Your circle" (WORK_BREAKDOWN T50): invite someone on WhatsApp, and see
/// what they'd get.
///
/// `api.family_circle` has no read contract or fixture yet (a T45a gap), so
/// this screen never lists who is actually in the circle: AGENTS.md says
/// facts come from data, never code, and a hard-coded "Meera joined 6 Oct"
/// would be wrong for every buyer who isn't the fixture's Rohan. It shows
/// only the signed-in buyer's own row (no name — the data layer has none
/// yet either, `api.me`'s shape is pending T41) and an honest line that
/// members appear once they join. The invite itself is real:
/// `api.family_invite_create` answers with the actual link, share text and
/// rules.
class FamilyScreen extends ConsumerWidget {
  const FamilyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final signedIn = ref.watch(signedInProvider);
    return Scaffold(
      key: familyScreenKey,
      backgroundColor: tokens.bg,
      appBar: AppBar(backgroundColor: tokens.bg, elevation: 0, title: const Text(FamilyCopy.title)),
      body: SafeArea(
        child: !signedIn ? _SignedOut(onSignIn: () => showSignInSheet(context, next: Routes.family)) : const _Circle(),
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
              FamilyCopy.signInToSeeCircle,
              style: PlinthType.body.copyWith(color: tokens.ink2),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: PlinthSpace.s20),
            PlinthButton(label: FamilyCopy.signIn, onPressed: onSignIn),
          ],
        ),
      ),
    );
  }
}

/// One thing an invite can cover: a single followed project, or (when there
/// are at least two) all of them. `key` is the project's slug, or `'all'`
/// (`_familyInviteProvider` turns it back into a `FamilyInviteScope`: that
/// contract class has no value equality of its own, so a provider family
/// keyed on an instance of it would never hit its cache — see 1f31b1a's
/// note on this file). Labels and slugs both come from
/// `FollowingFeed.projects` — never hard-coded, so this works for any
/// buyer's own follows, not only the fixture's four.
class _ScopeChoice {
  const _ScopeChoice({required this.key, required this.label});

  final String key;
  final String label;
}

List<_ScopeChoice> _scopeChoicesOf(c.FollowingFeed feed) {
  final projects = feed.projects;
  final choices = [for (final p in projects) _ScopeChoice(key: p.slug, label: p.name ?? p.slug)];
  if (projects.length >= 2) {
    choices.add(_ScopeChoice(key: 'all', label: 'All ${projects.length} projects'));
  }
  return choices;
}

class _Circle extends ConsumerStatefulWidget {
  const _Circle();

  @override
  ConsumerState<_Circle> createState() => _CircleState();
}

class _CircleState extends ConsumerState<_Circle> {
  String? _selectedKey;
  String _inviteStatus = '';

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final feedAsync = ref.watch(followingFeedProvider);
    return ListView(
      padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 8, PlinthLayout.gutterPhone, 40),
      children: [
        Text(FamilyCopy.whoFollowsWithYou, style: PlinthType.h2.copyWith(color: tokens.ink)),
        const SizedBox(height: 2),
        Text(FamilyCopy.subtitle, style: PlinthType.small.copyWith(color: tokens.muted)),
        const SizedBox(height: PlinthSpace.s16),
        const _YouRow(),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: PlinthSpace.s12),
          child: Text(FamilyCopy.membersAppearLine, style: PlinthType.small.copyWith(color: tokens.ink2)),
        ),
        const SizedBox(height: PlinthSpace.s8),
        Text(FamilyCopy.inviteSomeone, style: PlinthType.h3.copyWith(color: tokens.ink)),
        const SizedBox(height: PlinthSpace.s8),
        switch (feedAsync) {
          AsyncData(value: final cached?) => _InviteSection(
            feed: cached.value,
            selectedKey: _selectedKey,
            inviteStatus: _inviteStatus,
            onSelect: (key) => setState(() {
              _selectedKey = key;
              _inviteStatus = '';
            }),
            onStatus: (status) => setState(() => _inviteStatus = status),
          ),
          AsyncError() => _honestLine(tokens, FamilyCopy.followsUnavailableLine),
          _ => const Padding(
            padding: EdgeInsets.symmetric(vertical: PlinthSpace.s12),
            child: Center(child: CircularProgressIndicator()),
          ),
        },
        const SizedBox(height: PlinthSpace.s20),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _BulletList(title: FamilyCopy.theyCanSee, items: FamilyCopy.theyCanSeeItems),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _BulletList(title: FamilyCopy.theyCantChange, items: FamilyCopy.theyCantChangeItems),
            ),
          ],
        ),
      ],
    );
  }

  Widget _honestLine(PlinthTokens tokens, String text) => Padding(
    padding: const EdgeInsets.symmetric(vertical: PlinthSpace.s8),
    child: Text(text, style: PlinthType.body.copyWith(color: tokens.ink2)),
  );
}

class _InviteSection extends ConsumerWidget {
  const _InviteSection({
    required this.feed,
    required this.selectedKey,
    required this.inviteStatus,
    required this.onSelect,
    required this.onStatus,
  });

  final c.FollowingFeed feed;
  final String? selectedKey;
  final String inviteStatus;
  final ValueChanged<String> onSelect;
  final ValueChanged<String> onStatus;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final choices = _scopeChoicesOf(feed);
    if (choices.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: PlinthSpace.s8),
        child: Text(FamilyCopy.noProjectsToInviteLine, style: PlinthType.body.copyWith(color: tokens.ink2)),
      );
    }
    final selected = choices.firstWhere((o) => o.key == selectedKey, orElse: () => choices.first);
    final inviteAsync = ref.watch(_familyInviteProvider(selected.key));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(FamilyCopy.whatTheyFollow, style: PlinthType.small.copyWith(color: tokens.ink2)),
        const SizedBox(height: PlinthSpace.s8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final choice in choices)
              PlinthPill(
                label: choice.label,
                selected: choice.key == selected.key,
                onPressed: () => onSelect(choice.key),
              ),
          ],
        ),
        const SizedBox(height: PlinthSpace.s12),
        switch (inviteAsync) {
          AsyncData(:final value) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              PlinthButton(
                label: FamilyCopy.inviteOnWhatsApp,
                glyph: KitGlyph.share,
                onPressed: () => _shareInvite(context, value),
              ),
              const SizedBox(height: PlinthSpace.s8),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      inviteStatus.isEmpty ? _bareLink(value.link) : inviteStatus,
                      style: PlinthType.small.copyWith(color: tokens.ink2),
                    ),
                  ),
                  TextButton(onPressed: () => _copyLink(value), child: const Text(FamilyCopy.copyLink)),
                ],
              ),
              const SizedBox(height: PlinthSpace.s12),
              Text(value.privateLine, style: PlinthType.small.copyWith(color: tokens.ink)),
            ],
          ),
          AsyncError() => Padding(
            padding: const EdgeInsets.symmetric(vertical: PlinthSpace.s8),
            child: Text(FamilyCopy.inviteNotReadyLine, style: PlinthType.small.copyWith(color: tokens.ink2)),
          ),
          _ => const Padding(
            padding: EdgeInsets.symmetric(vertical: PlinthSpace.s12),
            child: Center(child: CircularProgressIndicator()),
          ),
        },
      ],
    );
  }

  String _bareLink(String link) => link.replaceFirst(RegExp(r'^https?://'), '');

  Future<void> _shareInvite(BuildContext context, c.FamilyInvite invite) async {
    await SharePlus.instance.share(ShareParams(text: invite.shareText));
    onStatus('WhatsApp is open with your message. Pick who to send it to; they opt in themselves.');
  }

  Future<void> _copyLink(c.FamilyInvite invite) async {
    await Clipboard.setData(ClipboardData(text: invite.link));
    onStatus('Copied ${_bareLink(invite.link)}. ${invite.rules.join(' ')}');
  }
}

/// Keyed by a `_ScopeChoice.key` (a project slug, or `'all'`): a plain
/// `String` has real value equality, so picking the same choice twice
/// reuses the one request instead of sending a fresh one every rebuild.
final _familyInviteProvider = FutureProvider.family<c.FamilyInvite, String>((ref, key) {
  final scope = key == 'all' ? c.FamilyInviteScope(all: true) : c.FamilyInviteScope(slugs: [key]);
  return ref.watch(familyRepositoryProvider).createInvite(scope);
}, retry: noRetry);

/// The signed-in buyer's own row: no name (none in the data layer yet), no
/// join date (there is no "circle" record to date), just who they are.
class _YouRow extends StatelessWidget {
  const _YouRow();

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: PlinthSpace.s12),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: tokens.track, shape: BoxShape.circle),
            child: Icon(Icons.person_outline_rounded, size: 20, color: tokens.ink),
          ),
          const SizedBox(width: 12),
          Text(
            FamilyCopy.you,
            style: PlinthType.body.copyWith(fontWeight: FontWeight.w600, color: tokens.ink),
          ),
        ],
      ),
    );
  }
}

class _BulletList extends StatelessWidget {
  const _BulletList({required this.title, required this.items});

  final String title;
  final List<String> items;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: PlinthType.body.copyWith(fontWeight: FontWeight.w700, color: tokens.ink),
        ),
        const SizedBox(height: 6),
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: KitIcon(KitGlyph.check, size: 12, color: tokens.ink),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(item, style: PlinthType.small.copyWith(color: tokens.ink)),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
