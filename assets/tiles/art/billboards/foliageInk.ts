import { twoOctavePatchNoise } from '../artNoise';
import type { PixelPainter } from '../pixelCanvas';
import type { BillboardPalette } from './billboardPalette';
import { rampInk, towardsKeyLight } from './billboardShading';
import { maskWellInside } from './maskProbe';

const CLUMP_CELL = 6;
const LEAF_CELL = 3;
const CLUMP_WEIGHT = 0.42;
const LEAF_SALT = 0x2f6d1a3b;
const GAP_SALT = 0x71c3d95f;
const GAP_CELL = 2;
const GAP_BELOW = 0.09;
const GAP_INSET = 3;

export function foliageInk(palette: BillboardPalette, size: number, seed: number): PixelPainter {
  return (x, y) => rampInk(palette, foliageLightAt(x, y, size, seed));
}

export function foliageLightAt(x: number, y: number, size: number, seed: number): number {
  const dapple = clumpedLeafNoise(x, y, size, seed) - 0.5;
  return towardsKeyLight(x, y, size) + dapple * CLUMP_WEIGHT;
}

export function withCanopyGaps(mask: PixelPainter, size: number, seed: number): PixelPainter {
  return (x, y) =>
    isCanopyGap(x, y, size, seed) && maskWellInside(mask, x, y, GAP_INSET) ? null : mask(x, y);
}

function clumpedLeafNoise(x: number, y: number, size: number, seed: number): number {
  const clumps = twoOctavePatchNoise(x, y, { seed, cell: CLUMP_CELL, size });
  const leaves = twoOctavePatchNoise(x, y, { seed: seed ^ LEAF_SALT, cell: LEAF_CELL, size });
  return clumps * 0.68 + leaves * 0.32;
}

function isCanopyGap(x: number, y: number, size: number, seed: number): boolean {
  return twoOctavePatchNoise(x, y, { seed: seed ^ GAP_SALT, cell: GAP_CELL, size }) < GAP_BELOW;
}
