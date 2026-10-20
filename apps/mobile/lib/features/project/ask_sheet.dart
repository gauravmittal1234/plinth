import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../core/widgets/widgets.dart';
import 'project_copy.dart';

/// Opens the project-scoped Ask Plinth sheet. `ai_ask` is off in R1
/// (INTEGRATION_NOTES.md), so this sheet states what Ask Plinth is and
/// offers a human adviser instead of a working text answer; M5 wires the
/// real answer behind the same sheet.
Future<void> showAskSheet(BuildContext context, {required String projectName}) {
  return showPlinthSheet<void>(
    context: context,
    builder: (_) => AskSheet(projectName: projectName),
  );
}

class AskSheet extends StatefulWidget {
  const AskSheet({super.key, required this.projectName});

  final String projectName;

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
        PlinthSheetHeader(title: ProjectCopy.ask, subtitle: ProjectCopy.askAbout(widget.projectName)),
        Flexible(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(ProjectCopy.askDisclaimer, style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink2)),
                const SizedBox(height: PlinthSpace.s20),
                TextField(
                  controller: _controller,
                  minLines: 1,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: ProjectCopy.askHint(widget.projectName),
                    filled: true,
                    fillColor: tokens.track,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(PlinthRadius.panel),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: PlinthSpace.s24),
                const Divider(height: 1),
                const SizedBox(height: PlinthSpace.s20),
                Text(ProjectCopy.wantAPerson, style: PlinthType.body.copyWith(fontWeight: FontWeight.w600, color: tokens.ink)),
                const SizedBox(height: 6),
                Text(ProjectCopy.talkToAdviser, style: PlinthType.body.copyWith(color: tokens.ink)),
                const SizedBox(height: 2),
                Text(ProjectCopy.adviserHours, style: PlinthType.small.copyWith(color: tokens.muted)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
