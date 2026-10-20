import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../onboarding_copy.dart';
import '../otp_cells.dart';
import '../sign_in_flow_controller.dart';

/// "Enter the code": the 10-minute, 30-second-resend one-time code the auth
/// hook sent (T41; the sender is "PLINTH", set server-side — this screen
/// never names a sender itself). "WhatsApp one-tap autofill" reads whatever
/// 6-digit run the person actually copied from their clipboard; there is no
/// WhatsApp API a third-party app can hook into for more than that.
class CodeStep extends StatelessWidget {
  const CodeStep({super.key, required this.signIn});

  final SignInFlowController signIn;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return ListenableBuilder(
      listenable: signIn,
      builder: (context, _) => Padding(
        padding: const EdgeInsets.fromLTRB(
          PlinthLayout.gutterApp,
          PlinthSpace.s12,
          PlinthLayout.gutterApp,
          PlinthSpace.s24,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(OnboardingCopy.codeHeadline, style: PlinthType.title.copyWith(color: tokens.ink)),
            const SizedBox(height: PlinthSpace.s8),
            Text(signIn.sentLine, style: PlinthType.lead.copyWith(color: tokens.ink)),
            const SizedBox(height: PlinthSpace.s16),
            if (signIn.canAutofill) ...[_AutofillHint(signIn: signIn), const SizedBox(height: PlinthSpace.s16)],
            Text(OnboardingCopy.sixDigitCode, style: PlinthType.label.copyWith(color: tokens.ink)),
            const SizedBox(height: PlinthSpace.s8),
            OtpCells(value: signIn.otp, onChanged: signIn.setOtp, hasError: signIn.otpErr != null),
            if (signIn.otpErr != null) ...[
              const SizedBox(height: PlinthSpace.s8),
              Text(signIn.otpErr!, style: PlinthType.caption.copyWith(color: tokens.error)),
            ],
            const SizedBox(height: PlinthSpace.s16),
            Wrap(
              spacing: PlinthSpace.s20,
              runSpacing: PlinthSpace.s8,
              children: [
                PlinthButton(
                  kind: PlinthButtonKind.tertiary,
                  label: signIn.secondsLeft > 0
                      ? OnboardingCopy.resendIn(signIn.secondsLeft)
                      : OnboardingCopy.sendNewCode,
                  onPressed: signIn.secondsLeft > 0 || signIn.busy
                      ? null
                      : () async {
                          final ok = await signIn.resend();
                          if (ok && context.mounted) showPlinthToast(context, OnboardingCopy.newCodeSent);
                        },
                ),
                PlinthButton(
                  kind: PlinthButtonKind.tertiary,
                  label: signIn.viaWhatsApp ? OnboardingCopy.sendBySmsInstead : OnboardingCopy.sendOnWhatsAppInstead,
                  onPressed: signIn.busy
                      ? null
                      : () async {
                          final toWhatsApp = !signIn.viaWhatsApp;
                          final ok = await signIn.switchChannel();
                          if (ok && context.mounted) {
                            showPlinthToast(
                              context,
                              toWhatsApp ? OnboardingCopy.codeSentOnWhatsApp : OnboardingCopy.codeSentBySms,
                            );
                          }
                        },
                ),
              ],
            ),
            const SizedBox(height: PlinthSpace.s16),
            Text(OnboardingCopy.neverCallsForCode, style: PlinthType.meta.copyWith(color: tokens.ink)),
          ],
        ),
      ),
    );
  }
}

class _AutofillHint extends StatelessWidget {
  const _AutofillHint({required this.signIn});

  final SignInFlowController signIn;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Material(
      color: tokens.track,
      borderRadius: BorderRadius.circular(PlinthRadius.panel),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () async {
          final filled = await signIn.autofillFromClipboard();
          if (!filled && context.mounted) showPlinthToast(context, OnboardingCopy.nothingToFillIn);
        },
        child: Padding(
          padding: const EdgeInsets.all(PlinthSpace.s12),
          child: Row(
            children: [
              Icon(Icons.content_paste_go_rounded, size: PlinthLayout.iconLg, color: tokens.ink),
              const SizedBox(width: PlinthSpace.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(OnboardingCopy.codeArrivedOnWhatsApp, style: PlinthType.rowTitle.copyWith(color: tokens.ink)),
                    Text(OnboardingCopy.tapToFillIn, style: PlinthType.meta.copyWith(color: tokens.ink2)),
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
