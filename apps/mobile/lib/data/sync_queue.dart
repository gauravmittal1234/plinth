import 'dart:async';
import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show ApiErrorCode;

import '../core/clock.dart';
import 'api_client.dart';
import 'auth.dart';
import 'local_store.dart';
import 'session.dart';

// Offline writes, after pet_app's lib/data/sync_queue.dart (BUILD_PLAN §5.3):
// follows, alert preferences and shortlist notes never fail for want of a
// connection. Each write is kept on the phone and replayed in order, right
// away, when the app returns to the foreground and every 20 seconds, until
// the server has it. Every write carries a `p_client_id`; the server returns
// the first result for a replayed id (API_CONTRACTS §1 "Idempotency"), and
// the queue never holds two writes with the same id.

/// A write kept on the phone until the server has it: `api.<fn>(args)`.
@immutable
class QueuedWrite {
  const QueuedWrite({required this.fn, required this.args, required this.queuedAt});

  factory QueuedWrite.fromJson(JsonMap json) => QueuedWrite(
    fn: json['fn'] as String,
    args: Map<String, dynamic>.from(json['args'] as Map),
    queuedAt: DateTime.parse(json['queued_at'] as String),
  );

  /// The `api` function.
  final String fn;

  /// Its `p_` arguments, `p_client_id` included.
  final JsonMap args;

  /// When the buyer made the change.
  final DateTime queuedAt;

  /// The idempotency key the server de-duplicates on.
  String get clientId => args['p_client_id'] as String;

  JsonMap toJson() => {'fn': fn, 'args': args, 'queued_at': queuedAt.toIso8601String()};

  @override
  String toString() => 'api.$fn($args)';
}

enum SyncStatus {
  /// The server has it; [SyncOutcome.result] is its answer.
  sent,

  /// Kept on the phone (no connection, or signed out); it will replay.
  queued,

  /// The server said no ([SyncOutcome.error]); the write is dropped.
  refused,
}

/// What happened to one write.
@immutable
class SyncOutcome {
  const SyncOutcome.sent(this.write, this.result) : status = SyncStatus.sent, error = null;
  const SyncOutcome.queued(this.write) : status = SyncStatus.queued, result = null, error = null;
  const SyncOutcome.refused(this.write, ApiException this.error) : status = SyncStatus.refused, result = null;

  final QueuedWrite write;
  final SyncStatus status;

  /// The server's JSON answer (sent only).
  final Object? result;

  /// Why the server said no (refused only).
  final ApiException? error;

  /// [result] when it is a payload with this `schema` envelope, else null.
  JsonMap? payload(String schema) {
    final r = result;
    return r is Map && r['schema'] == schema ? Map<String, dynamic>.from(r) : null;
  }

  @override
  String toString() => 'SyncOutcome(${status.name} ${write.fn}${error == null ? '' : ' $error'})';
}

/// The queue: an ordered list of writes not yet on the server.
class SyncQueue extends Notifier<List<QueuedWrite>> {
  /// Where the queue is kept ([LocalStore]).
  static const storeKey = 'data.sync_queue.v1';

  /// How often a non-empty queue retries while the app is open.
  static const interval = Duration(seconds: 20);

  /// The writes that go through the queue (WORK_BREAKDOWN T17; AGENTS §4).
  static const queuedFunctions = {'follow', 'unfollow', 'set_follow_type', 'alert_prefs_set', 'shortlist_note_add'};

  Timer? _timer;
  Future<void>? _loaded;
  Future<void>? _flushing;
  bool _again = false;
  final _results = <String, SyncOutcome>{};
  final _outcomes = StreamController<SyncOutcome>.broadcast();

  /// Every write the server answered (sent or refused), as it happens.
  Stream<SyncOutcome> get outcomes => _outcomes.stream;

  @override
  List<QueuedWrite> build() {
    final life = AppLifecycleListener(onResume: flush);
    // Signing in replays what waited; signing out forgets it: the next person
    // on this phone must not replay someone else's follows. A plain stream
    // subscription, because Riverpod pauses `ref.listen` while nothing
    // watches the queue.
    final auth = ref.read(authRepositoryProvider).changes.listen((now) => now ? flush() : clear());
    ref.onDispose(() {
      _timer?.cancel();
      life.dispose();
      auth.cancel();
      _outcomes.close();
    });
    _loaded = _load();
    return const [];
  }

