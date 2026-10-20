import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

/// A short confirmation ("Link copied", "Following Aurelia Heights, Phase
/// 2"): an ink toast over the content for 3.2 s, read out by screen readers.
/// Never the only place something important is said.
ScaffoldFeatureController<SnackBar, SnackBarClosedReason> showPlinthToast(
  BuildContext context,
  String message, {
  String? actionLabel,
  VoidCallback? onAction,
}) {
  final messenger = ScaffoldMessenger.of(context)..hideCurrentSnackBar();
  return messenger.showSnackBar(PlinthToast.snackBar(context, message, actionLabel: actionLabel, onAction: onAction));
}

/// The toast's look, for [showPlinthToast] and for showing it inline.
class PlinthToast extends StatelessWidget {
  const PlinthToast({super.key, required this.message});

  final String message;

  static const duration = Duration(milliseconds: 3200);

  /// The [SnackBar] [showPlinthToast] shows.
  static SnackBar snackBar(BuildContext context, String message, {String? actionLabel, VoidCallback? onAction}) {
    final tokens = PlinthTokens.of(context);
    return SnackBar(
      content: PlinthToast(message: message),
      duration: duration,
      behavior: SnackBarBehavior.floating,
      backgroundColor: tokens.inverse,
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PlinthRadius.panel)),
      action: actionLabel == null
          ? null
          : SnackBarAction(label: actionLabel, textColor: tokens.onInverse, onPressed: onAction ?? () {}),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Text(message, style: PlinthType.body.copyWith(height: 1.4, color: tokens.onInverse));
  }
}
