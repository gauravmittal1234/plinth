import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show FollowType;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../core/widgets/widgets.dart';
import '../../data/follow.dart';
import 'following_copy.dart';

/// "Have you booked here?" (G-19): watching vs booked, private to the buyer
/// and never shown to the family circle. Opens from a project row's
/// follow-type pill on AppFollowing.
Future<void> showFollowTypeSheet(BuildContext context, {required String slug, required String projectName}) {
  return showPlinthSheet<void>(
    context: context,
    builder: (_) => FollowTypeSheet(slug: slug, projectName: projectName),
  );
}

class FollowTypeSheet extends StatefulWidget {
  const FollowTypeSheet({super.key, required this.slug, required this.projectName});

  final String slug;
  final String projectName;

  @override
  State<FollowTypeSheet> createState() => _FollowTypeSheetState();
}

class _FollowTypeSheetState extends State<FollowTypeSheet> {
  bool _touched = false;
  bool _saving = false;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Consumer(
      builder: (context, ref, _) {
        final current = ref.watch(followTypeProvider(widget.slug));
        final booked = current == FollowType.booked;
        return Padding(
          padding: const EdgeInsets.fromLTRB(0, 0, 0, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              PlinthSheetHeader(title: FollowingCopy.haveYouBookedHere, subtitle: widget.projectName),
              const SizedBox(height: PlinthSpace.s8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: PlinthSpace.s20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _Option(
                      title: FollowingCopy.watchingTitle,
                      sub: FollowingCopy.watchingSub,
                      items: FollowingCopy.watchingItems,
                      selected: !booked,
                      onTap: _saving ? null : () => _pick(ref, FollowType.watching),
                    ),
                    const SizedBox(height: PlinthSpace.s8),
                    _Option(
                      title: FollowingCopy.bookedTitle,
                      sub: FollowingCopy.bookedSub,
                      items: FollowingCopy.bookedItems,
                      selected: booked,
                      onTap: _saving ? null : () => _pick(ref, FollowType.booked),
                    ),
                    const SizedBox(height: PlinthSpace.s16),
                    Text(
                      _touched ? FollowingCopy.typeNoteSaved : FollowingCopy.typeNotePrivate,
                      style: PlinthType.small.copyWith(color: tokens.muted),
                    ),
                    const SizedBox(height: PlinthSpace.s20),
                    PlinthButton(label: FollowingCopy.done, onPressed: () => Navigator.of(context).maybePop()),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _pick(WidgetRef ref, String type) async {
    setState(() {
      _saving = true;
      _touched = true;
    });
    try {
      await ref.read(followsProvider.notifier).setType(widget.slug, type);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}

class _Option extends StatelessWidget {
  const _Option({required this.title, required this.sub, required this.items, required this.selected, this.onTap});

  final String title;
  final String sub;
  final List<String> items;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Semantics(
      container: true,
      button: true,
      selected: selected,
      label: title,
      hint: sub,
      excludeSemantics: true,
      onTap: onTap,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(PlinthRadius.panel),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: selected ? tokens.track : Colors.transparent,
            borderRadius: BorderRadius.circular(PlinthRadius.panel),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: PlinthSpace.s16, vertical: PlinthSpace.s16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(top: 3),
                      child: Icon(
                        selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                        size: 22,
                        color: selected ? tokens.accent : tokens.ink2,
                      ),
                    ),
                    const SizedBox(width: PlinthSpace.s12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(title, style: PlinthType.h3.copyWith(color: tokens.ink)),
                          const SizedBox(height: 2),
                          Text(sub, style: PlinthType.body.copyWith(height: 1.45, color: tokens.ink2)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: PlinthSpace.s8),
                Padding(
                  padding: const EdgeInsets.only(left: 34),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      for (final item in items)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: KitIcon(KitGlyph.check, size: 14, color: tokens.ink),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(item, style: PlinthType.small.copyWith(height: 1.4, color: tokens.ink)),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
