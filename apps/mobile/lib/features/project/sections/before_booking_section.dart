import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../project_copy.dart';
import '../widgets/expander.dart';

/// "What else before booking?" (G-14, G-15, G-17, G-40): four explainers,
/// each collapsed by default (G-18) — payment plans, home loans, buying from
/// abroad and selling before possession.
class ProjectBeforeBookingSection extends StatelessWidget {
  const ProjectBeforeBookingSection({super.key, required this.beforeBooking});

  final c.BeforeBooking beforeBooking;

  @override
  Widget build(BuildContext context) {
    final topics = [
      beforeBooking.paymentPlans,
      beforeBooking.loans,
      beforeBooking.nri,
      beforeBooking.sellingBeforePossession,
    ].whereType<c.BookingTopic>().toList();
    return SectionBand(
      question: ProjectCopy.beforeBooking,
      answer: 'Four things buyers ask about before the first cheque, with the rules behind them.',
      children: [
        for (final (i, topic) in topics.indexed) ...[
          if (i > 0) const SizedBox(height: PlinthSpace.s20),
          ProjectExpander(
            title: topic.title,
            subtitle: topic.sub ?? topic.line,
            children: [_Topic(topic: topic)],
          ),
        ],
      ],
    );
  }
}

class _Topic extends StatelessWidget {
  const _Topic({required this.topic});

  final c.BookingTopic topic;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final body = PlinthType.body.copyWith(height: 1.5, color: tokens.ink);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final (i, para) in topic.paras.indexed) ...[
          if (i > 0) const SizedBox(height: PlinthSpace.s16),
          switch (para.tone) {
            c.BookingParaTone.developerSays || c.BookingParaTone.fromDeveloper => DeveloperSaysField(
              label: para.lead ?? KitCopy.lane(c.Lane.fromDeveloper),
              text: para.text,
              compact: true,
            ),
            c.BookingParaTone.key => DecoratedBox(
              decoration: BoxDecoration(color: tokens.track, borderRadius: BorderRadius.circular(PlinthRadius.panel)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: _Para(para: para, style: body.copyWith(fontWeight: FontWeight.w600)),
              ),
            ),
            _ => _Para(para: para, style: body),
          },
        ],
        if (topic.points != null && topic.points!.isNotEmpty) ...[
          const SizedBox(height: PlinthSpace.s16),
          for (final point in topic.points!)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(padding: const EdgeInsets.only(top: 9, right: 10), child: _Bullet(color: tokens.ink2)),
                  Expanded(child: Text(point, style: body)),
                ],
              ),
            ),
        ],
      ],
    );
  }
}

class _Para extends StatelessWidget {
  const _Para({required this.para, required this.style});

  final c.BookingPara para;
  final TextStyle style;

  @override
  Widget build(BuildContext context) {
    final lead = para.lead;
    if (lead == null) return Text(para.text, style: style);
    return Text.rich(
      TextSpan(
        children: [
          TextSpan(text: '$lead ', style: const TextStyle(fontWeight: FontWeight.w700)),
          TextSpan(text: para.text),
        ],
      ),
      style: style,
    );
  }
}

class _Bullet extends StatelessWidget {
  const _Bullet({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    width: 5,
    height: 5,
    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
  );
}
