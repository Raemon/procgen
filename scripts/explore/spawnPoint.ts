import { nearestWalkable, type CellPoint } from '../../world/nearestWalkable';
import type { WalkableProbe } from './cachedWorldProbes';

const SPAWN_SEARCH_RADIUS = 64;

export function spawnNearOrigin(isWalkableAt: WalkableProbe): CellPoint | null {
  return nearestWalkable(0, 0, SPAWN_SEARCH_RADIUS, isWalkableAt);
}
