import type { CellPoint } from '../../../world/nearestWalkable';
import type { TileIdProbe } from '../../explore/cachedWorldProbes';

const STEPS_BETWEEN_POSTCARDS = 8;
const POSTCARD_RADIUS = 2;

export function viewDistinctness(path: CellPoint[], tileIdAt: TileIdProbe): number {
  const postcards = postcardsAlongPath(path, tileIdAt);
  if (postcards.length === 0) return 0;
  return new Set(postcards).size / postcards.length;
}

function postcardsAlongPath(path: CellPoint[], tileIdAt: TileIdProbe): string[] {
  const postcards: string[] = [];
  for (let index = 0; index < path.length; index += STEPS_BETWEEN_POSTCARDS) {
    postcards.push(postcardAt(path[index]!, tileIdAt));
  }
  return postcards;
}

function postcardAt(cell: CellPoint, tileIdAt: TileIdProbe): string {
  const tileIds: number[] = [];
  for (let dy = -POSTCARD_RADIUS; dy <= POSTCARD_RADIUS; dy++) {
    for (let dx = -POSTCARD_RADIUS; dx <= POSTCARD_RADIUS; dx++) {
      tileIds.push(tileIdAt(cell.x + dx, cell.y + dy));
    }
  }
  return tileIds.join(',');
}
