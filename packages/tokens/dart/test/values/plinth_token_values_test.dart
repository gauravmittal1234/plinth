// Pure-Dart checks of the generated values (run by `dart test` and
// `flutter test`): they match tokens.json, carry no glass, and text pairs meet
// WCAG AA.
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;

import 'package:plinth_tokens/plinth_token_values.dart';
import 'package:test/test.dart';

/// tokens.json, read from the package that generated this one.
final Map<String, Object?> _tokens = jsonDecode(
  File('../tokens.json').readAsStringSync(),
) as Map<String, Object?>;

/// The `$value` at a dotted path, with `{references}` resolved.
Object? _value(String path) {
  Object? node = _tokens;
  for (final part in path.split('.')) {
    node = (node! as Map<String, Object?>)[part];
  }
  final value = (node! as Map<String, Object?>)[r'$value'];
  if (value is String && value.startsWith('{') && value.endsWith('}')) {
    return _value(value.substring(1, value.length - 1));
  }
  return value;
}

/// '#RRGGBB' | 'transparent' | 'rgba(r, g, b, a)' → 0xAARRGGBB.
int _argb(String css) {
  if (css == 'transparent') return 0x00000000;
  final hex = RegExp(r'^#([0-9A-Fa-f]{6})$').firstMatch(css);
  if (hex != null) return 0xFF000000 | int.parse(hex.group(1)!, radix: 16);
  final rgba = RegExp(r'^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$')
      .firstMatch(css);
  if (rgba == null) throw FormatException('unsupported colour', css);
  final a = (double.parse(rgba.group(4)!) * 255).round();
  return a << 24 |
      int.parse(rgba.group(1)!) << 16 |
      int.parse(rgba.group(2)!) << 8 |
      int.parse(rgba.group(3)!);
}

int _alpha(int argb) => (argb >> 24) & 0xFF;

double _luminance(int argb) {
  double channel(int shift) {
    final c = ((argb >> shift) & 0xFF) / 255;
    return c <= 0.04045
        ? c / 12.92
        : math.pow((c + 0.055) / 1.055, 2.4).toDouble();
  }

  return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
}

double _contrast(int a, int b) {
  final la = _luminance(a), lb = _luminance(b);
  return (math.max(la, lb) + 0.05) / (math.min(la, lb) + 0.05);
}

const _themes = ['day', 'night'];
const _bands = [
  'low',
  'moderate',
  'elevated',
  'high',
  'severe',
  'limited',
  'notScored',
];

void main() {
  test('theme colours match tokens.json', () {
    for (final theme in _themes) {
      final json = (_tokens['color']! as Map<String, Object?>)[theme]!;
      final names = (json as Map<String, Object?>).keys.toList();
      expect(plinthColorValues[theme]!.keys.toList(), names);
      for (final name in names) {
        expect(
          plinthColorValues[theme]![name],
          _argb(_value('color.$theme.$name')! as String),
          reason: 'color.$theme.$name',
        );
      }
    }
  });

  test('risk colours and the sheet shadow match tokens.json', () {
    for (final theme in _themes) {
      for (final band in _bands) {
        for (final role in ['ink', 'fill', 'text']) {
          expect(
            plinthRiskValues[theme]![band]![role],
            _argb(_value('risk.$theme.$band.$role')! as String),
            reason: 'risk.$theme.$band.$role',
          );
        }
      }
      final shadow = _value('elevation.$theme.sheet')! as Map<String, Object?>;
      expect(plinthSheetShadowValues[theme], _argb(shadow['color']! as String));
    }
  });

  test(
    'no glass: colours are opaque or fully transparent, except the scrim',
    () {
      for (final theme in _themes) {
        plinthColorValues[theme]!.forEach((name, argb) {
          if (name == 'scrim') {
            expect(_alpha(argb), inInclusiveRange(1, 254));
          } else {
            expect(_alpha(argb), anyOf(0x00, 0xFF), reason: '$theme.$name');
          }
        });
        for (final band in _bands) {
          for (final argb in plinthRiskValues[theme]![band]!.values) {
            expect(_alpha(argb), anyOf(0x00, 0xFF), reason: '$theme.$band');
          }
        }
      }
    },
  );

  test('text pairs meet WCAG AA (4.5:1)', () {
    for (final theme in _themes) {
      final c = plinthColorValues[theme]!;
      for (final fg in ['ink', 'ink2', 'muted']) {
        for (final bg in ['bg', 'panel', 'track', 'claimBg', 'nav', 'sheet']) {
          expect(
            _contrast(c[fg]!, c[bg]!),
            greaterThanOrEqualTo(4.5),
            reason: '$theme $fg on $bg',
          );
        }
      }
      for (final band in _bands) {
        final r = plinthRiskValues[theme]![band]!;
        for (final bg in ['bg', 'panel']) {
          expect(
            _contrast(r['text']!, c[bg]!),
            greaterThanOrEqualTo(4.5),
            reason: '$theme $band name on $bg',
          );
        }
        if (_alpha(r['fill']!) == 0xFF) {
          expect(
            _contrast(c['ink']!, r['fill']!),
            greaterThanOrEqualTo(4.5),
            reason: '$theme chip text on the $band fill',
          );
        }
      }
    }
  });

  test('Low and Moderate band names use ink on Day', () {
    final day = plinthColorValues['day']!;
    for (final band in ['low', 'moderate']) {
      final r = plinthRiskValues['day']![band]!;
      expect(r['text'], day['ink']);
      expect(_contrast(r['ink']!, day['bg']!), lessThan(4.5));
    }
  });

  test('version is set', () {
    expect(plinthTokensVersion, matches(RegExp(r'^\d+\.\d+\.\d+$')));
  });
}
