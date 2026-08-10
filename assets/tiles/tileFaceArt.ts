export const FACE_ART_SIZES = [4, 8, 16, 32, 64, 128, 256, 512, 1024] as const;
export const MIN_FACE_ART_SIZE = 2;
export const MAX_FACE_ART_SIZE = 1024;
export const DEFAULT_FACE_ART_SIZE = 8;
export const CUBE_FACES = ['top', 'north', 'east', 'south', 'west', 'bottom'] as const;
export const SIDE_FACES = ['north', 'east', 'south', 'west'] as const;

export const DEFAULT_FRAME_MS = 160;
export const MIN_FRAME_MS = 40;
export const MAX_FRAME_MS = 2000;
export const MAX_ART_FRAMES = 16;

export type CubeFace = (typeof CUBE_FACES)[number];
export type FacePixels = (string | null)[];
export type FaceGrids = Record<CubeFace, FacePixels>;

export type PartialFaceGrids = Partial<FaceGrids>;

export interface FaceArtFrame {
  color: PartialFaceGrids;
  height: PartialFaceGrids | null;
}

export type CubeFaceArt = {
  size: number;
  height?: PartialFaceGrids | null;
  framesAfterFirst?: FaceArtFrame[];
  frameMs?: number;
} & FaceGrids;

export function blankFacePixels(size: number = DEFAULT_FACE_ART_SIZE): FacePixels {
  return new Array<string | null>(size * size).fill(null);
}

function blankFaceGrids(size: number = DEFAULT_FACE_ART_SIZE): FaceGrids {
  const grids = {} as FaceGrids;
  for (const face of CUBE_FACES) grids[face] = blankFacePixels(size);
  return grids;
}

export function blankCubeFaceArt(size: number = DEFAULT_FACE_ART_SIZE): CubeFaceArt {
  return { size, ...blankFaceGrids(size) };
}

export function cloneCubeFaceArt(art: CubeFaceArt): CubeFaceArt {
  return {
    ...art,
    ...clonedGrids(art),
    height: art.height ? clonedGrids(art.height) : art.height,
    framesAfterFirst: art.framesAfterFirst?.map(clonedFrame),
  };
}

function clonedFrame(frame: FaceArtFrame): FaceArtFrame {
  return {
    color: clonedGrids(frame.color),
    height: frame.height ? clonedGrids(frame.height) : null,
  };
}

function clonedGrids<T extends PartialFaceGrids>(grids: T): T {
  const copy = {} as PartialFaceGrids;
  for (const face of CUBE_FACES) if (grids[face]) copy[face] = [...grids[face]!];
  return copy as T;
}

export function isEntirelyBlank(art: CubeFaceArt): boolean {
  return everyGridInArt(art, (pixels) => pixels.every((pixel) => pixel === null));
}

function everyGridInArt(
  art: CubeFaceArt,
  predicate: (pixels: FacePixels) => boolean,
): boolean {
  return allFaceGridsOf(art).every((grids) =>
    CUBE_FACES.every((face) => !grids[face] || predicate(grids[face]!)),
  );
}

export function allFaceGridsOf(art: CubeFaceArt): PartialFaceGrids[] {
  const later = (art.framesAfterFirst ?? []).flatMap((frame) =>
    frame.height ? [frame.color, frame.height] : [frame.color],
  );
  return art.height ? [art, art.height, ...later] : [art, ...later];
}

export function faceGridSize(pixels: FacePixels): number {
  return Math.round(Math.sqrt(pixels.length));
}

export function isCubeFaceArt(value: unknown): value is CubeFaceArt {
  if (typeof value !== 'object' || value === null) return false;
  const art = value as Partial<CubeFaceArt>;
  const size = art.size;
  if (!isValidFaceArtSize(size)) return false;
  return (
    isFaceGrids(art, size) &&
    isOptionalHeightGrids(art.height, size) &&
    isOptionalFrameList(art.framesAfterFirst, size) &&
    (art.frameMs === undefined || isValidFrameMs(art.frameMs))
  );
}

function isOptionalFrameList(value: unknown, size: number): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > MAX_ART_FRAMES - 1) return false;
  return value.every((frame) => isFaceArtFrame(frame, size));
}

function isFaceArtFrame(value: unknown, size: number): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const frame = value as Partial<FaceArtFrame>;
  return isPartialFaceGrids(frame.color, size) && isOptionalHeightGrids(frame.height, size);
}

function isOptionalHeightGrids(value: unknown, size: number): boolean {
  return value === undefined || value === null || isPartialFaceGrids(value, size);
}

function isFaceGrids(value: unknown, size: number): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const grids = value as Partial<FaceGrids>;
  return CUBE_FACES.every((face) => isFacePixels(grids[face], size));
}

function isPartialFaceGrids(value: unknown, size: number): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const grids = value as Partial<FaceGrids>;
  return CUBE_FACES.every((face) => grids[face] === undefined || isFacePixels(grids[face], size));
}

function isValidFrameMs(value: unknown): value is number {
  return typeof value === 'number' && value >= MIN_FRAME_MS && value <= MAX_FRAME_MS;
}

function isValidFaceArtSize(size: unknown): size is number {
  return (
    typeof size === 'number' &&
    Number.isInteger(size) &&
    size >= MIN_FACE_ART_SIZE &&
    size <= MAX_FACE_ART_SIZE
  );
}

export function isFacePixels(value: unknown, size: number): value is FacePixels {
  return (
    Array.isArray(value) &&
    value.length === size * size &&
    value.every((pixel) => pixel === null || typeof pixel === 'string')
  );
}
