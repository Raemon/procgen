import { isTransparentInk } from '@/features/asset-library/tiles/inkColor';
import {
  CUBE_FACES,
  type CubeFaceArt,
  type PartialFaceGrids,
} from '@/features/asset-library/tiles/tileFaceArt';
import type { TilePlacement } from '../tilePlacements';

const opacityByArt = new WeakMap<CubeFaceArt, boolean>();

export function placementSealsFaces(placement: TilePlacement): boolean {
  if (isTransparentInk(placement.baseColor)) return false;
  return placement.faceArt === null || artIsOpaque(placement.faceArt);
}

function artIsOpaque(art: CubeFaceArt): boolean {
  const known = opacityByArt.get(art);
  if (known !== undefined) return known;
  const opaque = everyPaintedPixelIsOpaque(art);
  opacityByArt.set(art, opaque);
  return opaque;
}

function everyPaintedPixelIsOpaque(art: CubeFaceArt): boolean {
  return colorGridsOf(art).every((grids) =>
    CUBE_FACES.every((face) => (grids[face] ?? []).every(isOpaquePixel)),
  );
}

function isOpaquePixel(pixel: string | null): boolean {
  return pixel === null || !isTransparentInk(pixel);
}

function colorGridsOf(art: CubeFaceArt): PartialFaceGrids[] {
  return [art, ...(art.framesAfterFirst ?? []).map((frame) => frame.color)];
}
