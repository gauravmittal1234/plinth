import 'package:flutter/material.dart';

// Owned by T48 (AppOnboarding: sign in with a phone code). Stub from T06.
//
// The router opens this for account pages (`/you/*`) when signed out, and
// account actions (Follow, alerts) will call it too. Keep the signature:
// T48 signs the person in, then goes to [next] when it is set.

/// Opens the sign-in sheet. Completes when the sheet closes.
Future<void> showSignInSheet(BuildContext context, {String? next}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) => _SignInSheetPlaceholder(next: next),
  );
}

class _SignInSheetPlaceholder extends StatelessWidget {
  const _SignInSheetPlaceholder({this.next});

  final String? next;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Sign in with your phone', style: text.headlineMedium),
          const SizedBox(height: 8),
          Text('AppOnboarding', style: text.titleMedium),
          const SizedBox(height: 4),
          Text('Placeholder. T48 builds the sign-in sheet in M2.', style: text.bodyMedium),
          if (next != null) ...[const SizedBox(height: 8), Text('Then opens $next', style: text.bodySmall)],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: FilledButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Close')),
          ),
        ],
      ),
    );
  }
}
