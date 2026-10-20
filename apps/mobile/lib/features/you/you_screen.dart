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

/// Tab 4: alerts, privacy and the account (app UI v2: a screen title, then
/// tight sections of cards and list rows with icon tiles).
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
          padding: const EdgeInsets.fromLTRB(
            PlinthLayout.gutterApp,
            PlinthSpace.s16,
            PlinthLayout.gutterApp,
            PlinthSpace.s32,
          ),
          children: [
            Semantics(
              header: true,
              child: Text('You', style: PlinthType.title.copyWith(color: tokens.ink)),
            ),
            const SizedBox(height: PlinthSpace.s8),
            Text(
              signedIn
                  ? 'Your account, your number and how Plinth reaches you.'
                  : 'Browse freely. Signing in only happens when you open Who has my number.',
              style: PlinthType.body.copyWith(color: tokens.ink2),
            ),
            const SizedBox(height: PlinthSpace.s20),
            const _NumberTeaser(),
            if (signedIn)
              const YouSection(
                title: 'What have I agreed to?',
                subtitle: 'Nothing is ticked until you tick it. Change your mind anytime.',
                child: _AlertToggles(),
              ),
            const YouSection(
              title: 'How should Plinth look?',
              subtitle: 'Night is easier on the eyes after dark. Risk bands keep the same names, order and meter.',
              child: _ThemeToggle(),
            ),
            const YouSection(title: 'How we make money', child: _MoneyBlock()),
            const YouSection(title: 'Who do I contact if something goes wrong?', child: _GrievanceBlock()),
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
      gap: PlinthSpace.s16,
      children: [
        Row(
          children: [
            PlinthIconTile(icon: Icons.phone_locked_rounded, tone: tokens.accentSoft, color: tokens.onAccentSoft),
            const SizedBox(width: PlinthSpace.s12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  switch (numbers) {
                    AsyncData(value: final value?) => Text(
                      value.countLine,
                      style: PlinthType.h3.copyWith(color: tokens.ink),
                    ),
                    AsyncError() => Text(
                      'Could not load who has your number.',
                      style: PlinthType.rowTitle.copyWith(color: tokens.ink),
                    ),
                    AsyncData() => Text(
                      'Your number is never shared without your tap.',
                      style: PlinthType.rowTitle.copyWith(color: tokens.ink),
                    ),
                    _ when signedIn => const SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    _ => Text(
                      'Your number is never shared without your tap.',
                      style: PlinthType.rowTitle.copyWith(color: tokens.ink),
                    ),
                  },
                  const SizedBox(height: 2),
                  Text(
                    'You choose who can contact you. At most 3 parties in any 30 days.',
                    style: PlinthType.meta.copyWith(color: tokens.ink2),
                  ),
                ],
              ),
            ),
          ],
        ),
        PlinthButton(
          label: 'Who has my number?',
          icon: Icons.lock_person_rounded,
          expand: true,
          onPressed: () => context.push(Routes.privacy),
        ),
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

    final tokens = PlinthTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (prefs.numberLine != null) ...[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 1),
                child: Icon(Icons.phone_iphone_rounded, size: 18, color: tokens.ink2),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(prefs.numberLine!, style: PlinthType.meta.copyWith(color: tokens.ink2)),
              ),
            ],
          ),
          const SizedBox(height: PlinthSpace.s12),
        ],
        PlinthGroup(
          children: [
            YouToggleRow(
              icon: Icons.notifications_rounded,
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
              icon: Icons.chat_rounded,
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
              icon: Icons.calendar_month_rounded,
              title: 'Weekly digest',
              subtitle: digestOn
                  ? 'One summary of your followed projects, ${digestLabel(map.whatsapp!.digest!)}.'
                  : 'Off.',
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
              icon: Icons.bedtime_rounded,
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
        ),
      ],
    );
  }
}

class _ThemeToggle extends ConsumerWidget {
  const _ThemeToggle();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final night = ref.watch(themeModeProvider.select((m) => m == ThemeMode.dark));
    // One segmented control (app UI v2), not two pills far apart.
    return PlinthSegmented<ThemeMode>(
      semanticLabel: 'Theme',
      value: night ? ThemeMode.dark : ThemeMode.light,
      options: const [
        SegmentOption(ThemeMode.light, 'Day', icon: Icons.light_mode_rounded),
        SegmentOption(ThemeMode.dark, 'Night', icon: Icons.dark_mode_rounded),
      ],
      onChanged: (mode) => ref.read(themeModeProvider.notifier).pick(mode),
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
        gap: PlinthSpace.s8,
        children: [
          Row(
            children: [
              PlinthIconTile(icon: Icons.handshake_rounded, tone: tokens.accentSoft, color: tokens.onAccentSoft),
              const SizedBox(width: PlinthSpace.s12),
              Expanded(
                child: Text(value.money.neverLine, style: PlinthType.rowTitle.copyWith(color: tokens.ink)),
              ),
            ],
          ),
          for (final line in value.money.lines) Text(line, style: PlinthType.meta.copyWith(color: tokens.ink2)),
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
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              PlinthIconTile(icon: Icons.support_agent_rounded, tone: tokens.track),
              const SizedBox(width: PlinthSpace.s12),
              Expanded(
                child: Text(
                  'Our Grievance Officer, ${value.grievance.officer}. Write to ${value.grievance.contact}. '
                  '${value.grievance.line}',
                  style: PlinthType.meta.copyWith(color: tokens.ink2),
                ),
              ),
            ],
          ),
        ],
      ),
      AsyncError() => const SizedBox.shrink(),
      _ => const SizedBox.shrink(),
    };
  }
}
