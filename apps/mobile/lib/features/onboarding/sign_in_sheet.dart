import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../core/widgets/widgets.dart';
import '../../data/auth.dart';
import 'onboarding_copy.dart';
import 'sign_in_flow_controller.dart';
import 'steps/code_step.dart';
import 'steps/phone_step.dart';

/// Opens the quick sign-in sheet: the same phone-and-code logic as
/// AppOnboarding's own Phone/Code steps ([SignInFlowController]), in the
/// compact chrome a sheet needs. Completes when the sheet closes.
///
/// The router opens this for account pages (`/you/*`) when signed out
/// (`app/account_gate.dart`'s `SignInOnOpen`), and account actions (Follow,
/// alerts) open it too. Signing in here goes to [next] when it is set,
/// rather than leaving the buyer on the sign-in sheet's own page.
Future<void> showSignInSheet(BuildContext context, {String? next}) {
  return showPlinthSheet<void>(
    context: context,
    builder: (sheetContext) => _SignInSheet(
      onVerified: () {
        Navigator.of(sheetContext).maybePop();
        if (next != null && context.mounted) context.go(next);
      },
    ),
  );
}

class _SignInSheet extends ConsumerStatefulWidget {
  const _SignInSheet({required this.onVerified});

  final VoidCallback onVerified;

  @override
  ConsumerState<_SignInSheet> createState() => _SignInSheetState();
}

class _SignInSheetState extends ConsumerState<_SignInSheet> {
  late final SignInFlowController _signIn = SignInFlowController(ref.read(authRepositoryProvider));
  bool _onCode = false;

  @override
  void dispose() {
    _signIn.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.only(bottom: PlinthSpace.s16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            PlinthSheetHeader(title: OnboardingCopy.signInSheetTitle),
            const SizedBox(height: PlinthSpace.s8),
            _onCode ? CodeStep(signIn: _signIn) : PhoneStep(signIn: _signIn),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: PlinthLayout.gutterApp),
              child: ListenableBuilder(
                listenable: _signIn,
                builder: (context, _) => PlinthButton(
                  key: const Key('sign-in-sheet-primary'),
                  expand: true,
                  label: _onCode
                      ? OnboardingCopy.verify
                      : (_signIn.viaWhatsApp ? OnboardingCopy.sendCodeOnWhatsApp : OnboardingCopy.sendCodeBySms),
                  onPressed: _signIn.busy ? null : _onPrimary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _onPrimary() async {
    if (_onCode) {
      final ok = await _signIn.verify();
      if (ok) widget.onVerified();
      return;
    }
    final ok = await _signIn.sendCode();
    if (ok && mounted) setState(() => _onCode = true);
  }
}
