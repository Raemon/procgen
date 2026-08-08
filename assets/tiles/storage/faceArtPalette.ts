import { allFaceGridsOf, CUBE_FACES, type CubeFaceArt } from '../tileFaceArt';

export const MAX_PALETTE_COLORS = 0xffff;

const INDEXES_IN_ONE_BYTE = 256;

export function paletteOfFaceArt(art: CubeFaceArt): string[] {
  const colors = new Set<string>();
  for (const grids of allFaceGridsOf(art))
    for (const face of CUBE_FACES)
      for (const pixel of grids[face] ?? []) if (pixel !== null) colors.add(pixel);
  return [...colors].sort();
}

export function paletteIndexes(palette: readonly string[]): Map<string, number> {
  return new Map(palette.map((color, at) => [color, at + 1]));
}

export function bytesPerIndex(palette: readonly string[]): number {
  return palette.length + 1 <= INDEXES_IN_ONE_BYTE ? 1 : 2;
}

export function isPalette(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_PALETTE_COLORS &&
    value.every((color) => typeof color === 'string')
  );
}
