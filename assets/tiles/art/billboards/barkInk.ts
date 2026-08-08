import { pixelNoise } from '../artNoise';
import { barPainter } from '../painters/shapePainters';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import { gridLength, MASK_INK } from './billboardGrid';
import { edgedThroughMask } from './billboardEdges';
import { barkEdges, type BillboardPalette } from './billboardPalette';
import { leanAcrossAt, leanedPoint } from './windLean';

const GRAIN_WEIGHT = 0.22;
const TRUNK_BEND = 0.7;

export function trunkPainter(
  size: number,
  palette: BillboardPalette,
  seed: number,
  thickness: number,
  top: number,
): PixelPainter {
  return edgedThroughMask(
    trunkMask(size, seed, thickness, top),
    barkInk(palette, size, seed),
    barkEdges(palette),
    size,
  );
}

export function boughPainter(
  size: number,
  palette: BillboardPalette,
  seed: number,
  reach: { across: number; down: number },
): PixelPainter {
  return edgedThroughMask(
    barPainter(
      leanedPoint(size, 0.5, TRUNK_BEND, seed),
      leanedPoint(size, reach.across, reach.down, seed),
      gridLength(size, 0.05),
      MASK_INK,
    ),
    barkInk(palette, size, seed),
    barkEdges(palette),
    size,
  );
}

function trunkMask(size: number, seed: number, thickness: number, top: number): PixelPainter {
  return stackedPainters(
    barPainter(
      leanedPoint(size, 0.5, 1, seed),
      leanedPoint(size, 0.5, TRUNK_BEND, seed),
      gridLength(size, thickness),
      MASK_INK,
    ),
    barPainter(
      leanedPoint(size, 0.5, TRUNK_BEND, seed),
      leanedPoint(size, 0.5, top, seed),
      gridLength(size, thickness * 0.78),
      MASK_INK,
    ),
  );
}

function barkInk(palette: BillboardPalette, size: number, seed: number): PixelPainter {
  return (x, y) => {
    const acrossSpine = x - size / 2 - leanAcrossAt(size, y / size, seed);
    const grain = pixelNoise(x, Math.floor(y / 2), seed) * GRAIN_WEIGHT;
    if (acrossSpine < -0.5 + grain) return palette.stem;
    return grain > GRAIN_WEIGHT * 0.66 ? palette.stemShade : palette.stemEdge;
  };
}
