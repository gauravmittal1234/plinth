// Every valid example in packages/contracts/examples decodes with the
// generated Dart models and survives an encode/decode round trip.
import 'dart:convert';
import 'dart:io';

import 'package:plinth_contracts/plinth_contracts.dart';
import 'package:test/test.dart';

import 'round_trips.g.dart';

void main() {
  final examples = Directory('../examples');

  test('every examples folder has a Dart model', () {
    final folders = examples
        .listSync()
        .whereType<Directory>()
        .map((d) => d.uri.pathSegments.where((s) => s.isNotEmpty).last)
        .toSet();
    expect(folders, equals(roundTrips.keys.toSet()));
  });

  for (final entry in roundTrips.entries) {
    final valid = Directory('${examples.path}/${entry.key}/valid');
    final files = valid.listSync().whereType<File>().toList()
      ..sort((a, b) => a.path.compareTo(b.path));
    group(entry.key, () {
      for (final file in files) {
        test(file.uri.pathSegments.last, () {
          final json = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
          final once = entry.value(json);
          for (final key in json.keys) {
            expect(once.containsKey(key), isTrue, reason: 'lost "$key"');
          }
          final twice = entry.value(jsonDecode(jsonEncode(once)) as Map<String, dynamic>);
          expect(jsonEncode(twice), equals(jsonEncode(once)));
        });
      }
    });
  }

  test('enum constants and catalogues', () {
    expect(DisplayState.values, contains(DisplayState.factsOnly));
    expect(BandCode.elevated, 'elevated');
    expect(refPatterns['C']!.hasMatch('C-1018-11'), isTrue);
    expect(refPatterns['C']!.hasMatch('PLN-C-261017-0623'), isFalse);
    expect(FlagKeys.values, hasLength(19));
    expect(schemaIds['plinth.risk_summary/1'], 'RiskSummary');
  });

  test('a newer server value does not break an older app', () {
    final json = jsonDecode(
      File('${examples.path}/risk_summary/valid/aurelia-heights-phase-2.json').readAsStringSync(),
    ) as Map<String, dynamic>;
    (json['display'] as Map<String, dynamic>)['overlays'] = ['pending_change', 'some_new_overlay'];
    json['a_field_added_later'] = true;
    final summary = RiskSummary.fromJson(json);
    expect(summary.display.overlays, contains('some_new_overlay'));
    expect(summary.display.state, DisplayState.scored);
  });
}
