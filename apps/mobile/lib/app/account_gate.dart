import 'package:flutter/material.dart';

import '../features/onboarding/sign_in_sheet.dart';

/// Shows [child] and, once it is on screen, opens the sign-in sheet.
///
/// The router sends a signed-out person who opens an account page (`/you/*`)
/// to `/you?signin=1&next=<page>`; this widget opens the sheet there. Browsing
/// pages never do this (DESIGN §2.6: show value before asking, no login walls).
class SignInOnOpen extends StatefulWidget {
  const SignInOnOpen({super.key, required this.child, this.next});

  final Widget child;

  /// Where to go after signing in.
  final String? next;

  @override
  State<SignInOnOpen> createState() => _SignInOnOpenState();
}

class _SignInOnOpenState extends State<SignInOnOpen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) showSignInSheet(context, next: widget.next);
    });
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
