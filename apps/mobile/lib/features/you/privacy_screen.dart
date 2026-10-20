import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../core/widgets/widgets.dart';
import '../../data/api_client.dart';
import '../../data/privacy.dart';
import 'you_format.dart';
import 'you_widgets.dart';

// Owned by T51 (AppYou, privacy). Build (WORK_BREAKDOWN T51): who has my
// number (api.who_has_my_number), consent history with its C-MMDD-NN refs,
// one-tap withdraw showing the real `effects` lines (api.consent_withdraw),
// download my data and delete my account. Neither `data_export_request` nor
// `account_delete_request` has a fixture answer yet (T45b has not shipped
// the real RPC), so AGENTS.md rule 9 applies: the button tries the real call
// and names what actually happened, never a staged "Preparing…" success.
///
/// Who has my number, consent history, download my data, delete account.
/// Needs a session: signed out, the router opens the You tab's sign-in sheet.
class PrivacyScreen extends ConsumerStatefulWidget {
  const PrivacyScreen({super.key});

  @override
  ConsumerState<PrivacyScreen> createState() => _PrivacyScreenState();
}

class _PrivacyScreenState extends ConsumerState<PrivacyScreen> {
  final Map<String, ConsentWithdrawal> _withdrawn = {};
  String? _exportNotice;
  String? _deleteNotice;

  Future<void> _confirmWithdraw(ContactParty party) async {
    final confirmed = await showPlinthSheet<bool>(
      context: context,
      builder: (ctx) => _RevokeSheet(party: party),
    );
    if (confirmed != true || !mounted) return;
    try {
      final result = await ref.read(privacyRepositoryProvider).withdrawConsent(party.ref);
      if (!mounted) return;
      setState(() => _withdrawn[party.ref] = result);
      showPlinthToast(context, result.effects.isEmpty ? 'Access revoked.' : result.effects.first);
    } on ApiException {
      if (!mounted) return;
      showPlinthToast(context, "Fixture mode has no consent record for ${party.ref}, so nothing was withdrawn.");
    }
  }

