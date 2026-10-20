// Flutter checks of the ThemeExtension (run by `flutter test` only).
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

const _themes = {'day': PlinthTokens.day, 'night': PlinthTokens.night};

void main() {
  test('Flutter colours equal the generated values, by name', () {
    _themes.forEach((name, tokens) {
      final values = plinthColorValues[name]!;
      expect(tokens.colors.keys.toList(), values.keys.toList());
      tokens.colors.forEach((key, color) {
        expect(color.toARGB32(), values[key], reason: '$name.$key');
      });
      for (final key in PlinthRiskKey.values) {
        final band = tokens.risk.of(key);
        final raw = plinthRiskValues[name]![key.name]!;
        expect(band.ink.toARGB32(), raw['ink'], reason: '$name.${key.name}');
        expect(band.fill.toARGB32(), raw['fill'], reason: '$name.${key.name}');
        expect(band.text.toARGB32(), raw['text'], reason: '$name.${key.name}');
      }
      expect(
        tokens.sheetShadow.single.color.toARGB32(),
        plinthSheetShadowValues[name],
      );
    });
  });

  test('Day is light and Night is dark', () {
    expect(PlinthTokens.day.brightness, Brightness.light);
    expect(PlinthTokens.night.brightness, Brightness.dark);
  });

  test('lerp runs from Day to Night', () {
    const day = PlinthTokens.day, night = PlinthTokens.night;
    final start = day.lerp(night, 0), end = day.lerp(night, 1);
    expect(start.colors, day.colors);
    expect(end.colors, night.colors);
    expect(end.risk.elevated.ink, night.risk.elevated.ink);
    expect(end.brightness, Brightness.dark);
    final mid = day.lerp(night, 0.5);
    expect(mid.bg, Color.lerp(day.bg, night.bg, 0.5));
    expect(
      mid.risk.high.fill,
      Color.lerp(day.risk.high.fill, night.risk.high.fill, 0.5),
    );
    expect(day.lerp(null, 0.5), same(day));
  });

  test('copyWith changes only what it is given', () {
    const red = Color(0xFF94211C);
    final copy = PlinthTokens.day.copyWith(accent: red);
    expect(copy.accent, red);
    final rest = Map.of(copy.colors)..remove('accent');
    final day = Map.of(PlinthTokens.day.colors)..remove('accent');
    expect(rest, day);
    expect(copy.risk, same(PlinthTokens.day.risk));
  });

  testWidgets('of() reads the extension, else falls back on brightness', (
    tester,
  ) async {
    late PlinthTokens fromExtension, fromBrightness;
    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData(extensions: const [PlinthTokens.night]),
        home: Builder(
          builder: (context) {
            fromExtension = PlinthTokens.of(context);
            return Theme(
              data: ThemeData(brightness: Brightness.dark),
              child: Builder(
                builder: (inner) {
                  fromBrightness = PlinthTokens.of(inner);
                  return const SizedBox();
                },
              ),
            );
          },
        ),
      ),
    );
    expect(fromExtension, same(PlinthTokens.night));
    expect(fromBrightness, same(PlinthTokens.night));
  });

  test('risk keys carry the meter step and style', () {
    expect(PlinthRiskKey.values.map((k) => k.step), [1, 2, 3, 4, 5, 0, 0]);
    expect(PlinthRiskKey.limited.meter, PlinthMeterStyle.dashed);
    expect(PlinthRiskKey.notScored.meter, PlinthMeterStyle.outlined);
  });

  test('type roles: families, tracking in px, tabular numerals', () {
    expect(PlinthType.display.fontFamily, 'Bricolage Grotesque');
    expect(PlinthType.display.fontWeight, FontWeight.w700);
    expect(PlinthType.display.letterSpacing, closeTo(-0.5, 1e-9));
    // App UI v2 (FOUNDER_QUESTIONS P10): Bricolage 700 for display, title and
    // section only; Figtree for every other role, with Noto Sans for Hindi.
    for (final s in [PlinthType.title, PlinthType.section]) {
      expect(s.fontFamily, 'Bricolage Grotesque');
      expect(s.fontWeight, FontWeight.w700);
    }
    for (final s in [
      PlinthType.rowTitle,
      PlinthType.body,
      PlinthType.meta,
      PlinthType.caption,
      PlinthType.button,
      PlinthType.label,
      PlinthType.number,
    ]) {
      expect(s.fontFamily, 'Figtree');
      expect(s.fontFamilyFallback, ['Noto Sans']);
    }
    expect(PlinthType.rowTitle.fontWeight, FontWeight.w600);
    expect(PlinthType.button.fontWeight, FontWeight.w700);
    expect(PlinthType.caption.fontSize, greaterThanOrEqualTo(13));
    expect(
      PlinthType.body.fontFeatures,
      contains(const FontFeature.tabularFigures()),
    );
  });

  test('spacing is on the 4-px grid and panels stay at or under 8', () {
    for (final s in [
      PlinthSpace.s4,
      PlinthSpace.s8,
      PlinthSpace.s12,
      PlinthSpace.s16,
      PlinthSpace.s20,
      PlinthSpace.s24,
      PlinthSpace.s32,
      PlinthSpace.s40,
      PlinthSpace.s56,
      PlinthSpace.s72,
    ]) {
      expect(s % 4, 0);
    }
    expect(PlinthRadius.none, 0);
    expect(PlinthRadius.panel, lessThanOrEqualTo(8));
    expect(PlinthLayout.touchApp, greaterThanOrEqualTo(48));
    expect(PlinthRadius.card, 20);
    expect(PlinthRadius.button, 16);
    expect(PlinthRadius.tile, 12);
    expect(PlinthLayout.buttonApp, 56);
    expect(
      PlinthLayout.buttonSecondaryApp,
      greaterThanOrEqualTo(PlinthLayout.touchApp),
    );
  });
}
