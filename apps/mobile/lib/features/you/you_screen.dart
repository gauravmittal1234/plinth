import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:plinth_contracts/plinth_contracts.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../app/routes.dart';
import '../../app/theme_mode.dart';
import '../../core/widgets/widgets.dart';
import '../../data/alerts.dart';
import '../../data/privacy.dart';
import '../../data/session.dart';
import '../../data/trust.dart';
import 'you_format.dart';
import 'you_widgets.dart';

// Owned by T51 (AppYou). Build (WORK_BREAKDOWN T51): the "Who has my
// number?" teaser into the Privacy screen, the alert toggles defaulting to
// §5b (WhatsApp and the weekly digest on, api.alert_prefs_get), the Day/Night
// theme setting (theme_mode.dart: "T51 owns the setting"), and the money and
// grievance lines everyone sees, signed in or not.

/// Tab 4: alerts, privacy and the account.
class YouScreen extends ConsumerWidget {
  const YouScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final signedIn = ref.watch(signedInProvider);
    return Scaffold(
      backgroundColor: tokens.bg,
      body: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            SectionBand(
              question: 'You',
              answer: signedIn
                  ? 'Your account, your number and how Plinth reaches you.'
                  : 'Browse freely. Signing in only happens when you open Who has my number.',
              children: const [_NumberTeaser()],
            ),
            if (signedIn)
              SectionBand(
                tone: BandTone.track,
                question: 'What have I agreed to?',
                answer: 'Nothing is ticked until you tick it. Change your mind anytime.',
                children: const [_AlertToggles()],
              ),
            SectionBand(question: 'How should Plinth look?', children: const [_ThemeToggle()]),
            SectionBand(tone: BandTone.track, question: 'How we make money', children: const [_MoneyBlock()]),
            SectionBand(question: 'Who do I contact if something goes wrong?', children: const [_GrievanceBlock()]),
          ],
        ),
      ),
    );
  }
}

class _NumberTeaser extends ConsumerWidget {
  const _NumberTeaser();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final signedIn = ref.watch(signedInProvider);
    final numbers = signedIn ? ref.watch(whoHasMyNumberProvider) : null;
    return YouPanel(
      children: [
        switch (numbers) {
          AsyncData(value: final value?) => Text(value.countLine, style: PlinthType.h3.copyWith(color: tokens.ink)),
          AsyncError() => Text(
            'Could not load who has your number.',
            style: PlinthType.body.copyWith(color: tokens.ink),
          ),
          AsyncData() => Text(
            'Your number is never shared without your tap.',
            style: PlinthType.body.copyWith(color: tokens.ink2),
          ),
          _ when signedIn => const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2)),
          _ => Text(
            'Your number is never shared without your tap.',
            style: PlinthType.body.copyWith(color: tokens.ink2),
          ),
        },
        Text(
          'You choose who can contact you. At most 3 parties in any 30 days.',
          style: PlinthType.small.copyWith(color: tokens.ink2),
        ),
        PlinthButton(label: 'Who has my number?', onPressed: () => context.push(Routes.privacy)),
      ],
    );
  }
}

class _AlertToggles extends ConsumerWidget {
  const _AlertToggles();

  Future<void> _save(WidgetRef ref, AlertPrefsMap next) => ref.read(alertPrefsProvider.notifier).save(next);

  void _toast(BuildContext context, String message) => showPlinthToast(context, message);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final prefsAsync = ref.watch(alertPrefsProvider);
    return switch (prefsAsync) {
      AsyncData(value: final prefs?) => _AlertToggleList(
        prefs: prefs,
        onSave: (next) => _save(ref, next),
        onBlocked: (message) => _toast(context, message),
      ),
      AsyncError() => Text('Could not load your preferences.', style: PlinthType.body.copyWith(color: tokens.ink)),
      _ => const Padding(
        padding: EdgeInsets.symmetric(vertical: PlinthSpace.s16),
        child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
      ),
    };
  }
}

class _AlertToggleList extends StatelessWidget {
  const _AlertToggleList({required this.prefs, required this.onSave, required this.onBlocked});

  final AlertPrefs prefs;
  final ValueChanged<AlertPrefsMap> onSave;
  final ValueChanged<String> onBlocked;

