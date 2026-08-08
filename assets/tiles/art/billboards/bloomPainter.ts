import { barPainter, discPainter, type PixelPoint } from '../painters/shapePainters';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import { gridLength, gridPoint, MASK_INK } from './billboardGrid';
import type { BillboardPalette } from './billboardPalette';
import { roundedInk, shadedThroughMask, stemInk } from './billboardShading';

const STEM_TOPS = [
  { across: 0.32, down: 0.22 },
  { across: 0.5, down: 0.09 },
  { across: 0.7, down: 0.3 },
] as const;

const STEM_THICKNESS = 0.055;
const PETAL_RADIUS = 0.11;
const HEART_RADIUS = 0.04;

export function bloomPainter(size: number, palette: BillboardPalette, seed: number): PixelPainter {
  return stackedPainters(
    leafTuftPainter(size, palette, seed),
    ...STEM_TOPS.map((top) => stemPainter(size, palette, gridPoint(size, top.across, top.down))),
    ...STEM_TOPS.map((top) => flowerPainter(size, palette, gridPoint(size, top.across, top.down))),
  );
}

function leafTuftPainter(size: number, palette: BillboardPalette, seed: number): PixelPainter {
  return shadedThroughMask(leafTuftMask(size), roundedInk(palette, size, seed));
}

function leafTuftMask(size: number): PixelPainter {
  return stackedPainters(
    discPainter(gridPoint(size, 0.5, 0.94), gridLength(size, 0.24), MASK_INK),
    discPainter(gridPoint(size, 0.24, 0.92), gridLength(size, 0.15), MASK_INK),
    discPainter(gridPoint(size, 0.78, 0.93), gridLength(size, 0.15), MASK_INK),
  );
}

function stemPainter(size: number, palette: BillboardPalette, top: PixelPoint): PixelPainter {
  return shadedThroughMask(
    barPainter(gridPoint(size, 0.5, 1), top, gridLength(size, STEM_THICKNESS), MASK_INK),
    stemInk(palette, size),
  );
}

function flowerPainter(size: number, palette: BillboardPalette, top: PixelPoint): PixelPainter {
  return stackedPainters(
    discPainter(top, gridLength(size, PETAL_RADIUS), palette.petal),
    discPainter(top, gridLength(size, HEART_RADIUS), palette.petalHeart),
  );
}
