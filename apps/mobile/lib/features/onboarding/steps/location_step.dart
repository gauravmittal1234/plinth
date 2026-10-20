import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show CoverageNext;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../../../data/trust.dart';
import '../onboarding_controller.dart';
import '../onboarding_copy.dart';
import '../onboarding_format.dart';

/// `about().coverage.next`'s own name for the Golf Course Ext Rd row
/// (API_CONTRACTS §3.1, `packages/fixtures/expected/about/default.json`) —
/// the only key that row carries (AGENTS.md rule 10's comment on
/// `coverageNextByName`).
const _soonCorridorName = 'Golf Course Extension Road';

/// "Where are you looking?" — a corridor, "use my location", or both; each
/// optional (the brief). The location permission is real (`geolocator`); with
/// no reverse-geocoding service wired up, what it unlocks is honest and
/// general ("Projects near you come first in Explore") rather than naming a
/// sector it has no fact for (AGENTS.md rule 10).
class LocationStep extends ConsumerWidget {
  const LocationStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final state = ref.watch(onboardingControllerProvider);
    final notifier = ref.read(onboardingControllerProvider.notifier);
    final soon = coverageNextByName(ref.watch(aboutProvider).value?.coverage.next, _soonCorridorName);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AspectRatio(
          aspectRatio: 390 / 148,
          child: DecoratedBox(
            decoration: BoxDecoration(color: tokens.photo),
            child: Center(child: Icon(Icons.map_rounded, size: 40, color: tokens.ink2)),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(
            PlinthLayout.gutterApp,
            PlinthSpace.s16,
            PlinthLayout.gutterApp,
            PlinthSpace.s24,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(OnboardingCopy.locationHeadline, style: PlinthType.title.copyWith(color: tokens.ink)),
              const SizedBox(height: PlinthSpace.s8),
              Text(OnboardingCopy.locationBody, style: PlinthType.lead.copyWith(color: tokens.ink)),
              const SizedBox(height: PlinthSpace.s16),
              PlinthChipRow(
                children: [
                  for (final key in onboardingCorridors)
                    // The "soon" corridor is a fact (its own name + when it
                    // opens): hidden entirely rather than shown with a stale
                    // guess when `about()` hasn't supplied that row yet
                    // (AGENTS.md rule 10).
                    if (key != onboardingSoonCorridor || soon != null)
                      _CorridorChip(
                        corridorKey: key,
                        on: state.corridors.contains(key),
                        notifier: notifier,
                        soon: soon,
                      ),
                ],
              ),
              const SizedBox(height: PlinthSpace.s16),
              DecoratedBox(
                decoration: BoxDecoration(color: tokens.track, borderRadius: BorderRadius.circular(PlinthRadius.panel)),
                child: Padding(
                  padding: const EdgeInsets.all(PlinthSpace.s16),
                  child: state.locationOn ? _LocationOn(notifier: notifier) : _LocationOff(notifier: notifier),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CorridorChip extends StatelessWidget {
  const _CorridorChip({required this.corridorKey, required this.on, required this.notifier, required this.soon});

  final String corridorKey;
  final bool on;
  final OnboardingController notifier;

  /// The "coming soon" row from `about()`, for the one corridor that needs
  /// it. Null for every other corridor, and never read by them.
  final CoverageNext? soon;

  static const _names = {'dxp': OnboardingCopy.corridorDwarkaExpressway, 'ng': OnboardingCopy.corridorNewGurugram};

  bool get _isSoon => corridorKey == onboardingSoonCorridor;

  /// Only reached when [_isSoon] — the caller never builds this chip
  /// otherwise (`soon == null` hides it instead).
  String get _label => _isSoon ? OnboardingCopy.corridorSoonChip(soon!.name, soon!.whenLine) : _names[corridorKey]!;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final selected = on && !_isSoon;
    return Semantics(
      button: true,
      selected: selected,
      label: _label,
      excludeSemantics: true,
      onTap: () => _onTap(context),
      child: Pressable(
        child: Material(
          color: selected ? tokens.inverse : tokens.track,
          borderRadius: BorderRadius.circular(PlinthRadius.pill),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () => _onTap(context),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Text(
                _label,
                style: PlinthType.label.copyWith(
                  color: selected ? tokens.onInverse : (_isSoon ? tokens.ink2 : tokens.ink),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _onTap(BuildContext context) {
    if (_isSoon) {
      showPlinthToast(context, OnboardingCopy.corridorSoonToast(soon!.name, soon!.whenLine));
      return;
    }
    notifier.toggleCorridor(corridorKey);
  }
}

class _LocationOff extends StatefulWidget {
  const _LocationOff({required this.notifier});

  final OnboardingController notifier;

  @override
  State<_LocationOff> createState() => _LocationOffState();
}

class _LocationOffState extends State<_LocationOff> {
  bool _busy = false;

  Future<void> _useLocation() async {
    setState(() => _busy = true);
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
      final granted = permission == LocationPermission.always || permission == LocationPermission.whileInUse;
      widget.notifier.setLocationOn(granted);
      if (!granted && mounted) showPlinthToast(context, OnboardingCopy.locationPermissionDenied);
    } catch (e) {
      debugPrint('location permission unavailable: $e');
      if (mounted) showPlinthToast(context, OnboardingCopy.locationPermissionDenied);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PlinthButton(
          kind: PlinthButtonKind.inverse,
          icon: Icons.near_me_rounded,
          label: OnboardingCopy.useMyLocation,
          onPressed: _busy ? null : _useLocation,
        ),
        const SizedBox(height: PlinthSpace.s12),
        Text(OnboardingCopy.locationHint, style: PlinthType.meta.copyWith(color: tokens.ink)),
      ],
    );
  }
}

class _LocationOn extends StatelessWidget {
  const _LocationOn({required this.notifier});

  final OnboardingController notifier;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.check_circle_rounded, size: PlinthLayout.iconMd, color: tokens.ink),
            const SizedBox(width: PlinthSpace.s8),
            Expanded(
              child: Text(OnboardingCopy.locationOnHeadline, style: PlinthType.rowTitle.copyWith(color: tokens.ink)),
            ),
          ],
        ),
        const SizedBox(height: PlinthSpace.s8),
        Text(OnboardingCopy.locationOnBody, style: PlinthType.meta.copyWith(color: tokens.ink)),
        const SizedBox(height: PlinthSpace.s12),
        PlinthButton(
          kind: PlinthButtonKind.tertiary,
          label: OnboardingCopy.turnLocationOff,
          onPressed: () => notifier.setLocationOn(false),
        ),
      ],
    );
  }
}
