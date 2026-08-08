import type { ServerWorld } from '../../../api/agent/serverWorld';
import type { CellPoint } from '../../../world/nearestWalkable';
import type { WalkableProbe } from '../cachedWorldProbes';
import type { ExplorationTrace, WalkLimits } from '../explorationTrace';

export interface DriverRun {
  world: ServerWorld;
  spawn: CellPoint;
  isWalkableAt: WalkableProbe;
  limits: WalkLimits;
  seed: number;
}

export interface WorldDriver {
  name: string;
  explore(run: DriverRun): Promise<ExplorationTrace>;
}
