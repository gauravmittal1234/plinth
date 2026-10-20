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
  String? imageUrl,
}) {
  return showPlinthSheet<void>(
    context: context,
    builder: (_) => AlertsSheet(projectName: projectName, alertsLine: alertsLine, imageUrl: imageUrl),
  );
}

/// The follow sheet in the app UI v2 pattern (after Thapki's action sheet):
/// the project's thumbnail and the question, the server's alerts line as a
/// tinted hint, one 56 dp primary, then "just follow" as a grouped row.
class AlertsSheet extends StatelessWidget {
  const AlertsSheet({super.key, required this.projectName, required this.alertsLine, this.imageUrl});

  final String projectName;
  final String alertsLine;

  /// The project's `image_url`, for the header thumbnail.
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        PlinthSheetHeader(
          leading: ProjectThumb(imageUrl: imageUrl, size: 48),
          title: ProjectCopy.alertsHeading(projectName),
        ),
        Flexible(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterApp, PlinthSpace.s16, PlinthLayout.gutterApp, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                PlinthHintRow(icon: Icons.notifications_active_rounded, title: alertsLine, emphasized: false),
                const SizedBox(height: PlinthSpace.s16),
                PlinthButton(
                  label: ProjectCopy.turnOnAlerts,
                  icon: Icons.notifications_active_rounded,
                  expand: true,
                  onPressed: () => Navigator.of(context).maybePop(),
                ),
                const SizedBox(height: PlinthSpace.s8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(top: 1),
                      child: Icon(Icons.info_outline_rounded, size: 18, color: tokens.ink2),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(ProjectCopy.notificationNote, style: PlinthType.meta.copyWith(color: tokens.ink2)),
                    ),
                  ],
                ),
                const SizedBox(height: PlinthSpace.s20),
                PlinthGroup(
                  gapTone: tokens.sheet,
                  tone: tokens.track,
                  children: [
                    PlinthListRow(
                      leading: PlinthIconTile(icon: Icons.bookmark_added_rounded, tone: tokens.bgSolid),
                      title: ProjectCopy.notNowJustFollow,
                      onTap: () => Navigator.of(context).maybePop(),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
