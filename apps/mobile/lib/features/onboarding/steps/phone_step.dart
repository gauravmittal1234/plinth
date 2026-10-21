import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../onboarding_copy.dart';
import '../sign_in_flow_controller.dart';

/// "Sign in to follow projects": the phone number and how to send the code.
/// The bottom bar (built by the screen that hosts this step) owns the actual
/// "send code" action, calling [signIn]'s own `sendCode`; this widget is only
/// the step's content.
class PhoneStep extends StatelessWidget {
  const PhoneStep({super.key, required this.signIn});

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
            Text(OnboardingCopy.phoneHeadline, style: PlinthType.title.copyWith(color: tokens.ink)),
            const SizedBox(height: PlinthSpace.s8),
            Text(OnboardingCopy.phoneBody, style: PlinthType.lead.copyWith(color: tokens.ink)),
            const SizedBox(height: PlinthSpace.s16),
            Text(OnboardingCopy.mobileNumber, style: PlinthType.label.copyWith(color: tokens.ink)),
            const SizedBox(height: PlinthSpace.s8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _CcSelect(signIn: signIn),
                const SizedBox(width: PlinthSpace.s8),
                Expanded(
                  child: SizedBox(
                    height: PlinthLayout.fieldApp,
                    child: TextField(
                      key: const Key('onboarding-phone-field'),
                      keyboardType: TextInputType.phone,
                      textInputAction: TextInputAction.done,
                      onChanged: signIn.setPhone,
                      style: PlinthType.body.copyWith(color: tokens.ink),
                      decoration: InputDecoration(
                        hintText: OnboardingCopy.phoneHint,
                        hintStyle: PlinthType.body.copyWith(color: tokens.ink2),
                        filled: true,
                        fillColor: tokens.bgSolid,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 18),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(PlinthRadius.field),
                          borderSide: BorderSide(color: signIn.phoneErr != null ? tokens.error : tokens.lineStrong),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(PlinthRadius.field),
                          borderSide: BorderSide(color: signIn.phoneErr != null ? tokens.error : tokens.lineStrong),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(PlinthRadius.field),
                          borderSide: BorderSide(color: tokens.focus, width: 2),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            if (signIn.phoneErr != null) ...[
              const SizedBox(height: PlinthSpace.s8),
              Text(signIn.phoneErr!, style: PlinthType.caption.copyWith(color: tokens.error)),
            ],
            const SizedBox(height: PlinthSpace.s16),
            Text(OnboardingCopy.sendCodeBy, style: PlinthType.label.copyWith(color: tokens.ink)),
            const SizedBox(height: PlinthSpace.s8),
            PlinthSegmented<bool>(
              semanticLabel: OnboardingCopy.sendCodeBy,
              value: signIn.viaWhatsApp,
              options: const [
                SegmentOption(true, OnboardingCopy.whatsApp, icon: Icons.chat_rounded),
                SegmentOption(false, OnboardingCopy.sms, icon: Icons.sms_rounded),
              ],
              onChanged: signIn.pickChannel,
            ),
            const SizedBox(height: PlinthSpace.s16),
            Text.rich(
              TextSpan(
                style: PlinthType.meta.copyWith(color: tokens.ink),
                children: [
                  const TextSpan(text: '${OnboardingCopy.phoneDisclaimer} '),
                  TextSpan(
                    text: OnboardingCopy.privacyNotice,
                    style: const TextStyle(fontWeight: FontWeight.w600, decoration: TextDecoration.underline),
                    recognizer: _tapPrivacy(context),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static GestureRecognizer _tapPrivacy(BuildContext context) =>
      TapGestureRecognizer()..onTap = () => _showPrivacyNotice(context);

  static void _showPrivacyNotice(BuildContext context) {
    showPlinthSheet(
      context: context,
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(0, PlinthSpace.s16, 0, PlinthSpace.s24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const PlinthSheetHeader(title: OnboardingCopy.privacyNotice),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: PlinthLayout.gutterApp),
              child: Text(
                OnboardingCopy.privacyNoticeBody,
                style: PlinthType.body.copyWith(color: PlinthTokens.of(context).ink, height: 1.4),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CcSelect extends StatelessWidget {
  const _CcSelect({required this.signIn});

  final SignInFlowController signIn;

  static const _options = {
    '+91': OnboardingCopy.ccIn,
    '+971': OnboardingCopy.ccAe,
    '+1': OnboardingCopy.ccUs,
    '+44': OnboardingCopy.ccGb,
  };

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Container(
      height: PlinthLayout.fieldApp,
      width: 104,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: tokens.bgSolid,
        borderRadius: BorderRadius.circular(PlinthRadius.field),
        border: Border.all(color: tokens.lineStrong),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: signIn.cc,
          isExpanded: true,
          icon: Icon(Icons.expand_more_rounded, color: tokens.ink2),
          borderRadius: BorderRadius.circular(PlinthRadius.field),
          items: [
            for (final e in _options.entries)
              DropdownMenuItem(
                value: e.key,
                child: Text(e.value, style: PlinthType.body.copyWith(color: tokens.ink)),
              ),
          ],
          onChanged: (v) {
            if (v != null) signIn.setCc(v);
          },
        ),
      ),
    );
  }
}
