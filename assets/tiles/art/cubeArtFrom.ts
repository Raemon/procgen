import { faceArtWithFrames } from '../faceArtFrames';
import {
  blankCubeFaceArt,
  CUBE_FACES,
  SIDE_FACES,
  type CubeFace,
  type CubeFaceArt,
  type FaceArtFrame,
  type PartialFaceGrids,
} from '../tileFaceArt';
import { paintedFace, type PixelPainter } from './pixelCanvas';

export interface CubeFacePainters {
  top: PixelPainter;
  sides: PixelPainter;
  bottom: PixelPainter;
}

export interface CubeArtFramePainters {
  color: Partial<CubeFacePainters>;
  height?: Partial<CubeFacePainters>;
}

export function cubeArtFrom(
  size: number,
  painters: CubeFacePainters,
  height?: Partial<CubeFacePainters>,
): CubeFaceArt {
  return animatedCubeArt(size, [{ color: painters, height }]);
}

export function animatedCubeArt(
  size: number,
  frames: CubeArtFramePainters[],
  frameMs?: number,
): CubeFaceArt {
  const base = frameMs ? { ...blankCubeFaceArt(size), frameMs } : blankCubeFaceArt(size);
  return faceArtWithFrames(base, frames.map(paintedFrame(size)));
}

function paintedFrame(size: number): (frame: CubeArtFramePainters) => FaceArtFrame {
  return (frame) => ({
    color: paintedGrids(size, frame.color),
    height: frame.height ? paintedGrids(size, frame.height) : null,
  });
}

function paintedGrids(size: number, painters: Partial<CubeFacePainters>): PartialFaceGrids {
  const grids: PartialFaceGrids = {};
  for (const face of CUBE_FACES) {
    const painter = painterForFace(painters, face);
    if (painter) grids[face] = paintedFace(size, painter);
  }
  return grids;
}

function painterForFace(
  painters: Partial<CubeFacePainters>,
  face: CubeFace,
): PixelPainter | undefined {
  if (face === 'top') return painters.top;
  if (face === 'bottom') return painters.bottom;
  return isSideFace(face) ? painters.sides : painters.top;
}

function isSideFace(face: CubeFace): boolean {
  return (SIDE_FACES as readonly string[]).includes(face);
}
