import {
  blankFacePixels,
  DEFAULT_FACE_ART_SIZE,
  faceGridSize,
  MAX_FACE_ART_SIZE,
  MIN_FACE_ART_SIZE,
  type FacePixels,
} from './tileFaceArt';

export type SpriteArt = FacePixels;

export function blankSpriteArt(size: number = DEFAULT_FACE_ART_SIZE): SpriteArt {
  return blankFacePixels(size);
}

export function spriteGridSize(sprite: SpriteArt): number {
  return faceGridSize(sprite);
}

export function isSpriteArt(value: unknown): value is SpriteArt {
  if (!Array.isArray(value)) return false;
  const size = faceGridSize(value as SpriteArt);
  if (size < MIN_FACE_ART_SIZE || size > MAX_FACE_ART_SIZE || size * size !== value.length) return false;
  return value.every((pixel) => pixel === null || typeof pixel === 'string');
}

export function isEntirelyTransparent(sprite: SpriteArt): boolean {
  return sprite.every((pixel) => pixel === null);
}