  @override
  Widget build(BuildContext context) {
    final map = prefs.prefs;
    final waOn = map.whatsapp?.bandChange != null;
    final digestOn = map.whatsapp?.digest != null;
    final pushOn = map.push != null;
    final quietOn = map.quietHours != null;

    return YouPanel(
      children: [
        Text(prefs.numberLine ?? '', style: PlinthType.small.copyWith(color: PlinthTokens.of(context).ink2)),
        YouToggleRow(
          title: 'Push notifications',
          subtitle: 'Rating changes, filings and visit reminders.',
          value: pushOn,
          onChanged: (on) => onSave(
            AlertPrefsMap(
              email: map.email,
              quietHours: map.quietHours,
              whatsapp: map.whatsapp,
              push: on ? ChannelPrefs(bandChange: 'instant', filings: 'instant') : null,
            ),
          ),
        ),
        YouToggleRow(
          title: 'WhatsApp alerts for projects I follow',
          subtitle: prefs.lines.join(' '),
          value: waOn,
          onChanged: (on) => onSave(
            AlertPrefsMap(
              email: map.email,
              push: map.push,
              quietHours: map.quietHours,
              whatsapp: on ? ChannelPrefs(bandChange: 'instant', digest: map.whatsapp?.digest) : null,
            ),
          ),
        ),
        YouToggleRow(
          title: 'Weekly digest',
          subtitle: digestOn ? 'One summary of your followed projects, ${digestLabel(map.whatsapp!.digest!)}.' : 'Off.',
          value: digestOn,
          enabled: waOn,
          onBlocked: () => onBlocked('Turn on WhatsApp alerts for projects I follow first.'),
          onChanged: (on) => onSave(
            AlertPrefsMap(
              email: map.email,
              push: map.push,
              quietHours: map.quietHours,
              whatsapp: ChannelPrefs(bandChange: map.whatsapp?.bandChange, digest: on ? 'weekly_sun_9am' : null),
            ),
          ),
        ),
        YouToggleRow(
          title: 'Quiet hours',
          subtitle: quietOn
              ? 'No alerts from ${friendlyTime(map.quietHours!.from)} to ${friendlyTime(map.quietHours!.to)}.'
              : 'Off.',
          value: quietOn,
          onChanged: (on) => onSave(
            AlertPrefsMap(
              email: map.email,
              push: map.push,
              whatsapp: map.whatsapp,
              quietHours: on ? QuietHours(from: '22:00', to: '08:00') : null,
            ),
          ),
        ),
      ],
    );
  }
}

class _ThemeToggle extends ConsumerWidget {
  const _ThemeToggle();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final night = ref.watch(themeModeProvider.select((m) => m == ThemeMode.dark));
    return YouPanel(
      children: [
        Text(
          'Night is easier on the eyes after dark. Risk bands keep the same names, order and meter.',
          style: PlinthType.small.copyWith(color: tokens.ink2),
        ),
        Row(
          children: [
            Expanded(
              child: PlinthPill(
                label: 'Day',
                selected: !night,
                onPressed: () => ref.read(themeModeProvider.notifier).pick(ThemeMode.light),
              ),
            ),
            const SizedBox(width: PlinthSpace.s12),
            Expanded(
              child: PlinthPill(
                label: 'Night',
                selected: night,
                onPressed: () => ref.read(themeModeProvider.notifier).pick(ThemeMode.dark),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _MoneyBlock extends ConsumerWidget {
  const _MoneyBlock();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final about = ref.watch(aboutProvider);
    return switch (about) {
      AsyncData(:final value) => YouPanel(
        children: [
          Text(
            value.money.neverLine,
            style: PlinthType.body.copyWith(fontWeight: FontWeight.w600, color: tokens.ink),
          ),
          for (final line in value.money.lines) Text(line, style: PlinthType.small.copyWith(color: tokens.ink2)),
        ],
      ),
      AsyncError() => const SizedBox.shrink(),
      _ => const Padding(
        padding: EdgeInsets.symmetric(vertical: PlinthSpace.s16),
        child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
      ),
    };
  }
}

class _GrievanceBlock extends ConsumerWidget {
  const _GrievanceBlock();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final about = ref.watch(aboutProvider);
    return switch (about) {
      AsyncData(:final value) => YouPanel(
        children: [
          Text(
            'Our Grievance Officer, ${value.grievance.officer}. Write to ${value.grievance.contact}. ${value.grievance.line}',
            style: PlinthType.small.copyWith(color: tokens.ink2),
          ),
        ],
      ),
      AsyncError() => const SizedBox.shrink(),
      _ => const SizedBox.shrink(),
    };
  }
}
