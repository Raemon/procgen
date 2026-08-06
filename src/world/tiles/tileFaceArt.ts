export const FACE_ART_SIZES = [4, 8, 16, 32] as const;
export const DEFAULT_FACE_ART_SIZE = 8;
export const CUBE_FACES = ['top', 'north', 'east', 'south', 'west', 'bottom'] as const;
export const SIDE_FACES = ['north', 'east', 'south', 'west'] as const;

export type CubeFace = (typeof CUBE_FACES)[number];
export type SideFace = (typeof SIDE_FACES)[number];
export type FacePixels = (string | null)[];
export type CubeFaceArt = { size: number } & Record<CubeFace, FacePixels>;

export function blankFacePixels(size: number = DEFAULT_FACE_ART_SIZE): FacePixels {
  return new Array<string | null>(size * size).fill(null);
}

export function blankCubeFaceArt(size: number = DEFAULT_FACE_ART_SIZE): CubeFaceArt {
  const art = { size } as CubeFaceArt;
  for (const face of CUBE_FACES) art[face] = blankFacePixels(size);
  return art;
}

export function cloneCubeFaceArt(art: CubeFaceArt): CubeFaceArt {
  const copy = { size: art.size } as CubeFaceArt;
  for (const face of CUBE_FACES) copy[face] = [...art[face]];
  return copy;
}

export function isEntirelyBlank(art: CubeFaceArt): boolean {
  return CUBE_FACES.every((face) => art[face].every((pixel) => pixel === null));
}

export function faceGridSize(pixels: FacePixels): number {
  return Math.round(Math.sqrt(pixels.length));
}

export function isCubeFaceArt(value: unknown): value is CubeFaceArt {
  if (typeof value !== 'object' || value === null) return false;
  const art = value as Partial<CubeFaceArt>;
  if (!isValidFaceArtSize(art.size)) return false;
  return CUBE_FACES.every((face) => isFacePixels(art[face], art.size as number));
}

function isValidFaceArtSize(size: unknown): size is number {
  return typeof size === 'number' && Number.isInteger(size) && size >= 2 && size <= 64;
}

export function isFacePixels(value: unknown, size: number): value is FacePixels {
  return (
    Array.isArray(value) &&
    value.length === size * size &&
    value.every((pixel) => pixel === null || typeof pixel === 'string')
  );
}
