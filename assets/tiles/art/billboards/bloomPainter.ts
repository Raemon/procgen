import { pixelNoise } from '../artNoise';
import { barPainter, discPainter, type PixelPoint } from '../painters/shapePainters';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import { gridLength, gridPoint, MASK_INK } from './billboardGrid';
import type { BillboardPalette } from './billboardPalette';
import { shadedThroughMask, towardsKeyLight } from './billboardShading';
import { bladeTuftPainter } from './grassBlades';

const BLOSSOMS = [
  { across: 0.3, down: 0.26, sway: 0.06, radius: 0.1 },
  { across: 0.52, down: 0.12, sway: -0.04, radius: 0.115 },
  { across: 0.72, down: 0.34, sway: -0.07, radius: 0.078 },
] as const;

const MOTES = [
  { across: 0.18, down: 0.14 },
  { across: 0.64, down: 0.04 },
  { across: 0.86, down: 0.2 },
] as const;

const STEM_THICKNESS = 0.05;
const STEM_ROOT = 0.86;
const PETAL_HEART_RADIUS = 0.035;
const MOTE_RADIUS = 0.028;

export function bloomPainter(size: number, palette: BillboardPalette, seed: number): PixelPainter {
  return stackedPainters(
    bladeTuftPainter(size, palette, seed),
    ...BLOSSOMS.map((blossom) => stemPainter(size, palette, blossom)),
    ...BLOSSOMS.map((blossom) =>
      blossomPainter(size, palette, gridPoint(size, blossom.across, blossom.down), blossom.radius),
    ),
    motePainter(size, palette, seed),
  );
}

function stemPainter(
  size: number,
  palette: BillboardPalette,
  blossom: { across: number; down: number; sway: number },
): PixelPainter {
  const top = gridPoint(size, blossom.across, blossom.down);
  const bend = gridPoint(size, blossom.across + blossom.sway, (blossom.down + STEM_ROOT) / 2);
  return shadedThroughMask(stemMask(size, top, bend), stemInk(palette, size));
}

function stemMask(size: number, top: PixelPoint, bend: PixelPoint): PixelPainter {
  const thickness = gridLength(size, STEM_THICKNESS);
  return stackedPainters(
    barPainter(gridPoint(size, 0.5, 1), bend, thickness, MASK_INK),
    barPainter(bend, top, thickness * 0.8, MASK_INK),
  );
}

function stemInk(palette: BillboardPalette, size: number): PixelPainter {
  return (x, y) => (towardsKeyLight(x, y, size) > 0.6 ? palette.stem : palette.stemEdge);
}

function blossomPainter(
  size: number,
  palette: BillboardPalette,
  top: PixelPoint,
  radius: number,
): PixelPainter {
  return stackedPainters(
    discPainter(top, gridLength(size, radius), palette.petalGlow),
    discPainter(top, gridLength(size, radius * 0.72), palette.petal),
    discPainter(top, gridLength(size, PETAL_HEART_RADIUS), palette.petalHeart),
  );
}

function motePainter(size: number, palette: BillboardPalette, seed: number): PixelPainter {
  return stackedPainters(...MOTES.map((mote, index) => moteDisc(size, palette, seed, mote, index)));
}

function moteDisc(
  size: number,
  palette: BillboardPalette,
  seed: number,
  mote: { across: number; down: number },
  index: number,
): PixelPainter {
  const drift = pixelNoise(index, seed, seed) * 0.1 - 0.05;
  return discPainter(
    gridPoint(size, mote.across + drift, mote.down),
    gridLength(size, MOTE_RADIUS),
    palette.petalGlow,
  );
}
