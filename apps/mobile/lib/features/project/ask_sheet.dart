import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../core/widgets/widgets.dart';
import 'project_copy.dart';

/// Opens the project-scoped Ask Plinth sheet. `ai_ask` is off in R1
/// (INTEGRATION_NOTES.md), so this sheet states what Ask Plinth is and
/// offers a human adviser instead of a working text answer; M5 wires the
/// real answer behind the same sheet.
Future<void> showAskSheet(BuildContext context, {required String projectName, String? imageUrl}) {
  return showPlinthSheet<void>(
    context: context,
    builder: (_) => AskSheet(projectName: projectName, imageUrl: imageUrl),
  );
}

/// The Ask sheet in the app UI v2 pattern: the project's thumbnail and the
/// title, a 56 dp question field, the AI disclaimer as a tinted hint, and the
/// adviser as a grouped row with an icon tile.
class AskSheet extends StatefulWidget {
  const AskSheet({super.key, required this.projectName, this.imageUrl});

  final String projectName;

  /// The project's `image_url`, for the header thumbnail.
  final String? imageUrl;

  @override
  State<AskSheet> createState() => _AskSheetState();
}

class _AskSheetState extends State<AskSheet> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        PlinthSheetHeader(
          leading: ProjectThumb(imageUrl: widget.imageUrl, size: 48),
          title: ProjectCopy.ask,
          subtitle: ProjectCopy.askAbout(widget.projectName),
        ),
        Flexible(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterApp, PlinthSpace.s16, PlinthLayout.gutterApp, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: _controller,
                  minLines: 1,
                  maxLines: 4,
                  style: PlinthType.body.copyWith(color: tokens.ink),
                  decoration: InputDecoration(
                    hintText: ProjectCopy.askHint(widget.projectName),
                    prefixIcon: Padding(
                      padding: const EdgeInsetsDirectional.only(start: 16, end: 10),
                      child: Icon(Icons.auto_awesome_rounded, size: PlinthLayout.iconMd, color: tokens.ink),
                    ),
                    prefixIconConstraints: const BoxConstraints(minWidth: 46, minHeight: PlinthLayout.fieldApp),
                  ),
                ),
                const SizedBox(height: PlinthSpace.s12),
                PlinthHintRow(icon: Icons.info_rounded, title: ProjectCopy.askDisclaimer, emphasized: false),
                const SizedBox(height: PlinthSpace.s20),
                PlinthGroup(
                  gapTone: tokens.sheet,
                  tone: tokens.track,
                  children: [
                    PlinthListRow(
                      leading: PlinthIconTile(icon: Icons.support_agent_rounded, tone: tokens.bgSolid),
                      title: ProjectCopy.wantAPerson,
                      subtitle: '${ProjectCopy.talkToAdviser}\n${ProjectCopy.adviserHours}',
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
