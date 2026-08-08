import { barPainter, discPainter } from '../painters/shapePainters';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import { gridLength, gridPoint, MASK_INK } from './billboardGrid';
import type { BillboardPalette } from './billboardPalette';
import { roundedInk, shadedThroughMask, stemInk } from './billboardShading';

export function shrubPainter(
  size: number,
  palette: BillboardPalette,
  seed: number,
): PixelPainter {
  return stackedPainters(stalkPainter(size, palette), leafPainter(size, palette, seed));
}

function stalkPainter(size: number, palette: BillboardPalette): PixelPainter {
  return shadedThroughMask(
    barPainter(
      gridPoint(size, 0.5, 1),
      gridPoint(size, 0.5, 0.74),
      gridLength(size, 0.1),
      MASK_INK,
    ),
    stemInk(palette, size),
  );
}

function leafPainter(size: number, palette: BillboardPalette, seed: number): PixelPainter {
  return shadedThroughMask(leafMask(size), roundedInk(palette, size, seed));
}

function leafMask(size: number): PixelPainter {
  return stackedPainters(
    discPainter(gridPoint(size, 0.5, 0.52), gridLength(size, 0.33), MASK_INK),
    discPainter(gridPoint(size, 0.25, 0.68), gridLength(size, 0.24), MASK_INK),
    discPainter(gridPoint(size, 0.75, 0.68), gridLength(size, 0.24), MASK_INK),
    discPainter(gridPoint(size, 0.44, 0.28), gridLength(size, 0.17), MASK_INK),
  );
}
