import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/family.dart';

// Rohan's family circle (F-98; DESIGN §5b, fix-since-family.md §2): Meera
// joined 6 Oct 2026 with all 4 projects and can add notes; her father was
// invited 18 Oct 2026 to Aurelia Heights, Phase 2 and hasn't tapped the link
// yet. `api.family_circle` has no fixture payload yet (no
// packages/fixtures/expected/family_circle folder), so the member list below
// mirrors the AppFamily artboard's own facts and is kept for the app's
// session. Every change a buyer makes here (remove, undo, cancel invite)
// still goes through the matching `api.family_*` RPC first, and the screen
// only updates once that RPC answers (AGENTS.md rule 9: no confirmation
// without a record). `family_member_undo` backs Meera's Undo for real; a
// cancelled invite's Undo has no server call to reverse it (no fixture for
// one), so it only restores what this phone showed before the cancel.

/// Where one member of the circle stands.
enum MemberStatus {
  joined,
  removed,
  invited,

  /// An invite cancelled before it was tapped.
  cancelled,
}

/// One person in the circle, as DESIGN §5b names them. `memberId` is the
/// canonical id `api.family_member_remove`/`_undo` take; `inviteCode` is the
/// code `api.family_invite_cancel` takes.
class FamilyMemberFact {
  const FamilyMemberFact({
    required this.key,
    required this.name,
    this.init = '',
    this.person = false,
    this.memberId,
    this.inviteCode,
  });

  final String key;
  final String name;
  final String init;

  /// Shown as a person glyph instead of initials (no name yet, as the
  /// artboard draws Meera's father).
  final bool person;
  final String? memberId;
  final String? inviteCode;
}

const youFact = FamilyMemberFact(key: 'you', name: 'Rohan (you)', init: 'R');
const meeraFact = FamilyMemberFact(
  key: 'meera',
  name: 'Meera',
  init: 'M',
  memberId: '6a4ec682-1447-52b9-8c7a-92979e185e0b',
);
const fatherFact = FamilyMemberFact(
  key: 'father',
  name: 'Meera’s father',
  person: true,
  memberId: '0209e42c-7fec-5e5b-bfa8-525bb990232b',
  inviteCode: 'AH2-7KQ',
);

/// The circle as this phone currently shows it.
class FamilyCircleState {
  const FamilyCircleState({this.meeraStatus = MemberStatus.joined, this.fatherStatus = MemberStatus.invited});

  final MemberStatus meeraStatus;
  final MemberStatus fatherStatus;

  FamilyCircleState copyWith({MemberStatus? meeraStatus, MemberStatus? fatherStatus}) =>
      FamilyCircleState(meeraStatus: meeraStatus ?? this.meeraStatus, fatherStatus: fatherStatus ?? this.fatherStatus);

  FamilyMemberFact memberFact(String key) => switch (key) {
    'meera' => meeraFact,
    'father' => fatherFact,
    _ => youFact,
  };

  bool get fatherIn => fatherStatus == MemberStatus.invited || fatherStatus == MemberStatus.joined;

  /// Faces beside "Family circle" on Following and in the circle's entry row.
  List<FamilyMemberFact> get entryFaces => [
    if (meeraStatus == MemberStatus.joined) meeraFact,
    if (fatherIn) fatherFact,
  ];

  /// "With Meera · her father is invited" (AppFamily/AppFollowing's
  /// `entryText`/`circleText`).
  String get entryText {
    final who = <String>[if (meeraStatus == MemberStatus.joined) 'Meera'];
    final base = who.isEmpty ? 'Just you' : 'With ${who.join(' and ')}';
    return switch (fatherStatus) {
      MemberStatus.invited => '$base · her father is invited',
      MemberStatus.joined => who.isEmpty ? 'With Meera’s father' : '$base and her father',
      _ => base,
    };
  }
}

/// Holds [FamilyCircleState] and sends every change through its RPC first.
class FamilyCircleController extends Notifier<FamilyCircleState> {
  @override
  FamilyCircleState build() => const FamilyCircleState();

  /// `api.family_member_remove`, then marks Meera removed.
  Future<void> removeMeera() async {
    await ref.read(familyRepositoryProvider).removeMember(meeraFact.memberId!);
    state = state.copyWith(meeraStatus: MemberStatus.removed);
  }

  /// `api.family_member_undo`: restores Meera.
  Future<void> undoRemoveMeera() async {
    await ref.read(familyRepositoryProvider).undoRemove(meeraFact.memberId!);
    state = state.copyWith(meeraStatus: MemberStatus.joined);
  }

  /// `api.family_invite_cancel`, then marks the invite cancelled.
  Future<void> cancelFatherInvite() async {
    await ref.read(familyRepositoryProvider).cancelInvite(fatherFact.inviteCode!);
    state = state.copyWith(fatherStatus: MemberStatus.cancelled);
  }

  /// No RPC answers a cancelled invite's undo (no fixture for one yet): this
  /// restores what the phone showed, within the same session only.
  void undoCancelFatherInvite() {
    state = state.copyWith(fatherStatus: MemberStatus.invited);
  }
}

final familyCircleFactsProvider = NotifierProvider<FamilyCircleController, FamilyCircleState>(
  FamilyCircleController.new,
);
