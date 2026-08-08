import { barPainter, convexPolygonPainter, type PixelPoint } from '../painters/shapePainters';
import { flatPainter, stackedPainters, type PixelPainter } from '../pixelCanvas';
import { gridLength, gridPoint, MASK_INK } from './billboardGrid';
import { edgedThroughMask } from './billboardEdges';
import { leafEdges, type BillboardPalette } from './billboardPalette';
import { shadedThroughMask } from './billboardShading';
import { rockInk } from './rockInk';

const MASSIF = [
  { across: 0.14, down: 1 },
  { across: 0.07, down: 0.72 },
  { across: 0.25, down: 0.5 },
  { across: 0.5, down: 0.36 },
  { across: 0.71, down: 0.45 },
  { across: 0.83, down: 0.74 },
  { across: 0.8, down: 1 },
] as const;

const SHARD = [
  { across: 0.72, down: 1 },
  { across: 0.78, down: 0.68 },
  { across: 0.93, down: 0.79 },
  { across: 0.96, down: 1 },
] as const;

export function boulderPainter(
  size: number,
  palette: BillboardPalette,
  seed: number,
): PixelPainter {
  return stackedPainters(
    edgedThroughMask(boulderMask(size), rockInk(palette, size, seed), leafEdges(palette), size),
    fissurePainter(size, palette),
  );
}

function fissurePainter(size: number, palette: BillboardPalette): PixelPainter {
  return shadedThroughMask(
    stackedPainters(
      barPainter(gridPoint(size, 0.42, 0.46), gridPoint(size, 0.48, 0.64), gridLength(size, 0.024), MASK_INK),
      barPainter(gridPoint(size, 0.48, 0.64), gridPoint(size, 0.44, 0.78), gridLength(size, 0.024), MASK_INK),
    ),
    flatPainter(palette.edge),
  );
}

function boulderMask(size: number): PixelPainter {
  return stackedPainters(facetMask(size, MASSIF), facetMask(size, SHARD));
}

function facetMask(size: number, corners: readonly { across: number; down: number }[]): PixelPainter {
  return convexPolygonPainter(corners.map((corner) => cornerPoint(size, corner)), MASK_INK);
}

function cornerPoint(size: number, corner: { across: number; down: number }): PixelPoint {
  return gridPoint(size, corner.across, corner.down);
}
