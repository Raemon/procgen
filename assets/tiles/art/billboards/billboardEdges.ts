import type { PixelPainter } from '../pixelCanvas';
import { towardsKeyLight } from './billboardShading';
import type { EdgeInks } from './billboardPalette';
import { maskHolds, maskOpensToward } from './maskProbe';

const RIM_CATCHES_LIGHT_ABOVE = 0.54;

export function edgedThroughMask(
  mask: PixelPainter,
  ink: PixelPainter,
  inks: EdgeInks,
  size: number,
): PixelPainter {
  return (x, y) => {
    if (!maskHolds(mask, x, y)) return null;
    if (catchesRimLight(mask, x, y, size)) return inks.rim;
    if (maskOpensToward(mask, x, y, 1, 1)) return inks.edge;
    return ink(x, y);
  };
}

function catchesRimLight(mask: PixelPainter, x: number, y: number, size: number): boolean {
  if (towardsKeyLight(x, y, size) < RIM_CATCHES_LIGHT_ABOVE) return false;
  return maskOpensToward(mask, x, y, -1, -1);
}