  Future<void> _requestExport() async {
    try {
      await ref.read(privacyRepositoryProvider).requestDataExport();
      setState(() => _exportNotice = "Your file is being prepared. We'll message you when it's ready.");
    } on ApiException {
      setState(
        () => _exportNotice =
            "Fixture mode doesn't record data requests yet, so nothing was saved. In the live product, your "
            "file is ready within 24 hours and the link works for 7 days, opening only after your sign-in code.",
      );
    }
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showPlinthSheet<bool>(context: context, builder: (ctx) => const _DeleteAccountSheet());
    if (confirmed != true || !mounted) return;
    try {
      await ref.read(privacyRepositoryProvider).requestAccountDeletion();
      setState(() => _deleteNotice = 'Your account is closed and scheduled for deletion.');
    } on ApiException {
      setState(
        () => _deleteNotice =
            "Fixture mode doesn't record account deletions yet, so nothing was saved. In the live product, "
            'your account closes today and we erase your data within 30 days.',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final numbersAsync = ref.watch(whoHasMyNumberProvider);
    return Scaffold(
      backgroundColor: tokens.bg,
      appBar: AppBar(backgroundColor: tokens.bg, elevation: 0, title: const Text('Privacy')),
      body: SafeArea(
        top: false,
        child: switch (numbersAsync) {
          AsyncData(value: final numbers?) => _Body(
            numbers: numbers,
            withdrawn: _withdrawn,
            onRevoke: _confirmWithdraw,
            exportNotice: _exportNotice,
            onExport: _requestExport,
            deleteNotice: _deleteNotice,
            onDelete: _confirmDelete,
          ),
          AsyncError() => Center(
            child: Padding(
              padding: const EdgeInsets.all(PlinthSpace.s24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Could not load who has your number.', style: PlinthType.body.copyWith(color: tokens.ink)),
                  const SizedBox(height: PlinthSpace.s16),
                  PlinthButton(label: 'Try again', onPressed: () => ref.invalidate(whoHasMyNumberProvider)),
                ],
              ),
            ),
          ),
          _ => const Center(child: CircularProgressIndicator()),
        },
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({
    required this.numbers,
    required this.withdrawn,
    required this.onRevoke,
    required this.exportNotice,
    required this.onExport,
    required this.deleteNotice,
    required this.onDelete,
  });

  final WhoHasMyNumber numbers;
  final Map<String, ConsentWithdrawal> withdrawn;
  final ValueChanged<ContactParty> onRevoke;
  final String? exportNotice;
  final VoidCallback onExport;
  final String? deleteNotice;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final active = numbers.parties.where((p) => !withdrawn.containsKey(p.ref)).toList();
    final history = <_HistoryRow>[
      for (final p in numbers.parties)
        withdrawn[p.ref] != null
            ? _HistoryRow(
                ref: p.ref,
                date: withdrawn[p.ref]!.withdrawnAt,
                who: p.party,
                what: withdrawn[p.ref]!.effects.join(' '),
                status: 'withdrawn',
              )
            : _HistoryRow(ref: p.ref, date: p.sharedOn, who: p.party, what: p.detail, status: 'active'),
      for (final e in numbers.ended)
        _HistoryRow(ref: e.ref, date: e.endedOn, who: e.party, what: e.detail, status: 'ended'),
    ]..sort((a, b) => b.date.compareTo(a.date));

    final tokens = PlinthTokens.of(context);
    Widget note(IconData icon, String text) => Padding(
      padding: const EdgeInsets.only(top: PlinthSpace.s8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 1),
            child: Icon(icon, size: 18, color: tokens.ink2),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(text, style: PlinthType.meta.copyWith(color: tokens.ink2)),
          ),
        ],
      ),
    );
    // App UI v2: tight sections of cards and grouped rows with icon tiles.
    return ListView(
      padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterApp, 0, PlinthLayout.gutterApp, PlinthSpace.s32),
      children: [
        YouSection(
          title: 'Who has my number?',
          subtitle: 'Every share needed your tap. Each one has a purpose, a date and a consent reference.',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${active.length} ${active.length == 1 ? 'party' : 'parties'} can reach you right now; a relay '
                "doesn't count.",
                style: PlinthType.rowTitle.copyWith(color: tokens.ink),
              ),
              const SizedBox(height: PlinthSpace.s12),
              for (final party in active) _PartyCard(party: party, onRevoke: () => onRevoke(party)),
              for (final relay in numbers.relays)
                note(Icons.swap_calls_rounded, 'Not counted: ${relay.party} — ${relay.line} (consent ${relay.ref})'),
              for (final ended in numbers.ended)
                note(
                  Icons.history_rounded,
                  '${ended.party} (${ended.detail}) · ended ${formatDisplayDate(ended.endedOn)} · consent ${ended.ref}',
                ),
              note(Icons.family_restroom_rounded, numbers.familyLine),
            ],
          ),
        ),
        YouSection(
          title: 'What did I say yes to?',
          subtitle:
              'Every line is a tap you made, newest first. References use the form C-MMDD-NN, so you can quote '
              'one to us or to the site office.',
          child: PlinthGroup(children: [for (final row in history) _HistoryTile(row: row)]),
        ),
        YouSection(
          title: 'Can I take my data, or delete it?',
          subtitle: 'Yes, both, at any time. Neither needs an email or a phone call.',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              YouPanel(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      PlinthIconTile(icon: Icons.download_rounded, tone: tokens.track),
                      const SizedBox(width: PlinthSpace.s12),
                      Expanded(
                        child: Text(
                          'Saved projects, alerts, consent history and who had your number. One ZIP with a PDF and '
                          'a JSON file. Ready within 24 hours; the link works for 7 days.',
                          style: PlinthType.meta.copyWith(color: tokens.ink2),
                        ),
                      ),
                    ],
                  ),
                  PlinthButton(
                    label: 'Prepare download',
                    icon: Icons.download_rounded,
                    kind: PlinthButtonKind.tonal,
                    expand: true,
                    onPressed: onExport,
                  ),
                  if (exportNotice != null) Text(exportNotice!, style: PlinthType.meta.copyWith(color: tokens.ink2)),
                ],
              ),
              const SizedBox(height: PlinthSpace.s12),
              YouPanel(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      PlinthIconTile(icon: Icons.person_remove_rounded, tone: tokens.track),
                      const SizedBox(width: PlinthSpace.s12),
                      Expanded(
                        child: Text(
                          'We close it now and erase your data within 30 days. Every party loses your relay number '
                          'at once.',
                          style: PlinthType.meta.copyWith(color: tokens.ink2),
                        ),
                      ),
                    ],
                  ),
                  PlinthButton(
                    label: 'Delete my account',
                    icon: Icons.delete_rounded,
                    kind: PlinthButtonKind.tonal,
                    expand: true,
                    onPressed: onDelete,
                  ),
                  if (deleteNotice != null) Text(deleteNotice!, style: PlinthType.meta.copyWith(color: tokens.ink2)),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _HistoryRow {
  const _HistoryRow({
    required this.ref,
    required this.date,
    required this.who,
    required this.what,
    required this.status,
  });

  final String ref;
  final String date;
  final String who;
  final String what;
  final String status;
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({required this.row});

  final _HistoryRow row;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final icon = switch (row.status) {
      'active' => Icons.check_circle_rounded,
      'withdrawn' => Icons.undo_rounded,
      _ => Icons.history_rounded,
    };
    return MergeSemantics(
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: PlinthLayout.rowMin),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: PlinthSpace.s16, vertical: PlinthSpace.s12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              PlinthIconTile(icon: icon, tone: tokens.track),
              const SizedBox(width: PlinthSpace.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Consent ${row.ref} · ${row.who}', style: PlinthType.rowTitle.copyWith(color: tokens.ink)),
                    const SizedBox(height: 2),
                    Text(row.what, style: PlinthType.meta.copyWith(color: tokens.ink2)),
                    const SizedBox(height: 2),
                    Text(row.status, style: PlinthType.caption.copyWith(color: tokens.muted)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PartyCard extends StatelessWidget {
  const _PartyCard({required this.party, required this.onRevoke});

  final ContactParty party;
  final VoidCallback onRevoke;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: PlinthSpace.s12),
      child: YouPanel(
        gap: PlinthSpace.s12,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              PlinthIconTile(icon: Icons.storefront_rounded, tone: tokens.track),
              const SizedBox(width: PlinthSpace.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(party.party, style: PlinthType.rowTitle.copyWith(color: tokens.ink)),
                    const SizedBox(height: 2),
                    Text(party.paysLine, style: PlinthType.meta.copyWith(color: tokens.ink2)),
                    const SizedBox(height: 2),
                    Text(party.detail, style: PlinthType.meta.copyWith(color: tokens.ink2)),
                    const SizedBox(height: 2),
                    Text(
                      'Shared ${formatDisplayDate(party.sharedOn)}'
                      '${party.accessUntil != null ? ' · access until ${formatDisplayDate(party.accessUntil!)}' : ''}'
                      ' · consent ${party.ref}',
                      style: PlinthType.meta.copyWith(color: tokens.ink2),
                    ),
                  ],
                ),
              ),
            ],
          ),
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: PlinthButton(
              label: 'Revoke',
              icon: Icons.link_off_rounded,
              kind: PlinthButtonKind.tonal,
              compact: true,
              onPressed: onRevoke,
            ),
          ),
        ],
      ),
    );
  }
}

