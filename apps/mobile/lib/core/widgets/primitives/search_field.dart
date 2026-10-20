import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/kit_copy.dart';

/// The search field (app UI v2): 56 tall, filled `track`, radius 16, a
/// leading rounded search icon, an `ink2` placeholder that clears AA, and a
/// clear button once there is text. A 2 dp focus ring shows where typing goes.
class PlinthSearchField extends StatefulWidget {
  const PlinthSearchField({super.key, required this.controller, required this.hint, this.onChanged, this.onSubmitted});

  final TextEditingController controller;
  final String hint;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;

  @override
  State<PlinthSearchField> createState() => _PlinthSearchFieldState();
}

class _PlinthSearchFieldState extends State<PlinthSearchField> {
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_changed);
  }

  @override
  void didUpdateWidget(PlinthSearchField old) {
    super.didUpdateWidget(old);
    if (old.controller != widget.controller) {
      old.controller.removeListener(_changed);
      widget.controller.addListener(_changed);
    }
  }

  @override
  void dispose() {
    widget.controller.removeListener(_changed);
    super.dispose();
  }

  void _changed() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final radius = BorderRadius.circular(PlinthRadius.field);
    final hasText = widget.controller.text.isNotEmpty;
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: PlinthLayout.fieldApp),
      child: TextField(
        controller: widget.controller,
        onChanged: widget.onChanged,
        onSubmitted: widget.onSubmitted,
        textInputAction: TextInputAction.search,
        style: PlinthType.body.copyWith(color: tokens.ink),
        cursorColor: tokens.focus,
        decoration: InputDecoration(
          filled: true,
          fillColor: tokens.track,
          hintText: widget.hint,
          hintStyle: PlinthType.body.copyWith(color: tokens.ink2),
          hintMaxLines: 1,
          contentPadding: const EdgeInsets.symmetric(vertical: 16),
          prefixIcon: Padding(
            padding: const EdgeInsetsDirectional.only(start: 16, end: 10),
            child: Icon(Icons.search_rounded, size: PlinthLayout.iconLg, color: tokens.ink),
          ),
          prefixIconConstraints: const BoxConstraints(minWidth: 50, minHeight: PlinthLayout.fieldApp),
          suffixIcon: hasText
              ? IconButton(
                  tooltip: KitCopy.clearSearch,
                  onPressed: () {
                    widget.controller.clear();
                    widget.onChanged?.call('');
                  },
                  icon: Icon(Icons.close_rounded, size: PlinthLayout.iconMd, color: tokens.ink2),
                )
              : null,
          border: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide.none),
          enabledBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide.none),
          focusedBorder: OutlineInputBorder(
            borderRadius: radius,
            borderSide: BorderSide(color: tokens.focus, width: 2),
          ),
        ),
      ),
    );
  }
}
