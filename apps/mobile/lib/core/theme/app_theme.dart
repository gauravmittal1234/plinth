import 'package:flutter/material.dart';

/// Material 3 themes for Day (the default) and Night (DESIGN §3, §3.2b, §0).
///
/// SKELETON (T06): the colours below are the Day/Night `T` objects of the
/// phone artboards, held in a private [_Palette] whose field names match the
/// `PlinthTokens` ThemeExtension that T01 generates. T07 (M0 gate) replaces
/// [_Palette] with `PlinthTokens.day` / `PlinthTokens.night` and adds the
/// extension to `ThemeData.extensions`; widgets that read only
/// `Theme.of(context)` keep working unchanged. Do not add colours here.
abstract final class AppTheme {
  /// Display face: headlines, big numbers, band names.
  static const displayFamily = 'Bricolage Grotesque';

  /// Text and UI face; Noto Sans covers missing glyphs.
  static const textFamily = 'Mukta';
  static const textFallback = <String>['Noto Sans'];

  static ThemeData day() => _build(_Palette.day);
  static ThemeData night() => _build(_Palette.night);

  static ThemeData _build(_Palette p) {
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
      shadow: p.shadow,
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
        shadowColor: p.shadow,
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
    );
  }

  /// DESIGN §3.3, Android sp. Tabular, lining numerals throughout.
  static TextTheme _textTheme(_Palette p) {
    const numerals = <FontFeature>[FontFeature.tabularFigures(), FontFeature.liningFigures()];
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

/// The phone artboards' Day and Night `T` objects (DESIGN §3.2b; translucent
/// Night values flattened onto the Night ground). Field names follow T01's
/// `PlinthTokens`. Replaced by `PlinthTokens` in T07.
class _Palette {
  const _Palette({
    required this.brightness,
    required this.bg,
    required this.panel,
    required this.track,
    required this.nav,
    required this.navIndicator,
    required this.sheet,
    required this.line,
    required this.lineStrong,
    required this.ink,
    required this.ink2,
    required this.muted,
    required this.accent,
    required this.onAccent,
    required this.accentSoft,
    required this.onAccentSoft,
    required this.error,
    required this.scrim,
    required this.shadow,
  });

  final Brightness brightness;
  final Color bg;
  final Color panel;
  final Color track;
  final Color nav;
  final Color navIndicator;
  final Color sheet;
  final Color line;
  final Color lineStrong;
  final Color ink;
  final Color ink2;
  final Color muted;
  final Color accent;
  final Color onAccent;
  final Color accentSoft;
  final Color onAccentSoft;
  final Color error;
  final Color scrim;
  final Color shadow;

  static const day = _Palette(
    brightness: Brightness.light,
    bg: Color(0xFFFBFAF7),
    panel: Color(0xFFFFFFFF),
    track: Color(0xFFF4F2ED),
    nav: Color(0xFFEFECE5),
    navIndicator: Color(0xFFE9F1EC),
    sheet: Color(0xFFFFFFFF),
    line: Color(0xFFE7E3DA),
    lineStrong: Color(0xFFC9C4B9),
    ink: Color(0xFF1B1A17),
    ink2: Color(0xFF3F3C36),
    muted: Color(0xFF5E5A52),
    accent: Color(0xFF1D5A44),
    onAccent: Color(0xFFFFFFFF),
    accentSoft: Color(0xFFE9F1EC),
    onAccentSoft: Color(0xFF133D2E),
    error: Color(0xFFB42318),
    scrim: Color(0x6B1B1A17),
    shadow: Color(0x1F1B1A17),
  );

  static const night = _Palette(
    brightness: Brightness.dark,
    bg: Color(0xFF0B1411),
    panel: Color(0xFF16221D),
    track: Color(0xFF1C2522),
    nav: Color(0xFF121D19),
    navIndicator: Color(0xFF213D32),
    sheet: Color(0xFF111D19),
    line: Color(0xFF262E2B),
    lineStrong: Color(0xFF4F5654),
    ink: Color(0xFFEEF3F0),
    ink2: Color(0xFFB9C6C0),
    muted: Color(0xFF93A69D),
    accent: Color(0xFF6EE7B7),
    onAccent: Color(0xFF052E1F),
    accentSoft: Color(0xFF172D25),
    onAccentSoft: Color(0xFFCFF7E6),
    error: Color(0xFFFF8A80),
    scrim: Color(0x94000000),
    shadow: Color(0x73000000),
  );
}
