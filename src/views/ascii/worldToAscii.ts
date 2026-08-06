import { EMPTY } from '../../world/grid';
import type { Tileset } from '../../world/tiles/tileset';
import type { World } from '../../world/world';

export const PLAYER_GLYPH = '@';
export const EMPTY_GLYPH = ' ';
export const UNKNOWN_GLYPH = '?';

export function worldToAscii(world: World, tileset: Tileset): string {
  const rows: string[] = [];
  for (let y = 0; y < world.grid.height; y++) rows.push(asciiRow(world, tileset, y));
  return rows.join('\n');
}

export function glyphAt(world: World, tileset: Tileset, x: number, y: number): string {
  if (x === world.playerX && y === world.playerY) return PLAYER_GLYPH;
  const tileId = world.grid.get(x, y);
  if (tileId === EMPTY) return EMPTY_GLYPH;
  return tileset.byId(tileId)?.symbol ?? UNKNOWN_GLYPH;
}

function asciiRow(world: World, tileset: Tileset, y: number): string {
  let row = '';
  for (let x = 0; x < world.grid.width; x++) row += glyphAt(world, tileset, x, y);
  return row;
}
