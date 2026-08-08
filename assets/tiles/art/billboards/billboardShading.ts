import { pixelNoise } from '../artNoise';
import type { PixelPainter } from '../pixelCanvas';
import type { BillboardPalette } from './billboardPalette';

const SPECKLE_WEIGHT = 0.3;
const LIT_ABOVE = 0.88;
const SHADED_BELOW = 0.55;

export function shadedThroughMask(mask: PixelPainter, ink: PixelPainter): PixelPainter {
  return (x, y) => (mask(x, y) === null ? null : ink(x, y));
}

export function roundedInk(palette: BillboardPalette, size: number, seed: number): PixelPainter {
  return (x, y) => {
    const lightward = towardsKeyLight(x, y, size) + pixelNoise(x, y, seed) * SPECKLE_WEIGHT;
    if (lightward > LIT_ABOVE) return palette.lit;
    if (lightward < SHADED_BELOW) return palette.shade;
    return palette.base;
  };
}

export function stemInk(palette: BillboardPalette, size: number): PixelPainter {
  return (x) => (x < size / 2 ? palette.stem : palette.stemShade);
}

function towardsKeyLight(x: number, y: number, size: number): number {
  return (size - x + (size - y)) / (2 * size);
}
