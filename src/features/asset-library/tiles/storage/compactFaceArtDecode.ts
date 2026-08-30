import {
  CUBE_FACES,
  isCubeFaceArt,
  isValidFaceArtSize,
  type CubeFaceArt,
  type FaceArtFrame,
  type PartialFaceGrids,
} from '../tileFaceArt';
import {
  isCompactFaceArt,
  type CompactFaceArt,
  type CompactFaceArtFrame,
  type CompactFaceGrids,
} from './compactFaceArtShape';
import { isPalette } from './faceArtPalette';
import { faceGridOfBase64 } from './faceGridIndexes';

type GridUnpacker = (grids: unknown) => PartialFaceGrids | null;

export function faceArtFromCompact(value: unknown): CubeFaceArt | null {
  if (!isCompactFaceArt(value)) return null;
  if (!isValidFaceArtSize(value.size) || !isPalette(value.palette)) return null;
  const unpack = gridUnpackerFor(value.palette, value.size);
  const color = unpack(value.color);
  if (color === null) return null;
  const art = { size: value.size, ...color, ...optionalLayersOf(value, unpack) };
  return isCubeFaceArt(art) ? art : null;
}

function optionalLayersOf(value: CompactFaceArt, unpack: GridUnpacker): Partial<CubeFaceArt> {
  return {
    ...(value.frameMs === undefined ? {} : { frameMs: value.frameMs }),
    ...(value.height === undefined ? {} : { height: value.height && unpack(value.height) }),
    ...(value.framesAfterFirst === undefined
      ? {}
      : { framesAfterFirst: unpackedFrames(value.framesAfterFirst, unpack) }),
  };
}

function unpackedFrames(value: unknown, unpack: GridUnpacker): FaceArtFrame[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((frame: CompactFaceArtFrame) => ({
    color: unpack(frame?.color)!,
    height: frame?.height ? unpack(frame.height) : null,
  }));
}

function gridUnpackerFor(palette: readonly string[], size: number): GridUnpacker {
  return (grids) => {
    if (typeof grids !== 'object' || grids === null) return null;
    const unpacked: PartialFaceGrids = {};
    for (const face of CUBE_FACES) {
      const packed = (grids as CompactFaceGrids)[face];
      if (packed === undefined) continue;
      const pixels = faceGridOfBase64(packed, palette, size);
      if (pixels === null) return null;
      unpacked[face] = pixels;
    }
    return unpacked;
  };
}
