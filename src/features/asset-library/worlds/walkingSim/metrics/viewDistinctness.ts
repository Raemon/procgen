import type { CellPoint } from '@/features/game/nearestWalkable';
import type { CellCharacterProbe } from '../cellCharacter';

export const STEPS_BETWEEN_POSTCARDS = 8;
const POSTCARD_RADIUS = 2;

export function viewDistinctness(
  path: readonly CellPoint[],
  characterAt: CellCharacterProbe,
): number {
  const postcards = postcardsAlongPath(path, characterAt, STEPS_BETWEEN_POSTCARDS);
  if (postcards.length === 0) return 0;
  const views = postcards.map(arrangementBlindViewOf);
  return new Set(views).size / views.length;
}

function arrangementBlindViewOf(postcard: string): string {
  const counts = new Map<string, number>();
  for (const character of postcard.split(',')) {
    counts.set(character, (counts.get(character) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([one], [other]) => one.localeCompare(other))
    .map(([character, count]) => `${character}x${count}`)
    .join(',');
}

export function postcardsAlongPath(
  path: readonly CellPoint[],
  characterAt: CellCharacterProbe,
  stride: number,
): string[] {
  const postcards: string[] = [];
  for (let index = 0; index < path.length; index += stride) {
    postcards.push(postcardAt(path[index]!, characterAt));
  }
  return postcards;
}

function postcardAt(cell: CellPoint, characterAt: CellCharacterProbe): string {
  const characters: string[] = [];
  for (let dy = -POSTCARD_RADIUS; dy <= POSTCARD_RADIUS; dy++) {
    for (let dx = -POSTCARD_RADIUS; dx <= POSTCARD_RADIUS; dx++) {
      characters.push(characterAt(cell.x + dx, cell.y + dy));
    }
  }
  return characters.join(',');
}
