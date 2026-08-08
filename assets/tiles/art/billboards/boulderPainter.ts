import { discPainter } from '../painters/shapePainters';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import { gridLength, gridPoint, MASK_INK } from './billboardGrid';
import type { BillboardPalette } from './billboardPalette';
import { roundedInk, shadedThroughMask } from './billboardShading';

export function boulderPainter(
  size: number,
  palette: BillboardPalette,
  seed: number,
): PixelPainter {
  return shadedThroughMask(boulderMask(size), roundedInk(palette, size, seed));
}

function boulderMask(size: number): PixelPainter {
  return stackedPainters(
    discPainter(gridPoint(size, 0.46, 0.6), gridLength(size, 0.31), MASK_INK),
    discPainter(gridPoint(size, 0.73, 0.76), gridLength(size, 0.2), MASK_INK),
    discPainter(gridPoint(size, 0.24, 0.83), gridLength(size, 0.14), MASK_INK),
  );
}
