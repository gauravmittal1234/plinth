import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

/// Material 3 themes for Day (the default) and Night (DESIGN §3, §3.2b, §0),
/// with the app UI v2 type, shape and control sizes (benchmark-thapki.md,
/// FOUNDER_QUESTIONS P10).
///
/// Every colour comes from T01's generated [PlinthTokens]
/// (`PlinthTokens.day` / `PlinthTokens.night`), which is also registered in
/// `ThemeData.extensions`: widgets read `Theme.of(context)` for Material roles
/// and `PlinthTokens.of(context)` for the rest (risk ramp, chip fills, slab).
/// Do not add colours here; change `packages/tokens/tokens.json` and
/// regenerate.
abstract final class AppTheme {
  /// Display face: display, screen titles and section headings, at 700.
  static const displayFamily = PlinthType.displayFamily;

  /// Text and UI face (Figtree); Noto Sans covers Devanagari.
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
    final button = RoundedRectangleBorder(borderRadius: BorderRadius.circular(PlinthRadius.button));
    final field = BorderRadius.circular(PlinthRadius.field);
    return ThemeData(
      useMaterial3: true,
      brightness: p.brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: p.bg,
      canvasColor: p.bg,
      fontFamily: textFamily,
      fontFamilyFallback: textFallback,
      textTheme: text,
      // App UI v2: Material rounded icons only, 24 dp by default.
      iconTheme: IconThemeData(color: p.ink, size: PlinthLayout.iconLg),
      actionIconTheme: ActionIconThemeData(
        backButtonIconBuilder: (_) => const Icon(Icons.arrow_back_rounded),
        closeButtonIconBuilder: (_) => const Icon(Icons.close_rounded),
      ),
      // DESIGN §0: no shadows at rest, no hairline dividers.
      appBarTheme: AppBarTheme(
        backgroundColor: p.bg,
        foregroundColor: p.ink,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleTextStyle: PlinthType.h3.copyWith(color: p.ink),
        iconTheme: IconThemeData(color: p.ink, size: PlinthLayout.iconLg),
      ),
      dividerTheme: const DividerThemeData(color: Colors.transparent, space: 24, thickness: 0),
      // App UI v2: a floating 72 dp bar (AppShell), selected icon on the
      // indicator, label 13 · 700 when selected.
      navigationBarTheme: NavigationBarThemeData(
        height: PlinthLayout.navFloating,
        elevation: 0,
        backgroundColor: p.nav,
        surfaceTintColor: Colors.transparent,
        indicatorColor: p.navIndicator,
        indicatorShape: const StadiumBorder(),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (s) => PlinthType.label.copyWith(
            fontWeight: s.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w600,
            color: s.contains(WidgetState.selected) ? p.ink : p.ink2,
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (s) => IconThemeData(
            size: PlinthLayout.iconLg,
            color: s.contains(WidgetState.selected) ? p.onAccentSoft : p.ink2,
          ),
        ),
      ),
      // App UI v2: radius 16, 56 dp primary, 48 dp secondary, labels 16 · 700
      // on one line.
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: p.accent,
          foregroundColor: p.onAccent,
          minimumSize: const Size(48, PlinthLayout.buttonApp),
          shape: button,
          textStyle: text.labelLarge,
          padding: const EdgeInsets.symmetric(horizontal: 20),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: p.ink,
          minimumSize: const Size(48, PlinthLayout.buttonSecondaryApp),
          shape: button,
          side: BorderSide(color: p.ink),
          textStyle: text.labelLarge,
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: p.ink,
          minimumSize: const Size(48, PlinthLayout.touchApp),
          shape: button,
          textStyle: text.labelLarge?.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(foregroundColor: p.ink, minimumSize: const Size(48, 48)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: p.track,
        hintStyle: text.bodyLarge?.copyWith(color: p.ink2),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(borderRadius: field, borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: field, borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(
          borderRadius: field,
          borderSide: BorderSide(color: p.focus, width: 2),
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? p.onAccent : p.ink2),
        trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? p.accent : p.track),
        trackOutlineColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? Colors.transparent : p.lineStrong,
        ),
      ),
      checkboxTheme: CheckboxThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        fillColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? p.accent : null),
        checkColor: WidgetStatePropertyAll(p.onAccent),
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
        dragHandleSize: const Size(36, 4),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(PlinthRadius.sheet)),
        ),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: p.ink2,
        textColor: p.ink,
        titleTextStyle: text.titleMedium,
        subtitleTextStyle: text.bodySmall,
        minVerticalPadding: 12,
        minTileHeight: PlinthLayout.rowMin,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: p.ink,
        contentTextStyle: text.bodyMedium?.copyWith(color: p.bg),
        behavior: SnackBarBehavior.floating,
        shape: button,
        elevation: 0,
      ),
      splashFactory: InkSparkle.splashFactory,
      visualDensity: VisualDensity.standard,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      extensions: <ThemeExtension<dynamic>>[p],
    );
  }

  /// App UI v2 type scale (benchmark-thapki.md; PlinthType from the tokens):
  /// Bricolage Grotesque 700 for display, screen titles and section headings;
  /// Figtree for everything else. Tabular, lining numerals throughout.
  static TextTheme _textTheme(PlinthTokens p) {
    TextStyle ink(TextStyle s, [Color? c]) => s.copyWith(color: c ?? p.ink);
    return TextTheme(
      displayLarge: ink(PlinthType.display),
      displayMedium: ink(PlinthType.display),
      displaySmall: ink(PlinthType.display),
      headlineLarge: ink(PlinthType.title),
      headlineMedium: ink(PlinthType.title),
      headlineSmall: ink(PlinthType.title),
      titleLarge: ink(PlinthType.section),
      titleMedium: ink(PlinthType.rowTitle),
      titleSmall: ink(PlinthType.meta.copyWith(fontWeight: FontWeight.w600)),
      bodyLarge: ink(PlinthType.body),
      bodyMedium: ink(PlinthType.body),
      bodySmall: ink(PlinthType.meta, p.ink2),
      labelLarge: ink(PlinthType.button),
      labelMedium: ink(PlinthType.label),
      labelSmall: ink(PlinthType.caption, p.muted),
    );
  }
}
