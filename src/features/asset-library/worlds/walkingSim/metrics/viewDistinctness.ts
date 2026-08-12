import type { CellPoint } from '@/features/game/nearestWalkable';
import type { TileCharacterOf } from '../tileCharacter';
import type { TileIdProbe } from '../worldProbes';

export const STEPS_BETWEEN_POSTCARDS = 8;
const POSTCARD_RADIUS = 2;

export function viewDistinctness(
  path: readonly CellPoint[],
  tileIdAt: TileIdProbe,
  characterOf: TileCharacterOf,
): number {
  const postcards = postcardsAlongPath(path, tileIdAt, characterOf, STEPS_BETWEEN_POSTCARDS);
  if (postcards.length === 0) return 0;
  return new Set(postcards).size / postcards.length;
}

export function postcardsAlongPath(
  path: readonly CellPoint[],
  tileIdAt: TileIdProbe,
  characterOf: TileCharacterOf,
  stride: number,
): string[] {
  const postcards: string[] = [];
  for (let index = 0; index < path.length; index += stride) {
    postcards.push(postcardAt(path[index]!, tileIdAt, characterOf));
  }
  return postcards;
}

function postcardAt(
  cell: CellPoint,
  tileIdAt: TileIdProbe,
  characterOf: TileCharacterOf,
): string {
  const characters: string[] = [];
  for (let dy = -POSTCARD_RADIUS; dy <= POSTCARD_RADIUS; dy++) {
    for (let dx = -POSTCARD_RADIUS; dx <= POSTCARD_RADIUS; dx++) {
      characters.push(characterOf(tileIdAt(cell.x + dx, cell.y + dy)));
    }
  }
  return characters.join(',');
}
