import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/widgets/widgets.dart';
import '../../data/family.dart';
import '../../data/session.dart';
import '../onboarding/sign_in_sheet.dart';
import 'family_copy.dart';

/// Key for the screen's root (AGENTS.md pitfall note; `AppRisk`'s
/// `riskScreenKey` is the precedent).
const familyJoinScreenKey = Key('app-family-join-screen');

/// The public E.164 WhatsApp business number for the JOIN flow, mirroring
/// the web's `NEXT_PUBLIC_WA_BUSINESS_NUMBER` (SETUP_FOR_FOUNDER.md). Empty
/// until the founder sets it at build time; the `wa.me` link still opens
/// WhatsApp with the JOIN text ready, just without a chosen recipient (see
/// the Handoff note in this PR: `lib/core/config/env.dart` is T06's, so T50
/// reads this itself rather than adding an `Env` field there).
const String _waBusinessNumber = String.fromEnvironment('WA_BUSINESS_NUMBER');

/// Opened by a family invite link (`plinth.in/j/<code>`; WORK_BREAKDOWN T50).
/// Public: no sign-in to see what the invite offers (DESIGN §2.6).
class FamilyJoinScreen extends ConsumerStatefulWidget {
  const FamilyJoinScreen({super.key, required this.code});

  final String code;

  @override
  ConsumerState<FamilyJoinScreen> createState() => _FamilyJoinScreenState();
}

enum _Channel { whatsApp, app }

class _FamilyJoinScreenState extends ConsumerState<FamilyJoinScreen> {
  _Channel _channel = _Channel.whatsApp;
  bool _declined = false;
  bool _waOpened = false;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final previewAsync = ref.watch(invitePreviewProvider(widget.code));
    return Scaffold(
      key: familyJoinScreenKey,
      backgroundColor: tokens.bg,
      body: SafeArea(
        child: switch (previewAsync) {
          AsyncData(:final value) => _Preview(
            code: widget.code,
            preview: value,
            channel: _channel,
            declined: _declined,
            waOpened: _waOpened,
            onChannel: (c) => setState(() => _channel = c),
            onPrimary: () => _onPrimary(context, value),
            onDecline: () => setState(() => _declined = true),
          ),
          AsyncError() => Center(
            child: Padding(
              padding: const EdgeInsets.all(PlinthSpace.s24),
              child: Text(
                'This invite link no longer works.',
                style: PlinthType.body.copyWith(color: tokens.ink2),
                textAlign: TextAlign.center,
              ),
            ),
          ),
          _ => Center(child: CircularProgressIndicator(color: tokens.accent)),
        },
      ),
    );
  }

  Future<void> _onPrimary(BuildContext context, c.FamilyInvitePreview preview) async {
    if (_channel == _Channel.whatsApp) {
      final text = Uri.encodeComponent('JOIN ${widget.code}');
      final uri = _waBusinessNumber.isEmpty
          ? Uri.parse('https://wa.me/?text=$text')
          : Uri.parse('https://wa.me/$_waBusinessNumber?text=$text');
      await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (mounted) setState(() => _waOpened = true);
      return;
    }
    if (!ref.read(signedInProvider)) {
      await showSignInSheet(context);
      return;
    }
    try {
      await ref.read(familyRepositoryProvider).join(widget.code);
    } on Exception {
      if (context.mounted) {
        showPlinthToast(context, 'Can’t finish joining from here yet. Try WhatsApp instead.');
      }
    }
  }
}

class _Preview extends StatelessWidget {
  const _Preview({
    required this.code,
    required this.preview,
    required this.channel,
    required this.declined,
    required this.waOpened,
    required this.onChannel,
    required this.onPrimary,
    required this.onDecline,
  });

