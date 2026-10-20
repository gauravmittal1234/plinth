import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../core/widgets/widgets.dart';
import 'project_copy.dart';

/// "Get alerts for {name}?" right after a first follow: the server's
/// [alertsLine], and a choice between turning alerts on and following quietly.
/// Push itself is T48's; this sheet only records the buyer's choice is a
/// later concern — for M1 it simply confirms the follow and explains what
/// comes next (DESIGN §4.16: no FAB, a sheet instead).
Future<void> showAlertsSheet(
  BuildContext context, {
  required String projectName,
  required String alertsLine,
}) {
  return showPlinthSheet<void>(
    context: context,
    builder: (_) => AlertsSheet(projectName: projectName, alertsLine: alertsLine),
  );
}

class AlertsSheet extends StatelessWidget {
  const AlertsSheet({super.key, required this.projectName, required this.alertsLine});

  final String projectName;
  final String alertsLine;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            ProjectCopy.alertsHeading(projectName),
            style: PlinthType.h2.copyWith(color: tokens.ink),
          ),
          const SizedBox(height: PlinthSpace.s12),
          Text(alertsLine, style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink)),
          const SizedBox(height: PlinthSpace.s8),
          Text(ProjectCopy.notificationNote, style: PlinthType.small.copyWith(color: tokens.muted)),
          const SizedBox(height: PlinthSpace.s24),
          PlinthButton(
            label: ProjectCopy.turnOnAlerts,
            onPressed: () => Navigator.of(context).maybePop(),
          ),
          const SizedBox(height: PlinthSpace.s12),
          PlinthButton(
            label: ProjectCopy.notNowJustFollow,
            kind: PlinthButtonKind.tonal,
            onPressed: () => Navigator.of(context).maybePop(),
          ),
        ],
      ),
    );
  }
}
