import type { CubeFaceArt } from '../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from './artSize';
import { darken } from './colorMath';
import { cubeArtFrom } from './cubeArtFrom';
import { soilSidePainter } from './painters/soilSidePainter';
import { flatPainter, type PixelPainter } from './pixelCanvas';

export interface GroundCrossSection {
  surface: string;
  soil: string;
  seed: number;
  capHeight?: number;
}

export function groundCubeArt(top: PixelPainter, section: GroundCrossSection): CubeFaceArt {
  return cubeArtFrom(SIZE, {
    top,
    sides: soilSidePainter({
      surface: section.surface,
      soil: section.soil,
      capHeight: section.capHeight ?? 3,
      seed: section.seed,
      size: SIZE,
    }),
    bottom: flatPainter(darken(section.soil, 0.45)),
  });
}
