import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/data/alerts.dart';
import 'package:plinth/data/api_client.dart';
import 'package:plinth/data/auth.dart';
import 'package:plinth/data/compare.dart';
import 'package:plinth/data/developer.dart';
import 'package:plinth/data/evidence.dart';
import 'package:plinth/data/family.dart';
import 'package:plinth/data/flags.dart';
import 'package:plinth/data/follow.dart';
import 'package:plinth/data/privacy.dart';
import 'package:plinth/data/project.dart';
import 'package:plinth/data/search.dart';
import 'package:plinth/data/trust.dart';
import 'package:plinth_contracts/plinth_contracts.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show GoTrueClient;

import 'data_test_helpers.dart';

/// One repository call: what it must send and what the live server answers.
typedef _Case = ({
  String name,
  Future<Object> Function(ProviderContainer c) call,
  String fn,
  JsonMap args,
  Object? answer,
  Type type,
});

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final scope = FamilyInviteScope(slugs: ['aurelia-heights-phase-2']);
  final prefs = AlertPrefsMap(
    push: ChannelPrefs(bandChange: Cadence.instant, filings: Cadence.instant),
    whatsapp: ChannelPrefs(bandChange: Cadence.instant, digest: Cadence.weeklySun9am),
    quietHours: QuietHours(from: '21:00', to: '08:00'),
  );

  // Every live repository call: the `api` function it reaches and its `p_`
  // arguments, answered with the contract's own example payloads (§5b facts).
  final cases = <_Case>[
    (
      name: 'ProjectRepository.riskSummary',
      call: (c) => c.read(projectRepositoryProvider).riskSummary(const PhaseRef('aurelia-heights-phase-2')),
      fn: 'risk_summary',
      args: {'p_slug': 'aurelia-heights-phase-2'},
      answer: contractExample('risk_summary', 'aurelia-heights-phase-2'),
      type: RiskSummary,
    ),
    (
      name: 'ProjectRepository.projectPage (a preview state is FIXTURES-only)',
      call: (c) => c
          .read(projectRepositoryProvider)
          .projectPage(const PhaseRef('aurelia-heights-phase-2', previewState: 'facts_only')),
      fn: 'project_page',
      args: {'p_slug': 'aurelia-heights-phase-2'},
      answer: contractExample('project_page', 'aurelia-heights-phase-2'),
      type: ProjectPage,
    ),
    (
      name: 'ProjectRepository.shareCard',
      call: (c) => c.read(projectRepositoryProvider).shareCard('AH2-C1'),
      fn: 'share_card',
      args: {'p_code': 'AH2-C1'},
      answer: contractExample('share_card', 'aurelia-old-card-v1-1'),
      type: ShareCard,
    ),
    (
      name: 'SearchRepository.search',
      call: (c) => c
          .read(searchRepositoryProvider)
          .search(
            SearchQuery(
              q: '3 bhk dwarka expresway under 2.5 cr low risk',
              filters: SearchFilters(bhk: [3], corridors: ['dwarka-expressway']),
            ),
          ),
      fn: 'search_projects',
      args: {
        'p_q': '3 bhk dwarka expresway under 2.5 cr low risk',
        'p_filters': {
          'bhk': [3],
          'corridors': ['dwarka-expressway'],
        },
        'p_sort': 'lowest_risk',
        'p_bbox': null,
        'p_cursor': null,
        'p_limit': 20,
      },
      answer: contractExample('search_results', '3bhk-dwarka-under-2-5-cr-low-risk'),
      type: SearchResults,
    ),
    (
      name: 'SearchRepository.suggest',
      call: (c) => c.read(searchRepositoryProvider).suggest('aurelia'),
      fn: 'suggest',
      args: {'p_q': 'aurelia'},
      answer: contractExample('suggest_results', 'aurelia'),
      type: SuggestResults,
    ),
    (
      name: 'SearchRepository.requestProject',
      call: (c) => c.read(searchRepositoryProvider).requestProject('Indigo Terraces'),
      fn: 'request_project',
      args: {'p_name': 'Indigo Terraces', 'p_rera': null},
      answer: {'ref': 'R-1018-01'},
      type: Map<String, dynamic>,
    ),
    (
      name: 'DeveloperRepository.developerPage',
      call: (c) => c.read(developerRepositoryProvider).developerPage('northfield-estates'),
      fn: 'developer_page',
      args: {'p_slug': 'northfield-estates'},
      answer: contractExample('developer_page', 'northfield-estates'),
      type: DeveloperPage,
    ),
    (
      name: 'CompareRepository.compare',
      call: (c) => c.read(compareRepositoryProvider).compare(['aurelia-heights-phase-2', 'kestrel-park']),
      fn: 'compare',
      args: {
        'p_slugs': ['aurelia-heights-phase-2', 'kestrel-park'],
      },
      answer: contractExample('compare', 'aurelia-kestrel-sapphire'),
      type: Compare,
    ),
    (
      name: 'EvidenceRepository.evidence',
      call: (c) => c.read(evidenceRepositoryProvider).evidence(const EvidenceRef('fact-1')),
      fn: 'evidence',
      args: {'p_fact_id': 'fact-1'},
      answer: contractExample('evidence', 'aurelia-qpr-2026-q2'),
      type: Evidence,
    ),
    (
      name: 'EvidenceRepository.evidence with the page it was opened from (T13)',
      call: (c) =>
          c.read(evidenceRepositoryProvider).evidence(const EvidenceRef('fact-1', slug: 'aurelia-heights-phase-2')),
      fn: 'evidence',
      args: {'p_fact_id': 'fact-1', 'p_slug': 'aurelia-heights-phase-2'},
      answer: contractExample('evidence', 'aurelia-qpr-2026-q2'),
      type: Evidence,
    ),
    (
      name: 'FlagsRepository.flags',
      call: (c) => c.read(flagsRepositoryProvider).flags(),
      fn: 'flags',
      args: {},
      answer: contractExample('flags', 'anon-defaults'),
      type: Flags,
    ),
    (
      name: 'TrustRepository.methodology',
      call: (c) => c.read(trustRepositoryProvider).methodology(),
      fn: 'methodology',
      args: {},
      answer: contractExample('methodology', 'v1-2'),
      type: Methodology,
    ),
    (
      name: 'TrustRepository.about',
      call: (c) => c.read(trustRepositoryProvider).about(),
      fn: 'about',
      args: {},
      answer: contractExample('about', 'today'),
      type: About,
    ),
    (
      name: 'FollowRepository.follow',
      call: (c) => c
          .read(followRepositoryProvider)
          .follow('aurelia-heights-phase-2', type: FollowType.watching, source: FollowSource.app, clientId: 'c-1'),
      fn: 'follow',
      args: {'p_slug': 'aurelia-heights-phase-2', 'p_follow_type': 'watching', 'p_source': 'app', 'p_client_id': 'c-1'},
      answer: contractExample('follow', 'aurelia-watching'),
      type: Follow,
    ),
    (
      name: 'FollowRepository.unfollow',
      call: (c) => c.read(followRepositoryProvider).unfollow('kestrel-park', clientId: 'c-2'),
      fn: 'unfollow',
      args: {'p_slug': 'kestrel-park', 'p_client_id': 'c-2'},
      answer: contractExample('ok', 'ok'),
      type: Ok,
    ),
    (
      name: 'FollowRepository.setFollowType',
      call: (c) =>
          c.read(followRepositoryProvider).setFollowType('aurelia-heights-phase-2', type: 'booked', clientId: 'c-3'),
      fn: 'set_follow_type',
      args: {'p_slug': 'aurelia-heights-phase-2', 'p_follow_type': 'booked', 'p_client_id': 'c-3'},
      answer: contractExample('follow', 'aurelia-watching'),
      type: Follow,
    ),
    (
      name: 'FollowRepository.feed',
      call: (c) => c.read(followRepositoryProvider).feed(),
      fn: 'following_feed',
      args: {'p_since': null},
      answer: contractExample('following_feed', 'rohan-since-14-oct'),
      type: FollowingFeed,
    ),
    (
      name: 'FollowRepository.feed since a replay date',
      call: (c) => c.read(followRepositoryProvider).feed(since: '2026-07-01'),
      fn: 'following_feed',
      args: {'p_since': '2026-07-01'},
      answer: contractExample('following_feed', 'rohan-since-14-oct'),
      type: FollowingFeed,
    ),
    (
      name: 'FollowRepository.markSeen',
      call: (c) => c.read(followRepositoryProvider).markSeen(),
      fn: 'mark_following_seen',
      args: {},
      answer: contractExample('ok', 'ok'),
      type: Ok,
    ),
    (
      name: 'FollowRepository.linkWhatsappFollows',
      call: (c) => c.read(followRepositoryProvider).linkWhatsappFollows(accept: true),
      fn: 'link_whatsapp_follows',
      args: {'p_accept': true},
      answer: {'linked': 2},
      type: Map<String, dynamic>,
    ),
    (
      name: 'AlertsRepository.get',
      call: (c) => c.read(alertsRepositoryProvider).get(),
      fn: 'alert_prefs_get',
      args: {},
      answer: contractExample('alert_prefs', 'rohan'),
      type: AlertPrefs,
    ),
    (
      name: 'AlertsRepository.set (unset channels left out)',
      call: (c) => c.read(alertsRepositoryProvider).set(prefs, clientId: 'c-4'),
      fn: 'alert_prefs_set',
      args: {...contractExample('alert_prefs_set_request', 'rohan'), 'p_client_id': 'c-4'},
      answer: contractExample('alert_prefs', 'rohan'),
      type: AlertPrefs,
    ),
    (
      name: 'AlertsRepository.saveSearch',
      call: (c) =>
          c.read(alertsRepositoryProvider).saveSearch('3 BHK Dwarka', const SearchQuery(q: '3 bhk'), clientId: 'c-5'),
      fn: 'saved_search_save',
      args: {
        'p_name': '3 BHK Dwarka',
        'p_query': {'q': '3 bhk', 'sort': 'lowest_risk'},
        'p_client_id': 'c-5',
      },
      answer: {'id': 's-1'},
      type: Map<String, dynamic>,
    ),
    (
      name: 'AlertsRepository.deleteSearch',
      call: (c) => c.read(alertsRepositoryProvider).deleteSearch('s-1'),
      fn: 'saved_search_delete',
      args: {'p_id': 's-1'},
      answer: contractExample('ok', 'ok'),
      type: Ok,
    ),
    (
      name: 'FamilyRepository.circle',
      call: (c) => c.read(familyRepositoryProvider).circle(),
      fn: 'family_circle',
      args: {},
      answer: {'members': <Object>[]},
      type: Map<String, dynamic>,
    ),
    (
      name: 'FamilyRepository.createInvite',
      call: (c) => c.read(familyRepositoryProvider).createInvite(scope, clientId: 'c-6'),
      fn: 'family_invite_create',
      args: {...contractExample('family_invite_create_request', 'aurelia'), 'p_client_id': 'c-6'},
      answer: contractExample('family_invite', 'ah2-7kq'),
      type: FamilyInvite,
    ),
    (
      name: 'FamilyRepository.cancelInvite',
      call: (c) => c.read(familyRepositoryProvider).cancelInvite('AH2-7KQ'),
      fn: 'family_invite_cancel',
      args: {'p_code': 'AH2-7KQ'},
      answer: contractExample('ok', 'ok'),
      type: Ok,
    ),
    (
      name: 'FamilyRepository.invitePreview',
      call: (c) => c.read(familyRepositoryProvider).invitePreview('AH2-7KQ'),
      fn: 'family_invite_preview',
      args: {'p_code': 'AH2-7KQ'},
      answer: contractExample('family_invite_preview', 'ah2-7kq'),
      type: FamilyInvitePreview,
    ),
    (
      name: 'FamilyRepository.removeMember',
      call: (c) => c.read(familyRepositoryProvider).removeMember('m-1'),
      fn: 'family_member_remove',
      args: {'p_member_id': 'm-1'},
      answer: {'ok': true},
      type: Map<String, dynamic>,
    ),
    (
      name: 'FamilyRepository.undoRemove',
      call: (c) => c.read(familyRepositoryProvider).undoRemove('m-1'),
      fn: 'family_member_undo',
      args: {'p_member_id': 'm-1'},
      answer: {'ok': true},
      type: Map<String, dynamic>,
    ),
    (
      name: 'FamilyRepository.join',
      call: (c) => c.read(familyRepositoryProvider).join('AH2-7KQ'),
      fn: 'family_join',
      args: {'p_code': 'AH2-7KQ'},
      answer: {'ok': true},
      type: Map<String, dynamic>,
    ),
    (
      name: 'FamilyRepository.addNote',
      call: (c) => c.read(familyRepositoryProvider).addNote('kestrel-park', 'Ask about parking', clientId: 'c-7'),
      fn: 'shortlist_note_add',
      args: {'p_slug': 'kestrel-park', 'p_text': 'Ask about parking', 'p_client_id': 'c-7'},
      answer: {'ok': true},
      type: Map<String, dynamic>,
    ),
    (
      name: 'PrivacyRepository.whoHasMyNumber',
      call: (c) => c.read(privacyRepositoryProvider).whoHasMyNumber(),
      fn: 'who_has_my_number',
      args: {},
      answer: contractExample('who_has_my_number', 'rohan'),
      type: WhoHasMyNumber,
    ),
    (
      name: 'PrivacyRepository.consentHistory',
      call: (c) => c.read(privacyRepositoryProvider).consentHistory(),
      fn: 'consent_history',
      args: {},
      answer: {'items': <Object>[]},
      type: Map<String, dynamic>,
    ),
    (
      name: 'PrivacyRepository.withdrawConsent',
      call: (c) => c.read(privacyRepositoryProvider).withdrawConsent('C-1012-04'),
      fn: 'consent_withdraw',
      args: {'p_ref': 'C-1012-04'},
      answer: contractExample('consent_withdrawal', 'c-1012-04'),
      type: ConsentWithdrawal,
    ),
    (
      name: 'PrivacyRepository.renewRelay',
      call: (c) => c.read(privacyRepositoryProvider).renewRelay('r-1'),
      fn: 'relay_renew',
      args: {'p_relay_id': 'r-1'},
      answer: {'ok': true},
      type: Map<String, dynamic>,
    ),
    (
      name: 'PrivacyRepository.requestDataExport',
      call: (c) => c.read(privacyRepositoryProvider).requestDataExport(),
      fn: 'data_export_request',
      args: {},
      answer: {'ok': true},
      type: Map<String, dynamic>,
    ),
    (
      name: 'PrivacyRepository.requestAccountDeletion',
      call: (c) => c.read(privacyRepositoryProvider).requestAccountDeletion(),
      fn: 'account_delete_request',
      args: {},
      answer: {'ok': true},
      type: Map<String, dynamic>,
    ),
  ];

  group('live repositories call the right api function with p_ arguments', () {
    for (final t in cases) {
      test(t.name, () async {
        final api = FakeApiClient({t.fn: t.answer});
        final container = liveContainer(api);
        addTearDown(container.dispose);
        final result = await t.call(container);
        expect(api.calls, hasLength(1));
        expect(api.calls.single.fn, t.fn);
        expect(api.calls.single.args, t.args);
        expect(api.calls.single.args.keys.every((k) => k.startsWith('p_')), isTrue);
        if (t.type == Map<String, dynamic>) {
          expect(result, t.answer);
        } else {
          expect(result.runtimeType, t.type);
        }
      });
    }

    test('every buyer function of API_CONTRACTS §3.2 (M2) and public read (M1) is covered', () {
      const m1m2 = {
        'risk_summary', 'project_page', 'search_projects', 'suggest', 'developer_page', 'compare', 'evidence', //
        'methodology', 'about', 'flags', 'share_card', 'family_invite_preview', 'me', 'device_register', 'follow',
        'unfollow', 'set_follow_type', 'following_feed', 'mark_following_seen', 'link_whatsapp_follows',
        'alert_prefs_get', 'alert_prefs_set', 'saved_search_save', 'saved_search_delete', 'family_circle',
        'family_invite_create', 'family_invite_cancel', 'family_member_remove', 'family_member_undo', 'family_join',
        'shortlist_note_add', 'who_has_my_number', 'consent_history', 'consent_withdraw', 'relay_renew',
        'data_export_request', 'account_delete_request', 'request_project',
      };
      final covered = {for (final t in cases) t.fn, 'me', 'device_register'}; // auth: next group
      expect(m1m2.difference(covered), isEmpty);
    });
  });

  group('live auth repository', () {
    test('me and device_register are api calls', () async {
      final api = FakeApiClient({
        'me': <String, dynamic>{'id': 'u-1'},
      });
      final repo = SupabaseAuthRepository(
        GoTrueClient(url: 'http://127.0.0.1:9/auth/v1', autoRefreshToken: false),
        api,
      );
      expect(await repo.me(), {'id': 'u-1'});
      final ok = await repo.registerDevice(token: 'fcm-token-for-tests', platform: 'android', appVersion: '0.1.0');
      expect(ok.ok, isTrue);
      expect(api.fns, ['me', 'device_register']);
      expect(api.calls.last.args, {
        'p_token': 'fcm-token-for-tests',
        'p_platform': 'android',
        'p_app_version': '0.1.0',
      });
    });
  });

  test('a server error reaches the caller as ApiException with its house-copy sentence', () async {
    const notFound = ApiException(
      ApiErrorCode.notFound,
      status: 404,
      details: 'We do not cover this project yet.',
      fn: 'risk_summary',
    );
    final container = liveContainer(FakeApiClient({'risk_summary': notFound}));
    addTearDown(container.dispose);
    await expectLater(
      container.read(projectRepositoryProvider).riskSummary(const PhaseRef('indigo-terraces')),
      throwsA(same(notFound)),
    );
  });

  test('an answer that is not a JSON object is unexpected', () async {
    final container = liveContainer(FakeApiClient({'flags': 'true'}));
    addTearDown(container.dispose);
    await expectLater(
      container.read(flagsRepositoryProvider).flags(),
      throwsA(isA<ApiException>().having((e) => e.code, 'code', ApiException.unexpected)),
    );
  });
}
