import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/theme_mode.dart';
import 'package:plinth/core/theme/app_theme.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../helpers/app_harness.dart';

void main() {
  testWidgets('Day is the default; the toggle switches to Night and back', (tester) async {
    final container = await pumpPlinth(tester);
    BuildContext page() => tester.element(find.text('AppExplore'));

    expect(container.read(themeModeProvider), ThemeMode.light);
    expect(Theme.of(page()).brightness, Brightness.light);

    await tester.tap(find.byTooltip('Switch to Night theme'));
    await tester.pumpAndSettle();
    expect(container.read(themeModeProvider), ThemeMode.dark);
    expect(Theme.of(page()).brightness, Brightness.dark);

    await tester.tap(find.byTooltip('Switch to Day theme'));
    await tester.pumpAndSettle();
    expect(Theme.of(page()).brightness, Brightness.light);
  });

  test('Day and Night carry the artboard grounds, inks and accents', () {
    final day = AppTheme.day();
    expect(day.useMaterial3, isTrue);
    expect(day.scaffoldBackgroundColor, const Color(0xFFFBFAF7));
    expect(day.colorScheme.onSurface, const Color(0xFF1B1A17));
    expect(day.colorScheme.primary, const Color(0xFF1D5A44));

    final night = AppTheme.night();
    expect(night.brightness, Brightness.dark);
    expect(night.scaffoldBackgroundColor, const Color(0xFF0B1411));
    expect(night.colorScheme.onSurface, const Color(0xFFEEF3F0));
    expect(night.colorScheme.primary, const Color(0xFF6EE7B7));
  });

  test('colours come from T01: PlinthTokens Day/Night ride along as a ThemeExtension', () {
    final day = AppTheme.day();
    expect(day.extension<PlinthTokens>(), same(PlinthTokens.day));
    expect(day.scaffoldBackgroundColor, PlinthTokens.day.bg);
    expect(day.colorScheme.primary, PlinthTokens.day.accent);
    expect(day.colorScheme.outlineVariant, PlinthTokens.day.line);
    expect(day.bottomSheetTheme.shadowColor, PlinthTokens.day.sheetShadow.first.color);

    final night = AppTheme.night();
    expect(night.extension<PlinthTokens>(), same(PlinthTokens.night));
    expect(night.scaffoldBackgroundColor, PlinthTokens.night.bg);
    expect(night.navigationBarTheme.backgroundColor, PlinthTokens.night.nav);
    expect(night.colorScheme.error, PlinthTokens.night.error);
  });

  test('type: Bricolage Grotesque 800 for display, Mukta for text', () {
    final text = AppTheme.day().textTheme;
    expect(text.headlineLarge?.fontFamily, AppTheme.displayFamily);
    expect(text.headlineLarge?.fontWeight, FontWeight.w800);
    expect(text.bodyMedium?.fontFamily, AppTheme.textFamily);
    expect(text.bodyMedium?.fontFamilyFallback, AppTheme.textFallback);
    expect(text.bodyMedium?.fontSize, 16);
  });

  test('no shadows at rest: app bar and navigation bar sit flat', () {
    final theme = AppTheme.day();
    expect(theme.appBarTheme.elevation, 0);
    expect(theme.appBarTheme.scrolledUnderElevation, 0);
    expect(theme.navigationBarTheme.elevation, 0);
    expect(theme.navigationBarTheme.height, 64);
  });
}
