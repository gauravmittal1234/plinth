import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart';

import 'api_client.dart';
import 'fixture_world.dart';
import 'session.dart';
import 'sync_queue.dart';

// The family circle (API_CONTRACTS §4.11): invite a relative with a one-person,
// 7-day code (`plinth.in/j/AH2-7KQ`), the circle's members, remove with undo,
// and shortlist notes. An invite carries no phone number; the relative's own
// WhatsApp "JOIN <code>" is the opt-in. Screens: AppFamily (T50).

abstract interface class FamilyRepository {
  /// `api.family_circle()`. Shape pending (T45a), returned as JSON.
  Future<JsonMap> circle();

  /// `api.family_invite_create(p_scope, p_client_id)`.
  Future<FamilyInvite> createInvite(FamilyInviteScope scope, {String? clientId});

  /// `api.family_invite_cancel(p_code)`.
  Future<Ok> cancelInvite(String code);

  /// `api.family_invite_preview(p_code)` (public): what a relative sees.
  Future<FamilyInvitePreview> invitePreview(String code);

  /// `api.family_member_remove(p_member_id)`. Shape pending (T45a).
  Future<JsonMap> removeMember(String memberId);

  /// `api.family_member_undo(p_member_id)`. Shape pending (T45a).
  Future<JsonMap> undoRemove(String memberId);

  /// `api.family_join(p_code)`: the app path for a code. Shape pending (T45a).
  Future<JsonMap> join(String code);

  /// `api.shortlist_note_add(p_slug, p_text, p_client_id)`. Shape pending
  /// (T45a). Prefer [ShortlistNotes.add], which queues it.
  Future<JsonMap> addNote(String slug, String text, {required String clientId});
}

JsonMap _inviteArgs(FamilyInviteScope scope, String? clientId) => {
  'p_scope': compactJson(scope.toJson()),
  'p_client_id': ?clientId,
};

class SupabaseFamilyRepository implements FamilyRepository {
  SupabaseFamilyRepository(this._api);

  final ApiClient _api;

  @override
  Future<JsonMap> circle() => _api.rpcMap('family_circle');

  @override
  Future<FamilyInvite> createInvite(FamilyInviteScope scope, {String? clientId}) async =>
      FamilyInvite.fromJson(await _api.rpcMap('family_invite_create', _inviteArgs(scope, clientId)));

  @override
  Future<Ok> cancelInvite(String code) async =>
      Ok.fromJson(await _api.rpcMap('family_invite_cancel', {'p_code': code}));

  @override
  Future<FamilyInvitePreview> invitePreview(String code) async =>
      FamilyInvitePreview.fromJson(await _api.rpcMap('family_invite_preview', {'p_code': code}));

  @override
  Future<JsonMap> removeMember(String memberId) => _api.rpcMap('family_member_remove', {'p_member_id': memberId});

  @override
  Future<JsonMap> undoRemove(String memberId) => _api.rpcMap('family_member_undo', {'p_member_id': memberId});

  @override
  Future<JsonMap> join(String code) => _api.rpcMap('family_join', {'p_code': code});

  @override
  Future<JsonMap> addNote(String slug, String text, {required String clientId}) =>
      _api.rpcMap('shortlist_note_add', {'p_slug': slug, 'p_text': text, 'p_client_id': clientId});
}

/// The fixture buyer's circle (`expected/family_invite_preview`, T03b; the
/// rest once fixtures exist). Writes are held in the fixture session.
class FixtureFamilyRepository implements FamilyRepository {
  FixtureFamilyRepository(this._world);

  final FixtureWorld _world;

  @override
  Future<JsonMap> circle() => _world.rpcMap('family_circle');

  @override
  Future<FamilyInvite> createInvite(FamilyInviteScope scope, {String? clientId}) async =>
      FamilyInvite.fromJson(await _world.writeAnswered('family_invite_create', _inviteArgs(scope, clientId)));

  @override
  Future<Ok> cancelInvite(String code) async {
    await _world.write('family_invite_cancel', {'p_code': code});
    return Ok(ok: true);
  }

  @override
  Future<FamilyInvitePreview> invitePreview(String code) async =>
      FamilyInvitePreview.fromJson(await _world.read('family_invite_preview', {'p_code': code}));

  @override
  Future<JsonMap> removeMember(String memberId) =>
      _world.writeAnswered('family_member_remove', {'p_member_id': memberId});

  @override
  Future<JsonMap> undoRemove(String memberId) => _world.writeAnswered('family_member_undo', {'p_member_id': memberId});

  @override
  Future<JsonMap> join(String code) => _world.writeAnswered('family_join', {'p_code': code});

  @override
  Future<JsonMap> addNote(String slug, String text, {required String clientId}) async =>
      await _world.write('shortlist_note_add', {'p_slug': slug, 'p_text': text, 'p_client_id': clientId}) ??
      const {'ok': true};
}

final familyRepositoryProvider = Provider<FamilyRepository>(
  (ref) => SupabaseFamilyRepository(ref.watch(apiClientProvider)),
);

/// The signed-in buyer's circle (null when signed out).
final familyCircleProvider = FutureProvider<JsonMap?>((ref) async {
  if (!ref.watch(signedInProvider)) return null;
  return ref.watch(familyRepositoryProvider).circle();
}, retry: noRetry);

/// An invite as the relative sees it (`/j/<code>`). Public: no sign-in.
final invitePreviewProvider = FutureProvider.family<FamilyInvitePreview, String>(
  (ref, code) => ref.watch(familyRepositoryProvider).invitePreview(code),
  retry: noRetry,
);

/// Shortlist notes, sent through the SyncQueue so a note written offline is
/// not lost.
class ShortlistNotes {
  ShortlistNotes(this._queue);

  final SyncQueue _queue;

  /// Adds a note on [slug] for the circle. Sent now, or queued until online.
  Future<SyncOutcome> add(String slug, String text) =>
      _queue.send('shortlist_note_add', {'p_slug': slug, 'p_text': text});
}

final shortlistNotesProvider = Provider<ShortlistNotes>((ref) => ShortlistNotes(ref.watch(syncQueueProvider.notifier)));
