import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import { boughPainter, trunkPainter } from './barkInk';
import type { BillboardPalette } from './billboardPalette';
import { canopyPainter, type CanopyLobe } from './canopyShapes';

const TRUNK_THICKNESS = 0.11;
const TRUNK_TOP = 0.46;
const BOUGHS = [
  { across: 0.29, down: 0.5 },
  { across: 0.71, down: 0.55 },
] as const;

const CROWN: readonly CanopyLobe[] = [
  { across: 0.47, down: 0.34, radius: 0.27 },
  { across: 0.26, down: 0.45, radius: 0.19 },
  { across: 0.72, down: 0.5, radius: 0.17 },
  { across: 0.6, down: 0.17, radius: 0.17 },
  { across: 0.36, down: 0.19, radius: 0.13 },
  { across: 0.79, down: 0.34, radius: 0.11 },
];

export function broadleafPainter(
  size: number,
  palette: BillboardPalette,
  seed: number,
): PixelPainter {
  return stackedPainters(
    trunkPainter(size, palette, seed, TRUNK_THICKNESS, TRUNK_TOP),
    ...BOUGHS.map((reach) => boughPainter(size, palette, seed, reach)),
    canopyPainter(size, palette, seed, CROWN),
  );
}
