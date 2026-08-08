import { barPainter, discPainter } from '../painters/shapePainters';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import { gridLength, gridPoint, MASK_INK } from './billboardGrid';
import type { BillboardPalette } from './billboardPalette';
import { roundedInk, shadedThroughMask, stemInk } from './billboardShading';

export function broadleafPainter(
  size: number,
  palette: BillboardPalette,
  seed: number,
): PixelPainter {
  return stackedPainters(trunkPainter(size, palette), canopyPainter(size, palette, seed));
}

function trunkPainter(size: number, palette: BillboardPalette): PixelPainter {
  return shadedThroughMask(
    barPainter(
      gridPoint(size, 0.5, 1),
      gridPoint(size, 0.5, 0.5),
      gridLength(size, 0.13),
      MASK_INK,
    ),
    stemInk(palette, size),
  );
}

function canopyPainter(size: number, palette: BillboardPalette, seed: number): PixelPainter {
  return shadedThroughMask(canopyMask(size), roundedInk(palette, size, seed));
}

function canopyMask(size: number): PixelPainter {
  return stackedPainters(
    discPainter(gridPoint(size, 0.5, 0.38), gridLength(size, 0.29), MASK_INK),
    discPainter(gridPoint(size, 0.3, 0.47), gridLength(size, 0.2), MASK_INK),
    discPainter(gridPoint(size, 0.7, 0.47), gridLength(size, 0.2), MASK_INK),
    discPainter(gridPoint(size, 0.5, 0.18), gridLength(size, 0.19), MASK_INK),
  );
}
