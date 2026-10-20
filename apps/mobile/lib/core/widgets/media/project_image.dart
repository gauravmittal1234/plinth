import 'package:flutter/material.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/kit_copy.dart';

/// The illustrative project pictures bundled with the app: the same files
/// the web ships (`apps/web/src/features/home/assets`), under
/// `assets/images/projects/`. A payload names its picture in `image_url`
/// ("/media/heroKestrel.jpg"); this matches it by file name, so which
/// picture a project shows always comes from the payload.
abstract final class ProjectImages {
  static const _dir = 'assets/images/projects';
  static const _bundled = <String>{
    'heroAurelia.jpg',
    'heroCoral.jpg',
    'heroHeron.jpg',
    'heroJuniper.jpg',
    'heroKestrel.jpg',
    'heroLaurel.jpg',
    'heroSapphire.jpg',
  };

  /// The asset for a payload's `image_url`, or null when there is none or
  /// the app doesn't bundle it.
  static String? assetFor(String? imageUrl) {
    if (imageUrl == null || imageUrl.isEmpty) return null;
    final name = Uri.tryParse(imageUrl)?.pathSegments.lastOrNull ?? imageUrl.split('/').last;
    return _bundled.contains(name) ? '$_dir/$name' : null;
  }
}

/// A project's illustrative picture, cropped to fill. With no picture it
/// shows a quiet building icon on a tone, never a flat grey box.
class _ProjectPicture extends StatelessWidget {
  const _ProjectPicture({required this.imageUrl, required this.iconSize});

  final String? imageUrl;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final asset = ProjectImages.assetFor(imageUrl);
    final placeholder = ColoredBox(
      color: tokens.photo,
      child: Center(
        child: Icon(Icons.apartment_rounded, size: iconSize, color: tokens.ink2),
      ),
    );
    if (asset == null) return placeholder;
    return Stack(
      fit: StackFit.expand,
      children: [
        placeholder,
        Image.asset(
          asset,
          fit: BoxFit.cover,
          excludeFromSemantics: true,
          errorBuilder: (context, error, stackTrace) => placeholder,
        ),
      ],
    );
  }
}

/// A project thumbnail for list cards and sheet headers (app UI v2): 56 dp,
/// radius 12. Decorative: the row it sits in names the project.
class ProjectThumb extends StatelessWidget {
  const ProjectThumb({super.key, required this.imageUrl, this.size = PlinthLayout.thumb});

  final String? imageUrl;
  final double size;

  @override
  Widget build(BuildContext context) {
    return ExcludeSemantics(
      child: ClipRRect(
        borderRadius: BorderRadius.circular(PlinthRadius.tile),
        child: SizedBox.square(
          dimension: size,
          child: _ProjectPicture(imageUrl: imageUrl, iconSize: PlinthLayout.iconLg),
        ),
      ),
    );
  }
}

/// The project page's hero picture (app UI v2): full width, radius 20, with
/// the server's [caption] ("Images on this page are illustrative") on a solid
/// label pill, so it clears AA over any part of any picture.
class ProjectHeroImage extends StatelessWidget {
  const ProjectHeroImage({super.key, required this.imageUrl, this.caption, this.aspectRatio = 4 / 3});

  final String? imageUrl;
  final String? caption;
  final double aspectRatio;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Semantics(
      image: true,
      label: caption ?? KitCopy.illustrativePicture,
      excludeSemantics: true,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(PlinthRadius.card),
        child: AspectRatio(
          aspectRatio: aspectRatio,
          child: Stack(
            fit: StackFit.expand,
            children: [
              _ProjectPicture(imageUrl: imageUrl, iconSize: 40),
              if (caption != null)
                PositionedDirectional(
                  start: PlinthSpace.s12,
                  bottom: PlinthSpace.s12,
                  end: PlinthSpace.s12,
                  child: Align(
                    alignment: AlignmentDirectional.bottomStart,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: tokens.aiLabelBg,
                        borderRadius: BorderRadius.circular(PlinthRadius.pill),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        child: Text(caption!, style: PlinthType.caption.copyWith(color: tokens.aiLabelFg)),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
