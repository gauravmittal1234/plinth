import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Day by default, with a Night toggle (DESIGN, "Daylight Live"). The app does
/// not follow the phone's dark mode on its own.
///
/// Kept in memory for now; T51 (AppYou) owns the setting and may persist it.
class ThemeModeController extends Notifier<ThemeMode> {
  @override
  ThemeMode build() => ThemeMode.light;

  bool get isNight => state == ThemeMode.dark;

  void toggle() => state = isNight ? ThemeMode.light : ThemeMode.dark;

  /// Explicit Day/Night pick (AppYou "How should Plinth look?", T51).
  void pick(ThemeMode mode) => state = mode;
}

final themeModeProvider = NotifierProvider<ThemeModeController, ThemeMode>(ThemeModeController.new);
