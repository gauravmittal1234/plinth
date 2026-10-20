import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/data/alerts.dart';
import 'package:plinth/data/api_client.dart';
import 'package:plinth/data/compare.dart';
import 'package:plinth/data/developer.dart';
import 'package:plinth/data/evidence.dart';
import 'package:plinth/data/family.dart';
import 'package:plinth/data/fixture_world.dart';
import 'package:plinth/data/flags.dart';
import 'package:plinth/data/follow.dart';
import 'package:plinth/data/privacy.dart';
import 'package:plinth/data/project.dart';
import 'package:plinth/data/search.dart';
import 'package:plinth/data/trust.dart';
import 'package:plinth_contracts/plinth_contracts.dart';
import 'package:plinth_fixtures/plinth_fixtures.dart';

import 'data_test_helpers.dart';

/// Every contract type, by its `schema` envelope (catalogues.g.dart's
/// schemaIds): a fixture payload must parse with its own model.
final Map<String, Object Function(JsonMap)> _parsers = {
  'About': About.fromJson,
  'AffordTheWait': AffordTheWait.fromJson,
  'AlertPrefs': AlertPrefs.fromJson,
  'AskAnswer': AskAnswer.fromJson,
  'Compare': Compare.fromJson,
  'CostBreakdown': CostBreakdown.fromJson,
  'DeveloperPage': DeveloperPage.fromJson,
  'DocCheck': DocCheck.fromJson,
  'Evidence': Evidence.fromJson,
  'FamilyCircle': FamilyCircle.fromJson,
  'FamilyInvite': FamilyInvite.fromJson,
  'FamilyInvitePreview': FamilyInvitePreview.fromJson,
  'Flags': Flags.fromJson,
  'Follow': Follow.fromJson,
  'FollowingFeed': FollowingFeed.fromJson,
  'Methodology': Methodology.fromJson,
  'PayeeCheck': PayeeCheck.fromJson,
  'ProjectPage': ProjectPage.fromJson,
  'RiskSummary': RiskSummary.fromJson,
  'SavedSearches': SavedSearches.fromJson,
  'SearchResults': SearchResults.fromJson,
  'ShareCard': ShareCard.fromJson,
  'SuggestResults': SuggestResults.fromJson,
  'WhoHasMyNumber': WhoHasMyNumber.fromJson,
  'ConsentHistory': ConsentHistory.fromJson,
};

/// Expected-payload folders with no app repository in M2: M3 calculators and
/// checks (T03b ships their fixtures early). Their payloads still parse.
const _m3Folders = {'doc_check', 'cost_breakdown', 'afford_the_wait', 'payee_check'};

/// Buyer reads whose contract T45a defined after the app's repositories were
/// written (family_circle is still untyped JSON in lib/data/family.dart; the
/// app has no saved-searches read yet). Their payloads parse; typing the
/// repositories is the app's follow-up (T45a Handoff).
const _untypedFolders = {'family_circle', 'saved_searches'};

