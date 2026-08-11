import {
  CUBE_FACES,
  type CubeFaceArt,
  type FaceArtFrame,
  type PartialFaceGrids,
} from '../tileFaceArt';
import {
  COMPACT_FACE_ART_FORMAT,
  type CompactFaceArt,
  type CompactFaceArtFrame,
  type CompactFaceGrids,
} from './compactFaceArtShape';
import { bytesPerIndex, paletteIndexes, paletteOfFaceArt } from './faceArtPalette';
import { base64OfFaceGrid } from './faceGridIndexes';

type GridPacker = (grids: PartialFaceGrids) => CompactFaceGrids;

export function compactFaceArtOf(art: CubeFaceArt): CompactFaceArt {
  const palette = paletteOfFaceArt(art);
  const pack = gridPackerFor(palette);
  return {
    compact: COMPACT_FACE_ART_FORMAT,
    size: art.size,
    palette,
    color: pack(art),
    ...(art.frameMs === undefined ? {} : { frameMs: art.frameMs }),
    ...(art.height === undefined ? {} : { height: art.height && pack(art.height) }),
    ...(art.framesAfterFirst === undefined
      ? {}
      : { framesAfterFirst: art.framesAfterFirst.map((frame) => packedFrame(frame, pack)) }),
  };
}

function packedFrame(frame: FaceArtFrame, pack: GridPacker): CompactFaceArtFrame {
  return { color: pack(frame.color), height: frame.height && pack(frame.height) };
}

function gridPackerFor(palette: readonly string[]): GridPacker {
  const indexes = paletteIndexes(palette);
  const width = bytesPerIndex(palette);
  return (grids) => {
    const packed: CompactFaceGrids = {};
    for (const face of CUBE_FACES)
      if (grids[face]) packed[face] = base64OfFaceGrid(grids[face]!, indexes, width);
    return packed;
  };
}
