import type { CellPoint } from '../../world/cellPoint';
import { spawnWithRoomToMove } from '../../world/spawn/spawnWithRoomToMove';
import type { WalkableProbe } from './cachedWorldProbes';

const SPAWN_SEARCH_RADIUS = 64;

export function spawnNearOrigin(isWalkableAt: WalkableProbe): CellPoint | null {
  return spawnWithRoomToMove(isWalkableAt, { x: 0, y: 0 }, SPAWN_SEARCH_RADIUS);
}
