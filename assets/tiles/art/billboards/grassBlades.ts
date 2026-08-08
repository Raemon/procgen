import { pixelNoise } from '../artNoise';
import { barPainter } from '../painters/shapePainters';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import { gridLength, gridPoint, MASK_INK } from './billboardGrid';
import type { BillboardPalette } from './billboardPalette';
import { shadedThroughMask } from './billboardShading';

const BLADES = [
  { root: 0.36, tip: 0.16, reach: 0.6 },
  { root: 0.42, tip: 0.3, reach: 0.46 },
  { root: 0.5, tip: 0.55, reach: 0.42 },
  { root: 0.56, tip: 0.72, reach: 0.52 },
  { root: 0.64, tip: 0.88, reach: 0.64 },
  { root: 0.7, tip: 0.62, reach: 0.36 },
] as const;

const BLADE_THICKNESS = 0.045;
const LIT_ABOVE_REACH = 0.4;

export function bladeTuftPainter(
  size: number,
  palette: BillboardPalette,
  seed: number,
): PixelPainter {
  return stackedPainters(...BLADES.map((blade, index) => bladePainter(size, palette, seed, blade, index)));
}

function bladePainter(
  size: number,
  palette: BillboardPalette,
  seed: number,
  blade: { root: number; tip: number; reach: number },
  index: number,
): PixelPainter {
  const top = 1 - blade.reach * (0.8 + pixelNoise(index, seed, seed) * 0.4);
  return shadedThroughMask(bladeMask(size, blade, top), bladeInk(palette, size, top));
}

function bladeMask(
  size: number,
  blade: { root: number; tip: number },
  top: number,
): PixelPainter {
  return barPainter(
    gridPoint(size, blade.root, 1),
    gridPoint(size, blade.tip, top),
    gridLength(size, BLADE_THICKNESS),
    MASK_INK,
  );
}

function bladeInk(palette: BillboardPalette, size: number, top: number): PixelPainter {
  return (_x, y) => (y / size < top + LIT_ABOVE_REACH * (1 - top) ? palette.base : palette.deep);
}
