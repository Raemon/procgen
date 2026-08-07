import { pickByValue, pixelNoise, twoOctavePatchNoise, type PatchScale } from '../artNoise';
import type { PixelPainter } from '../pixelCanvas';

export function grainPainter(palette: readonly string[], seed: number): PixelPainter {
  return (x, y) => pickByValue(palette, pixelNoise(x, y, seed));
}

export function patchPainter(palette: readonly string[], scale: PatchScale): PixelPainter {
  return (x, y) => pickByValue(palette, twoOctavePatchNoise(x, y, scale));
}

export function specklePainter(color: string, seed: number, chance: number): PixelPainter {
  return (x, y) => (pixelNoise(x, y, seed) < chance ? color : null);
}

export function clusteredSpecklePainter(
  palette: readonly string[],
  scale: PatchScale,
  chance: number,
): PixelPainter {
  return (x, y) => {
    if (pixelNoise(x, y, scale.seed ^ 0x2f9d1a7b) > chance) return null;
    return pickByValue(palette, twoOctavePatchNoise(x, y, scale));
  };
}
