import 'package:flutter/widgets.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

/// Motion helpers (DESIGN §0 motion layer, §4b): transform and opacity only,
/// and the phone's "Remove animations" setting skips every move to its end.
abstract final class KitMotion {
  /// True when the phone asks for reduced motion.
  static bool reduced(BuildContext context) => MediaQuery.maybeDisableAnimationsOf(context) ?? false;

  /// [d], or zero under reduced motion.
  static Duration of(BuildContext context, Duration d) => reduced(context) ? Duration.zero : d;
}

/// Shrinks to [PlinthMotion.pressScale] while pressed, so every tap is
/// answered (DESIGN §0: press feedback on every control).
class Pressable extends StatefulWidget {
  const Pressable({super.key, required this.child, this.enabled = true});

  final Widget child;
  final bool enabled;

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _down = false;

  void _set(bool v) {
    if (widget.enabled && v != _down) setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => _set(true),
      onPointerUp: (_) => _set(false),
      onPointerCancel: (_) => _set(false),
      child: AnimatedScale(
        scale: _down ? PlinthMotion.pressScale : 1,
        duration: KitMotion.of(context, PlinthMotion.press),
        curve: PlinthMotion.easeOut,
        child: widget.child,
      ),
    );
  }
}

/// The staggered entrance (DESIGN §0): rises [PlinthMotion.riseDistance] with
/// a fade, once, after [delay]. Under reduced motion it is simply there.
class Rise extends StatefulWidget {
  const Rise({super.key, required this.child, this.delay = Duration.zero});

  final Widget child;
  final Duration delay;

  /// The delay of the [index]th item in a stagger.
  static Duration step(int index) => PlinthMotion.staggerStep * index;

  @override
  State<Rise> createState() => _RiseState();
}

class _RiseState extends State<Rise> with SingleTickerProviderStateMixin {
  // One controller covers the delay too (no timers), so a test's
  // pumpAndSettle runs the whole entrance.
  late final Duration _total = widget.delay + PlinthMotion.rise;
  late final AnimationController _c = AnimationController(vsync: this, duration: _total);
  late final Animation<double> _t = CurvedAnimation(
    parent: _c,
    curve: Interval(widget.delay.inMicroseconds / _total.inMicroseconds, 1, curve: PlinthMotion.easeOut),
  );
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (KitMotion.reduced(context)) {
      _c.value = 1;
    } else {
      _c.forward();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _t,
      builder: (context, child) => Opacity(
        opacity: _t.value,
        child: Transform.translate(offset: Offset(0, (1 - _t.value) * PlinthMotion.riseDistance), child: child),
      ),
      child: widget.child,
    );
  }
}
