import {
  isCubeFaceArt,
  isFacePixels,
  type CubeFaceArt,
  type FacePixels,
} from './tileFaceArt';

const LEGACY_SIZE = 8;
const LEGACY_FACES = ['top', 'sides', 'bottom'] as const;

type LegacyFaceArt = Record<(typeof LEGACY_FACES)[number], FacePixels>;

export function upgradeStoredFaceArt(value: unknown): CubeFaceArt | null {
  if (isCubeFaceArt(value)) return value;
  if (isLegacyFaceArt(value)) return spreadLegacySidesToCompassFaces(value);
  return null;
}

function spreadLegacySidesToCompassFaces(legacy: LegacyFaceArt): CubeFaceArt {
  return {
    size: LEGACY_SIZE,
    top: [...legacy.top],
    north: [...legacy.sides],
    east: [...legacy.sides],
    south: [...legacy.sides],
    west: [...legacy.sides],
    bottom: [...legacy.bottom],
  };
}

function isLegacyFaceArt(value: unknown): value is LegacyFaceArt {
  if (typeof value !== 'object' || value === null) return false;
  const art = value as Partial<LegacyFaceArt>;
  return LEGACY_FACES.every((face) => isFacePixels(art[face], LEGACY_SIZE));
}
