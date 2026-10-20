import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../onboarding_controller.dart';
import '../onboarding_copy.dart';

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
                    _CorridorChip(corridorKey: key, on: state.corridors.contains(key), notifier: notifier),
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
  const _CorridorChip({required this.corridorKey, required this.on, required this.notifier});

  final String corridorKey;
  final bool on;
  final OnboardingController notifier;

  static const _names = {
    'dxp': OnboardingCopy.corridorDwarkaExpressway,
    'ng': OnboardingCopy.corridorNewGurugram,
    'gcer': OnboardingCopy.corridorGolfCourseExtRd,
  };

  bool get _soon => corridorKey == onboardingSoonCorridor;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final selected = on && !_soon;
    return Semantics(
      button: true,
      selected: selected,
      label: _names[corridorKey],
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
                _names[corridorKey]!,
                style: PlinthType.label.copyWith(
                  color: selected ? tokens.onInverse : (_soon ? tokens.ink2 : tokens.ink),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _onTap(BuildContext context) {
    if (_soon) {
      showPlinthToast(context, OnboardingCopy.corridorSoonToast);
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