/// Calls the fixture repository that serves [folder] with the request's
/// arguments, as a screen would, and returns the contract model.
Future<Object> _viaRepository(ProviderContainer c, String folder, JsonMap request) {
  final slug = request['p_slug'] as String?;
  final state = request['state'] as String?;
  return switch (folder) {
    'risk_summary' => c.read(projectRepositoryProvider).riskSummary(PhaseRef(slug!, previewState: state)),
    'project_page' => c.read(projectRepositoryProvider).projectPage(PhaseRef(slug!, previewState: state)),
    'share_card' => c.read(projectRepositoryProvider).shareCard(request['p_code'] as String),
    'search_projects' =>
      c
          .read(searchRepositoryProvider)
          .search(
            SearchQuery(
              q: request['p_q'] as String? ?? '',
              filters: request['p_filters'] == null ? null : SearchFilters.fromJson(request['p_filters'] as JsonMap),
              sort: request['p_sort'] as String? ?? SearchQuery.defaultSort,
              cursor: request['p_cursor'] as String?,
              limit: request['p_limit'] as int? ?? SearchQuery.defaultLimit,
            ),
          ),
    'suggest' => c.read(searchRepositoryProvider).suggest(request['p_q'] as String),
    'developer_page' => c.read(developerRepositoryProvider).developerPage(slug!, previewState: state),
    'compare' => c.read(compareRepositoryProvider).compare(List<String>.from(request['p_slugs'] as List)),
    'evidence' => c.read(evidenceRepositoryProvider).evidence(EvidenceRef(request['p_fact_id'] as String)),
    'flags' => c.read(flagsRepositoryProvider).flags(),
    'methodology' => c.read(trustRepositoryProvider).methodology(),
    'about' => c.read(trustRepositoryProvider).about(),
    'following_feed' => c.read(followRepositoryProvider).feed(since: request['p_since'] as String?),
    'alert_prefs' => c.read(alertsRepositoryProvider).get(),
    'family_invite_preview' => c.read(familyRepositoryProvider).invitePreview(request['p_code'] as String),
    'who_has_my_number' => c.read(privacyRepositoryProvider).whoHasMyNumber(),
    _ => throw StateError('No app repository serves expected/$folder. Add one to lib/data/ (T17).'),
  };
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late ProviderContainer container;
  late FixtureWorld world;

  setUp(() {
    // Signed in, so the buyer fixtures (T03b) are served too.
    container = fixturesContainer(signedIn: true);
    addTearDown(container.dispose);
    world = container.read(fixtureWorldProvider);
  });

  test('the bundled fixture world has the M1 reads', () {
    for (final folder in ['risk_summary', 'project_page', 'search_projects', 'developer_page', 'compare', 'evidence']) {
      expect(plinthExpectedKeys[folder], isNotEmpty, reason: folder);
    }
    expect(plinthExpectedKeys['risk_summary'], hasLength(9));
  });

  for (final MapEntry(key: folder, value: keys) in plinthExpectedKeys.entries) {
    group('expected/$folder', () {
      for (final key in keys) {
        test('$key parses as its contract type and comes back through its repository', () async {
          final payload = await world.payload(folder, key);
          if (writeFunctions.contains(folder)) {
            // T03b's answers to the M2 writes: the fixture world answers the recorded request.
            final request = (await world.requests(folder))[key];
            expect(request, isNotNull, reason: '_requests.json has no "$key"');
            expect(await world.write(folder, request!), isNotNull);
            return;
          }
          final type = schemaIds[payload['schema']];
          expect(type, isNotNull, reason: 'unknown schema ${payload['schema']}');
          expect(_parsers[type]!(payload), isNotNull);

          if (_m3Folders.contains(folder)) return; // repositories arrive in M3
          if (_untypedFolders.contains(folder)) return; // typed by the app's follow-up
          final request = (await world.requests(folder))[key];
          expect(request, isNotNull, reason: '_requests.json has no "$key"');
          final model = await _viaRepository(container, folder, request!);
          expect(model.runtimeType.toString(), type);
          expect((model as dynamic).schema, payload['schema']);
        });
      }
    });
  }

  group('the request arguments find the right fixture', () {
    test('a risk summary is the phase asked for', () async {
      for (final slug in plinthExpectedKeys['risk_summary']!.where((k) => !k.contains('--'))) {
        final risk = await container.read(projectRepositoryProvider).riskSummary(PhaseRef(slug));
        expect(risk.phase.slug, slug);
        expect(risk.display.state, isNot(DisplayState.factsOnly), reason: slug);
      }
    });

    test('Aurelia reads Elevated, late after Apr 2029', () async {
      final risk = await container
          .read(projectRepositoryProvider)
          .riskSummary(const PhaseRef('aurelia-heights-phase-2'));
      expect(risk.chip.kind, ChipKind.band);
      expect(risk.chip.label, 'Elevated');
      expect(risk.band?.code, BandCode.elevated);
      expect(risk.late12.lateAfter, '2029-04');
      expect(risk.meta.dataAsOf, '2026-10-14');
    });

    test('the facts-only design state is a preview of the same phase', () async {
      final repo = container.read(projectRepositoryProvider);
      const preview = PhaseRef('aurelia-heights-phase-2', previewState: 'facts_only');
      final risk = await repo.riskSummary(preview);
      expect(risk.phase.slug, 'aurelia-heights-phase-2');
      expect(risk.display.state, DisplayState.factsOnly);
      expect(risk.band, isNull);
      expect(risk.withheld, isNotNull);
      final page = await repo.projectPage(preview);
      expect(page.risk.display.state, DisplayState.factsOnly);
      final dev = await container
          .read(developerRepositoryProvider)
          .developerPage('northfield-estates', previewState: 'facts_only');
      expect(dev.group.mode, DeveloperPageMode.factsOnly);
    });

    test('an unknown design state is not_found, not the plain page', () async {
      final repo = container.read(projectRepositoryProvider);
      await expectLater(
        repo.riskSummary(const PhaseRef('kestrel-park', previewState: 'facts_only')),
        throwsA(isA<ApiException>().having((e) => e.code, 'code', ApiErrorCode.notFound)),
      );
    });

    test('Explore lists every seeded phase, lowest delivery risk first', () async {
      final results = await container.read(searchRepositoryProvider).search(const SearchQuery());
      expect(results.items.map((i) => i.slug), [
        'kestrel-park',
        'cedar-walk-phase-2',
        'sapphire-grove-phase-1',
        'aurelia-heights-phase-2',
        'coral-towers',
        'laurel-residency',
        'juniper-enclave',
        'heron-point-phase-2',
      ]);
    });

    test('a fixture query matches whatever its case and spacing', () async {
      final repo = container.read(searchRepositoryProvider);
      final exact = await repo.search(const SearchQuery(q: '3 bhk dwarka expresway under 2.5 cr low risk'));
      final loose = await repo.search(const SearchQuery(q: '  3 BHK  Dwarka Expresway under 2.5 cr LOW risk '));
      expect(loose.items.map((i) => i.slug), exact.items.map((i) => i.slug));
      expect(exact.items, isNotEmpty);
    });

    test('a query with no fixture is not_found (the fixture world invents no results)', () async {
      await expectLater(
        container.read(searchRepositoryProvider).search(const SearchQuery(q: 'kestrel')),
        throwsA(isA<ApiException>().having((e) => e.code, 'code', ApiErrorCode.notFound)),
      );
    });

    test('compare keeps the order of the slugs', () async {
      final repo = container.read(compareRepositoryProvider);
      final three = await repo.compare(['aurelia-heights-phase-2', 'kestrel-park', 'sapphire-grove-phase-1']);
      expect(three.columns.map((c) => c.slug), ['aurelia-heights-phase-2', 'kestrel-park', 'sapphire-grove-phase-1']);
      await expectLater(
        repo.compare(['kestrel-park', 'aurelia-heights-phase-2']),
        throwsA(isA<ApiException>().having((e) => e.code, 'code', ApiErrorCode.notFound)),
      );
    });

    test('an evidence item is the fact asked for', () async {
      // Keys like '<fact id>--<slug>' are the web's per-page variants (api.evidence with
      // p_slug); the app asks by fact id only, so it reads the plain keys.
      for (final id in plinthExpectedKeys['evidence']!.where((k) => !k.contains('--'))) {
        final item = await container.read(evidenceRepositoryProvider).evidence(EvidenceRef(id));
        expect(item.factId, id);
      }
    });

    test('flags: bands are public in the fixture world', () async {
      final flags = await container.read(flagsRepositoryProvider).flags();
      expect(flags.flags[FlagKeys.bandsPublic], isTrue);
      expect(flags.flags[FlagKeys.aiAsk], isFalse);
    });
  });

  group('providers', () {
    test('riskSummaryProvider and projectPageProvider read the fixture world', () async {
      final risk = await container.read(riskSummaryProvider(const PhaseRef('kestrel-park')).future);
      expect(risk.value.chip.label, 'Low');
      expect(risk.offline, isFalse);
      final page = await container.read(projectPageProvider(const PhaseRef('laurel-residency')).future);
      expect(page.value.risk.band?.setBy, BandSetBy.redFlagRule);
    });

    test('bandsProvider gives the five bands, Low to Severe, as the server names them (for T15)', () async {
      final bands = await container.read(bandsProvider.future);
      expect([for (final b in bands) b.step], [1, 2, 3, 4, 5]);
      expect([for (final b in bands) b.label], ['Low', 'Moderate', 'Elevated', 'High', 'Severe']);
      expect(bands[2].low, 30);
      expect(bands[2].high, 45);
    });

    test('flagProvider is false while loading and true once bands_public loads', () async {
      expect(container.read(flagProvider(FlagKeys.bandsPublic)), isFalse);
      await container.read(flagsProvider.future);
      expect(container.read(flagProvider(FlagKeys.bandsPublic)), isTrue);
      expect(container.read(flagProvider('a_flag_added_later')), isFalse);
    });

    test('searchProvider and compareProvider', () async {
      final all = await container.read(searchProvider(const SearchQuery()).future);
      expect(all.items, hasLength(8));
      final compare = await container.read(
        compareProvider('aurelia-heights-phase-2,kestrel-park,sapphire-grove-phase-1,coral-towers').future,
      );
      expect(compare.columns, hasLength(4));
    });
  });
}
