import { floodFillFacePixels } from '@/features/asset-library/pixelArtEditor/ops/floodFillFacePixels';
import { packHex } from '@/features/asset-library/tiles/art/packedHex';
import {
  isTransparentInk,
  opaqueInk,
  TRANSPARENT_INK,
  withTransparency,
} from '@/features/asset-library/tiles/inkColor';
import { blankFacePixels } from '@/features/asset-library/tiles/tileFaceArt';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

export function checkInkTransparency(check: CheckReporter): void {
  check(
    'a color is transparent only when its alpha byte is zero',
    isTransparentInk('#00000000') &&
      isTransparentInk('#7bbf5a00') &&
      !isTransparentInk('#7bbf5a') &&
      !isTransparentInk('#7bbf5aff'),
  );
  check(
    'every color reaches three.js as six opaque digits',
    opaqueInk('#7bbf5aff') === '#7bbf5a' &&
      opaqueInk('#7bbf5a') === '#7bbf5a' &&
      opaqueInk(TRANSPARENT_INK) === '#000000',
  );
  check(
    'packing an alpha-carrying ink keeps its hue rather than its low bytes',
    packHex('#7bbf5aff') === packHex('#7bbf5a'),
  );
  check(
    'a color editor toggles transparency without losing the hue it had',
    withTransparency('#7bbf5a', true) === '#7bbf5a00' &&
      withTransparency(withTransparency('#7bbf5a', true), false) === '#7bbf5a' &&
      withTransparency(TRANSPARENT_INK, false) === '#000000',
  );
  check(
    'painting with a transparent color punches a hole rather than storing a color',
    (() => {
      const painted = floodFillFacePixels(blankFacePixels(4).fill('#ffffff'), 4, 0, null);
      return painted.every((pixel) => pixel === null);
    })(),
  );
}
