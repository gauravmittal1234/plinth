import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import 'onboarding_copy.dart';

/// Six boxes showing a one-time code, after the artboard's own technique: one
/// real, invisible [TextField] captures input; the boxes beneath are purely
/// decorative so VoiceOver/TalkBack reads the field once, not six times.
class OtpCells extends StatefulWidget {
  const OtpCells({super.key, required this.value, required this.onChanged, this.hasError = false});

  final String value;
  final ValueChanged<String> onChanged;
  final bool hasError;

  @override
  State<OtpCells> createState() => _OtpCellsState();
}

class _OtpCellsState extends State<OtpCells> {
  late final TextEditingController _controller = TextEditingController(text: widget.value);
  final _focus = FocusNode();

  @override
  void didUpdateWidget(OtpCells old) {
    super.didUpdateWidget(old);
    if (widget.value != _controller.text) _controller.text = widget.value;
  }

  @override
  void dispose() {
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final active = widget.value.length.clamp(0, 5);
    return GestureDetector(
      onTap: () => _focus.requestFocus(),
      child: SizedBox(
        height: 60,
        child: Stack(
          children: [
            ExcludeSemantics(
              child: Row(
                children: [
                  for (var i = 0; i < 6; i++) ...[
                    if (i > 0) const SizedBox(width: 6),
                    Expanded(
                      child: _Cell(
                        digit: i < widget.value.length ? widget.value[i] : '',
                        active: i == active,
                        hasError: widget.hasError,
                        tokens: tokens,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Positioned.fill(
              child: Opacity(
                opacity: 0,
                child: TextField(
                  key: const Key('onboarding-otp-field'),
                  controller: _controller,
                  focusNode: _focus,
                  autofocus: true,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.done,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
                  onChanged: widget.onChanged,
                  decoration: const InputDecoration(
                    labelText: OnboardingCopy.sixDigitCode,
                    border: InputBorder.none,
                    counterText: '',
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Cell extends StatelessWidget {
  const _Cell({required this.digit, required this.active, required this.hasError, required this.tokens});

  final String digit;
  final bool active;
  final bool hasError;
  final PlinthTokens tokens;

  @override
  Widget build(BuildContext context) {
    final border = active ? tokens.ink : (hasError ? tokens.error : tokens.lineStrong);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: tokens.bgSolid,
        borderRadius: BorderRadius.circular(PlinthRadius.panel),
        border: Border.all(color: border, width: active ? 2 : 1.5),
      ),
      child: Center(
        child: Text(digit, style: PlinthType.section.copyWith(color: tokens.ink)),
      ),
    );
  }
}
