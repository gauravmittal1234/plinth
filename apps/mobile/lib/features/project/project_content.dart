import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';
import 'package:share_plus/share_plus.dart';

import '../../app/routes.dart';
import '../../core/widgets/widgets.dart';
import '../../data/follow.dart';
import '../../data/project.dart';
import 'alerts_sheet.dart';
import 'ask_sheet.dart';
import 'project_copy.dart';
import 'sections/before_booking_section.dart';
import 'sections/built_section.dart';
import 'sections/footer_section.dart';
import 'sections/furnish_section.dart';
import 'sections/hero_section.dart';
import 'sections/homes_section.dart';
import 'sections/next_steps_section.dart';
import 'sections/pay_section.dart';
import 'sections/risk_section.dart';
import 'sections/wait_section.dart';
import 'simple/simple_view.dart';

/// AppProject's real content (WORK_BREAKDOWN T31a): hero, risk, so what now,
/// before booking, built, homes, pay, afford the wait and furnish, a sticky
/// Follow / Ask / Share bar, and the Simple view.
class ProjectContent extends ConsumerStatefulWidget {
  const ProjectContent({super.key, required this.slug});

  final String slug;

  @override
  ConsumerState<ProjectContent> createState() => _ProjectContentState();
}

class _ProjectContentState extends ConsumerState<ProjectContent> {
  bool _simple = false;

  void _toggleSimple() => setState(() => _simple = !_simple);

  @override
  Widget build(BuildContext context) {
    final phase = PhaseRef(widget.slug);
    final pageAsync = ref.watch(projectPageProvider(phase));
    final tokens = PlinthTokens.of(context);

    return Scaffold(
      backgroundColor: tokens.bg,
      appBar: AppBar(
        backgroundColor: tokens.bg,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: _toggleSimple,
            child: Text(_simple ? ProjectCopy.fullPageLabel : ProjectCopy.simpleViewLabel),
          ),
        ],
      ),
      body: SafeArea(
        top: false,
        child: switch (pageAsync) {
          AsyncData(:final value) => _Loaded(
            slug: widget.slug,
            page: value.value,
            simple: _simple,
            onBackToFullPage: _toggleSimple,
          ),
          AsyncError() => _ErrorState(onRetry: () => ref.invalidate(projectPageProvider(phase))),
          _ => const Center(child: CircularProgressIndicator()),
        },
      ),
      bottomNavigationBar: switch (pageAsync) {
        AsyncData(:final value) when !_simple => _BottomBar(slug: widget.slug, page: value.value),
        _ => null,
      },
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(PlinthSpace.s24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'This project could not be loaded.',
              style: PlinthType.body.copyWith(color: PlinthTokens.of(context).ink),
            ),
            const SizedBox(height: PlinthSpace.s16),
            PlinthButton(label: 'Try again', onPressed: onRetry),
          ],
        ),
      ),
    );
  }
}

class _Loaded extends ConsumerWidget {
  const _Loaded({required this.slug, required this.page, required this.simple, required this.onBackToFullPage});

  final String slug;
  final c.ProjectPage page;
  final bool simple;
  final VoidCallback onBackToFullPage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final followType = ref.watch(followTypeProvider(slug));
    final followed = followType != null;

    if (simple) {
      return SingleChildScrollView(
        child: SimpleProjectView(
          projectName: page.risk.phase.name,
          risk: page.risk,
          nextSteps: page.nextSteps,
          followed: followed,
          onFollow: () => _toggleFollow(context, ref, slug, page.risk.phase.name, imageUrl: page.hero.imageUrl),
          onBackToFullPage: onBackToFullPage,
        ),
      );
    }

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        ProjectHeroSection(phase: page.risk.phase, hero: page.hero, chip: page.risk.chip),
        ProjectRiskSection(slug: slug, risk: page.risk, bandSinceLine: page.progress.today.bandSinceLine),
        ProjectNextStepsSection(nextSteps: page.nextSteps),
        ProjectBeforeBookingSection(beforeBooking: page.beforeBooking),
        ProjectBuiltSection(progress: page.progress, answer: page.risk.progress.line),
        ProjectHomesSection(homes: page.homes, fromDeveloper: page.fromDeveloper),
        ProjectPaySection(cost: page.cost),
        ProjectWaitSection(waitDefaults: page.waitDefaults, afford: page.affordDefault),
        ProjectFurnishSection(onOpen: () => context.push(Routes.visualise)),
        ProjectFooterSection(meta: page.meta),
      ],
    );
  }
}

Future<void> _toggleFollow(BuildContext context, WidgetRef ref, String slug, String name, {String? imageUrl}) async {
  final controller = ref.read(followsProvider.notifier);
  final wasFollowed = ref.read(followTypeProvider(slug)) != null;
  if (wasFollowed) {
    await controller.unfollow(slug);
    if (context.mounted) showPlinthToast(context, 'Unfollowed $name');
    return;
  }
  try {
    final result = await controller.follow(slug);
    if (!context.mounted) return;
    // Shown whether the server answered at once or the follow is still
    // queued (offline): either way the buyer just followed, successfully.
    await showAlertsSheet(
      context,
      projectName: name,
      imageUrl: imageUrl,
      alertsLine: result?.alertsLine ?? ProjectCopy.alertsLineFallback,
    );
  } on Exception {
    if (context.mounted) showPlinthToast(context, 'Could not follow $name. Try again.');
  }
}

class _BottomBar extends ConsumerWidget {
  const _BottomBar({required this.slug, required this.page});

  final String slug;
  final c.ProjectPage page;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final followType = ref.watch(followTypeProvider(slug));
    final followed = followType != null;
    final name = page.risk.phase.name;
    return BottomActionBar(
      actions: [
        // App UI v2: Follow (primary, icon), Ask Plinth (tonal, icon) and
        // Share as an icon button, so no label ever wraps.
        BottomAction(
          label: followed ? ProjectCopy.following : ProjectCopy.follow,
          glyph: followed ? KitGlyph.bookmarkAdded : KitGlyph.bookmark,
          pressed: followed,
          primary: true,
          onPressed: () => _toggleFollow(context, ref, slug, name, imageUrl: page.hero.imageUrl),
        ),
        BottomAction(
          label: ProjectCopy.ask,
          glyph: KitGlyph.sparkle,
          onPressed: () => showAskSheet(context, projectName: name, imageUrl: page.hero.imageUrl),
        ),
        BottomAction(label: ProjectCopy.share, glyph: KitGlyph.share, iconOnly: true, onPressed: () => _share(page)),
      ],
    );
  }

  Future<void> _share(c.ProjectPage page) async {
    final share = page.risk.share;
    final text = [...share.lines, share.sourceLine, share.caption].join('\n');
    await SharePlus.instance.share(ShareParams(text: text, subject: page.risk.phase.name));
  }
}
