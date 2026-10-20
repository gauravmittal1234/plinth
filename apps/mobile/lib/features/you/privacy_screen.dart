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

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        SectionBand(
          question: 'Who has my number?',
          answer: 'Every share needed your tap. Each one has a purpose, a date and a consent reference.',
          children: [
            Text(
              '${active.length} ${active.length == 1 ? 'party' : 'parties'} can reach you right now; a relay '
              "doesn't count.",
              style: PlinthType.body.copyWith(fontWeight: FontWeight.w600, color: PlinthTokens.of(context).ink),
            ),
            const SizedBox(height: PlinthSpace.s12),
            for (final party in active) _PartyCard(party: party, onRevoke: () => onRevoke(party)),
            for (final relay in numbers.relays)
              Padding(
                padding: const EdgeInsets.only(top: PlinthSpace.s8),
                child: Text(
                  'Not counted: ${relay.party} — ${relay.line} (consent ${relay.ref})',
                  style: PlinthType.small.copyWith(color: PlinthTokens.of(context).ink2),
                ),
              ),
            for (final ended in numbers.ended)
              Padding(
                padding: const EdgeInsets.only(top: PlinthSpace.s8),
                child: Text(
                  '${ended.party} (${ended.detail}) · ended ${formatDisplayDate(ended.endedOn)} · consent ${ended.ref}',
                  style: PlinthType.small.copyWith(color: PlinthTokens.of(context).ink2),
                ),
              ),
            const SizedBox(height: PlinthSpace.s8),
            Text(numbers.familyLine, style: PlinthType.small.copyWith(color: PlinthTokens.of(context).ink2)),
          ],
        ),
        SectionBand(
          tone: BandTone.track,
          question: 'What did I say yes to?',
          answer:
              'Every line is a tap you made, newest first. References use the form C-MMDD-NN, so you can quote '
              'one to us or to the site office.',
          children: [for (final row in history) _HistoryTile(row: row)],
        ),
        SectionBand(
          question: 'Can I take my data, or delete it?',
          answer: 'Yes, both, at any time. Neither needs an email or a phone call.',
          children: [
            YouPanel(
              children: [
                Text(
                  'Saved projects, alerts, consent history and who had your number. One ZIP with a PDF and a '
                  'JSON file. Ready within 24 hours; the link works for 7 days.',
                  style: PlinthType.small.copyWith(color: PlinthTokens.of(context).ink2),
                ),
                PlinthButton(label: 'Prepare download', kind: PlinthButtonKind.tonal, onPressed: onExport),
                if (exportNotice != null)
                  Text(exportNotice!, style: PlinthType.small.copyWith(color: PlinthTokens.of(context).ink2)),
              ],
            ),
            const SizedBox(height: PlinthSpace.s16),
            YouPanel(
              children: [
                Text(
                  'We close it now and erase your data within 30 days. Every party loses your relay number at once.',
                  style: PlinthType.small.copyWith(color: PlinthTokens.of(context).ink2),
                ),
                PlinthButton(label: 'Delete my account', kind: PlinthButtonKind.tonal, onPressed: onDelete),
                if (deleteNotice != null)
                  Text(deleteNotice!, style: PlinthType.small.copyWith(color: PlinthTokens.of(context).ink2)),
              ],
            ),
          ],
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
    return Padding(
      padding: const EdgeInsets.only(bottom: PlinthSpace.s8),
      child: Container(
        padding: const EdgeInsets.all(PlinthSpace.s16),
        decoration: BoxDecoration(color: tokens.bgSolid, borderRadius: BorderRadius.circular(PlinthRadius.panel)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Consent ${row.ref} · ${row.who}',
              style: PlinthType.small.copyWith(fontWeight: FontWeight.w700, color: tokens.ink),
            ),
            const SizedBox(height: 2),
            Text(row.what, style: PlinthType.small.copyWith(color: tokens.ink2)),
            const SizedBox(height: 2),
            Text(row.status, style: PlinthType.caption.copyWith(color: tokens.muted)),
          ],
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
        gap: PlinthSpace.s8,
        children: [
          Text(
            party.party,
            style: PlinthType.body.copyWith(fontWeight: FontWeight.w700, color: tokens.ink),
          ),
          Text(party.paysLine, style: PlinthType.small.copyWith(color: tokens.ink2)),
          Text(party.detail, style: PlinthType.small.copyWith(color: tokens.ink2)),
          Text(
            'Shared ${formatDisplayDate(party.sharedOn)}'
            '${party.accessUntil != null ? ' · access until ${formatDisplayDate(party.accessUntil!)}' : ''}'
            ' · consent ${party.ref}',
            style: PlinthType.small.copyWith(color: tokens.ink2),
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: PlinthButton(label: 'Revoke', kind: PlinthButtonKind.tonal, compact: true, onPressed: onRevoke),
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
    return Padding(
      padding: const EdgeInsets.fromLTRB(PlinthSpace.s20, PlinthSpace.s16, PlinthSpace.s20, PlinthSpace.s24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PlinthSheetHeader(title: 'Stop sharing your number with ${party.party}?'),
          const SizedBox(height: PlinthSpace.s12),
          Text(
            "You shared your number with them on ${formatDisplayDate(party.sharedOn)}, and a shared number "
            "can't be recalled, so ask them to delete it.",
            style: PlinthType.body.copyWith(color: tokens.ink2),
          ),
          const SizedBox(height: PlinthSpace.s20),
          PlinthButton(
            label: 'Keep sharing',
            kind: PlinthButtonKind.tonal,
            onPressed: () => Navigator.of(context).pop(false),
          ),
          const SizedBox(height: PlinthSpace.s12),
          PlinthButton(label: 'Stop sharing', onPressed: () => Navigator.of(context).pop(true)),
        ],
      ),
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
    return Padding(
      padding: const EdgeInsets.fromLTRB(PlinthSpace.s20, PlinthSpace.s16, PlinthSpace.s20, PlinthSpace.s24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const PlinthSheetHeader(title: 'Delete your account?'),
          const SizedBox(height: PlinthSpace.s12),
          Text(
            'Your account closes today. Every party loses access to your relay number at once. We erase your '
            'profile, saved projects, alerts and AI chats within 30 days. We keep consent records and any '
            'invoices only as long as the law requires.',
            style: PlinthType.body.copyWith(color: tokens.ink2),
          ),
          const SizedBox(height: PlinthSpace.s16),
          CheckboxListTile(
            value: _ack,
            onChanged: (v) => setState(() => _ack = v ?? false),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
            title: Text("I understand this can't be undone.", style: PlinthType.small.copyWith(color: tokens.ink)),
          ),
          const SizedBox(height: PlinthSpace.s8),
          PlinthButton(
            label: 'Keep my account',
            kind: PlinthButtonKind.tonal,
            onPressed: () => Navigator.of(context).pop(false),
          ),
          const SizedBox(height: PlinthSpace.s12),
          PlinthButton(label: 'Yes, delete my account', onPressed: _ack ? () => Navigator.of(context).pop(true) : null),
        ],
      ),
    );
  }
}
