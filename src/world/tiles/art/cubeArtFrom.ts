import { CUBE_FACES, SIDE_FACES, type CubeFaceArt } from '../tileFaceArt';
import { paintedFace, type PixelPainter } from './pixelCanvas';

export interface CubeFacePainters {
  top: PixelPainter;
  sides: PixelPainter;
  bottom: PixelPainter;
}

export function cubeArtFrom(size: number, painters: CubeFacePainters): CubeFaceArt {
  const art = { size } as CubeFaceArt;
  for (const face of CUBE_FACES) art[face] = paintedFace(size, painterForFace(painters, face));
  return art;
}

function painterForFace(painters: CubeFacePainters, face: (typeof CUBE_FACES)[number]): PixelPainter {
  if (face === 'top') return painters.top;
  if (face === 'bottom') return painters.bottom;
  return isSideFace(face) ? painters.sides : painters.top;
}

function isSideFace(face: (typeof CUBE_FACES)[number]): boolean {
  return (SIDE_FACES as readonly string[]).includes(face);
}
