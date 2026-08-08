import { pixelNoise } from '../artNoise';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import { trunkPainter } from './barkInk';
import { gridLength, MASK_INK } from './billboardGrid';
import { edgedThroughMask } from './billboardEdges';
import { leafEdges, type BillboardPalette } from './billboardPalette';
import { needleInk } from './needleInk';
import { leanAcrossAt } from './windLean';

const TIERS = 4;
const NEEDLES_TOP = 0.04;
const NEEDLES_BOTTOM = 0.92;
const WIDEST_HALF = 0.36;
const NARROWEST_HALF = 0.55;
const TIER_PINCH = 0.52;
const TIER_WOBBLE = 0.12;
const NEEDLE_RAGGEDNESS = 0.14;
const TRUNK_THICKNESS = 0.09;
const TRUNK_TOP = 0.78;

export function coniferPainter(
  size: number,
  palette: BillboardPalette,
  seed: number,
): PixelPainter {
  return stackedPainters(
    trunkPainter(size, palette, seed, TRUNK_THICKNESS, TRUNK_TOP),
    needlePainter(size, palette, seed),
  );
}

function needlePainter(size: number, palette: BillboardPalette, seed: number): PixelPainter {
  return edgedThroughMask(
    needleMask(size, seed),
    needleInk(palette, size, seed, TIERS),
    leafEdges(palette),
    size,
  );
}

function needleMask(size: number, seed: number): PixelPainter {
  return (x, y) => {
    const along = (y / size - NEEDLES_TOP) / (NEEDLES_BOTTOM - NEEDLES_TOP);
    if (along < 0 || along > 1) return null;
    const halfWidth = tierHalfWidth(size, along, y, seed);
    if (halfWidth < NARROWEST_HALF) return null;
    return Math.abs(x - spineAt(size, y, seed)) <= halfWidth ? MASK_INK : null;
  };
}

function spineAt(size: number, y: number, seed: number): number {
  return size / 2 + leanAcrossAt(size, y / size, seed);
}

function tierHalfWidth(size: number, along: number, y: number, seed: number): number {
  const tier = along * TIERS;
  const droop = TIER_PINCH + (1 - TIER_PINCH) * (tier % 1);
  return gridLength(size, WIDEST_HALF) * along * droop * raggedness(y, tier, seed);
}

function raggedness(y: number, tier: number, seed: number): number {
  const tierSpread = 1 - TIER_WOBBLE + pixelNoise(Math.floor(tier), 3, seed) * TIER_WOBBLE * 2;
  return tierSpread * (1 - NEEDLE_RAGGEDNESS * pixelNoise(0, y, seed));
}
