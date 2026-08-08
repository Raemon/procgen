import { barPainter } from '../painters/shapePainters';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import { gridLength, gridPoint, MASK_INK } from './billboardGrid';
import type { BillboardPalette } from './billboardPalette';
import { roundedInk, shadedThroughMask, stemInk } from './billboardShading';

const TIERS = 3;
const NEEDLES_TOP = 0.04;
const NEEDLES_BOTTOM = 0.88;
const WIDEST_HALF = 0.34;
const TIER_PINCH = 0.62;

export function coniferPainter(
  size: number,
  palette: BillboardPalette,
  seed: number,
): PixelPainter {
  return stackedPainters(trunkPainter(size, palette), needlePainter(size, palette, seed));
}

function trunkPainter(size: number, palette: BillboardPalette): PixelPainter {
  return shadedThroughMask(
    barPainter(
      gridPoint(size, 0.5, 1),
      gridPoint(size, 0.5, 0.82),
      gridLength(size, 0.1),
      MASK_INK,
    ),
    stemInk(palette, size),
  );
}

function needlePainter(size: number, palette: BillboardPalette, seed: number): PixelPainter {
  return shadedThroughMask(needleMask(size), roundedInk(palette, size, seed));
}

function needleMask(size: number): PixelPainter {
  return (x, y) => {
    const along = (y / size - NEEDLES_TOP) / (NEEDLES_BOTTOM - NEEDLES_TOP);
    if (along < 0 || along > 1) return null;
    return Math.abs(x - size / 2) <= tierHalfWidth(size, along) ? MASK_INK : null;
  };
}

function tierHalfWidth(size: number, along: number): number {
  const withinTier = (along * TIERS) % 1;
  return gridLength(size, WIDEST_HALF) * along * (TIER_PINCH + (1 - TIER_PINCH) * withinTier);
}
