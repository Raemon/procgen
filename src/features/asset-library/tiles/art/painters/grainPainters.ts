import { pickByValue, pixelNoise, twoOctavePatchNoise, type PatchScale } from '../artNoise';
import type { PixelPainter } from '../pixelCanvas';

export function patchPainter(palette: readonly string[], scale: PatchScale): PixelPainter {
  return (x, y) => pickByValue(palette, twoOctavePatchNoise(x, y, scale));
}

export function specklePainter(color: string, seed: number, chance: number): PixelPainter {
  return (x, y) => (pixelNoise(x, y, seed) < chance ? color : null);
}

