import {
  blankFaceGrids,
  CUBE_FACES,
  isCubeFaceArt,
  isValidFaceArtSize,
  type CubeFace,
  type CubeFaceArt,
  type FaceArtFrame,
  type FacePixels,
  type PartialFaceGrids,
} from '../tileFaceArt';

export type InkByCharacter = Record<string, string | null>;

export interface PaintedRowsSprite {
  palette: InkByCharacter;
  rows: string[];
}

type RowsByFace = Partial<Record<CubeFace, string[]>>;

export interface PaintedRowsFrame {
  color: RowsByFace;
  height?: RowsByFace | null;
}

export type PaintedRowsFaceArt = RowsByFace & {
  palette: InkByCharacter;
  height?: RowsByFace | null;
  framesAfterFirst?: PaintedRowsFrame[];
  frameMs?: number;
};

const DEFAULT_TRANSPARENT_CHARACTER = '.';

export function isPaintedRowsSprite(value: unknown): value is PaintedRowsSprite {
  if (typeof value !== 'object' || value === null) return false;
  const art = value as Partial<PaintedRowsSprite>;
  return Array.isArray(art.rows) && isInkByCharacter(art.palette);
}

export function isPaintedRowsFaceArt(value: unknown): value is PaintedRowsFaceArt {
  if (typeof value !== 'object' || value === null) return false;
  const art = value as PaintedRowsFaceArt;
  return isInkByCharacter(art.palette) && CUBE_FACES.some((face) => Array.isArray(art[face]));
}

export function spriteFromPaintedRows(art: PaintedRowsSprite): FacePixels | null {
  return gridFromRows(art.rows, art.palette, art.rows.length);
}

export function faceArtFromPaintedRows(art: PaintedRowsFaceArt): CubeFaceArt | null {
  const size = sizeOfFirstPaintedFace(art);
  if (size === null) return null;
  const grids = blankFaceGrids(size);
  for (const face of CUBE_FACES) {
    if (art[face] === undefined) continue;
    const pixels = gridFromRows(art[face], art.palette, size);
    if (pixels === null) return null;
    grids[face] = pixels;
  }
  const layers = optionalLayersOf(art, size);
  if (layers === null) return null;
  const assembled = { size, ...grids, ...layers };
  return isCubeFaceArt(assembled) ? assembled : null;
}

function optionalLayersOf(art: PaintedRowsFaceArt, size: number): Partial<CubeFaceArt> | null {
  let height: PartialFaceGrids | null | undefined;
  if (art.height !== undefined) {
    if (art.height === null) {
      height = null;
    } else {
      height = partialGridsFromRows(art.height, art.palette, size);
      if (height === null) return null;
    }
  }
  return {
    ...(art.frameMs === undefined ? {} : { frameMs: art.frameMs }),
    ...(art.height === undefined ? {} : { height }),
    ...(art.framesAfterFirst === undefined
      ? {}
      : { framesAfterFirst: framesFromRows(art.framesAfterFirst, art.palette, size) }),
  };
}

function framesFromRows(
  value: unknown,
  palette: InkByCharacter,
  size: number,
): FaceArtFrame[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((frame: PaintedRowsFrame) => ({
    color: partialGridsFromRows(frame?.color, palette, size)!,
    height: frame?.height ? partialGridsFromRows(frame.height, palette, size) : null,
  }));
}

function partialGridsFromRows(
  value: unknown,
  palette: InkByCharacter,
  size: number,
): PartialFaceGrids | null {
  if (typeof value !== 'object' || value === null) return null;
  const grids: PartialFaceGrids = {};
  for (const face of CUBE_FACES) {
    const rows = (value as RowsByFace)[face];
    if (rows === undefined) continue;
    const pixels = gridFromRows(rows, palette, size);
    if (pixels === null) return null;
    grids[face] = pixels;
  }
  return grids;
}

function gridFromRows(rows: unknown, palette: InkByCharacter, size: number): FacePixels | null {
  if (!Array.isArray(rows) || rows.length !== size || !isValidFaceArtSize(size)) return null;
  const pixels: FacePixels = [];
  for (const row of rows) {
    if (typeof row !== 'string') return null;
    const characters = [...row];
    if (characters.length !== size) return null;
    for (const character of characters) {
      const ink = inkOfCharacter(character, palette);
      if (ink === undefined) return null;
      pixels.push(ink);
    }
  }
  return pixels;
}

function inkOfCharacter(character: string, palette: InkByCharacter): string | null | undefined {
  if (Object.prototype.hasOwnProperty.call(palette, character)) return palette[character];
  return character === DEFAULT_TRANSPARENT_CHARACTER ? null : undefined;
}

function isInkByCharacter(value: unknown): value is InkByCharacter {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.entries(value).every(
    ([character, ink]) => [...character].length === 1 && (ink === null || typeof ink === 'string'),
  );
}

function sizeOfFirstPaintedFace(art: PaintedRowsFaceArt): number | null {
  for (const face of CUBE_FACES) {
    const rows = art[face];
    if (Array.isArray(rows)) return rows.length;
  }
  return null;
}