  final String code;
  final c.FamilyInvitePreview preview;
  final _Channel channel;
  final bool declined;
  final bool waOpened;
  final ValueChanged<_Channel> onChannel;
  final VoidCallback onPrimary;
  final VoidCallback onDecline;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 8, PlinthLayout.gutterPhone, 0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(FamilyCopy.plinth, style: PlinthType.h3.copyWith(color: tokens.ink)),
              Text('plinth.in/j/$code', style: PlinthType.small.copyWith(color: tokens.muted)),
            ],
          ),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 12, PlinthLayout.gutterPhone, 24),
            children: [if (declined) ..._done(tokens) else ..._invite(tokens)],
          ),
        ),
        _bar(context, tokens),
      ],
    );
  }

  List<Widget> _invite(PlinthTokens tokens) => [
    AspectRatio(
      aspectRatio: 390 / 164,
      child: DecoratedBox(
        decoration: BoxDecoration(color: tokens.photo, borderRadius: BorderRadius.circular(PlinthRadius.panel)),
        child: Center(
          child: Text(FamilyCopy.illustrativeImage, style: PlinthType.small.copyWith(color: tokens.ink2)),
        ),
      ),
    ),
    const SizedBox(height: PlinthSpace.s16),
    Text('${preview.inviterFirstName} invited you', style: PlinthType.h1.copyWith(fontSize: 32, color: tokens.ink)),
    const SizedBox(height: PlinthSpace.s8),
    Text(
      'to follow ${preview.scopeLine}. You’ll get the same alerts. Your number stays yours.',
      style: PlinthType.lead.copyWith(height: 1.45, color: tokens.ink),
    ),
    if (preview.reraNumber != null) ...[
      const SizedBox(height: PlinthSpace.s8),
      Text('RERA ${preview.reraNumber}', style: PlinthType.small.copyWith(color: tokens.muted)),
    ],
    const SizedBox(height: PlinthSpace.s20),
    Text(FamilyCopy.whatYouGet, style: PlinthType.h3.copyWith(color: tokens.ink)),
    const SizedBox(height: PlinthSpace.s8),
    for (final line in preview.whatYouGet)
      Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: KitIcon(KitGlyph.check, size: 14, color: tokens.ink),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(line, style: PlinthType.body.copyWith(height: 1.45, color: tokens.ink)),
            ),
          ],
        ),
      ),
    const SizedBox(height: PlinthSpace.s8),
    Text(preview.numberLine, style: PlinthType.small.copyWith(color: tokens.ink2)),
    const SizedBox(height: PlinthSpace.s20),
    Text(
      FamilyCopy.whereShouldAlertsGo,
      style: PlinthType.body.copyWith(fontWeight: FontWeight.w600, color: tokens.ink),
    ),
    const SizedBox(height: PlinthSpace.s8),
    PlinthSegmented<_Channel>(
      options: const [
        SegmentOption(_Channel.whatsApp, FamilyCopy.channelWhatsApp),
        SegmentOption(_Channel.app, FamilyCopy.channelApp),
      ],
      value: channel,
      onChanged: onChannel,
      semanticLabel: FamilyCopy.whereShouldAlertsGo,
    ),
    const SizedBox(height: PlinthSpace.s16),
    Text(FamilyCopy.utilityOnly, style: PlinthType.small.copyWith(color: tokens.muted)),
  ];

  List<Widget> _done(PlinthTokens tokens) => [
    const SizedBox(height: PlinthSpace.s40),
    Text(FamilyCopy.nothingWasSentTitle, style: PlinthType.h1.copyWith(fontSize: 32, color: tokens.ink)),
    const SizedBox(height: PlinthSpace.s12),
    Text(FamilyCopy.nothingWasSentText, style: PlinthType.lead.copyWith(height: 1.45, color: tokens.ink)),
    const SizedBox(height: PlinthSpace.s8),
    Text(FamilyCopy.nothingWasSentNote, style: PlinthType.small.copyWith(color: tokens.ink2)),
  ];

  Widget _bar(BuildContext context, PlinthTokens tokens) {
    if (declined) return const SizedBox.shrink();
    return DecoratedBox(
      decoration: BoxDecoration(color: tokens.nav),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 12, PlinthLayout.gutterPhone, 16),
        child: Column(
          children: [
            if (waOpened && channel == _Channel.whatsApp) ...[
              Text(
                FamilyCopy.waOpenedStatus(code),
                style: PlinthType.small.copyWith(color: tokens.ink),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: PlinthSpace.s8),
            ],
            PlinthButton(
              label: channel == _Channel.whatsApp
                  ? FamilyCopy.getAlertsOnWhatsApp
                  : FamilyCopy.followInApp(preview.inviterFirstName),
              expand: true,
              onPressed: onPrimary,
            ),
            TextButton(onPressed: onDecline, child: const Text(FamilyCopy.notNow)),
          ],
        ),
      ),
    );
  }
}
