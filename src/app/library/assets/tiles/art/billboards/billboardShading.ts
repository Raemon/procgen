import type { PixelPainter } from '../pixelCanvas';
import type { BillboardPalette } from './billboardPalette';

const LIT_ABOVE = 0.84;
const BASE_ABOVE = 0.6;
const SHADE_ABOVE = 0.38;

export function shadedThroughMask(mask: PixelPainter, ink: PixelPainter): PixelPainter {
  return (x, y) => (mask(x, y) === null ? null : ink(x, y));
}

export function rampInk(palette: BillboardPalette, lightward: number): string {
  if (lightward > LIT_ABOVE) return palette.lit;
  if (lightward > BASE_ABOVE) return palette.base;
  if (lightward > SHADE_ABOVE) return palette.shade;
  return palette.deep;
}

export function towardsKeyLight(x: number, y: number, size: number): number {
  return (size - x + (size - y)) / (2 * size);
}
