import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/app/theme_mode.dart';
import 'package:plinth/core/theme/app_theme.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../helpers/app_harness.dart';

void main() {
  testWidgets('Day is the default; the toggle switches to Night and back', (tester) async {
    // AppExplore (T30), Following (T50) and You (T51) are all filled now and
    // have no theme toggle of their own. Ask Plinth (AppVoice, M5) is still
    // the ArtboardPlaceholder that carries the toggle this test exercises.
    final container = await pumpPlinth(tester, location: Routes.ask);
    BuildContext page() => tester.element(find.text('AppVoice'));

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

  test('type (P10): Bricolage Grotesque 700 for display, titles and sections; Figtree for text', () {
    final text = AppTheme.day().textTheme;
    expect(AppTheme.textFamily, 'Figtree');
    expect(AppTheme.textFallback, ['Noto Sans']);
    for (final s in [text.displaySmall, text.headlineLarge, text.titleLarge]) {
      expect(s?.fontFamily, AppTheme.displayFamily);
      expect(s?.fontWeight, FontWeight.w700);
    }
    expect(text.headlineLarge?.fontSize, 26, reason: 'screen titles');
    expect(text.titleLarge?.fontSize, 20, reason: 'section headings');
    for (final s in [text.titleMedium, text.bodyMedium, text.bodySmall, text.labelLarge]) {
      expect(s?.fontFamily, AppTheme.textFamily);
      expect(s?.fontFamilyFallback, AppTheme.textFallback);
    }
    expect(text.titleMedium?.fontWeight, FontWeight.w600, reason: 'row titles');
    expect(text.labelLarge?.fontWeight, FontWeight.w700, reason: 'buttons');
    expect(text.bodyMedium?.fontSize, 16);
  });

  test('no shadows at rest: app bar and navigation bar sit flat', () {
    final theme = AppTheme.day();
    expect(theme.appBarTheme.elevation, 0);
    expect(theme.appBarTheme.scrolledUnderElevation, 0);
    expect(theme.navigationBarTheme.elevation, 0);
    expect(theme.navigationBarTheme.height, PlinthLayout.navFloating, reason: 'app UI v2: a floating 72 dp bar');
  });
}
