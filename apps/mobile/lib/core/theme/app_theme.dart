import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

/// Material 3 themes for Day (the default) and Night (DESIGN §3, §3.2b, §0).
///
/// Every colour comes from T01's generated [PlinthTokens]
/// (`PlinthTokens.day` / `PlinthTokens.night`), which is also registered in
/// `ThemeData.extensions`: widgets read `Theme.of(context)` for Material roles
/// and `PlinthTokens.of(context)` for the rest (risk ramp, chip fills, slab).
/// Do not add colours here; change `packages/tokens/tokens.json` and
/// regenerate.
abstract final class AppTheme {
  /// Display face: headlines, big numbers, band names.
  static const displayFamily = PlinthType.displayFamily;

  /// Text and UI face; Noto Sans covers missing glyphs.
  static const textFamily = PlinthType.textFamily;
  static const textFallback = PlinthType.textFallback;

  static ThemeData day() => _build(PlinthTokens.day);
  static ThemeData night() => _build(PlinthTokens.night);

  static ThemeData _build(PlinthTokens p) {
    // The one shadow colour (sheets, menus, dialogs), never used at rest.
    final shadow = p.sheetShadow.first.color;
    final scheme = ColorScheme(
      brightness: p.brightness,
      primary: p.accent,
      onPrimary: p.onAccent,
      primaryContainer: p.accentSoft,
      onPrimaryContainer: p.onAccentSoft,
      secondary: p.ink,
      onSecondary: p.bg,
      secondaryContainer: p.navIndicator,
      onSecondaryContainer: p.onAccentSoft,
      surface: p.bg,
      onSurface: p.ink,
      onSurfaceVariant: p.ink2,
      surfaceContainerLowest: p.panel,
      surfaceContainerLow: p.panel,
      surfaceContainer: p.track,
      surfaceContainerHigh: p.track,
      surfaceContainerHighest: p.track,
      surfaceTint: Colors.transparent,
      outline: p.lineStrong,
      outlineVariant: p.line,
      error: p.error,
      onError: p.onAccent,
      scrim: p.scrim,
      shadow: shadow,
      inverseSurface: p.ink,
      onInverseSurface: p.bg,
    );
    final text = _textTheme(p);
    const pill = StadiumBorder();
    return ThemeData(
      useMaterial3: true,
      brightness: p.brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: p.bg,
      canvasColor: p.bg,
      fontFamily: textFamily,
      fontFamilyFallback: textFallback,
      textTheme: text,
      // DESIGN §0: no shadows at rest, no hairline dividers.
      appBarTheme: AppBarTheme(
        backgroundColor: p.bg,
        foregroundColor: p.ink,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleTextStyle: text.titleLarge,
      ),
      dividerTheme: const DividerThemeData(color: Colors.transparent, space: 24, thickness: 0),
      // DESIGN §4.16: a 64 dp bar with 4 tabs.
      navigationBarTheme: NavigationBarThemeData(
        height: 64,
        elevation: 0,
        backgroundColor: p.nav,
        surfaceTintColor: Colors.transparent,
        indicatorColor: p.navIndicator,
        indicatorShape: pill,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (s) => TextStyle(
            fontFamily: textFamily,
            fontFamilyFallback: textFallback,
            fontSize: 13,
            height: 16 / 13,
            fontWeight: s.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
            color: s.contains(WidgetState.selected) ? p.ink : p.ink2,
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (s) => IconThemeData(size: 24, color: s.contains(WidgetState.selected) ? p.onAccentSoft : p.ink2),
        ),
      ),
      // DESIGN §4.2 and §3.4: one primary action, 52 px pills, 48 dp targets.
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: p.accent,
          foregroundColor: p.onAccent,
          minimumSize: const Size(48, 52),
          shape: pill,
          textStyle: text.labelLarge,
          padding: const EdgeInsets.symmetric(horizontal: 24),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: p.ink,
          minimumSize: const Size(48, 48),
          shape: pill,
          side: BorderSide(color: p.ink),
          textStyle: text.labelLarge,
          padding: const EdgeInsets.symmetric(horizontal: 20),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: p.ink,
          minimumSize: const Size(48, 48),
          shape: pill,
          textStyle: text.labelLarge?.copyWith(decoration: TextDecoration.underline),
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(foregroundColor: p.ink, minimumSize: const Size(48, 48)),
      ),
      // Sheets float, so they are the one place with a shadow (DESIGN §3.4).
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: p.sheet,
        modalBackgroundColor: p.sheet,
        surfaceTintColor: Colors.transparent,
        elevation: 8,
        modalElevation: 8,
        shadowColor: shadow,
        showDragHandle: true,
        dragHandleColor: p.lineStrong,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: p.ink2,
        textColor: p.ink,
        minVerticalPadding: 12,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: p.ink,
        contentTextStyle: text.bodyMedium?.copyWith(color: p.bg),
        behavior: SnackBarBehavior.floating,
      ),
      splashFactory: InkSparkle.splashFactory,
      visualDensity: VisualDensity.standard,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      extensions: <ThemeExtension<dynamic>>[p],
    );
  }

  /// DESIGN §3.3, Android sp. Tabular, lining numerals throughout.
  static TextTheme _textTheme(PlinthTokens p) {
    const numerals = PlinthType.numerals;
    TextStyle display(double size, double height) => TextStyle(
      fontFamily: displayFamily,
      fontWeight: FontWeight.w800,
      fontSize: size,
      height: height,
      letterSpacing: -0.02 * size,
      color: p.ink,
      fontFeatures: numerals,
    );
    TextStyle body(double size, double height, {FontWeight weight = FontWeight.w400, Color? color}) => TextStyle(
      fontFamily: textFamily,
      fontFamilyFallback: textFallback,
      fontWeight: weight,
      fontSize: size,
      height: height,
      letterSpacing: 0,
      color: color ?? p.ink,
      fontFeatures: numerals,
    );
    return TextTheme(
      displayLarge: display(36, 1.02),
      displayMedium: display(36, 1.02),
      displaySmall: display(36, 1.02),
      headlineLarge: display(30, 1.08),
      headlineMedium: display(26, 1.1),
      headlineSmall: display(26, 1.1),
      titleLarge: display(20, 1.2),
      titleMedium: body(16, 1.4, weight: FontWeight.w600),
      titleSmall: body(14, 1.4, weight: FontWeight.w600),
      bodyLarge: body(18, 1.4),
      bodyMedium: body(16, 1.55),
      bodySmall: body(14, 1.45, color: p.ink2),
      labelLarge: body(16, 1.25, weight: FontWeight.w600),
      labelMedium: body(14, 1.3, weight: FontWeight.w600),
      labelSmall: body(13, 1.4, color: p.muted),
    );
  }
}