class _RevokeSheet extends StatelessWidget {
  const _RevokeSheet({required this.party});

  final ContactParty party;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        PlinthSheetHeader(
          leading: PlinthIconTile(icon: Icons.link_off_rounded, size: 48, tone: tokens.track),
          title: 'Stop sharing your number with ${party.party}?',
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterApp, PlinthSpace.s16, PlinthLayout.gutterApp, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              PlinthHintRow(
                icon: Icons.info_rounded,
                emphasized: false,
                title:
                    "You shared your number with them on ${formatDisplayDate(party.sharedOn)}, and a shared number "
                    "can't be recalled, so ask them to delete it.",
              ),
              const SizedBox(height: PlinthSpace.s20),
              PlinthButton(
                label: 'Stop sharing',
                icon: Icons.link_off_rounded,
                expand: true,
                onPressed: () => Navigator.of(context).pop(true),
              ),
              const SizedBox(height: PlinthSpace.s12),
              PlinthButton(
                label: 'Keep sharing',
                kind: PlinthButtonKind.tonal,
                expand: true,
                onPressed: () => Navigator.of(context).pop(false),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DeleteAccountSheet extends StatefulWidget {
  const _DeleteAccountSheet();

  @override
  State<_DeleteAccountSheet> createState() => _DeleteAccountSheetState();
}

class _DeleteAccountSheetState extends State<_DeleteAccountSheet> {
  bool _ack = false;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        PlinthSheetHeader(
          leading: PlinthIconTile(icon: Icons.person_remove_rounded, size: 48, tone: tokens.track),
          title: 'Delete your account?',
        ),
        Flexible(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterApp, PlinthSpace.s16, PlinthLayout.gutterApp, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Your account closes today. Every party loses access to your relay number at once. We erase your '
                  'profile, saved projects, alerts and AI chats within 30 days. We keep consent records and any '
                  'invoices only as long as the law requires.',
                  style: PlinthType.body.copyWith(color: tokens.ink),
                ),
                const SizedBox(height: PlinthSpace.s12),
                CheckboxListTile(
                  value: _ack,
                  onChanged: (v) => setState(() => _ack = v ?? false),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    "I understand this can't be undone.",
                    style: PlinthType.rowTitle.copyWith(color: tokens.ink),
                  ),
                ),
                const SizedBox(height: PlinthSpace.s8),
                PlinthButton(
                  label: 'Yes, delete my account',
                  icon: Icons.delete_rounded,
                  expand: true,
                  onPressed: _ack ? () => Navigator.of(context).pop(true) : null,
                ),
                const SizedBox(height: PlinthSpace.s12),
                PlinthButton(
                  label: 'Keep my account',
                  kind: PlinthButtonKind.tonal,
                  expand: true,
                  onPressed: () => Navigator.of(context).pop(false),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
