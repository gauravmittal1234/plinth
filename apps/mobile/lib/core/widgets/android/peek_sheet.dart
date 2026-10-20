import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/kit_copy.dart';
import '../foundation/motion.dart';

/// The three resting heights of a [PeekSheet] (DESIGN §4 item 16).
enum PeekSheetState { peek, half, full }

/// The map's results sheet (AppMap; DESIGN §4 item 16): a non-modal bottom
/// sheet that rests at peek (112 dp), half or full height. It floats, so it
/// is the one place with a shadow. Drag its top to resize (it snaps to the
/// nearest height, or the next one on a fling), or tap the handle to step
/// peek → half → full → peek; screen readers hear where it is and what a
/// tap does.
///
/// Place it in a [Stack] over the map; it fills the stack's height at full.
class PeekSheet extends StatefulWidget {
  const PeekSheet({
    super.key,
    required this.builder,
    this.header,
    this.initialState = PeekSheetState.half,
    this.onStateChanged,
    this.peekHeight = PlinthLayout.sheetPeek,
    this.halfHeight = 380,
    this.fullHeight,
    this.handleLabel,
  });

  /// The sheet's scrolling body, given the controller to use.
  final Widget Function(BuildContext context, ScrollController controller) builder;

  /// Fixed content under the handle (the count line, a Map button); dragging
  /// it resizes the sheet too.
  final Widget? header;
  final PeekSheetState initialState;
  final ValueChanged<PeekSheetState>? onStateChanged;
  final double peekHeight;
  final double halfHeight;

  /// Defaults to the whole height the sheet is given.
  final double? fullHeight;

  /// The handle's screen-reader label for each state (AppMap's by default).
  final String Function(PeekSheetState state)? handleLabel;

  static String defaultHandleLabel(PeekSheetState state) => switch (state) {
    PeekSheetState.peek => KitCopy.peekHandlePeek,
    PeekSheetState.half => KitCopy.peekHandleHalf,
    PeekSheetState.full => KitCopy.peekHandleFull,
  };

  @override
  State<PeekSheet> createState() => PeekSheetStateHolder();
}

/// The [PeekSheet]'s state; [state] is where it rests now.
@visibleForTesting
class PeekSheetStateHolder extends State<PeekSheet> with SingleTickerProviderStateMixin {
  late final AnimationController _snap = AnimationController(vsync: this, duration: const Duration(milliseconds: 320));
  final ScrollController _scroll = ScrollController();
  late PeekSheetState state = widget.initialState;
  double? _height;
  Animation<double>? _toHeight;
  double _available = 0;

  double _heightOf(PeekSheetState s) => switch (s) {
    PeekSheetState.peek => widget.peekHeight,
    PeekSheetState.half => widget.halfHeight.clamp(widget.peekHeight, _full),
    PeekSheetState.full => _full,
  };

  double get _full => (widget.fullHeight ?? _available).clamp(widget.peekHeight, _available);

  @override
  void initState() {
    super.initState();
    _snap.addListener(() => setState(() => _height = _toHeight!.value));
  }

  @override
  void dispose() {
    _snap.dispose();
    _scroll.dispose();
    super.dispose();
  }

  /// Rests the sheet at [next].
  void settle(PeekSheetState next) {
    final from = _height ?? _heightOf(state);
    final to = _heightOf(next);
    if (next != state) {
      state = next;
      widget.onStateChanged?.call(next);
    }
    if (KitMotion.reduced(context) || from == to) {
      _snap.stop();
      setState(() => _height = to);
      return;
    }
    _toHeight = Tween(begin: from, end: to).animate(CurvedAnimation(parent: _snap, curve: PlinthMotion.easeNeedle));
    _snap.forward(from: 0);
  }

  void _cycle() => settle(switch (state) {
    PeekSheetState.peek => PeekSheetState.half,
    PeekSheetState.half => PeekSheetState.full,
    PeekSheetState.full => PeekSheetState.peek,
  });

  void _drag(DragUpdateDetails d) {
    _snap.stop();
    setState(() => _height = ((_height ?? _heightOf(state)) - d.delta.dy).clamp(widget.peekHeight, _full));
  }

  void _release(DragEndDetails d) {
    final h = _height ?? _heightOf(state);
    final v = d.primaryVelocity ?? 0;
    const order = PeekSheetState.values;
    PeekSheetState next;
    if (v.abs() > 700) {
      // A fling goes one step from the nearest height below or above.
      final up = v < 0;
      next = up
          ? order.firstWhere((s) => _heightOf(s) > h + 1, orElse: () => PeekSheetState.full)
          : order.reversed.firstWhere((s) => _heightOf(s) < h - 1, orElse: () => PeekSheetState.peek);
    } else {
      next = order.reduce((a, b) => (_heightOf(a) - h).abs() <= (_heightOf(b) - h).abs() ? a : b);
    }
    settle(next);
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final label = (widget.handleLabel ?? PeekSheet.defaultHandleLabel)(state);
    return LayoutBuilder(
      builder: (context, constraints) {
        _available = constraints.maxHeight;
        final height = (_height ?? _heightOf(state)).clamp(widget.peekHeight, _full);
        return Align(
          alignment: Alignment.bottomCenter,
          child: SizedBox(
            height: height,
            width: constraints.maxWidth,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: tokens.sheet,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: tokens.sheetShadow,
              ),
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // The top never overflows the sheet: at peek with very
                    // large text it is clipped, and the body gets no room.
                    ConstrainedBox(
                      constraints: BoxConstraints(maxHeight: height),
                      child: SingleChildScrollView(
                        physics: const NeverScrollableScrollPhysics(),
                        child: GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onVerticalDragUpdate: _drag,
                          onVerticalDragEnd: _release,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Semantics(
                                container: true,
                                button: true,
                                label: label,
                                excludeSemantics: true,
                                onTap: _cycle,
                                child: GestureDetector(
                                  behavior: HitTestBehavior.opaque,
                                  onTap: _cycle,
                                  child: SizedBox(
                                    height: 44,
                                    child: Align(
                                      alignment: Alignment.topCenter,
                                      child: Padding(
                                        padding: const EdgeInsets.only(top: 10),
                                        child: Container(
                                          width: 32,
                                          height: 4,
                                          decoration: BoxDecoration(
                                            color: tokens.lineStrong,
                                            borderRadius: BorderRadius.circular(2),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              ?widget.header,
                            ],
                          ),
                        ),
                      ),
                    ),
                    Expanded(child: widget.builder(context, _scroll)),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
