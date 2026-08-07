import { pickByValue, twoOctavePatchNoise, type PatchScale } from '../artNoise';
import type { PixelPainter } from '../pixelCanvas';

export function crackPainter(
  colorsFromCentreOut: readonly string[],
  scale: PatchScale,
  halfWidth: number,
): PixelPainter {
  return (x, y) => {
    const offCentre = Math.abs(twoOctavePatchNoise(x, y, scale) - 0.5);
    if (offCentre > halfWidth) return null;
    return pickByValue(colorsFromCentreOut, offCentre / halfWidth);
  };
}
