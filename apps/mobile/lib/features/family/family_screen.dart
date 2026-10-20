import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';
import 'package:share_plus/share_plus.dart';

import '../../app/routes.dart';
import '../../core/widgets/widgets.dart';
import '../../data/family.dart';
import '../../data/session.dart';
import '../onboarding/sign_in_sheet.dart';
import 'family_circle.dart';
import 'family_copy.dart';

/// Key for the screen's root (AGENTS.md pitfall note; `AppRisk`'s
/// `riskScreenKey` is the precedent).
const familyScreenKey = Key('app-family-screen');

/// "Your circle" (WORK_BREAKDOWN T50): who follows with you, invite someone
/// on WhatsApp, and remove or cancel an invite with Undo.
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

/// The scope an invite covers. `codeForDisplay`/`scopeOf` mirror the
/// artboard's `scope`/`code`, but the real link comes from the fixture.
enum _Scope { aurelia, all }

class _Circle extends ConsumerStatefulWidget {
  const _Circle();

  @override
  ConsumerState<_Circle> createState() => _CircleState();
}

class _CircleState extends ConsumerState<_Circle> {
  _Scope _scope = _Scope.aurelia;
  String _inviteStatus = '';

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final circle = ref.watch(familyCircleFactsProvider);
    final inviteAsync = ref.watch(_familyInviteProvider(_scope));
    return ListView(
      padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 8, PlinthLayout.gutterPhone, 40),
      children: [
        Text(FamilyCopy.whoFollowsWithYou, style: PlinthType.h2.copyWith(color: tokens.ink)),
        const SizedBox(height: 2),
        Text(FamilyCopy.subtitle, style: PlinthType.small.copyWith(color: tokens.muted)),
        const SizedBox(height: PlinthSpace.s16),
        _MemberRow(fact: youFact, sub: FamilyCopy.youSub, action: null),
        _MemberRow(
          fact: meeraFact,
          sub: circle.meeraStatus == MemberStatus.removed ? FamilyCopy.meeraRemovedSub : FamilyCopy.meeraJoinedSub,
          action: circle.meeraStatus == MemberStatus.removed
              ? _Action(label: FamilyCopy.undo, onTap: () => _undoMeera(context))
              : _Action(label: FamilyCopy.remove, onTap: () => _confirmRemoveMeera(context)),
        ),
        _MemberRow(
          fact: fatherFact,
          sub: circle.fatherStatus == MemberStatus.cancelled
              ? FamilyCopy.fatherCancelledSub
              : FamilyCopy.fatherInvitedSub,
          action: circle.fatherStatus == MemberStatus.cancelled
              ? _Action(label: FamilyCopy.undo, onTap: () => _undoCancelFather())
              : _Action(label: FamilyCopy.cancelInvite, onTap: () => _confirmCancelFather(context)),
        ),
        const SizedBox(height: PlinthSpace.s20),
        Text(FamilyCopy.inviteSomeone, style: PlinthType.h3.copyWith(color: tokens.ink)),
        const SizedBox(height: PlinthSpace.s8),
        Text(FamilyCopy.whatTheyFollow, style: PlinthType.small.copyWith(color: tokens.ink2)),
        const SizedBox(height: PlinthSpace.s8),
        PlinthSegmented<_Scope>(
          options: const [
            SegmentOption(_Scope.aurelia, FamilyCopy.scopeAurelia),
            SegmentOption(_Scope.all, FamilyCopy.scopeAll),
          ],
          value: _scope,
          onChanged: (s) => setState(() {
            _scope = s;
            _inviteStatus = '';
          }),
          semanticLabel: FamilyCopy.whatTheyFollow,
        ),
        const SizedBox(height: PlinthSpace.s12),
        switch (inviteAsync) {
          AsyncData(:final value) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              PlinthButton(
                label: FamilyCopy.inviteOnWhatsApp,
                glyph: KitGlyph.share,
                onPressed: () => _shareInvite(value),
              ),
              const SizedBox(height: PlinthSpace.s8),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      _inviteStatus.isEmpty ? _bareLink(value.link) : _inviteStatus,
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
          AsyncError() => const SizedBox.shrink(),
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

  String _bareLink(String link) => link.replaceFirst(RegExp(r'^https?://'), '');

  Future<void> _shareInvite(c.FamilyInvite invite) async {
    await SharePlus.instance.share(ShareParams(text: invite.shareText));
    if (!mounted) return;
    setState(
      () => _inviteStatus = 'WhatsApp is open with your message. Pick who to send it to; they opt in themselves.',
    );
  }

  Future<void> _copyLink(c.FamilyInvite invite) async {
    await Clipboard.setData(ClipboardData(text: invite.link));
    if (!mounted) return;
    setState(() => _inviteStatus = 'Copied ${_bareLink(invite.link)}. ${invite.rules.join(' ')}');
  }

  Future<void> _confirmRemoveMeera(BuildContext context) async {
    final yes = await showRevokeDialog(
      context,
      fact: meeraFact,
      title: FamilyCopy.removeMeeraTitle,
      points: FamilyCopy.removeMeeraPoints,
      yesLabel: FamilyCopy.removeMeeraYes,
      noLabel: FamilyCopy.removeMeeraNo,
    );
    if (yes != true || !context.mounted) return;
    await ref.read(familyCircleFactsProvider.notifier).removeMeera();
    if (!context.mounted) return;
    showPlinthToast(
      context,
      FamilyCopy.removeMeeraToast,
      actionLabel: FamilyCopy.undo,
      onAction: () => _undoMeera(context),
    );
  }

  Future<void> _undoMeera(BuildContext context) async {
    await ref.read(familyCircleFactsProvider.notifier).undoRemoveMeera();
  }

  Future<void> _confirmCancelFather(BuildContext context) async {
    final yes = await showRevokeDialog(
      context,
      fact: fatherFact,
      title: FamilyCopy.cancelFatherTitle,
      points: FamilyCopy.cancelFatherPoints,
      yesLabel: FamilyCopy.cancelFatherYes,
      noLabel: FamilyCopy.cancelFatherNo,
    );
    if (yes != true || !context.mounted) return;
    await ref.read(familyCircleFactsProvider.notifier).cancelFatherInvite();
    if (!context.mounted) return;
    showPlinthToast(context, FamilyCopy.cancelFatherToast, actionLabel: FamilyCopy.undo, onAction: _undoCancelFather);
  }

  void _undoCancelFather() {
    ref.read(familyCircleFactsProvider.notifier).undoCancelFatherInvite();
  }
}

final _familyInviteProvider = FutureProvider.family<c.FamilyInvite, _Scope>((ref, scope) {
  final args = scope == _Scope.all
      ? c.FamilyInviteScope(all: true)
      : c.FamilyInviteScope(slugs: const ['aurelia-heights-phase-2']);
  return ref.watch(familyRepositoryProvider).createInvite(args);
});

class _Action {
  const _Action({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;
}

class _MemberRow extends StatelessWidget {
  const _MemberRow({required this.fact, required this.sub, required this.action});

  final FamilyMemberFact fact;
  final String sub;
  final _Action? action;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final gone = sub == FamilyCopy.meeraRemovedSub || sub == FamilyCopy.fatherCancelledSub;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: PlinthSpace.s12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Opacity(
            opacity: gone ? 0.45 : 1,
            child: Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: tokens.track, shape: BoxShape.circle),
              child: fact.person
                  ? Icon(Icons.person_outline_rounded, size: 20, color: tokens.ink)
                  : Text(
                      fact.init,
                      style: PlinthType.body.copyWith(fontWeight: FontWeight.w700, color: tokens.ink),
                    ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fact.name,
                  style: PlinthType.body.copyWith(fontWeight: FontWeight.w600, color: tokens.ink),
                ),
                Text(sub, style: PlinthType.small.copyWith(color: tokens.ink2)),
              ],
            ),
          ),
          if (action != null)
            Semantics(
              button: true,
              label: '${action!.label} ${fact.name}',
              excludeSemantics: true,
              child: TextButton(onPressed: action!.onTap, child: Text(action!.label)),
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

/// The revoke / cancel-invite confirm dialog (AppFamily's DLG map).
Future<bool?> showRevokeDialog(
  BuildContext context, {
  required FamilyMemberFact fact,
  required String title,
  required List<String> points,
  required String yesLabel,
  required String noLabel,
}) {
  final tokens = PlinthTokens.of(context);
  return showPlinthSheet<bool>(
    context: context,
    builder: (_) => Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: tokens.track, shape: BoxShape.circle),
                child: fact.person
                    ? Icon(Icons.person_outline_rounded, size: 22, color: tokens.ink)
                    : Text(fact.init, style: PlinthType.h3.copyWith(color: tokens.ink)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(title, style: PlinthType.h2.copyWith(color: tokens.ink)),
              ),
            ],
          ),
          const SizedBox(height: PlinthSpace.s16),
          for (final point in points)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 9),
                    child: Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(color: tokens.ink, shape: BoxShape.circle),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(point, style: PlinthType.body.copyWith(height: 1.45, color: tokens.ink)),
                  ),
                ],
              ),
            ),
          const SizedBox(height: PlinthSpace.s12),
          PlinthButton(
            label: yesLabel,
            kind: PlinthButtonKind.inverse,
            onPressed: () => Navigator.of(context).pop(true),
          ),
          const SizedBox(height: PlinthSpace.s8),
          PlinthButton(
            label: noLabel,
            kind: PlinthButtonKind.tertiary,
            onPressed: () => Navigator.of(context).pop(false),
          ),
        ],
      ),
    ),
  );
}