  Future<void> _load() async {
    final raw = await ref.read(localStoreProvider).read(storeKey);
    if (raw == null || !ref.mounted) return;
    try {
      final saved = [
        for (final j in jsonDecode(raw) as List) QueuedWrite.fromJson(Map<String, dynamic>.from(j as Map)),
      ];
      final ids = {for (final w in state) w.clientId};
      // Saved writes are older than anything queued since the app started.
      state = [...saved.where((w) => !ids.contains(w.clientId)), ...state];
      _schedule();
    } catch (_) {
      // An unreadable queue is dropped rather than blocking every write.
    }
  }

  Future<void> _save() async {
    if (!ref.mounted) return;
    final store = ref.read(localStoreProvider);
    await store.write(storeKey, state.isEmpty ? null : jsonEncode([for (final w in state) w.toJson()]));
  }

  /// Queues `api.<fn>(args)` with a fresh `p_client_id` (unless [args] has
  /// one) and tries to send it now. See [submit].
  Future<SyncOutcome> send(String fn, JsonMap args) {
    assert(queuedFunctions.contains(fn), 'api.$fn is not a queued write');
    final clientId = args['p_client_id'] as String? ?? ref.read(clientIdProvider)();
    return submit(QueuedWrite(fn: fn, args: {...args, 'p_client_id': clientId}, queuedAt: ref.read(clockProvider)()));
  }

  /// Adds [write] (unless a write with its `p_client_id` is already queued)
  /// and tries to send the queue now. Completes with [write]'s outcome:
  /// sent, refused, or queued when it has to wait.
  Future<SyncOutcome> submit(QueuedWrite write) async {
    await _loaded;
    if (!ref.mounted) return SyncOutcome.queued(write);
    if (!state.any((w) => w.clientId == write.clientId)) {
      state = [...state, write];
      await _save();
    }
    await flush();
    return _results.remove(write.clientId) ?? SyncOutcome.queued(write);
  }

  /// Sends queued writes in order until one has to wait. A write the server
  /// refuses is dropped and reported; one that cannot be sent yet (offline,
  /// rate limited, signed out) stops the run and keeps its place.
  ///
  /// A call during a run makes that run go round once more, so a write added
  /// meanwhile is never left for the timer.
  Future<void> flush() {
    final running = _flushing;
    if (running != null) {
      _again = true;
      return running;
    }
    return _flushing = _drain().whenComplete(() => _flushing = null);
  }

  Future<void> _drain() async {
    do {
      _again = false;
      await _run();
    } while (_again && ref.mounted);
  }

  Future<void> _run() async {
    await _loaded;
    if (!ref.mounted || !ref.read(authRepositoryProvider).signedIn) return;
    final api = ref.read(apiClientProvider);
    while (ref.mounted && state.isNotEmpty) {
      final write = state.first;
      SyncOutcome outcome;
      try {
        outcome = SyncOutcome.sent(write, await api.rpc(write.fn, write.args));
      } on OfflineException {
        break;
      } on ApiException catch (e) {
        if (e.retryable || e.code == ApiErrorCode.authRequired) break;
        outcome = SyncOutcome.refused(write, e);
      }
      if (!ref.mounted) return;
      state = [
        for (final w in state)
          if (w.clientId != write.clientId) w,
      ];
      await _save();
      _results[write.clientId] = outcome;
      if (!_outcomes.isClosed) _outcomes.add(outcome);
    }
    if (ref.mounted) _schedule();
  }

  /// Forgets every queued write.
  Future<void> clear() async {
    if (!ref.mounted) return;
    state = const [];
    _results.clear();
    _schedule();
    await _save();
  }

  void _schedule() {
    if (state.isEmpty) {
      _timer?.cancel();
      _timer = null;
    } else {
      _timer ??= Timer.periodic(interval, (_) => flush());
    }
  }
}

final syncQueueProvider = NotifierProvider<SyncQueue, List<QueuedWrite>>(SyncQueue.new);
