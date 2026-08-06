export const FACE_ART_SIZE = 8;
export const CUBE_FACES = ['top', 'sides', 'bottom'] as const;

export type CubeFace = (typeof CUBE_FACES)[number];
export type FacePixels = (string | null)[];

export interface CubeFaceArt {
  top: FacePixels;
  sides: FacePixels;
  bottom: FacePixels;
}

export function blankFacePixels(): FacePixels {
  return new Array<string | null>(FACE_ART_SIZE * FACE_ART_SIZE).fill(null);
}

export function blankCubeFaceArt(): CubeFaceArt {
  return { top: blankFacePixels(), sides: blankFacePixels(), bottom: blankFacePixels() };
}

export function cloneCubeFaceArt(art: CubeFaceArt): CubeFaceArt {
  return { top: [...art.top], sides: [...art.sides], bottom: [...art.bottom] };
}

export function isEntirelyBlank(art: CubeFaceArt): boolean {
  return CUBE_FACES.every((face) => art[face].every((pixel) => pixel === null));
}

export function isCubeFaceArt(value: unknown): value is CubeFaceArt {
  if (typeof value !== 'object' || value === null) return false;
  const art = value as Partial<Record<CubeFace, unknown>>;
  return CUBE_FACES.every((face) => isFacePixels(art[face]));
}

function isFacePixels(value: unknown): value is FacePixels {
  return (
    Array.isArray(value) &&
    value.length === FACE_ART_SIZE * FACE_ART_SIZE &&
    value.every((pixel) => pixel === null || typeof pixel === 'string')
  );
}
