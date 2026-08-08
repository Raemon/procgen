import type { SpriteArt } from '../../tiles/spriteArt';

export type SpritePalette = Record<string, string>;

export function spriteFromRows(rows: readonly string[], palette: SpritePalette): SpriteArt {
  const size = rows.length;
  const pixels: SpriteArt = [];
  for (const row of rows) {
    if (row.length !== size) throw new Error(`sprite rows must be ${size} wide: '${row}'`);
    for (const key of row) pixels.push(palette[key] ?? null);
  }
  return pixels;
}
